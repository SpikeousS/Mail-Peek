const DEFAULTS = {
  previewHtml: true,
  previewMsg: true,
};

const allowNext = {
  filenames: new Set(),
  urls: new Set(),
  // One-shot tokens for Shift+click real downloads when the final URL/name
  // differs from the clicked link. Never arm these for blob: downloads.
  tokens: 0,
  until: 0,
  ext: "",
};
const ALLOW_WINDOW_MS = 5000;

// After a click-to-preview gesture, cancel the download the page may still
// start (Jira often uses URLs with no .msg/.eml in the path).
let expectPreview = null;
// Short on purpose: long enough for Jira to start the download it was going
// to start anyway, short enough that clicking a .png right after a .msg is
// never mistaken for the same gesture.
const EXPECT_WINDOW_MS = 4000;
const handledDownloadIds = new Set();

function armExpectPreview(sender, payload = {}) {
  expectPreview = {
    tabId: sender?.tab?.id || null,
    url: payload.url || "",
    filename: payload.filename || "",
    ext: String(payload.ext || "").toLowerCase(),
    until: Date.now() + EXPECT_WINDOW_MS,
  };
}

function clearExpectPreview() {
  expectPreview = null;
}

function matchExpectPreview(url, filename, ext) {
  const exp = expectPreview;
  if (!exp || Date.now() > exp.until) {
    if (exp) expectPreview = null;
    return null;
  }
  if (exp.url && urlsLooselyMatch(exp.url, url)) return exp;
  if (exp.filename && filename && namesLooselyMatch(exp.filename, filename)) return exp;
  // Jira content URLs often have no extension at all — if we just asked for a
  // preview and this looks like an attachment download, treat it as the one.
  if (looksLikeAttachmentUrl(url)) {
    if (!ext || ext === exp.ext || (exp.ext === "html" && ext === "htm")) return exp;
  }
  if (exp.ext && ext && (ext === exp.ext || (exp.ext === "html" && ext === "htm"))) {
    if (exp.filename || exp.url) return exp;
  }
  return null;
}

let lastHttpTabId = null;
let cachedSettings = { ...DEFAULTS };

function mergeSettings(stored) {
  const merged = { ...DEFAULTS, ...stored };
  // Coerce to real booleans — never leave undefined/null in the cache.
  for (const key of Object.keys(DEFAULTS)) {
    merged[key] = merged[key] !== false;
  }
  return merged;
}

async function getSettings() {
  return mergeSettings(await chrome.storage.sync.get(DEFAULTS));
}

function refreshCachedSettings() {
  getSettings()
    .then((s) => {
      cachedSettings = s;
    })
    .catch(() => {});
}

function applySettingsChanges(changes) {
  const next = { ...cachedSettings };
  for (const key of Object.keys(DEFAULTS)) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      next[key] = changes[key].newValue !== false;
    }
  }
  cachedSettings = next;
}

refreshCachedSettings();

