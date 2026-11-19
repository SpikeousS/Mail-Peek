import vm from "node:vm";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../extension/background.js", import.meta.url), "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeContext() {
  const state = { cancelled: [], erased: [] };
  const chrome = {
    runtime: {
      id: "self",
      onInstalled: { addListener() {} },
      onStartup: { addListener() {} },
      onMessage: { addListener() {} },
      getURL: () => "chrome-extension://self/",
    },
    storage: {
      sync: { get: async () => ({}), set: async () => {}, remove: async () => {} },
      onChanged: { addListener() {} },
    },
    action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
    contextMenus: {
      removeAll(cb) { if (cb) cb(); },
      create() {},
      onClicked: { addListener() {} },
    },
    tabs: {
      onActivated: { addListener() {} },
      onUpdated: { addListener() {} },
      query: async () => [],
      get: async () => ({ url: "https://mail.example/" }),
      sendMessage: async () => ({ ok: false }),
    },
    scripting: { executeScript: async () => {} },
    downloads: {
      onCreated: { addListener() {} },
      onDeterminingFilename: { addListener() {} },
      onChanged: { addListener() {}, removeListener() {} },
      cancel: async (id) => { state.cancelled.push(id); },
      erase: async (q) => { state.erased.push(q.id); },
      search: async () => [],
      open: async () => {},
      download: async () => 1,
    },
  };
  const context = vm.createContext({
    chrome,
    console,
    setTimeout,
    clearTimeout,
    fetch: async () => { throw new Error("no network in test"); },
    URL,
    btoa,
    atob,
    TextDecoder,
    TextEncoder,
  });
  vm.runInContext(code, context, { filename: "background.js" });
  return { context, state };
}

let failures = 0;
function check(name, cond, extra = "") {
  if (cond) console.log("PASS", name);
  else { failures++; console.log("FAIL", name, extra); }
}

function item(overrides = {}) {
  return {
    id: 1,
    state: "in_progress",
    url: "https://mail.example/attachment/42/foo.eml",
    finalUrl: "https://mail.example/attachment/42/foo.eml",
    filename: "/Users/me/Downloads/foo.eml",
    mime: "message/rfc822",
    byExtensionId: undefined,
    ...overrides,
  };
}

async function run(expr, ctx, extra = {}) {
  Object.assign(ctx, extra);
  return vm.runInContext(expr, ctx);
}

// 1. Explicit allow by filename wins over preview interception.
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: true }", context);
  await run('armAllowNext({ filename: "foo.eml" })', context);
  const intercepted = await run("interceptDownloadItem(item)", context, { item: item() });
  check("explicit allow by filename skips interception", intercepted === false && state.cancelled.length === 0);
}

// 2. A filename-less explicit allow (page "Download" button) still works and
//    does not inherit a stale extension from an earlier allowance.
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: true }", context);
  await run('armAllowNext({ filename: "older.msg" })', context);
  await run("armAllowNext({})", context);
  const intercepted = await run("interceptDownloadItem(item)", context, {
    item: item({ id: 2, url: "https://mail.example/download/99", finalUrl: "https://mail.example/download/99", filename: "/Users/me/Downloads/other.eml" }),
  });
  check("filename-less explicit allow ignores stale ext", intercepted === false && state.cancelled.length === 0);
}

// 3. Without an allow a real mail download is still previewed (old behaviour).
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: true }", context);
  const intercepted = await run("interceptDownloadItem(item)", context, { item: item({ id: 3 }) });
  check("mail download without allow is intercepted", intercepted === true && state.cancelled.includes(3));
}

// 4. Preview disabled: never intercept.
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: false }", context);
  const intercepted = await run("interceptDownloadItem(item)", context, { item: item({ id: 4 }) });
  check("preview disabled leaves download alone", intercepted === false && state.cancelled.length === 0);
}

// 5. The grace window lets the explicit-download message arrive late.
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: true }", context);
  await run("scheduleIntercept(item)", context, { item: item({ id: 5 }) });
  await run("armAllowNext({})", context); // message arrives while the timer is pending
  await sleep(450);
  check("late explicit allow wins during grace window", state.cancelled.length === 0);
}

// 6. Without an allow the scheduled interception still happens.
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: true }", context);
  await run("scheduleIntercept(item)", context, { item: item({ id: 6 }) });
  await sleep(450);
  check("scheduled interception still cancels mail", state.cancelled.includes(6));
}

// 7. Non-mail files are never candidates.
{
  const { context, state } = makeContext();
  const candidate = await run("isDownloadCandidate(item)", context, {
    item: item({ id: 7, url: "https://x/y.pdf", finalUrl: "https://x/y.pdf", filename: "/tmp/y.pdf", mime: "application/pdf" }),
  });
  check("pdf is not a download candidate", candidate === false && state.cancelled.length === 0);
}

// 8. Unknown/extension-less downloads stay candidates so Jira-style URLs work.
{
  const { context } = makeContext();
  const candidate = await run("isDownloadCandidate(item)", context, {
    item: item({ id: 8, url: "https://jira.example/secure/attachment/12345", finalUrl: "https://jira.example/secure/attachment/12345", filename: "", mime: "" }),
  });
  check("extension-less attachment URL is a candidate", candidate === true);
}


// 9. Explicit page actions can request a longer allowance (Outlook Web may take
//    several seconds to generate the EML/MSG before the download starts).
{
  const { context } = makeContext();
  const remaining = await run("armAllowNext({ windowMs: 15000 }); allowNext.until - Date.now()", context);
  check("explicit page action extends the allow window", remaining > 10000);
}

// 10. A generic page-action allowance must not inherit an extension from an
//     earlier hint (e.g. an .html filename near the Download menu item).
{
  const { context, state } = makeContext();
  await run("cachedSettings = { previewHtml: true, previewMsg: true }", context);
  await run('armAllowNext({ filename: "notes.html" })', context);
  await run("armAllowNext({ windowMs: 15000 })", context);
  const intercepted = await run("interceptDownloadItem(item)", context, { item: item({ id: 10 }) });
  check("generic page-action allow is not blocked by a stale ext", intercepted === false && state.cancelled.length === 0);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nAll background download tests passed");
process.exit(failures ? 1 : 0);
