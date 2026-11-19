(() => {
  if (globalThis.__MAIL_PEEK__) return;
  globalThis.__MAIL_PEEK__ = true;

  const HOST_ID = "mail-peek-host";
  const MAX_BYTES = 30 * 1024 * 1024;
  const FILE_EXT_RE = /\.(html?|htm|msg|eml)$/i;
  const FILENAME_RE = /([^\n/\\]+?\.(?:html?|htm|msg|eml))/i;
  const DEFAULTS = {
    previewHtml: true,
    previewMsg: true,
  };

  // ---- Support / donations ---------------------------------------------------
  // Plain outbound links only (no third-party scripts): CWS-safe.
  const SUPPORT_URL = "https://buymeacoffee.com/spikesu";
  const SUPPORT_NUDGE_AFTER = 20; // successful previews before the first gentle ask
  const SUPPORT_NUDGE_REPEAT_MS = 30 * 24 * 60 * 60 * 1000; // ask a 2nd time after 30 days
  const SUPPORT_NUDGE_MAX = 2; // then never again
  let supportState = { previews: 0, dismissals: 0, dismissedAt: 0, never: false };

  function supportLink(source) {
    return `${SUPPORT_URL}?utm_source=mailpeek&utm_medium=extension&utm_campaign=${encodeURIComponent(source)}`;
  }

  function loadSupportState() {
    try {
      chrome.storage.sync.get({ support: supportState }, (stored) => {
        if (stored?.support && typeof stored.support === "object") {
          supportState = { ...supportState, ...stored.support };
        }
      });
    } catch {
      /* context gone */
    }
  }

  function saveSupportState(patch) {
    supportState = { ...supportState, ...patch };
    try {
      chrome.storage.sync.set({ support: supportState });
    } catch {
      /* context gone */
    }
  }

  function recordPreviewSuccess() {
    saveSupportState({ previews: (supportState.previews || 0) + 1 });
  }

  function shouldShowSupportNudge() {
    const s = supportState;
    if (s.never) return false;
    if ((s.previews || 0) < SUPPORT_NUDGE_AFTER) return false;
    if ((s.dismissals || 0) >= SUPPORT_NUDGE_MAX) return false;
    if (s.dismissals > 0 && Date.now() - (s.dismissedAt || 0) < SUPPORT_NUDGE_REPEAT_MS) return false;
    return true;
  }

  function openSupportPage(source) {
    window.open(supportLink(source), "_blank", "noopener");
  }

  let settings = { ...DEFAULTS };
  let lastHint = null;
  let lastHintAt = 0;
  let modal = null;

  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = normalizeSettings(stored);
  });
  loadSupportState();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    const patch = {};
    for (const key of Object.keys(DEFAULTS)) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        patch[key] = changes[key].newValue !== false;
      }
    }
    if (Object.keys(patch).length) settings = { ...settings, ...patch };
    if (changes.support?.newValue && typeof changes.support.newValue === "object") {
      supportState = { ...supportState, ...changes.support.newValue };
    }
  });

  function normalizeSettings(stored) {
    const next = { ...DEFAULTS, ...stored };
    for (const key of Object.keys(DEFAULTS)) next[key] = next[key] !== false;
    return next;
  }

  function getExt(nameOrUrl) {
    const clean = String(nameOrUrl || "")
      .split(/[?#]/)[0]
      .split(/[/\\]/)
      .pop();
    const match = /\.([a-z0-9]+)$/i.exec(clean || "");
    return match ? match[1].toLowerCase() : "";
  }

  function normalizeExt(ext) {
    if (ext === "htm") return "html";
    return ext;
  }

  function isMailExt(ext) {
    return ext === "msg" || ext === "eml";
  }

  function isHtmlExt(ext) {
    return ext === "html" || ext === "htm";
  }

  // Names lifted from URLs arrive percent-encoded ("My%20mail%40x.eml").
  // Decode them so previews, downloads and the mail app see the real name.
  function decodePercent(name) {
    const text = String(name || "");
    if (!/%[0-9a-f]{2}/i.test(text)) return text;
    try {
      return decodeURIComponent(text.replace(/\+/g, "%2B"));
    } catch {
      return text.replace(/%20/gi, " ");
    }
  }

  function extractFilename(text) {
    if (!text) return "";
    const trimmed = String(text).replace(/\u2026/g, "...").trim();
    const match = trimmed.match(FILENAME_RE);
    return match ? decodePercent(match[1].trim()) : "";
  }

  function isAtlassian() {
    const host = location.hostname;
    return (
      /(^|\.)atlassian\.net$|(^|\.)atlassian\.com$/i.test(host)
      || /jira/i.test(host)
      || /\/browse\/|\/jira\/|\/wiki\//.test(location.pathname)
    );
  }

  function looksLikeAttachmentUrl(url) {
    const value = String(url || "").toLowerCase();
    return (
      /\/(attachment|attachments|secure\/attachment|download|uploads?|files?|media\/file)\b/.test(value)
      || /[?&](filename|file|name)=/.test(value)
      || /atlassian\.(net|com)|media\.atlassian\.com/.test(value)
      || /githubusercontent\.com|files\.slack\.com/.test(value)
    );
  }

  function getJiraIssueKey() {
    const path = location.pathname;
    const fromPath = path.match(/\/(?:browse|issues)\/([A-Z][A-Z0-9_]+-\d+)/i);
    if (fromPath) return fromPath[1];
    const selected = new URLSearchParams(location.search).get("selectedIssue");
    if (selected && /^[A-Z][A-Z0-9_]+-\d+$/i.test(selected)) return selected;
    const attr = document.querySelector("[data-issue-key], [data-issuekey]");
    const fromAttr = attr?.getAttribute("data-issue-key") || attr?.getAttribute("data-issuekey");
    if (fromAttr) return fromAttr;
    const title = document.title.match(/\b([A-Z][A-Z0-9_]+-\d+)\b/);
    return title ? title[1] : "";
  }

  function isOurUi(node) {
    return !!(node && (node.closest?.("#" + HOST_ID) || node.getRootNode?.()?.host?.id === HOST_ID));
  }

  function isIgnoredControl(node) {
    if (!node?.closest) return false;
    return !!node.closest(
      'button[aria-haspopup="menu"], [data-testid*="more-button"], [data-testid*="overflow"], [aria-label="More" i], [aria-label*="more actions" i]'
    );
  }

  // Any "name.ext" token — used to detect that the clicked thing is some
  // *other* kind of file (png, pdf…) so we never hijack it.
  const ANY_FILENAME_RE = /([^\s/\\"'<>]+?\.([a-z0-9]{2,5}))(?=$|[\s"'<>?#),;:])/gi;

  // Controls that own a page action ("Preview", "Download", "Save as"…).
  // Clicking one of those is an explicit request for the site's own preview or
  // download, so Mail Peek must neither replace it with its preview nor cancel
  // the resulting download.
  const DOWNLOAD_LABEL_RE = /\bdownload(?:ing|ed)?\b|\bsave(?:\s+as)?\b|\bexport\b|下载|下載|保存|另存|导出|匯出/i;
  const PREVIEW_LABEL_RE = /\bpreview\b|\bview\b|预览|預覽|查看/i;
  const CONTROL_SELECTOR =
    'a[href], button, input[type="button"], input[type="submit"], ' +
    '[role="button"], [role="menuitem"], [role="menuitemradio"], [role="link"]';

  // Nearest interactive control the user actually clicked. Labels are read from
  // that control only — never from a container that happens to include the word
  // "download" somewhere in its text.
  function nearestControl(node) {
    let el = node?.nodeType === 1 ? node : node?.parentElement;
    for (let depth = 0; el && el.nodeType === 1 && depth < 8; depth += 1) {
      if (isOurUi(el)) return null;
      if (el.matches?.(CONTROL_SELECTOR)) return el;
      el = el.parentElement;
    }
    return null;
  }

  // The control's own action label. Tooltips are only used for icon-only
  // controls: a filename link may carry title="Open in new tab" and must still
  // count as a filename, not as a page action.
  function actionLabelOf(control) {
    const text = shortTextOf(control, 160).trim();
    const parts = [
      control.getAttribute?.("aria-label"),
      control.getAttribute?.("data-tooltip"),
      control.getAttribute?.("data-title"),
      control.getAttribute?.("data-original-title"),
      control.getAttribute?.("data-testid"),
      control.getAttribute?.("name"),
      text,
    ];
    if (!text) {
      parts.push(control.getAttribute?.("title"));
      // Icon fonts / inline SVG often carry their only name in <title>.
      parts.push(control.querySelector?.("title")?.textContent);
    }
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  function isFilenameOnlyText(text) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (!value) return false;
    const lower = value.toLowerCase();
    return filenamesIn(value).some((name) => name.toLowerCase() === lower);
  }

  // innerText is empty for SVG / icon-only markup; fall back to textContent so
  // an inline SVG's <title>Download</title> still names the control.
  function actionTextOf(el) {
    const inner = el.innerText;
    const raw = inner && inner.trim() ? inner : el.textContent;
    return String(raw || "").replace(/\s+/g, " ").trim();
  }

  function actionAtStart(text) {
    const stripped = String(text || "")
      .replace(/^[^\p{L}\p{N}]+/u, "")
      .toLowerCase();
    if (!stripped) return "";
    if (/^(?:download|save|export|下载|下載|保存|另存|导出|匯出)/.test(stripped)) return "download";
    if (/^(?:preview|view|预览|預覽|查看)/.test(stripped)) return "preview";
    return "";
  }

  // Some web apps (Jira among them) render their Preview/Download actions as
  // styled <span>/<div> elements with a click handler instead of a real
  // button/link. Walk the clicked element's short ancestors and honour their
  // own label; stop as soon as we reach the attachment card / filename.
  function nonSemanticPageAction(node) {
    let el = node?.nodeType === 1 ? node : node?.parentElement;
    for (let depth = 0; el && el.nodeType === 1 && depth < 8; depth += 1) {
      if (isOurUi(el)) return "";
      const semantic = [
        el.getAttribute?.("aria-label"),
        el.getAttribute?.("data-testid"),
        el.getAttribute?.("data-tooltip"),
      ]
        .filter(Boolean)
        .join(" ");
      if (DOWNLOAD_LABEL_RE.test(semantic)) return "download";
      if (PREVIEW_LABEL_RE.test(semantic)) return "preview";

      const text = actionTextOf(el);
      if (isFilenameOnlyText(text) || isFilenameOnlyText(labelOf(el))) return "";

      const action = actionAtStart(text);
      if (action) return action;
      // A container whose label names the file is the attachment card, not an
      // action control — do not let its sibling action labels leak upward.
      if (filenamesIn(text).length) return "";
    }
    return "";
  }

  // Returns "download", "preview" or "" (not a page action). Clicking the
  // filename itself is NOT an action: that is what opens the Mail Peek preview.
  // An explicit aria-label / data-testid still wins over the visible filename
  // (e.g. a filename button labelled "Preview attachment" is a page action);
  // a plain tooltip such as title="Open in new tab" does not.
  function explicitPageAction(node) {
    const ownText = shortTextOf(node, 160);
    const ownSemantic = [
      node?.getAttribute?.("aria-label"),
      node?.getAttribute?.("data-testid"),
    ]
      .filter(Boolean)
      .join(" ");
    if (
      (isFilenameOnlyText(ownText) || isFilenameOnlyText(labelOf(node)))
      && !DOWNLOAD_LABEL_RE.test(ownSemantic)
      && !PREVIEW_LABEL_RE.test(ownSemantic)
    ) {
      return "";
    }

    const control = nearestControl(node);
    if (!control) return nonSemanticPageAction(node);
    const text = shortTextOf(control, 160);
    const semantic = [
      control.getAttribute?.("aria-label"),
      control.getAttribute?.("data-testid"),
    ]
      .filter(Boolean)
      .join(" ");
    if (isFilenameOnlyText(text) && !DOWNLOAD_LABEL_RE.test(semantic) && !PREVIEW_LABEL_RE.test(semantic)) {
      return "";
    }
    const label = actionLabelOf(control);
    if (DOWNLOAD_LABEL_RE.test(label)) return "download";
    if (PREVIEW_LABEL_RE.test(label)) return "preview";
    // Composite cards: a control whose visible label starts with the filename
    // is the attachment card itself, not one of its action controls.
    if (text && actionAtStart(text) === "" && filenamesIn(text).length) return "";
    return nonSemanticPageAction(node);
  }

  // Let the background know the next mail/html download belongs to an explicit
  // page action, so its download interceptor leaves it alone. A page preview
  // may fetch or download the original too.
  function armPageAction() {
    // Outlook Web generates the EML/MSG on demand and may start the download
    // seconds later; the file name/type is not knowable from the menu item.
    // Use a generic allowance with a longer window so the background never
    // mistakes this explicit page download for one of our preview downloads.
    allowNextDownload({ windowMs: 15000 });
  }

  function filenamesIn(text) {
    const out = [];
    const source = String(text || "").replace(/\u2026/g, "...");
    let match;
    ANY_FILENAME_RE.lastIndex = 0;
    while ((match = ANY_FILENAME_RE.exec(source))) {
      const name = match[1].trim();
      const ext = match[2].toLowerCase();
      // Skip things that look like domains / versions ("v1.2", "example.com")
      if (/^\d+$/.test(ext)) continue;
      if (/^(com|net|org|io|cn|co|dev|app)$/.test(ext) && !/\.(msg|eml|html?)$/i.test(name)) continue;
      out.push(name);
    }
    return out;
  }

  function labelOf(node) {
    if (!node || node.nodeType !== 1) return "";
    return (
      node.getAttribute("aria-label")
      || node.getAttribute("title")
      || node.getAttribute("alt")
      || node.dataset?.filename
      || node.dataset?.name
      || ""
    ).trim();
  }

  function shortTextOf(node, max = 200) {
    if (!node || node.nodeType !== 1) return "";
    const text = (node.innerText ?? node.textContent ?? "").trim();
    return text.length > 0 && text.length <= max ? text : "";
  }

  // Pick exactly one filename the user is pointing at, or null if ambiguous.
  function singleFilename(...texts) {
    const names = new Set();
    for (const text of texts) {
      for (const name of filenamesIn(text)) names.add(name.toLowerCase());
    }
    if (names.size !== 1) return names.size === 0 ? "" : null;
    return [...names][0];
  }

  // Jira (and similar apps) sometimes keep the file URL out of the anchor and
  // only in data attributes / an attachment id. Recover it so clicking the
  // filename can still resolve the original file.
  function attachmentUrlFromCard(item, clicked) {
    for (const root of [clicked, item]) {
      if (!root?.getAttribute) continue;
      const downloadUrl =
        root.getAttribute("data-downloadurl")
        || root.getAttribute("data-download-url")
        || root.getAttribute("data-file-url")
        || root.querySelector?.("[data-downloadurl]")?.getAttribute("data-downloadurl")
        || "";
      if (downloadUrl) {
        const absolute = /https?:\/\/\S+/.exec(downloadUrl)?.[0];
        if (absolute) return absolute;
        try {
          return new URL(downloadUrl, location.origin).href;
        } catch {
          /* ignore */
        }
      }
      const holder = root.matches?.("[data-attachment-id], [file-preview-id]")
        ? root
        : root.querySelector?.("[data-attachment-id], [file-preview-id]");
      const id =
        holder?.getAttribute("data-attachment-id")
        || holder?.getAttribute("file-preview-id")
        || "";
      if (/^\d+$/.test(id)) return `${location.origin}/secure/attachment/${id}`;
    }
    return "";
  }

  function hintFromElement(el) {
    if (!el || el.nodeType !== 1) return null;

    // 1) What did the user actually click? Prefer the nearest link; otherwise
    //    the nearest *single* attachment item (card / list item / row button).
    //    Never walk up into a container that holds several attachments.
    const link = el.closest?.("a[href]") || null;
    let item = link;
    if (!item) {
      item = el.closest?.(
        '[role="listitem"], li, tr, [role="row"], [role="button"], button, ' +
        '[data-testid*="attachment-card"], [data-testid*="attachment-item"], [data-testid*="media-card"], ' +
        '[class*="attachment-row"], [class*="attachment-item"], [class*="AttachmentCard"], [class*="media-card"]'
      );
    }
    if (item && item !== link && item.querySelectorAll("a[href]").length > 1) return null;
    const itemLink = link || (item ? item.querySelector?.("a[href]") : null);
    let href = itemLink?.href || "";
    if (!href || /^javascript:/i.test(href) || href === location.href) {
      href = attachmentUrlFromCard(item, el) || href;
    }

    // 2) If the clicked element itself clearly names another file type
    //    (e.g. a .png thumbnail), leave it to the page/browser.
    const ownLabel = labelOf(el);
    const ownText = el === item || el === link ? "" : shortTextOf(el, 120);
    const ownName = singleFilename(ownLabel, ownText);
    if (ownName === null) return null;
    if (ownName && !FILE_EXT_RE.test(ownName)) return null;
    if (el.tagName === "IMG" && !link) {
      const srcExt = getExt(el.currentSrc || el.src || "");
      if (srcExt && !isHtmlExt(srcExt) && !isMailExt(srcExt)) return null;
    }

    // 3) Resolve the filename from the closest scope outward, stopping as soon
    //    as one scope yields exactly one candidate.
    const downloadName = (itemLink?.getAttribute("download") || el.getAttribute?.("download") || "").trim();
    let filename = downloadName;
    if (!filename && ownName) filename = ownName;
    if (!filename && itemLink) {
      const fromLink = singleFilename(labelOf(itemLink), shortTextOf(itemLink, 200), itemLink.dataset?.filename);
      if (fromLink === null) return null;
      filename = fromLink;
    }
    if (!filename && item && item !== itemLink) {
      const fromItem = singleFilename(labelOf(item), shortTextOf(item, 200));
      if (fromItem === null) return null;
      filename = fromItem;
    }
    if (filename) filename = decodePercent(extractFilename(filename) || filename);

    const urlExt = getExt(href);
    const nameExt = getExt(filename);
    const ext = nameExt || urlExt;
    if (!isHtmlExt(ext) && !isMailExt(ext)) return null;
    // A URL that clearly points at another file type wins over a fuzzy name.
    if (urlExt && nameExt && urlExt !== nameExt && !isHtmlExt(urlExt) && !isMailExt(urlExt)) return null;

    // Need either a URL or a filename we can resolve (e.g. via Jira API).
    if (!href && !filename) return null;

    const inJiraAttachments = !!(
      isAtlassian()
      && (item || el).closest?.(
        '[data-testid*="attachment"], [data-test-id*="attachment"], [id*="attachment"], [class*="attachment"], section, aside'
      )
    );

    return {
      url: href,
      filename,
      ext: normalizeExt(ext),
      downloadAttr: !!(itemLink?.hasAttribute("download") || el.hasAttribute?.("download")),
      inJiraAttachments,
      force: false,
    };
  }

  // Does this hint point at an attachment *file* (as opposed to an ordinary
  // web page link that merely ends in .html)? Independent of user settings.
  function isAttachmentHint(hint) {
    if (!hint) return false;
    const ext = hint.ext;
    if (isMailExt(ext)) return true;
    if (isHtmlExt(ext)) {
      if (hint.force || hint.downloadAttr || hint.inJiraAttachments || isAtlassian()) return true;
      if (looksLikeAttachmentUrl(hint.url)) return true;
      if (hint.filename && FILE_EXT_RE.test(hint.filename)) return true;
      return false;
    }
    return false;
  }

  function shouldPreview(hint) {
    if (!isAttachmentHint(hint)) return false;
    if (isMailExt(hint.ext)) return !!settings.previewMsg;
    return !!settings.previewHtml;
  }

  // ---- Lifecycle ------------------------------------------------------------
  // When the extension is reloaded/updated, the old content script keeps
  // running in already-open tabs with a dead `chrome.runtime` ("Extension
  // context invalidated"). Two safeguards:
  //   1. Every instance announces itself on the DOM; older instances tear
  //     themselves down so only the newest one handles clicks.
  //   2. Before intercepting a click we check the runtime is still alive; if
  //     not, we step aside and let the browser handle the click normally.
  const INSTANCE_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const TAKEOVER_EVENT = "mail-peek:takeover";
  const lifecycle = new AbortController();
  let torndown = false;

  function contextAlive() {
    try {
      return !!chrome?.runtime?.id;
    } catch {
      return false;
    }
  }

  function teardown() {
    if (torndown) return;
    torndown = true;
    lifecycle.abort();
    try {
      closeModal();
    } catch {
      /* ignore */
    }
    document.getElementById(HOST_ID)?.remove();
    globalThis.__MAIL_PEEK__ = false;
  }

  document.addEventListener(
    TAKEOVER_EVENT,
    (event) => {
      if (event?.detail?.instance && event.detail.instance !== INSTANCE_ID) teardown();
    },
    { signal: lifecycle.signal }
  );
  document.dispatchEvent(new CustomEvent(TAKEOVER_EVENT, { detail: { instance: INSTANCE_ID } }));

  document.addEventListener(
    "mouseover",
    (event) => {
      const hint = hintFromElement(event.target);
      if (hint) {
        lastHint = hint;
        lastHintAt = Date.now();
      }
    },
    { capture: true, signal: lifecycle.signal }
  );

  function resolveClickHint(target) {
    // Strictly what was clicked. No hover fallback: it used to open a
    // neighbouring attachment when the click landed on something else.
    const direct = hintFromElement(target);
    if (direct) {
      lastHint = direct;
      lastHintAt = Date.now();
    }
    return direct;
  }

  // Shift+click: save the original file without leaving the page. The browser's
  // default for Shift+click on a link is "open in new window", which is not
  // what anyone wants for an attachment.
  let downloadSeq = 0;
  // Set while we re-dispatch the user's click to the page (see below) so our
  // own capture listeners ignore that synthetic event.
  let replayingClick = false;

  function replayPlainClick(target) {
    if (!target?.isConnected) return false;
    replayingClick = true;
    suppressClickUntil = 0;
    try {
      // Same click, minus the Shift modifier — the page's own handler runs and
      // starts its normal download; the background lets it through.
      target.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, view: window, button: 0 })
      );
    } finally {
      replayingClick = false;
    }
    return true;
  }

  async function downloadOriginal(hint, target) {
    const seq = (downloadSeq += 1);
    const nameGuess = hint.filename || extractFilename(hint.url) || "attachment";
    try {
      const source = await resolveSource(hint);
      const file = await fetchBytes(source.url);
      if (seq !== downloadSeq) return;
      const filename = decodePercent(source.filename || file.filename || nameGuess);
      downloadBytes(file.bytes, filename, file.contentType || mimeFromName(filename));
    } catch (err) {
      if (seq !== downloadSeq) return;
      // Could not fetch it ourselves. Never pop up an error window for a
      // Shift+click — hand the gesture back to the page instead.
      allowNextDownload(hint);
      if (hint.url) {
        // Plain navigation download in this tab.
        const anchor = document.createElement("a");
        anchor.href = hint.url;
        anchor.download = nameGuess;
        anchor.rel = "noopener";
        anchor.style.display = "none";
        document.documentElement.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }
      // No URL (JS-driven card, e.g. Jira Cloud): let the page do its own
      // download by replaying the click without Shift.
      if (replayPlainClick(target)) return;
      showError(nameGuess, err?.message || String(err));
    }
  }

  let suppressClickUntil = 0;
  // One gesture can produce both pointerdown and click; arm the background only
  // once so a stray token cannot let an unrelated preview download through.
  let armedPageAction = false;

  // Explicit page preview/download controls (Preview / Download / 预览 / 下载 /
  // Save as…). We leave these clicks entirely to the page and tell the
  // background to let any resulting download through.
  function preparePageAction() {
    armPageAction();
    armedPageAction = true;
  }

  function notifyExpectPreview(hint) {
    if (!hint || !contextAlive()) return;
    try {
      chrome.runtime
        .sendMessage({
          type: "EXPECT_PREVIEW",
          url: hint.url || "",
          filename: hint.filename || "",
          ext: hint.ext || "",
        })
        .catch?.(() => {});
    } catch {
      /* context gone */
    }
  }

  function beginPreviewFromGesture(event) {
    if (replayingClick) return null;
    // Only real user gestures may open the preview. Pages often start their
    // own download by creating a hidden link and calling .click() — Outlook
    // Web's "Download as EML/MSG" does exactly that.
    if (!event.isTrusted) return null;
    if (event.button !== 0) return null;
    if (isOurUi(event.target)) return null;
    if (isIgnoredControl(event.target)) return null;

    const hint = resolveClickHint(event.target);
    // Shift+click is handled for every attachment file we recognise, even when
    // preview for that type is switched off — otherwise the browser's native
    // Shift+click ("open in new window") kicks in and downloads from a popup.
    if (!isAttachmentHint(hint)) return null;

    if (!contextAlive()) {
      teardown();
      return null;
    }

    if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Shift+click = download the original, in this tab (no new window).
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // (If pointerdown handled this gesture, the click handler bails out
      // earlier via suppressClickUntil, so this runs exactly once.)
      suppressClickUntil = Date.now() + 1200;
      downloadOriginal(hint, event.target);
      return null;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      // Other modifiers keep the browser's native behaviour; just make sure the
      // resulting download is not turned into a preview.
      allowNextDownload(hint);
      return null;
    }

    // Plain click: only take over when preview is enabled for this type.
    if (!shouldPreview(hint)) return null;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return hint;
  }

  function handlePreviewGesture(event) {
    const hint = beginPreviewFromGesture(event);
    if (!hint) return false;
    // Tell the background to cancel the download Jira may still kick off,
    // even when the URL has no .msg/.eml extension yet.
    notifyExpectPreview(hint);
    suppressClickUntil = Date.now() + 1200;
    openPreview(hint);
    return true;
  }

  // Capture as early as possible. Some apps start the download on pointerdown
  // before click fires. (pointerdown covers mouse/touch/pen — no separate mousedown.)
  document.addEventListener(
    "pointerdown",
    (event) => {
      armedPageAction = false;
      if (!event.isTrusted) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (explicitPageAction(event.target)) {
        // A real Preview/Download button or menu item: let the page handle the
        // whole gesture. Arming happens before the page starts its download.
        preparePageAction(event.target);
        return;
      }
      handlePreviewGesture(event);
    },
    { capture: true, signal: lifecycle.signal }
  );

  document.addEventListener(
    "click",
    (event) => {
      if (replayingClick) return;
      // Ignore programmatic clicks: page scripts use hidden <a>.click() to
      // start their own preview/download. They must not become Mail Peek
      // previews (and must not be suppressed by our gesture guard).
      if (!event.isTrusted) return;
      if (explicitPageAction(event.target)) {
        if (!armedPageAction) preparePageAction(event.target);
        armedPageAction = false;
        return; // no preventDefault: the page's preview/download must run
      }
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
      handlePreviewGesture(event);
    },
    { capture: true, signal: lifecycle.signal }
  );

  // Keyboard activation (Enter / Space) has no pointerdown: arm there too.
  document.addEventListener(
    "keydown",
    (event) => {
      if (!event.isTrusted) return;
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      if (explicitPageAction(event.target)) preparePageAction(event.target);
    },
    { capture: true, signal: lifecycle.signal }
  );

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "MAIL_PEEK_PING") {
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type === "PREVIEW_URL" && message.url) {
      const filename = message.filename || extractFilename(message.url) || message.url;
      openPreview({
        url: message.url,
        filename,
        ext: normalizeExt(getExt(filename) || getExt(message.url)),
        force: true,
      });
      sendResponse({ ok: true });
      return false;
    }
    if (message?.type === "PREVIEW_CONTEXT") {
      const hint = message.url
        ? {
            url: message.url,
            filename: extractFilename(message.url),
            ext: normalizeExt(getExt(message.url)),
            force: true,
          }
        : lastHint;
      if (hint) openPreview({ ...hint, force: true });
      sendResponse({ ok: true });
      return false;
    }
    return false;
  });

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function fetchBytes(url) {
    try {
      const response = await fetch(url, { credentials: "include", redirect: "follow" });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return {
          bytes: new Uint8Array(buffer),
          contentType: response.headers.get("content-type") || "",
          filename: filenameFromDisposition(response.headers.get("content-disposition") || ""),
        };
      }
    } catch {
      /* CORS or mixed-content; fall through */
    }

    const remote = await chrome.runtime.sendMessage({ type: "FETCH_BINARY", url });
    if (!remote?.ok) throw new Error(remote?.error || "Unable to read the file");
    return {
      bytes: base64ToBytes(remote.base64),
      contentType: remote.contentType || "",
      filename: remote.filename || "",
    };
  }

  function filenameFromDisposition(header) {
    const star = /filename\*\s*=\s*(?:UTF-8''|)([^;]+)/i.exec(header || "");
    if (star) {
      try {
        return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
      } catch {
        /* ignore */
      }
    }
    const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header || "");
    return plain ? plain[1].trim() : "";
  }

  async function resolveJiraUrl(filename) {
    const key = getJiraIssueKey();
    if (!key || !filename) return null;
    const endpoints = [
      `/rest/api/3/issue/${encodeURIComponent(key)}?fields=attachment`,
      `/rest/api/2/issue/${encodeURIComponent(key)}?fields=attachment`,
    ];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) continue;
        const data = await response.json();
        const attachments = data?.fields?.attachment || [];
        const hit = matchAttachment(attachments, filename);
        if (hit?.content) {
          return { url: hit.content, filename: hit.filename, mime: hit.mimeType || "" };
        }
      } catch {
        /* try next */
      }
    }
    return null;
  }

  function matchAttachment(attachments, hint) {
    const name = String(hint || "").trim();
    if (!name) return null;
    const exact = attachments.find((item) => item.filename === name);
    if (exact) return exact;
    const lower = name.toLowerCase();
    const ci = attachments.find((item) => (item.filename || "").toLowerCase() === lower);
    if (ci) return ci;

    const stripped = name.replace(/\.\.\./g, "").trim();
    const ext = getExt(name);
    const sameExt = attachments.filter((item) => getExt(item.filename) === ext);
    if (name.includes("...") && sameExt.length) {
      const prefix = stripped.slice(0, Math.min(24, stripped.length)).toLowerCase();
      const hits = sameExt.filter((item) => (item.filename || "").toLowerCase().startsWith(prefix));
      if (hits.length === 1) return hits[0];
    }
    // The visible name in a wrapped attachment card may be only the tail of the
    // real filename (e.g. "16:09:05.eml" for "email-2026-10-07 16:09:05.eml").
    const suffixHits = sameExt.filter((item) => (item.filename || "").toLowerCase().endsWith(lower));
    if (suffixHits.length === 1) return suffixHits[0];
    if (sameExt.length === 1) return sameExt[0];
    return null;
  }

  async function resolveSource(hint) {
    if (hint.url && !hint.url.startsWith("javascript:") && hint.url !== location.href) {
      return { url: hint.url, filename: hint.filename };
    }
    if (isAtlassian() && hint.filename) {
      const resolved = await resolveJiraUrl(hint.filename);
      if (resolved) return resolved;
    }
    throw new Error("Could not find the file URL. Try right-click → “Preview with Mail Peek”, or hold Shift and click to download normally.");
  }

  function formatSize(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function decodeRfc2047(value) {
    return String(value || "").replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, data) => {
      try {
        if (encoding.toUpperCase() === "B") {
          const binary = atob(data.replace(/\s/g, ""));
          const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
          return new TextDecoder(charset).decode(bytes);
        }
        const qp = data.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (__, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
        return qp;
      } catch {
        return value;
      }
    });
  }

  function parseHeaders(raw) {
    const unfolded = raw.replace(/\r?\n[ \t]/g, " ");
    const headers = {};
    for (const line of unfolded.split(/\r?\n/)) {
      const index = line.indexOf(":");
      if (index < 0) continue;
      const key = line.slice(0, index).toLowerCase();
      const val = decodeRfc2047(line.slice(index + 1).trim());
      headers[key] = headers[key] ? `${headers[key]}, ${val}` : val;
    }
    return headers;
  }

  function decodeQuotedPrintableBytes(value) {
    const stripped = String(value || "").replace(/=\r?\n/g, "");
    const out = [];
    for (let i = 0; i < stripped.length; i += 1) {
      if (stripped[i] === "=" && i + 2 < stripped.length) {
        out.push(parseInt(stripped.slice(i + 1, i + 3), 16));
        i += 2;
      } else {
        out.push(stripped.charCodeAt(i) & 0xff);
      }
    }
    return new Uint8Array(out);
  }

  function decodePartBytes(body, transferEncoding) {
    const encoding = (transferEncoding || "").toLowerCase();
    if (encoding.includes("base64")) {
      const binary = atob(String(body || "").replace(/\s/g, ""));
      return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    }
    if (encoding.includes("quoted-printable")) {
      return decodeQuotedPrintableBytes(body);
    }
    const text = String(body || "");
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff;
    return bytes;
  }

  function decodeBody(body, transferEncoding, charset) {
    const encoding = (transferEncoding || "").toLowerCase();
    // 7bit/8bit/binary parts: the whole file was already decoded as UTF-8 text
    // in decodeText(), so the body is real text — re-mapping it through
    // charCodeAt & 0xff would destroy non-Latin characters.
    if (!encoding.includes("base64") && !encoding.includes("quoted-printable")) {
      return String(body || "");
    }
    const bytes = decodePartBytes(body, transferEncoding);
    const cs = charset || "utf-8";
    try {
      return new TextDecoder(cs).decode(bytes);
    } catch {
      return new TextDecoder("utf-8").decode(bytes);
    }
  }

  function splitMultipart(body, boundary) {
    const token = `--${boundary}`;
    return body
      .split(token)
      .map((part) => part.replace(/^\r?\n/, "").replace(/--\r?\n?$/, "").trim())
      .filter((part) => part && part !== "--");
  }

  function parseMime(raw) {
    const idx = raw.search(/\r?\n\r?\n/);
    const headerRaw = idx >= 0 ? raw.slice(0, idx) : raw;
    const body = idx >= 0 ? raw.slice(idx).replace(/^\r?\n\r?\n/, "") : "";
    const headers = parseHeaders(headerRaw);
    const contentType = headers["content-type"] || "text/plain";
    const disposition = headers["content-disposition"] || "";
    const charset = /charset="?([^";\s]+)/i.exec(contentType)?.[1];
    const boundary = /boundary="?([^";]+)"?/i.exec(contentType)?.[1];
    const mime = contentType.split(";")[0].trim().toLowerCase();
    const filename = decodeRfc2047(
      /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(disposition)?.[1]
      || /name="?([^";]+)"?/i.exec(contentType)?.[1]
      || ""
    ).replace(/"/g, "");
    const cid = (headers["content-id"] || "").replace(/[<>]/g, "").trim();

    if (/multipart\//i.test(contentType) && boundary) {
      const parts = splitMultipart(body, boundary).map(parseMime);
      const htmlPart = parts.find((part) => /text\/html/i.test(part.contentType) && part.html);
      const htmlNested = parts.find((part) => part.html);
      const textPart = parts.find((part) => /text\/plain/i.test(part.contentType) && part.text);
      const attachments = parts.flatMap((part) => {
        const own = [];
        if (part.bytes?.byteLength && !/^text\/(html|plain)/i.test(part.contentType || "")) {
          own.push(part);
        }
        return own.concat(part.attachments || []);
      });
      return {
        headers,
        contentType: mime,
        html: htmlPart?.html || htmlNested?.html || "",
        text: textPart?.text || "",
        attachments,
      };
    }

    const bytes = decodePartBytes(body, headers["content-transfer-encoding"]);
    const isText = /^text\//i.test(mime);
    const decoded = isText ? decodeBody(body, headers["content-transfer-encoding"], charset) : "";
    return {
      headers,
      contentType: mime,
      disposition,
      filename,
      cid,
      mime,
      html: /text\/html/i.test(mime) ? decoded : "",
      text: decoded,
      bytes,
      attachments: [],
    };
  }

  function mimeFromName(name) {
    const ext = getExt(name);
    return (
      {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        bmp: "image/bmp",
        svg: "image/svg+xml",
        tif: "image/tiff",
        tiff: "image/tiff",
        ico: "image/x-icon",
      }[ext] || "application/octet-stream"
    );
  }

  function toU8(content) {
    if (!content) return new Uint8Array();
    if (content instanceof Uint8Array) return content;
    return new Uint8Array(content);
  }

  function bytesToDataUrl(bytes, mime) {
    const chunk = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return `data:${mime || "application/octet-stream"};base64,${btoa(binary)}`;
  }

  function normalizeCid(value) {
    let text = String(value || "");
    try {
      text = decodeURIComponent(text);
    } catch {
      /* keep raw */
    }
    return text
      .replace(/^cid:/i, "")
      .replace(/^<|>$/g, "")
      .trim()
      .toLowerCase();
  }

  // 1×1 transparent GIF — used when a cid: has no matching attachment
  // (common for Outlook/Word placeholders like cid:~WRD0000.jpg). Leaving
  // unresolved cid: URLs triggers a Chrome CSP error in the sandbox.
  const CID_PLACEHOLDER =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  function replaceCidImages(html, attachments) {
    if (!html) return "";
    const byCid = new Map();
    const byName = new Map();
    for (const att of attachments || []) {
      if (!att?.bytes?.byteLength) continue;
      const url = bytesToDataUrl(att.bytes, att.mime || mimeFromName(att.name));
      const cid = normalizeCid(att.cid);
      if (cid) {
        byCid.set(cid, url);
        byCid.set(cid.split("@")[0], url);
      }
      if (att.name) {
        const name = String(att.name).toLowerCase();
        byName.set(name, url);
        byName.set(name.replace(/^~/, ""), url);
      }
    }

    function resolveCid(raw) {
      const key = normalizeCid(raw);
      if (!key) return CID_PLACEHOLDER;
      return (
        byCid.get(key)
        || byCid.get(key.split("@")[0])
        || byName.get(key)
        || byName.get(key.split("@")[0])
        || byName.get(key.replace(/^~/, ""))
        || CID_PLACEHOLDER
      );
    }

    return html
      // src="cid:...", href='cid:...', unquoted cid:...
      .replace(/(['"]?)cid:([^"'>\s)]+)/gi, (match, quote, cid) => `${quote || ""}${resolveCid(cid)}`)
      // CSS url(cid:...)
      .replace(/url\(\s*(['"]?)cid:([^'")]+)\1\s*\)/gi, (_, quote, cid) => `url(${quote || ""}${resolveCid(cid)}${quote || ""})`)
      // Relative / filename-only src that matches an attachment name
      .replace(/\bsrc=(['"])([^'"]+)\1/gi, (match, quote, src) => {
        if (/^(data:|https?:|blob:)/i.test(src)) return match;
        if (/^cid:/i.test(src)) return `src=${quote}${resolveCid(src)}${quote}`;
        const name = src.split(/[/?#]/).pop()?.toLowerCase();
        const url = name && (byName.get(name) || byName.get(name.replace(/^~/, "")));
        return url ? `src=${quote}${url}${quote}` : match;
      });
  }

  // Quoted-header labels written by a localized Outlook (Chinese UI) inside the
  // mail body. Shown as their English equivalents so the preview reads
  // consistently; the surrounding content is untouched.
  // Input patterns are written as \uXXXX escapes (source stays ASCII):
  //   From:        fa jian ren / ji jian zhe / ji jian ren
  //   To:          shou jian ren
  //   Cc:          chao song
  //   Bcc:         mi song / mi jian fu ben
  //   Sent:        fa song shi jian / ji jian ri qi / chuan song shi jian
  //   Subject:     zhu ti / zhu zhi
  //   Date/Time:   ri qi / shi jian
  //   Attachments: fu jian
  //   Importance:  zhong yao xing
  // \uff1a is the full-width colon.
  const COLON = "[:\uff1a]";
  const HEADER_LABELS = [
    [new RegExp(`(\u53d1\u4ef6\u4eba|\u5bc4\u4ef6\u8005|\u5bc4\u4ef6\u4eba)(\\s*)${COLON}`, "g"), "From$2:"],
    [new RegExp(`(\u6536\u4ef6\u4eba)(\\s*)${COLON}`, "g"), "To$2:"],
    [new RegExp(`(\u6284\u9001)(\\s*)${COLON}`, "g"), "Cc$2:"],
    [new RegExp(`(\u5bc6\u9001|\u5bc6\u4ef6\u526f\u672c)(\\s*)${COLON}`, "g"), "Bcc$2:"],
    [new RegExp(`(\u53d1\u9001\u65f6\u95f4|\u5bc4\u4ef6\u65e5\u671f|\u50b3\u9001\u6642\u9593)(\\s*)${COLON}`, "g"), "Sent$2:"],
    [new RegExp(`(\u4e3b\u9898|\u4e3b\u65e8)(\\s*)${COLON}`, "g"), "Subject$2:"],
    [new RegExp(`(\u65e5\u671f)(\\s*)${COLON}`, "g"), "Date$2:"],
    [new RegExp(`(\u65f6\u95f4)(\\s*)${COLON}`, "g"), "Time$2:"],
    [new RegExp(`(\u9644\u4ef6)(\\s*)${COLON}`, "g"), "Attachments$2:"],
    [new RegExp(`(\u91cd\u8981\u6027)(\\s*)${COLON}`, "g"), "Importance$2:"],
  ];

  // "Forwarded from Outlook" marker in Chinese Outlook bodies.
  const FORWARDED_ZH_RE = /\u4ece Outlook \u8f6c\u53d1\u7684\u90ae\u4ef6/g;
  // "Original Message" / "Forwarded Message" in Chinese.
  const ORIGINAL_ZH = "\u539f\u59cb\u90ae\u4ef6";
  const FORWARDED_ZH = "\u8f6c\u53d1\u90ae\u4ef6";
  const FORWARD_WORD_ZH = "\u8f6c\u53d1";

  function englishHeaderLabels(text) {
    let out = String(text || "");
    if (!/[\u4e00-\u9fff]/.test(out)) return out;
    for (const [pattern, replacement] of HEADER_LABELS) out = out.replace(pattern, replacement);
    return out;
  }

  const SPLIT_LINE = '<hr class="mail-split-line">';

  function addQuoteSeparators(html) {
    if (!html) return "";
    return englishHeaderLabels(html)
      .replace(/<div([^>]*id=["']divRplyFwdMsg["'][^>]*)>/gi, `${SPLIT_LINE}<div$1>`)
      .replace(/<div([^>]*id=["']appendonsend["'][^>]*)>/gi, `${SPLIT_LINE}<div$1>`)
      .replace(/-----\s*Original Message\s*-----/gi, `${SPLIT_LINE}<span class="mail-split-label">Original Message</span>`)
      .replace(/-{3,}\s*Forwarded [Mm]essage\s*-{3,}/g, `${SPLIT_LINE}<span class="mail-split-label">Forwarded Message</span>`)
      .replace(FORWARDED_ZH_RE, `${SPLIT_LINE}<span class="mail-split-label">Forwarded Message</span>`)
      .replace(/<b>\s*From:\s*<\/b>/gi, `${SPLIT_LINE}<b>From:</b>`)
      // Avoid stacking two rules when Outlook markers sit next to each other
      // (e.g. divRplyFwdMsg immediately followed by <b>From:</b>).
      .replace(SPLIT_DUP_RE, `${SPLIT_LINE}$1`);
  }

  const SPLIT_DUP_RE = new RegExp(
    `<hr class="mail-split-line">((?:<span class="mail-split-label">[^<]*</span>)?(?:\\s*<(?!hr)[^>]*>){0,6}\\s*)<hr class="mail-split-line">`,
    "g"
  );

  function textToHtml(text) {
    const raw = englishHeaderLabels(String(text || "").replace(/\r\n?/g, "\n").trim());
    if (!raw) return "";
    const lines = raw.split("\n");
    const headerStart = /^(From|De|Von)\s*[:\uff1a]/i;
    const headerFollow = /^(Sent|To|Date|Cc|Subject)\s*[:\uff1a]/i;
    const separator = new RegExp(
      `^-{2,}\\s*(Original Message|${ORIGINAL_ZH}|Forwarded message|${FORWARDED_ZH}|Weitergeleitete Nachricht)\\s*-{2,}$`,
      "i"
    );
    const forwardWord = new RegExp(`forward|${FORWARD_WORD_ZH}|weitergeleitete`, "i");
    const chunks = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const trimmed = line.trim();
      if (separator.test(trimmed)) {
        const label = forwardWord.test(trimmed) ? "Forwarded Message" : "Original Message";
        chunks.push(`${SPLIT_LINE}<span class="mail-split-label">${label}</span>\n`);
        continue;
      }
      if (headerStart.test(trimmed)) {
        const lookahead = lines.slice(i + 1, i + 5).some((next) => headerFollow.test(next.trim()));
        if (lookahead) chunks.push(SPLIT_LINE);
      }
      chunks.push(`${escapeHtml(line)}\n`);
    }
    return `<div class="plain-body">${chunks.join("")}</div>`;
  }

  function decodeHtmlBytes(bytes) {
    if (!(bytes instanceof Uint8Array) || !bytes.length) return "";
    const head = bytesLatin1(bytes.subarray(0, Math.min(bytes.length, 8192)));
    const match = /charset=["']?\s*([\w-]+)/i.exec(head);
    const hinted = match ? match[1].toLowerCase() : "";
    const label =
      /utf-?8/.test(hinted) ? "utf-8"
      : /gb2312|gbk|gb18030/.test(hinted) ? "gbk"
      : /big5/.test(hinted) ? "big5"
      : hinted || "";
    const tryDecode = (enc, fatal) => {
      try {
        return new TextDecoder(enc, fatal ? { fatal: true } : undefined).decode(bytes);
      } catch {
        return null;
      }
    };
    if (label) {
      const direct = tryDecode(label, false);
      if (direct != null) return direct;
    }
    return tryDecode("utf-8", true) || tryDecode("gbk", false) || tryDecode("utf-8", false) || "";
  }

  function bytesLatin1(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
    return out;
  }

  function bodyFromRtf(node) {
    const rtfApi = globalThis.MailPeekRtf;
    const compressed = node?.compressedRtf;
    if (!rtfApi || !(compressed instanceof Uint8Array) || !compressed.length) return { html: "", text: "" };
    try {
      const rtf = rtfApi.decompress(compressed);
      const html = rtfApi.rtfToHtml(rtf);
      if (html) return { html, text: "" };
      return { html: "", text: rtfApi.rtfToText(rtf) };
    } catch {
      return { html: "", text: "" };
    }
  }

  function decorateEmailHtml(html) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  /* Do not shrink the mail to the dialog: the iframe is measured and sized to
     the content, and the preview panel scrolls horizontally when it is wider.
     Images therefore keep their original dimensions and aspect ratio. */
  html, body { margin: 0; padding: 0; background: #fff; color: #0f172a; overflow: visible; }
  body { font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; padding: 16px 20px 24px; box-sizing: border-box; }
  * { box-sizing: border-box; }
  .plain-body { white-space: pre-wrap; word-break: break-word; font-size: 13px; }
  blockquote, .gmail_quote, blockquote.gmail_quote,
  #divRplyFwdMsg, #appendonsend, .OutlookMessageHeader {
    border-left: 3px solid #94a3b8;
    padding: 8px 0 8px 12px;
    margin: 16px 0 8px;
    background: #f8fafc;
  }
  hr { border: none; border-top: 1px dashed #cbd5e1; margin: 20px 0; }
  /* Reply / forward separator: a plain rule, same in .msg and .eml */
  hr.mail-split-line {
    border: none;
    border-top: 1px solid #b6c2d1;
    margin: 22px 0 14px;
  }
  .mail-split-label {
    display: inline-block;
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .04em;
    text-transform: uppercase;
    margin: -6px 0 6px;
  }
</style></head><body>${html || ""}</body></html>`;
  }

  function isExchangeDn(value) {
    return /^\/o=/i.test(String(value || "").trim());
  }

  function isSmtpAddress(value) {
    const text = String(value || "").trim();
    return text.includes("@") && !isExchangeDn(text) && !/\s/.test(text);
  }

  function pickSmtp(...candidates) {
    for (const value of candidates) {
      if (isSmtpAddress(value)) return String(value).trim();
    }
    for (const value of candidates) {
      const text = String(value || "").trim();
      if (text && !isExchangeDn(text)) return text;
    }
    return "";
  }

  function formatAddress(name, email) {
    const cleanName = String(name || "").trim();
    const cleanEmail = pickSmtp(email);
    if (cleanName && cleanEmail && !cleanName.includes(cleanEmail)) {
      return `${cleanName} <${cleanEmail}>`;
    }
    return cleanName || cleanEmail || "";
  }

  function formatRecipient(person) {
    if (!person) return "";
    return formatAddress(
      person.name || person.displayName || "",
      person.smtpAddress || person.email || ""
    );
  }

  function formatFrom(node) {
    return formatAddress(
      node.senderName || "",
      node.senderSmtpAddress || node.creatorSMTPAddress || node.lastModifierSMTPAddress || node.senderEmail || ""
    );
  }

  function normalizeAddrKey(value) {
    const text = String(value || "").trim().toLowerCase();
    const angle = /<([^>]+)>/.exec(text);
    if (angle) return angle[1].trim();
    if (text.includes("@")) return text.replace(/^mailto:/, "");
    return text;
  }

  function splitAddressList(raw) {
    const text = String(raw || "").replace(/\r?\n[ \t]+/g, " ").trim();
    if (!text) return [];
    const parts = [];
    let current = "";
    let inQuotes = false;
    let depth = 0;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '"') inQuotes = !inQuotes;
      if (!inQuotes) {
        if (ch === "<") depth += 1;
        if (ch === ">" && depth > 0) depth -= 1;
        if ((ch === "," || ch === ";") && depth === 0) {
          if (current.trim()) parts.push(current.trim());
          current = "";
          continue;
        }
      }
      current += ch;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function getRawProp(node, tagStem) {
    const props = node.rawProps || [];
    const stem = String(tagStem || "").toLowerCase();
    for (const prop of props) {
      const tag = String(prop.propertyTag || "").toLowerCase();
      if (!tag.startsWith(stem)) continue;
      if (typeof prop.value === "string") return prop.value;
      if (prop.value instanceof Uint8Array) return decodeText(prop.value);
    }
    return "";
  }

  function headerValue(headersRaw, name) {
    const raw = String(headersRaw || "");
    if (!raw) return "";
    const unfolded = raw.replace(/\r?\n[ \t]+/g, " ");
    const re = new RegExp(`(?:^|\\r?\\n)${name}\\s*:\\s*([^\\r\\n]*)`, "ig");
    const chunks = [];
    let match;
    while ((match = re.exec(unfolded))) {
      if (match[1]?.trim()) chunks.push(match[1].trim());
    }
    return chunks.join(", ");
  }

  function recipientMatchesHint(person, hint) {
    const hintKey = normalizeAddrKey(hint);
    if (!hintKey) return false;
    const keys = [
      person.smtpAddress,
      person.email,
      person.name,
      person.displayName,
      formatRecipient(person),
    ]
      .map(normalizeAddrKey)
      .filter(Boolean);
    return keys.some((key) => key === hintKey || key.includes(hintKey) || hintKey.includes(key));
  }

  function formatRecipientLine(node, type) {
    const people = (node.recipients || []).filter((person) => person.recipType === type);
    // Outlook display order: PidTagDisplayTo / DisplayCc / DisplayBcc
    const displayTag = type === "to" ? "0e04" : type === "cc" ? "0e03" : "0e02";
    const display = getRawProp(node, displayTag);
    const headerName = type === "to" ? "To" : type === "cc" ? "Cc" : "Bcc";
    const orderHints = display
      ? display.split(";").map((part) => part.trim()).filter(Boolean)
      : splitAddressList(headerValue(node.headers, headerName));

    if (!orderHints.length) {
      return people.map(formatRecipient).filter(Boolean).join("; ");
    }

    const remaining = [...people];
    const ordered = [];
    for (const hint of orderHints) {
      const index = remaining.findIndex((person) => recipientMatchesHint(person, hint));
      if (index >= 0) {
        ordered.push(remaining.splice(index, 1)[0]);
      } else {
        ordered.push({ name: hint, smtpAddress: "", email: "" });
      }
    }
    ordered.push(...remaining);
    return ordered.map(formatRecipient).filter(Boolean).join("; ");
  }

  // ---- Structured addresses (for Reply / Reply all / Forward) ---------------
  // { name, email } where email is a real SMTP address or "" when the file only
  // carries an Exchange X.500 DN — the mail client then has to resolve it.

  function strictSmtp(...candidates) {
    for (const value of candidates) {
      if (isSmtpAddress(value)) return String(value).trim().replace(/^mailto:/i, "");
    }
    return "";
  }

  function parseAddress(text) {
    const raw = String(text || "").replace(/\s+/g, " ").trim();
    if (!raw) return null;
    const angle = /^(.*?)<([^<>]+)>\s*$/.exec(raw);
    if (angle) {
      const name = angle[1].trim().replace(/^"(.*)"$/, "$1").trim();
      const email = strictSmtp(angle[2]);
      return { name: name && name !== email ? name : "", email };
    }
    if (isSmtpAddress(raw)) return { name: "", email: raw };
    return { name: raw.replace(/^"(.*)"$/, "$1"), email: "" };
  }

  function parseAddressList(raw) {
    return splitAddressList(raw).map(parseAddress).filter(Boolean);
  }

  function addrKey(addr) {
    return (addr?.email || addr?.name || "").trim().toLowerCase();
  }

  function addrToString(addr) {
    if (!addr) return "";
    if (addr.email && addr.name) return `${addr.name} <${addr.email}>`;
    return addr.email || addr.name || "";
  }

  function msgAddressList(node, type) {
    return (node.recipients || [])
      .filter((person) => person.recipType === type)
      .map((person) => ({
        name: String(person.name || person.displayName || "").trim(),
        email: strictSmtp(person.smtpAddress, person.email),
      }))
      .filter((addr) => addr.name || addr.email);
  }

  function msgSender(node) {
    return {
      name: String(node.senderName || "").trim(),
      email: strictSmtp(
        node.senderSmtpAddress,
        getRawProp(node, "5d01"),
        getRawProp(node, "5d02"),
        node.creatorSMTPAddress,
        node.lastModifierSMTPAddress,
        node.senderEmail
      ),
    };
  }

  function messageIdOf(node) {
    const raw = getRawProp(node, "1035") || headerValue(node.headers, "Message-ID");
    return String(raw || "").trim();
  }

  function decodeText(bytes) {
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      return new TextDecoder("utf-8").decode(bytes);
    }
  }

  function ensureHost() {
    let host = document.getElementById(HOST_ID);
    if (host) return host.shadowRoot;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.all = "initial";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${modalCss()}</style><div class="backdrop" hidden></div>`;
    document.documentElement.appendChild(host);
    shadow.querySelector(".backdrop").addEventListener("click", (event) => {
      if (event.target.classList.contains("backdrop")) closeModal();
    });
    // Ctrl+wheel / pinch over the preview zooms the preview, not the page.
    // Registered on the host only so the page's own scrolling stays passive.
    host.addEventListener("wheel", onPreviewWheel, { capture: true, passive: false });
    return shadow;
  }

  // While the preview is open the page underneath must not scroll, even when
  // the preview's own scroller reaches its top/bottom (scroll chaining).
  let savedPageScroll = null;

  function lockPageScroll() {
    if (savedPageScroll) return;
    const root = document.documentElement;
    const body = document.body;
    savedPageScroll = {
      rootOverflow: root.style.overflow,
      rootOverscroll: root.style.overscrollBehavior,
      bodyOverflow: body ? body.style.overflow : "",
      bodyOverscroll: body ? body.style.overscrollBehavior : "",
    };
    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("overscroll-behavior", "none", "important");
    if (body) {
      body.style.setProperty("overflow", "hidden", "important");
      body.style.setProperty("overscroll-behavior", "none", "important");
    }
  }

  function unlockPageScroll() {
    if (!savedPageScroll) return;
    const root = document.documentElement;
    const body = document.body;
    root.style.overflow = savedPageScroll.rootOverflow;
    root.style.overscrollBehavior = savedPageScroll.rootOverscroll;
    if (body) {
      body.style.overflow = savedPageScroll.bodyOverflow;
      body.style.overscrollBehavior = savedPageScroll.bodyOverscroll;
    }
    savedPageScroll = null;
  }

  // Element that had focus before the preview opened; restored on close.
  let focusBeforeModal = null;

  function focusDialog() {
    const dialog = document.getElementById(HOST_ID)?.shadowRoot?.querySelector(".dialog");
    if (!dialog) return;
    try {
      dialog.focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  }

  function closeModal() {
    const shadow = document.getElementById(HOST_ID)?.shadowRoot;
    const backdrop = shadow?.querySelector(".backdrop");
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.innerHTML = "";
    }
    viewerFrames.clear();
    modal = null;
    unlockPageScroll();
    const previous = focusBeforeModal;
    focusBeforeModal = null;
    if (previous?.isConnected && typeof previous.focus === "function") {
      try {
        previous.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    }
  }

  // ---- Preview zoom (Ctrl/⌘ +/-/0, Ctrl+wheel, pinch) -----------------------
  // While the preview is open these gestures zoom only the preview content;
  // the host page keeps its own zoom level. Browser zoom works again once
  // the preview is closed.
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 0.1;
  let zoomLevel = 1;

  function zoomKeyDirection(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return 0;
    const key = event.key;
    const code = event.code;
    if (key === "+" || key === "=" || code === "Equal" || code === "NumpadAdd") return 1;
    if (key === "-" || key === "_" || code === "Minus" || code === "NumpadSubtract") return -1;
    if (key === "0" || code === "Digit0" || code === "Numpad0") return 2;
    return 0;
  }

  function applyZoom(next) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 100) / 100));
    zoomLevel = clamped;
    // Width measurement depends on the iframe viewport. Drop fixed widths so
    // each viewer re-reports its content at the new zoom level before the
    // preview panel decides whether it still needs horizontal scrolling.
    resetFrameWidths();
    broadcastZoom();
    updateZoomBadge();
  }

  function stepZoom(direction) {
    if (direction === 2) applyZoom(1);
    else if (direction === 1) applyZoom(zoomLevel + ZOOM_STEP);
    else if (direction === -1) applyZoom(zoomLevel - ZOOM_STEP);
  }

  function broadcastZoom() {
    for (const frame of viewerFrames.values()) {
      frame.contentWindow?.postMessage({ source: "mail-peek", type: "zoom", zoom: zoomLevel }, "*");
    }
  }

  function updateZoomBadge() {
    const shadow = document.getElementById(HOST_ID)?.shadowRoot;
    const dialog = shadow?.querySelector(".dialog");
    if (dialog) dialog.style.setProperty("--ap-zoom", String(zoomLevel));
    const badge = shadow?.querySelector('[data-act="zoom"]');
    if (badge) {
      badge.textContent = `${Math.round(zoomLevel * 100)}%`;
      badge.classList.toggle("changed", Math.abs(zoomLevel - 1) > 0.001);
      badge.title =
        Math.abs(zoomLevel - 1) > 0.001
          ? "Click to reset to 100%"
          : "Zoom: Ctrl/⌘ + / −  ·  Click to reset";
    }
    const zoomOut = shadow?.querySelector('[data-act="zoom-out"]');
    const zoomIn = shadow?.querySelector('[data-act="zoom-in"]');
    if (zoomOut) zoomOut.disabled = zoomLevel <= ZOOM_MIN + 0.001;
    if (zoomIn) zoomIn.disabled = zoomLevel >= ZOOM_MAX - 0.001;
  }

  document.addEventListener("keydown", (event) => {
    if (!modal) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      closeModal();
      return;
    }
    const direction = zoomKeyDirection(event);
    if (direction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      stepZoom(direction);
    }
  }, { capture: true, signal: lifecycle.signal });

  function onPreviewWheel(event) {
    if (!modal) return;
    // Only intercept Ctrl/⌘ + wheel (pinch-zoom). Plain two-finger scroll must
    // reach the mail iframe — calling preventDefault here used to cancel it.
    if (!event.ctrlKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.deltaY < 0) stepZoom(1);
    else if (event.deltaY > 0) stepZoom(-1);
  }

  // Ask the background to open a finished download with the OS default app.
  // Must be called while the page still has the user's click activation —
  // Chrome curries that gesture onto the message and downloads.open() needs it.
  async function openDownloadedDraft(downloadId) {
    try {
      const result = await chrome.runtime.sendMessage({ type: "DRAFT_OPEN", downloadId });
      return result?.ok ? { opened: true } : { opened: false, error: result?.error || "" };
    } catch (err) {
      return { opened: false, error: String(err?.message || err) };
    }
  }

  // ---- Reply / Reply all / Forward: driven by the compose.html frame -------
  //
  // Mail Peek never composes mail itself. All three buttons save the ORIGINAL
  // message file (the .msg / .eml exactly as previewed) and open it with the
  // OS default mail app, where the user hits Reply / Reply all / Forward. That
  // keeps every byte of fidelity and lets the mail client fill in recipients.
  //
  // The buttons live in an extension iframe (see compose.js for why). The
  // frame asks us for the file, we hand the bytes back, and the frame saves
  // and opens it without any dialog.

  const EXTENSION_ORIGIN = new URL(chrome.runtime.getURL("")).origin;
  const COMPOSE_MODES = { reply: "Reply", replyAll: "Reply all", forward: "Forward" };

  function originalFilename(name, mime) {
    let base = decodePercent(String(name || "").split(/[\\/]/).pop().trim());
    if (!base) base = "message";
    if (!/\.(msg|eml)$/i.test(base)) {
      base += /outlook|ms-tnef|vnd\.ms-outlook/i.test(mime || "") ? ".msg" : ".eml";
    }
    return base.replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function composeFrame() {
    return document.getElementById(HOST_ID)?.shadowRoot?.querySelector(".compose-frame") || null;
  }

  function replyToFrame(frame, payload, transfer) {
    try {
      frame.contentWindow?.postMessage(payload, EXTENSION_ORIGIN, transfer || []);
    } catch {
      /* frame gone */
    }
  }

  // ---- MSG -> EML conversion (Mac / Linux only) ------------------------------
  //
  // Outlook for Windows opens .msg natively, so there we hand over the original
  // file. Outlook for Mac (and Apple Mail) cannot read .msg properly: the
  // sender is usually stored only as an Exchange X.500 address, so the From
  // line comes up empty. On those platforms we rebuild the same message as a
  // standards .eml — same HTML body, inline images, attachments, embedded
  // messages, headers — with From/To/Cc written as name + SMTP address.

  const IS_WINDOWS = /win/i.test(navigator.userAgentData?.platform || navigator.platform || "");
  const CRLF = "\r\n";

  function utf8Bytes(text) {
    return new TextEncoder().encode(String(text ?? ""));
  }

  function base64Lines(bytes) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    let binary = "";
    for (let i = 0; i < u8.length; i += 0x8000) binary += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    const b64 = btoa(binary);
    const lines = [];
    for (let i = 0; i < b64.length; i += 76) lines.push(b64.slice(i, i + 76));
    return lines.join(CRLF);
  }

  function needsEncoding(text) {
    return /[^\x20-\x7e]/.test(text);
  }

  // RFC 2047 encoded-words, split so each stays under the 75-char limit.
  function encodedWord(text) {
    const value = String(text ?? "");
    if (!value) return "";
    if (!needsEncoding(value)) return value;
    const words = [];
    let chunk = "";
    for (const ch of value) {
      if (utf8Bytes(chunk + ch).length > 45) {
        words.push(`=?UTF-8?B?${btoa(String.fromCharCode(...utf8Bytes(chunk)))}?=`);
        chunk = "";
      }
      chunk += ch;
    }
    if (chunk) words.push(`=?UTF-8?B?${btoa(String.fromCharCode(...utf8Bytes(chunk)))}?=`);
    return words.join(CRLF + " ");
  }

  function quoteDisplayName(name) {
    const clean = String(name || "").replace(/[\r\n"]/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return "";
    if (needsEncoding(clean)) return encodedWord(clean);
    return /[()<>@,;:\\".\[\]]/.test(clean) ? `"${clean}"` : clean;
  }

  // "Name <smtp>" — when the file has no SMTP address for a person we keep
  // the name and use a clearly-marked placeholder (RFC 2606 .invalid).
  function headerAddr(addr) {
    const name = String(addr?.name || "").trim();
    let email = String(addr?.email || "").trim();
    if (!email) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "unknown";
      email = `${slug}@unresolved.invalid`;
    }
    const display = quoteDisplayName(name);
    return display ? `${display} <${email}>` : email;
  }

  function foldHeader(name, value) {
    const text = String(value ?? "").replace(/\r?\n/g, CRLF + " ");
    if (text.includes(CRLF) || (name.length + 2 + text.length) <= 76 || !text.includes(", ")) {
      return `${name}: ${text}`;
    }
    const parts = text.split(", ");
    const lines = [];
    let line = `${name}: ${parts[0]}`;
    for (const part of parts.slice(1)) {
      if (line.length + 2 + part.length > 76) {
        lines.push(line + ",");
        line = ` ${part}`;
      } else {
        line += `, ${part}`;
      }
    }
    lines.push(line);
    return lines.join(CRLF);
  }

  function rfc2822Date(value) {
    const date = value ? new Date(value) : new Date();
    const d = Number.isNaN(date.getTime()) ? new Date() : date;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad = (n) => String(n).padStart(2, "0");
    return `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
  }

  function boundaryToken(tag) {
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
    return `----=_MailPeek_${tag}_${rand}`;
  }

  function contentFilename(name) {
    const clean = String(name || "attachment").replace(/[\r\n"\\/]/g, "_").trim() || "attachment";
    if (!needsEncoding(clean)) return `filename="${clean}"`;
    return `filename*=UTF-8''${encodeURIComponent(clean)}`;
  }

  // Headers the .msg kept from transport that are still meaningful; the
  // MIME-structural ones are rebuilt by us and must not be copied.
  const KEEP_TRANSPORT_HEADERS = /^(received|return-path|authentication-results|dkim-signature|arc-.*|x-ms-.*|x-originating-ip|x-mailer|thread-topic|thread-index|in-reply-to|references|message-id|list-.*|importance|x-priority|priority|reply-to|sender|accept-language|content-language|x-originatororg|x-forefront-.*|x-microsoft-.*)$/i;

  function transportHeaderLines(raw) {
    const lines = String(raw || "").replace(/\r?\n/g, CRLF).split(CRLF);
    const out = [];
    let keep = false;
    for (const line of lines) {
      if (/^[ \t]/.test(line)) {
        if (keep) out.push(line);
        continue;
      }
      const match = /^([!-9;-~]+)\s*:/.exec(line);
      keep = !!match && KEEP_TRANSPORT_HEADERS.test(match[1]);
      if (keep) out.push(line);
    }
    return out;
  }

  function transportFromEmail(raw) {
    const from = parseAddress(decodeRfc2047(headerValue(raw, "From")));
    return strictSmtp(from?.email) || "";
  }

  function htmlWithUtf8Charset(html) {
    let out = String(html || "").replace(/<meta[^>]+charset[^>]*>/gi, "");
    const meta = '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
    if (/<head[^>]*>/i.test(out)) out = out.replace(/<head[^>]*>/i, (m) => `${m}${meta}`);
    else if (/<html[^>]*>/i.test(out)) out = out.replace(/<html[^>]*>/i, (m) => `${m}<head>${meta}</head>`);
    else out = `<html><head>${meta}</head><body>${out}</body></html>`;
    return out;
  }

  function plainTextOf(message) {
    const text = String(message.text || "").trim();
    if (text) return text;
    return String(message.rawHtml || "")
      .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function msgToEml(message, nested = []) {
    const headers = transportHeaderLines(message.headersRaw);
    const has = (name) => headers.some((line) => new RegExp(`^${name}\\s*:`, "i").test(line));

    const sender = { ...(message.fromAddr || {}) };
    if (!sender.email) sender.email = transportFromEmail(message.headersRaw);
    if (!sender.name && !sender.email) sender.name = String(message.from || "").trim();

    const top = [];
    top.push(foldHeader("From", headerAddr(sender)));
    if (message.toAddrs?.length) top.push(foldHeader("To", message.toAddrs.map(headerAddr).join(", ")));
    if (message.ccAddrs?.length) top.push(foldHeader("Cc", message.ccAddrs.map(headerAddr).join(", ")));
    top.push(`Subject: ${encodedWord(String(message.subject || "").replace(/\s+/g, " ").trim())}`);
    top.push(`Date: ${rfc2822Date(message.date)}`);
    if (!has("Message-ID")) {
      const mid = String(message.messageId || "").trim();
      top.push(`Message-ID: ${mid ? (mid.startsWith("<") ? mid : `<${mid}>`) : `<${boundaryToken("id").slice(6)}@mailpeek.local>`}`);
    }
    if (!has("References") && message.references) top.push(foldHeader("References", message.references));
    if (!has("Importance") && message.importance === 2) top.push("Importance: high");
    top.push("MIME-Version: 1.0");
    top.push("X-Converted-By: Mail Peek (Outlook .msg to .eml, content unchanged)");

    const html = message.rawHtml ? htmlWithUtf8Charset(message.rawHtml) : "";
    const text = plainTextOf(message);
    const files = (message.attachments || []).filter((file) => file?.bytes?.byteLength);
    const cidRefs = new Set((html.match(/cid:([^"'\s)>]+)/gi) || []).map((m) => m.slice(4).toLowerCase()));
    const inline = files.filter((file) => file.cid && (cidRefs.has(file.cid.toLowerCase()) || (file.hidden && /^image\//i.test(file.mime || ""))));
    const regular = files.filter((file) => !inline.includes(file));

    // A MIME entity: its own headers + content. Nesting builds new entities
    // whose content is the serialized children between boundaries.
    const entity = (head, content) => ({ head, content });
    const serialize = (part) => `${part.head.join(CRLF)}${CRLF}${CRLF}${part.content}`;
    const multipart = (type, tag, children, extra = "") => {
      const boundary = boundaryToken(tag);
      const content = [...children.map((child) => `--${boundary}${CRLF}${serialize(child)}`), `--${boundary}--`].join(CRLF);
      return entity([`Content-Type: ${type}; boundary="${boundary}"${extra}`], content);
    };
    const filePart = (file, disposition) => {
      // message/rfc822 parts must not be base64 (RFC 2046 §5.2.1); our own
      // converted .eml output is line-safe, so embed it as 8bit.
      const isMessage = file.mime === "message/rfc822";
      return entity(
        [
          `Content-Type: ${file.mime || mimeFromName(file.name) || "application/octet-stream"}; name="${String(file.name).replace(/["\r\n]/g, "_")}"`,
          `Content-Transfer-Encoding: ${isMessage ? "8bit" : "base64"}`,
          ...(disposition === "inline" && file.cid ? [`Content-ID: <${file.cid}>`] : []),
          `Content-Disposition: ${disposition}; ${contentFilename(file.name)}`,
        ],
        isMessage ? decodeText(file.bytes) : base64Lines(file.bytes)
      );
    };

    const textPart = entity(
      ['Content-Type: text/plain; charset="utf-8"', "Content-Transfer-Encoding: base64"],
      base64Lines(utf8Bytes(text))
    );
    let body = textPart;
    if (html) {
      const htmlPart = entity(
        ['Content-Type: text/html; charset="utf-8"', "Content-Transfer-Encoding: base64"],
        base64Lines(utf8Bytes(html))
      );
      body = multipart("multipart/alternative", "alt", [textPart, htmlPart]);
    }
    if (inline.length) {
      body = multipart("multipart/related", "rel", [body, ...inline.map((file) => filePart(file, "inline"))], '; type="multipart/alternative"');
    }

    const embedded = nested.map((child, index) => ({
      name: `${(child.subject || `Embedded message ${index + 1}`).replace(/[\\/:*?"<>|\r\n]+/g, " ").trim().slice(0, 80)}.eml`,
      bytes: msgToEml(child),
      mime: "message/rfc822",
    }));
    if (regular.length || embedded.length) {
      body = multipart("multipart/mixed", "mix", [body, ...[...regular, ...embedded].map((file) => filePart(file, "attachment"))]);
    }

    const head = [...headers, ...top, ...body.head].join(CRLF);
    return utf8Bytes(head + CRLF + CRLF + body.content + CRLF);
  }

  function handleComposeRequest(frame, { id, mode }) {
    const source = modal?.bytes;
    if (!source || !COMPOSE_MODES[mode]) {
      replyToFrame(frame, { type: "mail-peek:draft", id, error: "No message file to open" });
      return;
    }
    try {
      const isMsg = /\.msg$/i.test(modal.filename || "") || /ms-outlook/i.test(modal.mime || "");
      let bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
      let filename = originalFilename(modal.filename, modal.mime);
      let mime = isMsg ? "application/vnd.ms-outlook" : "message/rfc822";

      if (isMsg && !IS_WINDOWS && modal.thread?.length) {
        // Outlook for Mac cannot read .msg (blank From). Rebuild as .eml.
        bytes = msgToEml(modal.thread[0], modal.thread.slice(1));
        filename = filename.replace(/\.msg$/i, "") + ".eml";
        mime = "message/rfc822";
      }

      // Copy: the buffer is transferred to the frame and we still need ours.
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      replyToFrame(frame, { type: "mail-peek:draft", id, filename, mime, bytes: buffer }, [buffer]);
    } catch (err) {
      replyToFrame(frame, { type: "mail-peek:draft", id, error: String(err?.message || err) });
    }
  }

  function handleComposeResult({ ok, error, downloadId }) {
    // Success: the mail app now has the message — get out of its way.
    if (ok) {
      closeModal();
      return;
    }
    if (downloadId != null) {
      // The file is saved but opening was refused (e.g. activation expired).
      // A fresh click on the toast button retries via the background; that
      // route may show Chrome's one-line "Allow Mail Peek to open…" prompt.
      showToast("Message saved to Downloads.", {
        actionLabel: "Open in mail app",
        onAction: async () => {
          const retry = await openDownloadedDraft(downloadId);
          if (!retry.opened) {
            showToast(`Could not open automatically (${retry.error || "blocked"}). Double-click the file in Downloads.`);
          }
        },
      });
      return;
    }
    showToast(`Could not open the message: ${error || "unknown error"}`);
  }

  window.addEventListener(
    "message",
    (event) => {
      if (event.origin !== EXTENSION_ORIGIN) return;
      const frame = composeFrame();
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "mail-peek:compose") handleComposeRequest(frame, data);
      else if (data.type === "mail-peek:compose-result") handleComposeResult(data);
      else if (data.type === "mail-peek:escape") closeModal();
    },
    { signal: lifecycle.signal }
  );

  let toastTimer = 0;
  function showToast(text, { actionLabel = "", onAction = null, duration } = {}) {
    const dialog = document.getElementById(HOST_ID)?.shadowRoot?.querySelector(".dialog");
    if (!dialog) return;
    let toast = dialog.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      dialog.appendChild(toast);
    }
    toast.textContent = "";
    const label = document.createElement("span");
    label.className = "toast-text";
    label.textContent = text;
    toast.appendChild(label);
    if (actionLabel && typeof onAction === "function") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toast-btn";
      button.textContent = actionLabel;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        onAction();
      });
      toast.appendChild(button);
    }
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), duration ?? (actionLabel ? 12000 : 4200));
  }

  // Inline SVG icons for the header toolbar (Fluent-style outlines, 20px grid,
  // stroke-based so they inherit the button's text color).
  // Reply / Reply all / Forward icons live in compose.html.
  const ICONS = {
    paperclip:
      '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="m13.5 6.5-6 6a2.1 2.1 0 0 0 3 3l6.5-6.5a4 4 0 0 0-5.7-5.7L4.8 9.8a5.5 5.5 0 0 0 7.8 7.8L16 14.2"/></svg>',
    download:
      '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M10 3v9"/><path d="m6.5 8.5 3.5 3.5 3.5-3.5"/><path d="M3.5 13.5V15a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1.5"/></svg>',
    close:
      '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
      '<path d="m5 5 10 10"/><path d="M15 5 5 15"/></svg>',
  };

  function iconButton({ icon, label, title, attrs = "", extraClass = "" }) {
    return `<button type="button" class="btn icon ${extraClass}" ${attrs} title="${escapeHtml(title || label)}" aria-label="${escapeHtml(label)}">${ICONS[icon]}</button>`;
  }

  function showModal({ title, badge, bodyHtml, bytes, filename, mime, afterRender, nudge = false, replyTo = null, thread = null }) {
    const shadow = ensureHost();
    const backdrop = shadow.querySelector(".backdrop");
    backdrop.hidden = false;
    lockPageScroll();
    // Remember where focus was so Escape/Close hands it back. We take focus
    // ourselves because the opening click is preventDefault-ed (focus does
    // not move), and if it was inside a page iframe our Ctrl/⌘ +/- keydown
    // listener on this document would never see the keys.
    if (!modal) focusBeforeModal = document.activeElement;
    const showNudge = nudge && shouldShowSupportNudge();
    const previews = supportState.previews || 0;
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" tabindex="-1">
        <header class="bar">
          <div class="titles">
            <span class="badge">${escapeHtml(badge)}</span>
            <span class="name" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
          </div>
          <div class="actions">
            <div class="zoom-group" role="group" aria-label="Preview zoom">
              <button type="button" class="btn zoom-step" data-act="zoom-out" title="Zoom out (Ctrl/⌘ −)" aria-label="Zoom out">−</button>
              <button type="button" class="btn zoom" data-act="zoom" title="Zoom: Ctrl/⌘ + / −  ·  Click to reset">100%</button>
              <button type="button" class="btn zoom-step" data-act="zoom-in" title="Zoom in (Ctrl/⌘ +)" aria-label="Zoom in">+</button>
            </div>
            <a class="btn support" data-act="support" href="${escapeHtml(supportLink("viewer"))}" target="_blank" rel="noopener noreferrer" title="Enjoying Mail Peek? Buy me a coffee ☕" aria-label="Support Mail Peek">☕</a>
            ${
              replyTo
                ? `<iframe class="compose-frame" src="${escapeHtml(chrome.runtime.getURL("compose.html"))}" title="Reply or forward" scrolling="no" allowtransparency="true"></iframe>`
                : ""
            }
            ${iconButton({ icon: "download", label: "Download", title: "Download the original file", attrs: 'data-act="download"' })}
            ${iconButton({ icon: "close", label: "Close", title: "Close (Esc)", attrs: 'data-act="close"', extraClass: "primary" })}
          </div>
        </header>
        ${
          showNudge
            ? `<div class="nudge" role="status">
                <span class="nudge-text">You've previewed <b>${previews}</b> emails with Mail Peek. If it saves you time, consider buying me a coffee ☕</span>
                <span class="nudge-actions">
                  <button type="button" class="nudge-btn primary" data-act="nudge-support">Support</button>
                  <button type="button" class="nudge-btn" data-act="nudge-later">Later</button>
                  <button type="button" class="nudge-btn quiet" data-act="nudge-never">Don't show again</button>
                </span>
              </div>`
            : ""
        }
        <div class="body">${bodyHtml}</div>
      </div>
    `;
    modal = { bytes, filename, mime, replyTo, thread };
    updateZoomBadge();
    focusDialog();
    backdrop.querySelector('[data-act="zoom-out"]').addEventListener("click", () => stepZoom(-1));
    backdrop.querySelector('[data-act="zoom-in"]').addEventListener("click", () => stepZoom(1));
    backdrop.querySelector('[data-act="zoom"]').addEventListener("click", () => applyZoom(1));
    backdrop.querySelector('[data-act="close"]').addEventListener("click", closeModal);
    backdrop.querySelector('[data-act="download"]').addEventListener("click", () => {
      downloadBytes(bytes, filename, mime);
    });
    backdrop.querySelector('[data-act="support"]').addEventListener("click", (event) => {
      // Let the anchor open normally, but keep the click from reaching the page.
      event.stopPropagation();
    });
    if (showNudge) {
      const nudgeEl = backdrop.querySelector(".nudge");
      const dismiss = (patch) => {
        saveSupportState(patch);
        nudgeEl?.remove();
      };
      backdrop.querySelector('[data-act="nudge-support"]').addEventListener("click", () => {
        openSupportPage("nudge");
        dismiss({ never: true });
      });
      backdrop.querySelector('[data-act="nudge-later"]').addEventListener("click", () => {
        dismiss({ dismissals: (supportState.dismissals || 0) + 1, dismissedAt: Date.now() });
      });
      backdrop.querySelector('[data-act="nudge-never"]').addEventListener("click", () => {
        dismiss({ never: true });
      });
    }
    afterRender?.(backdrop);
  }

  function allowNextDownload({ filename, url, windowMs } = {}) {
    if (!contextAlive()) return;
    try {
      chrome.runtime
        .sendMessage({
          type: "ALLOW_NEXT_DOWNLOAD",
          filename: filename || "",
          url: url || "",
          windowMs: windowMs || 0,
        })
        .catch?.(() => {});
    } catch {
      /* context gone; nothing to bypass */
    }
  }

  function downloadBytes(bytes, filename, mime) {
    const name = filename || "file";
    // blob: downloads are ignored by the interceptor — do NOT arm allowNext,
    // or the leftover token would let the next real .msg/.eml download through.
    const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  function showLoading(filename) {
    showModal({
      title: filename || "Preview",
      badge: "Loading",
      bodyHtml: `<div class="status">Reading file…</div>`,
      bytes: new Uint8Array(),
      filename: filename || "file",
      mime: "application/octet-stream",
    });
  }

  function showError(filename, error) {
    showModal({
      title: filename || "Preview failed",
      badge: "Error",
      bodyHtml: `<div class="status error">${escapeHtml(error)}</div>`,
      bytes: new Uint8Array(),
      filename: filename || "file",
      mime: "application/octet-stream",
    });
  }

  let viewerSeq = 0;
  const viewerFrames = new Map();

  function previewScroller() {
    return document.getElementById(HOST_ID)?.shadowRoot?.querySelector(".body") || null;
  }

  // Drop the fixed width applied to widen an iframe for an oversized mail.
  // The viewer then measures itself against the current panel width again.
  function releaseFrameWidth(frame) {
    frame.style.removeProperty("width");
    const card = frame.closest(".msg-card");
    if (card) card.style.removeProperty("width");
    const thread = frame.closest(".thread");
    if (!thread) return;
    let max = 0;
    thread.querySelectorAll("iframe[data-viewer-id]").forEach((item) => {
      if (item !== frame) max = Math.max(max, Math.round(parseFloat(item.style.width) || 0));
    });
    thread.style.minWidth = max ? `${max}px` : "";
    thread.style.width = max && thread.classList.contains("single") ? `${max}px` : "";
  }

  function resetFrameWidths() {
    for (const frame of viewerFrames.values()) releaseFrameWidth(frame);
  }

  function applyFrameMeasure(frame, data) {
    const height = Math.min(Math.max(Number(data.height) || 0, 60), 40000);
    frame.style.height = `${height + 2}px`;

    // Width measurements are only trustworthy at the zoom level currently
    // applied. Reports still in flight from before a zoom change are ignored;
    // the viewer re-reports right after it applies the new zoom.
    const measuredZoom = Number(data.zoom) || 1;
    if (Math.abs(measuredZoom - zoomLevel) > 0.001) return;

    // The viewer reports the width of its laid-out content (= its own viewport
    // when everything fits). Only go wider than the panel when the mail really
    // is wider — a large image at its original size, a fixed-width table — so
    // the .body scroller can pan horizontally instead of shrinking it.
    const scroller = previewScroller();
    const available = scroller ? scroller.clientWidth : frame.clientWidth;
    const measured = Math.max(0, Number(data.width) || 0);
    const wide = measured > available + 1;
    const width = wide ? Math.ceil(measured) : 0;
    frame.style.width = width ? `${width}px` : "";

    // Let the card/header and (single-message) thread grow with the mail, so
    // its background keeps covering the whole scrollable width.
    const card = frame.closest(".msg-card");
    if (card) card.style.width = width ? `${width}px` : "";
    const thread = frame.closest(".thread");
    if (thread) {
      let max = 0;
      thread.querySelectorAll("iframe[data-viewer-id]").forEach((item) => {
        max = Math.max(max, Math.round(parseFloat(item.style.width) || 0));
      });
      thread.style.minWidth = max ? `${max}px` : "";
      thread.style.width = max && thread.classList.contains("single") ? `${max}px` : "";
    }
  }

  let resizeRaf = 0;
  window.addEventListener(
    "resize",
    () => {
      if (!modal) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => resetFrameWidths());
    },
    { signal: lifecycle.signal }
  );

  function mountViewer(frame, type, html) {
    if (!frame) return;
    const id = `ap-${Date.now().toString(36)}-${(viewerSeq += 1)}`;
    frame.dataset.viewerId = id;
    viewerFrames.set(id, frame);
    let url;
    try {
      url = chrome.runtime.getURL("viewer.html");
    } catch {
      url = null;
    }
    if (!url) {
      frame.srcdoc = html;
      return;
    }
    // Single-message view: the iframe is the only scroller, so it must never
    // chain scrolls outward. In a multi-message thread the outer list should
    // still take over when the body hits its end.
    frame.addEventListener(
      "load",
      () => {
        frame.contentWindow?.postMessage(
          { source: "mail-peek", type, html, id, zoom: zoomLevel },
          "*"
        );
      },
      { once: true }
    );
    frame.src = `${url}#${id}`;
  }

  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== "mail-peek-viewer") return;
    if (data.type === "zoom-step") {
      if (modal) stepZoom(Number(data.direction) || 0);
      return;
    }
    if (data.type === "remeasure" && data.id) {
      const frame = viewerFrames.get(data.id);
      if (frame && frame.contentWindow === event.source) releaseFrameWidth(frame);
      return;
    }
    if (data.type === "wheel") {
      if (!modal) return;
      const shadow = document.getElementById(HOST_ID)?.shadowRoot;
      const scroller = shadow?.querySelector(".body");
      if (!scroller) return;
      let dx = Number(data.deltaX) || 0;
      let dy = Number(data.deltaY) || 0;
      const mode = Number(data.deltaMode) || 0;
      if (mode === 1) {
        dx *= 16;
        dy *= 16;
      } else if (mode === 2) {
        dx *= scroller.clientWidth;
        dy *= scroller.clientHeight;
      }
      scroller.scrollTop += dy;
      scroller.scrollLeft += dx;
      return;
    }
    if (data.type !== "height" || !data.id) return;
    const frame = viewerFrames.get(data.id);
    if (!frame || frame.contentWindow !== event.source) return;
    // Size the iframe to its content; the preview .body panel is the scroller.
    applyFrameMeasure(frame, data);
  });

  function renderHtmlPreview(bytes, filename) {
    showModal({
      title: filename,
      badge: "HTML",
      bodyHtml: `<iframe class="frame page"></iframe>`,
      bytes,
      filename,
      mime: "text/html",
      nudge: true,
      afterRender(root) {
        mountViewer(root.querySelector("iframe.frame"), "render-page", decodeHtmlBytes(bytes));
      },
    });
  }

  // Attachments worth listing: everything except images that are actually
  // displayed inline in the body. Outlook marks those hidden and gives them a
  // Content-ID; other mailers set Content-ID / "inline" on real attachments
  // too, so the deciding factor is whether the body references the cid.
  function cidReferences(message) {
    const html = String(message?.rawHtml || message?.quoteHtml || "");
    const refs = new Set();
    for (const match of html.matchAll(/cid:([^"'\s)>]+)/gi)) {
      const raw = match[1];
      refs.add(raw.toLowerCase());
      try {
        refs.add(decodeURIComponent(raw).toLowerCase());
      } catch {
        /* keep raw */
      }
    }
    return refs;
  }

  function visibleAttachments(message) {
    const list = Array.isArray(message) ? message : message?.attachments;
    const refs = Array.isArray(message) ? new Set() : cidReferences(message);
    return (list || []).filter((file) => {
      if (!file?.name || !file.bytes?.byteLength) return false;
      const cid = String(file.cid || "").trim().toLowerCase();
      const isImage = /^image\//i.test(file.mime || mimeFromName(file.name));
      if (cid && refs.has(cid)) return false; // rendered inline in the body
      if (cid && file.hidden && isImage) return false; // Outlook inline picture
      return true;
    });
  }

  function renderThread(messages) {
    const multi = messages.length > 1;
    return `<div class="thread ${multi ? "multi" : "single"}">${messages
      .map((message, index) => {
        const meta = [
          ["From", message.from],
          ["To", message.to],
          ["Cc", message.cc],
          ["Date", message.date],
        ]
          .filter(([, value]) => value)
          .map(([label, value]) => `<div class="meta-row"><span>${label}</span><b>${escapeHtml(value)}</b></div>`)
          .join("");
        const visible = visibleAttachments(message);
        const files = visible
          .map(
            (file, fileIndex) =>
              `<button type="button" class="chip" data-msg="${index}" data-att="${fileIndex}" title="Download ${escapeHtml(file.name)}">` +
              `<span class="chip-name">${escapeHtml(file.name)}</span>` +
              `<span class="chip-size">${formatSize(file.bytes.length)}</span></button>`
          )
          .join("");
        const filesRow = files
          ? `<div class="chips"><span class="chips-label">${ICONS.paperclip} ${visible.length} attachment${visible.length === 1 ? "" : "s"}</span>${files}</div>`
          : "";
        const bodyBlock = message.html
          ? `<iframe class="frame mail" data-mail="${index}" scrolling="yes"></iframe>`
          : `<pre class="plain">${escapeHtml(message.text || "(Empty body)")}</pre>`;
        const subLabel = multi
          ? `<div class="msg-label">${escapeHtml(message.subject || message.label || `Message ${index + 1}`)} · ${index + 1}/${messages.length}</div>`
          : "";
        return `
          <article class="msg-card">
            ${subLabel}
            <div class="mail-head">
              ${meta}
              ${filesRow}
            </div>
            ${bodyBlock}
          </article>
        `;
      })
      .join("")}</div>`;
  }

  function bindThread(root, messages) {
    root.querySelectorAll("iframe[data-mail]").forEach((frame) => {
      const index = Number(frame.getAttribute("data-mail"));
      const html = messages[index]?.html;
      if (html) mountViewer(frame, "render-mail", html);
    });
    root.querySelectorAll("[data-msg][data-att]").forEach((button) => {
      button.addEventListener("click", () => {
        const msgIndex = Number(button.getAttribute("data-msg"));
        const fileIndex = Number(button.getAttribute("data-att"));
        const file = visibleAttachments(messages[msgIndex])[fileIndex];
        if (file) downloadBytes(file.bytes, file.name, file.mime);
      });
    });
  }

  function flattenMsgThread(reader, data) {
    const messages = [];
    const walk = (node, label) => {
      const attachments = [];
      const nested = [];
      for (const item of node.attachments || []) {
        if (item.innerMsgContent && item.innerMsgContentFields) {
          nested.push(item.innerMsgContentFields);
          continue;
        }
        let content = null;
        try {
          content = reader.getAttachment(item);
        } catch {
          content = null;
        }
        const name = content?.fileName || item.fileName || item.name || "attachment";
        attachments.push({
          name,
          bytes: toU8(content?.content),
          hidden: !!item.attachmentHidden,
          cid: String(item.pidContentId || "").replace(/^<|>$/g, ""),
          mime: (item.attachMimeTag || "").split(";")[0].trim() || mimeFromName(name),
        });
      }
      const fromRtf = bodyFromRtf(node);
      // Prefer RTF-deencapsulated HTML: MsgReader bodyHtml is often missing or mis-decoded for Exchange mail.
      let htmlRaw = fromRtf.html || node.bodyHtml || decodeHtmlBytes(node.html) || "";
      let textBody = node.body || fromRtf.text || "";
      if (htmlRaw && (htmlRaw.match(/\uFFFD/g) || []).length > 8 && fromRtf.html) {
        htmlRaw = fromRtf.html;
      }
      const quoteHtml = htmlRaw ? addQuoteSeparators(htmlRaw) : "";
      const bodyHtml = htmlRaw
        ? replaceCidImages(quoteHtml, attachments)
        : textToHtml(textBody);
      messages.push({
        label,
        from: formatFrom(node),
        to: formatRecipientLine(node, "to"),
        cc: formatRecipientLine(node, "cc"),
        subject: node.subject || "",
        date: node.clientSubmitTime || node.messageDeliveryTime || "",
        html: bodyHtml ? decorateEmailHtml(bodyHtml) : "",
        text: textBody,
        attachments,
        // Structured data for Reply / Forward
        fromAddr: msgSender(node),
        toAddrs: msgAddressList(node, "to"),
        ccAddrs: msgAddressList(node, "cc"),
        messageId: messageIdOf(node),
        references: headerValue(node.headers, "References"),
        quoteHtml,
        // Untouched pieces for the MSG -> EML conversion (see msgToEml)
        rawHtml: htmlRaw,
        headersRaw: String(node.headers || ""),
        importance: node.importance,
      });
      nested.forEach((child, index) => walk(child, `Embedded message ${index + 1}`));
    };
    walk(data, "Current message");
    return messages;
  }

  function renderMsgPreview(bytes, filename) {
    const Reader = globalThis.MailPeekMsgReader;
    if (!Reader) throw new Error("MSG parser library is not loaded");
    const reader = new Reader(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    reader.parserConfig = { includeRawProps: true };
    const data = reader.getFileData();
    const messages = flattenMsgThread(reader, data);
    showModal({
      title: messages[0]?.subject || filename,
      badge: "MSG",
      bodyHtml: renderThread(messages),
      bytes,
      filename,
      mime: "application/vnd.ms-outlook",
      nudge: true,
      replyTo: messages[0] || null,
      thread: messages,
      afterRender(root) {
        bindThread(root, messages);
      },
    });
  }

  function renderEmlPreview(bytes, filename) {
    const parsed = parseMime(decodeText(bytes));
    const attachments = (parsed.attachments || []).map((part, index) => ({
      name: part.filename || (part.cid ? part.cid.split("@")[0] : `part-${index + 1}`),
      bytes: part.bytes || new Uint8Array(),
      mime: part.mime || part.contentType || "application/octet-stream",
      cid: part.cid || "",
      hidden: /inline/i.test(part.disposition || ""),
    }));
    const htmlRaw = parsed.html || "";
    const quoteHtml = htmlRaw ? addQuoteSeparators(htmlRaw) : "";
    const messages = [
      {
        label: "Current message",
        from: parsed.headers.from || "",
        to: parsed.headers.to || "",
        cc: parsed.headers.cc || "",
        subject: parsed.headers.subject || "",
        date: parsed.headers.date || "",
        html: htmlRaw
          ? decorateEmailHtml(replaceCidImages(quoteHtml, attachments))
          : parsed.text
            ? decorateEmailHtml(textToHtml(parsed.text))
            : "",
        text: parsed.text || "",
        attachments,
        // Structured data for Reply / Forward
        fromAddr: parseAddress(parsed.headers["reply-to"] || parsed.headers.from) || { name: "", email: "" },
        toAddrs: parseAddressList(parsed.headers.to),
        ccAddrs: parseAddressList(parsed.headers.cc),
        messageId: (parsed.headers["message-id"] || "").trim(),
        references: parsed.headers.references || "",
        quoteHtml,
        rawHtml: htmlRaw,
      },
    ];
    showModal({
      title: messages[0].subject || filename,
      badge: "EML",
      bodyHtml: renderThread(messages),
      bytes,
      filename,
      mime: "message/rfc822",
      nudge: true,
      replyTo: messages[0] || null,
      afterRender(root) {
        bindThread(root, messages);
      },
    });
  }

  let previewSeq = 0;

  async function openPreview(hint) {
    const seq = (previewSeq += 1);
    const filenameGuess = hint.filename || extractFilename(hint.url) || "Untitled file";
    showLoading(filenameGuess);
    try {
      const source = await resolveSource(hint);
      if (seq !== previewSeq) return;
      const file = await fetchBytes(source.url);
      if (seq !== previewSeq) return;
      const filename = decodePercent(source.filename || file.filename || filenameGuess);
      const ext = normalizeExt(getExt(filename) || hint.ext);
      if (file.bytes.byteLength > MAX_BYTES) {
        throw new Error(`File is too large (${formatSize(file.bytes.byteLength)}). The preview limit is 30 MB.`);
      }
      if (isHtmlExt(ext)) renderHtmlPreview(file.bytes, filename);
      else if (ext === "msg") renderMsgPreview(file.bytes, filename);
      else if (ext === "eml") renderEmlPreview(file.bytes, filename);
      else throw new Error("This file type is not supported");
      recordPreviewSuccess();
    } catch (err) {
      if (seq !== previewSeq) return;
      const message = err?.message || String(err);
      if (/Extension context invalidated|context invalidated|runtime\.id/i.test(message) || !contextAlive()) {
        showError(
          filenameGuess,
          "Mail Peek was just updated or reloaded, so this tab lost its connection to the extension.\n\nPlease reload the page and click the attachment again."
        );
        return;
      }
      showError(filenameGuess, message);
    }
  }

  function modalCss() {
    return `
      :host { all: initial; }
      .backdrop {
        position: fixed; inset: 0; z-index: 2147483646;
        background: rgba(15, 23, 42, .55);
        display: flex; align-items: center; justify-content: center;
        padding: 16px; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        overflow: hidden; overscroll-behavior: none;
      }
      .dialog, .body, .thread, .msg-card, .frame { overscroll-behavior: contain; }
      .backdrop[hidden] { display: none !important; }
      .dialog:focus { outline: none; }
      .dialog {
        width: min(1360px, calc(100vw - 32px)); height: min(980px, calc(100vh - 32px));
        max-width: calc(100vw - 32px); max-height: calc(100vh - 32px);
        background: #fff; color: #0f172a; border-radius: 16px;
        box-shadow: 0 24px 80px rgba(0,0,0,.28);
        display: flex; flex-direction: column; overflow: hidden; position: relative;
      }
      .bar {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 10px 14px; border-bottom: 1px solid #dbe4ee; background: #0078d4;
        flex: none; min-width: 0;
      }
      .titles { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; overflow: hidden; }
      .badge {
        flex: none; font-size: 11px; font-weight: 700; letter-spacing: .04em;
        padding: 3px 8px; border-radius: 999px; background: rgba(255,255,255,.18); color: #fff;
      }
      .name {
        font-size: 14px; font-weight: 600; color: #fff;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
      }
      .actions { display: flex; gap: 8px; flex: none; }
      .btn {
        border: 1px solid rgba(255,255,255,.75); background: transparent; color: #fff;
        border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer;
        font-weight: 600;
      }
      .btn.primary {
        background: #fff; border-color: #fff; color: #0078d4;
        box-shadow: 0 1px 2px rgba(0,0,0,.12);
      }
      .btn:hover { filter: brightness(0.97); }
      .btn:disabled {
        opacity: .4; cursor: default; filter: none;
      }
      .btn.icon {
        display: inline-flex; align-items: center; justify-content: center;
        width: 34px; min-width: 34px; height: 30px; padding: 0; line-height: 0;
        border-color: rgba(255,255,255,.45);
      }
      .btn.icon svg { display: block; }
      .btn.icon:hover { background: rgba(255,255,255,.16); filter: none; }
      .btn.icon.primary { border-color: #fff; }
      .btn.icon.primary:hover { background: #e6f1fb; }
      .zoom-group {
        display: inline-flex; align-items: stretch; flex: none;
        border: 1px solid rgba(255,255,255,.45);
        border-radius: 8px; overflow: hidden;
      }
      .zoom-group .btn {
        border: 0; border-radius: 0; margin: 0;
        padding: 5px 10px;
      }
      .zoom-group .btn + .btn {
        border-left: 1px solid rgba(255,255,255,.28);
      }
      .btn.zoom {
        min-width: 52px; text-align: center; font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,.9);
      }
      .btn.zoom.changed { color: #fff; background: rgba(255,255,255,.16); }
      .btn.zoom-step {
        min-width: 32px; padding: 5px 8px; font-size: 15px; line-height: 1;
        font-weight: 700; color: #fff;
      }
      .btn.zoom-step:hover:not(:disabled) { background: rgba(255,255,255,.16); }
      .btn.support {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 32px; padding: 4px 8px; font-size: 14px; line-height: 1;
        text-decoration: none; border-color: rgba(255,255,255,.45);
      }
      .btn.support:hover { background: rgba(255,255,255,.16); filter: none; }
      .compose-frame {
        display: block; flex: none; border: 0; margin: 0; padding: 0;
        width: 110px; height: 30px; background: transparent; color-scheme: light;
      }
      .toast {
        position: absolute; left: 50%; bottom: 18px; transform: translate(-50%, 8px);
        max-width: min(560px, 90%); padding: 9px 14px; border-radius: 10px;
        background: rgba(15, 23, 42, .92); color: #fff; font-size: 12.5px; line-height: 1.4;
        box-shadow: 0 6px 20px rgba(0,0,0,.25); opacity: 0; pointer-events: none;
        transition: opacity .18s ease, transform .18s ease; z-index: 5;
      }
      .toast.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
      .toast { display: flex; align-items: center; gap: 12px; }
      .toast-text { min-width: 0; }
      .toast-btn {
        flex: none; border: 1px solid rgba(255,255,255,.55); background: #fff; color: #0f172a;
        border-radius: 7px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
      }
      .toast-btn:hover { background: #e2e8f0; }
      .nudge {
        flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 7px 14px; background: #fff8e6; border-bottom: 1px solid #f3e2b3;
        color: #5b4a1c; font-size: 12px; line-height: 1.4;
      }
      .nudge-text { min-width: 0; }
      .nudge-text b { font-weight: 700; }
      .nudge-actions { display: flex; gap: 6px; flex: none; }
      .nudge-btn {
        border: 1px solid #e2c98a; background: #fff; color: #5b4a1c;
        border-radius: 6px; padding: 3px 9px; font-size: 12px; font-weight: 600; cursor: pointer;
      }
      .nudge-btn.primary { background: #ffdd00; border-color: #ffdd00; color: #1f1a06; }
      .nudge-btn.quiet { border-color: transparent; background: transparent; color: #8a7a4a; font-weight: 500; }
      .nudge-btn:hover { filter: brightness(0.96); }
      .body {
        flex: 1; min-height: 0; display: flex; flex-direction: column;
        background: #fff; max-width: 100%;
        /* Mail is rendered at its original size (images included). When it is
           wider than the dialog, the whole preview scrolls horizontally here
           instead of squeezing the images. */
        overflow-x: auto;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .frame {
        width: 100%; max-width: none; border: 0; background: #fff;
        display: block; flex: none; min-height: 120px;
      }
      .status { margin: auto; padding: 40px; color: #64748b; font-size: 14px; }
      .status.error { color: #b91c1c; white-space: pre-wrap; }
      .thread {
        flex: none;
        display: flex; flex-direction: column;
        background: #fff;
        padding: 0; gap: 0;
      }
      .thread.multi {
        gap: 10px;
        padding: 10px;
        background: #edf2f7;
      }
      .msg-card {
        background: #fff;
        /* Must stay visible: an iframe sized to a wide mail (large image) has
           to overflow this card into the .body horizontal scroller. */
        overflow: visible;
        display: flex;
        flex-direction: column;
        flex: none;
      }
      .thread.single .msg-card {
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
      .thread.multi .msg-card {
        border: 1px solid #d0d7de;
        border-radius: 10px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, .05);
      }
      .msg-label {
        background: #0078d4; color: #fff; font-size: 11px; font-weight: 700;
        letter-spacing: .04em; padding: 4px 12px; flex: none;
      }
      .mail-head {
        flex: none; padding: 8px 14px;
        border-bottom: 1px solid #e8eef4; background: #f7f9fc;
      }
      .mail-head h2 { margin: 0 0 4px; font-size: 14px; line-height: 1.3; font-weight: 650; }
      .meta-row {
        display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 6px;
        font-size: 12px; margin: 1px 0; line-height: 1.35;
      }
      .meta-row span { color: #64748b; }
      .meta-row b {
        font-weight: 500;
        overflow-wrap: anywhere;
        word-break: break-word;
        min-width: 0;
      }
      .chips {
        display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px;
        padding-top: 8px; border-top: 1px dashed #dbe3ec;
      }
      .chips-label {
        display: inline-flex; align-items: center; gap: 4px; margin-right: 4px;
        font-size: 12px; color: #475569;
      }
      .chip {
        display: inline-flex; align-items: center; gap: 6px; max-width: 320px;
        border: 1px solid #cbd5e1; background: #fff; border-radius: 8px;
        padding: 4px 10px; font-size: 12px; color: #0f172a; cursor: pointer; text-align: left;
      }
      .chip:hover { border-color: #0078d4; background: #f0f7ff; }
      .chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
      .chip-size { flex: none; color: #64748b; font-size: 11px; }
      .plain { margin: 0; padding: 16px 20px; overflow: auto; white-space: pre-wrap; font-size: 13px; }
      /* Preview zoom: headers/labels scale together with the iframe bodies. */
      .mail-head, .msg-label, .plain, .status { zoom: var(--ap-zoom, 1); }
    `;
  }
})();