function basename(value) {
  return String(value || "")
    .split(/[?#]/)[0]
    .split(/[/\\]/)
    .pop()
    .toLowerCase();
}

function namesLooselyMatch(a, b) {
  const left = basename(a);
  const right = basename(b);
  if (!left || !right) return false;
  if (left === right) return true;
  // "foo.msg" vs "foo (1).msg" / encoded variants
  const stem = (name) => name.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "");
  return stem(left) === stem(right) && extOf(left) === extOf(right);
}

function urlsLooselyMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  try {
    const left = new URL(a);
    const right = new URL(b);
    if (left.origin === right.origin && left.pathname === right.pathname) return true;
    // Jira: /secure/attachment/12345/... id in either URL
    const idRe = /\/attachment\/(\d+)\b/i;
    const leftId = idRe.exec(left.pathname)?.[1];
    const rightId = idRe.exec(right.pathname)?.[1];
    if (leftId && rightId && leftId === rightId) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function consumeAllowNext(url, filename) {
  const now = Date.now();
  if (allowNext.urls.has(url)) {
    allowNext.urls.delete(url);
    return true;
  }
  if (filename && allowNext.filenames.has(filename)) {
    allowNext.filenames.delete(filename);
    return true;
  }
  for (const known of [...allowNext.filenames]) {
    if (namesLooselyMatch(known, filename)) {
      allowNext.filenames.delete(known);
      return true;
    }
  }
  for (const known of [...allowNext.urls]) {
    if (urlsLooselyMatch(known, url)) {
      allowNext.urls.delete(known);
      return true;
    }
  }
  // Token fallback: exactly one mail/html download after an explicit allow,
  // optionally filtered by the extension we expected.
  if (allowNext.tokens > 0 && now < allowNext.until) {
    const downloadExt = extOf(filename) || extOf(url);
    if (!allowNext.ext || allowNext.ext === downloadExt || (allowNext.ext === "html" && downloadExt === "htm")) {
      allowNext.tokens -= 1;
      if (allowNext.tokens <= 0) {
        allowNext.tokens = 0;
        allowNext.until = 0;
        allowNext.ext = "";
      }
      return true;
    }
  }
  return false;
}

function armAllowNext({ filename, url, windowMs } = {}) {
  if (filename) allowNext.filenames.add(filename);
  if (url) allowNext.urls.add(url);
  allowNext.tokens += 1;
  const requested = Number(windowMs) || 0;
  const lifetime = Math.min(Math.max(requested || ALLOW_WINDOW_MS, 1000), 120000);
  allowNext.until = Date.now() + lifetime;
  // Never let an extension from a previous allowance leak into this one — an
  // explicit "Download" click often has no filename yet when it is armed.
  allowNext.ext = extOf(filename) || extOf(url) || "";
}

function updateBadge(settings) {
  const active = !!(settings.previewHtml || settings.previewMsg);
  chrome.action.setBadgeText({ text: active ? "" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: "#6b7280" });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseFilename(contentDisposition, fallback) {
  if (!contentDisposition) return fallback || "";
  const star = /filename\*\s*=\s*(?:UTF-8''|)([^;]+)/i.exec(contentDisposition);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* ignore */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition);
  return plain ? plain[1].trim() : fallback || "";
}

function extOf(nameOrUrl) {
  const clean = String(nameOrUrl || "")
    .split(/[?#]/)[0]
    .split(/[/\\]/)
    .pop();
  const m = /\.([a-z0-9]+)$/i.exec(clean || "");
  return m ? m[1].toLowerCase() : "";
}

function looksLikeAttachmentUrl(url) {
  const u = String(url || "").toLowerCase();
  return /\/(attachment|attachments|secure\/attachment|download|uploads?|files?|media\/file)\b/.test(u)
    || /[?&](filename|file|name)=/.test(u)
    || /atlassian\.(net|com)/.test(u)
    || /media\.atlassian\.com/.test(u);
}

function isInjectableUrl(url) {
  return typeof url === "string" && /^https?:/i.test(url);
}

async function rememberTab(tabId) {
  if (!tabId) return;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isInjectableUrl(tab.url)) lastHttpTabId = tabId;
  } catch {
    /* tab gone */
  }
}

async function fetchBinary(url) {
  const response = await fetch(url, {
    credentials: "include",
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return {
    ok: true,
    base64: arrayBufferToBase64(buffer),
    contentType: response.headers.get("content-type") || "",
    filename: parseFilename(response.headers.get("content-disposition") || ""),
  };
}

async function pingTab(tabId) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: "MAIL_PEEK_PING" });
    return !!res?.ok;
  } catch {
    return false;
  }
}

async function ensureContentScript(tabId) {
  if (await pingTab(tabId)) return true;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["lib/msgreader.js", "content.js"],
    });
  } catch {
    return false;
  }
  return pingTab(tabId);
}

async function sendToTab(tabId, message) {
  if (!tabId) return false;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isInjectableUrl(tab.url)) return false;
  } catch {
    return false;
  }
  if (!(await ensureContentScript(tabId))) return false;
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    return false;
  }
}

async function findPreviewTab(item, preferredTabId) {
  if (preferredTabId && await sendToTab(preferredTabId, { type: "MAIL_PEEK_PING" })) {
    return preferredTabId;
  }

  const tabs = await chrome.tabs.query({ url: ["https://*/*", "http://*/*"] });
  const initiator = String(item?.initiator || "").replace(/\/$/, "");
  const referrer = String(item?.referrer || "");

  const scored = tabs
    .filter((tab) => isInjectableUrl(tab.url))
    .map((tab) => {
      let score = 0;
      try {
        const origin = new URL(tab.url).origin;
        if (initiator && origin === initiator) score += 5;
        if (referrer && (referrer.startsWith(origin) || tab.url.startsWith(referrer))) score += 4;
        if (tab.active) score += 2;
        if (tab.id === lastHttpTabId) score += 3;
        if (/atlassian\.(net|com)/i.test(tab.url)) score += 1;
      } catch {
        score = 0;
      }
      return { id: tab.id, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.id || lastHttpTabId;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  // Migrate the removed master switch: master off becomes both formats off.
  // The old download-interception switch is obsolete and no longer gates Jira.
  if (details?.reason === "update") {
    const leftover = await chrome.storage.sync.get(["enabled"]);
    const patch = {};
    if (leftover.enabled === false) {
      patch.previewMsg = false;
      patch.previewHtml = false;
    }
    if (Object.keys(patch).length) await chrome.storage.sync.set(patch);
    // replyVia / myEmail belonged to the removed draft-composer; Reply/Forward
    // now simply open the original file in the mail app.
    await chrome.storage.sync.remove(["enabled", "interceptDownloads", "replyVia", "myEmail"]);
  }
  const settings = await getSettings();
  cachedSettings = settings;
  updateBadge(settings);
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "mail-peek-preview",
      title: "Preview with Mail Peek",
      contexts: ["link", "page"],
    });
  });
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  cachedSettings = settings;
  updateBadge(settings);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  applySettingsChanges(changes);
  if (changes.previewHtml || changes.previewMsg) updateBadge(cachedSettings);
});

chrome.tabs.onActivated.addListener((info) => {
  rememberTab(info.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && isInjectableUrl(tab.url || changeInfo.url)) {
    lastHttpTabId = tabId;
  }
});

getSettings()
  .then((s) => {
    cachedSettings = s;
    updateBadge(s);
  })
  .catch(() => {});

chrome.tabs.query({ active: true, lastFocusedWindow: true }).then((tabs) => {
  if (tabs[0]?.id) rememberTab(tabs[0].id);
}).catch(() => {});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender?.tab?.id) rememberTab(sender.tab.id);

  if (message?.type === "FETCH_BINARY") {
    fetchBinary(message.url)
      .then(sendResponse)
      .catch((err) => sendResponse({ ok: false, error: String(err.message || err) }));
    return true;
  }

  if (message?.type === "ALLOW_NEXT_DOWNLOAD") {
    armAllowNext({
      filename: message.filename || "",
      url: message.url || "",
      windowMs: message.windowMs,
    });
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "DRAFT_NAME") {
    // compose.html is about to start a download; remember the intended name
    // so onDeterminingFilename can apply it (see that listener).
    if (typeof message.filename === "string" && message.filename) {
      pendingDraftNames.push({ filename: message.filename, at: Date.now() });
      if (pendingDraftNames.length > 5) pendingDraftNames.shift();
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "DRAFT_OPEN") {
    // downloads.open() only works "in response to a user gesture". The gesture
    // from the click in the page is curried onto this message, but it is valid
    // only for the synchronous part of this listener — so call open() FIRST,
    // before any await. (Awaiting the returned promise afterwards is fine.)
    const id = Number(message.downloadId);
    if (!Number.isInteger(id) || id < 0) {
      sendResponse({ ok: false, error: "Invalid downloadId" });
      return false;
    }
    let pending;
    try {
      pending = chrome.downloads.open(id);
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message || err) });
      return false;
    }
    Promise.resolve(pending)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
    return true;
  }

  if (message?.type === "EXPECT_PREVIEW") {
    armExpectPreview(sender, message);
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "GET_SETTINGS") {
    getSettings().then(sendResponse).catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  return false;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "mail-peek-preview") return;
  sendToTab(tab?.id, {
    type: "PREVIEW_CONTEXT",
    url: info.linkUrl || "",
    filename: "",
  }).catch(() => {});
});

function markHandled(downloadId) {
  handledDownloadIds.add(downloadId);
  if (handledDownloadIds.size > 300) handledDownloadIds.clear();
}

// Filenames announced by compose.html for the draft downloads it is about to
// start. Chrome ignores download()'s `filename` option whenever any extension
// has an onDeterminingFilename listener (we do, for preview interception), so
// the name has to be re-applied from that listener.
const pendingDraftNames = [];
const DRAFT_NAME_WINDOW_MS = 15_000;

function takeDraftName() {
  const now = Date.now();
  while (pendingDraftNames.length && now - pendingDraftNames[0].at > DRAFT_NAME_WINDOW_MS) {
    pendingDraftNames.shift();
  }
  return pendingDraftNames.shift()?.filename || "";
}

// Cheap, non-mutating pre-check. Unknown extensions are kept as candidates
// because Jira and similar sites serve attachments from URLs without a file
// extension and only reveal the real name later.
function isDownloadCandidate(item) {
  if (!item || handledDownloadIds.has(item.id)) return false;
  if (item.byExtensionId === chrome.runtime.id) return false;

  const url = item.finalUrl || item.url || "";
  if (url.startsWith("blob:")) return false;

  const filename = (item.filename || "").split(/[/\\]/).pop();
  const ext = extOf(filename) || extOf(url);
  if (ext && ext !== "msg" && ext !== "eml" && ext !== "html" && ext !== "htm") return false;

  const mime = String(item.mime || "").toLowerCase();
  if (/^(image|video|audio)\//.test(mime) || mime === "application/pdf" || mime === "application/zip") {
    return false;
  }
  return true;
}

function previewExpectedFor(item) {
  const url = item.finalUrl || item.url || "";
  const filename = (item.filename || "").split(/[/\\]/).pop();
  const ext = extOf(filename) || extOf(url);
  return matchExpectPreview(url, filename, ext);
}

function interceptDownloadItem(item) {
  if (!isDownloadCandidate(item)) return false;

  const settings = cachedSettings;
  const url = item.finalUrl || item.url || "";
  const filename = (item.filename || "").split(/[/\\]/).pop();
  const ext = extOf(filename) || extOf(url);

  if (consumeAllowNext(url, filename)) return false;

  const expected = matchExpectPreview(url, filename, ext);
  const isMail = ext === "msg" || ext === "eml" || expected?.ext === "msg" || expected?.ext === "eml";
  const isHtml = ext === "html" || ext === "htm" || expected?.ext === "html";

  if (expected) {
    // Recent click-to-preview gesture — cancel even when the download URL
    // has no file extension yet (common on Jira).
    if (expected.ext === "msg" || expected.ext === "eml") {
      if (!settings.previewMsg) return false;
    } else if (expected.ext === "html") {
      if (!settings.previewHtml) return false;
    }
  } else {
    if (isMail && !settings.previewMsg) return false;
    if (isHtml && !settings.previewHtml) return false;
    if (!isMail && !isHtml) return false;
    if (isHtml && !looksLikeAttachmentUrl(url) && !/\.(html?|htm)$/i.test(filename)) return false;
  }

  markHandled(item.id);
  clearExpectPreview();

  chrome.downloads.cancel(item.id).catch(() => {});
  chrome.downloads.erase({ id: item.id }).catch(() => {});

  const previewUrl = expected?.url || url;
  const previewName = expected?.filename || filename;
  const preferredTabId = expected?.tabId || lastHttpTabId;
  (async () => {
    const tabId = await findPreviewTab(item, preferredTabId);
    await sendToTab(tabId, {
      type: "PREVIEW_URL",
      url: previewUrl,
      filename: previewName,
    });
  })().catch(() => {});

  return true;
}

// A page's own Download / 下载 button may race the content-script message that
// authorises its download, especially when the service worker was asleep. For
// downloads that were not preceded by a click-to-preview gesture, give that
// message a brief moment to arrive, then re-read the item (the real filename is
// often only known in onDeterminingFilename) and decide.
const INTERCEPT_GRACE_MS = 300;
const pendingIntercepts = new Set();

function scheduleIntercept(item) {
  if (!isDownloadCandidate(item)) return;

  // Preview gesture already known: acting immediately keeps the preview snappy
  // and lets us cancel before the file hits the disk.
  if (previewExpectedFor(item)) {
    interceptDownloadItem(item);
    return;
  }

  if (pendingIntercepts.has(item.id)) return;
  pendingIntercepts.add(item.id);
  setTimeout(async () => {
    pendingIntercepts.delete(item.id);
    let fresh = item;
    try {
      const found = await chrome.downloads.search({ id: item.id });
      if (found?.[0]) fresh = found[0];
    } catch {
      /* item gone */
    }
    // It finished while we waited: leave the user's download alone.
    if (fresh.state === "complete" || fresh.state === "interrupted") return;
    try {
      interceptDownloadItem(fresh);
    } catch {
      /* ignore */
    }
  }, INTERCEPT_GRACE_MS);
}

chrome.downloads.onCreated.addListener((item) => {
  try {
    scheduleIntercept(item);
  } catch {
    /* never surface as an uncaught SW rejection */
  }
});

// Filename is often empty in onCreated and filled in here — second chance to
// catch .msg/.eml downloads whose URL path has no extension.
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  let suggestion;
  const ownDraft =
    item.byExtensionId === chrome.runtime.id &&
    (/\.eml$/i.test(item.filename || "") ||
      String(item.mime || "").toLowerCase() === "message/rfc822" ||
      String(item.url || "").startsWith("blob:"));
  if (ownDraft) {
    const wanted = takeDraftName();
    if (wanted) suggestion = { filename: wanted, conflictAction: "uniquify" };
  }
  try {
    if (suggestion) suggest(suggestion);
    else suggest();
  } catch {
    /* suggest must be called; ignore double-call errors */
  }
  try {
    scheduleIntercept(item);
  } catch {
    /* ignore */
  }
});
