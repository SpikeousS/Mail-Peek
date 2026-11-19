// Mail Peek — Reply / Reply all / Forward toolbar.
//
// All three buttons do the same thing: save the ORIGINAL message file exactly
// as previewed and open it with the OS default mail app, where the user then
// hits Reply / Reply all / Forward. Mail Peek never composes mail itself.
//
// This tiny page is embedded (as an extension iframe) in the preview header.
// It exists because chrome.downloads.open() only opens a file *without* the
// "Allow Mail Peek to open …?" dialog when it is called from an extension
// frame inside the tab the user just interacted with. Calls made from the
// service worker always show that dialog. So the click → download → open
// chain runs entirely in this frame, inside the click's activation window.
//
// Protocol with the parent content script (window.postMessage):
//   frame  → parent : { type: "mail-peek:compose", id, mode }
//   parent → frame  : { type: "mail-peek:draft", id, filename?, mime?,
//                        bytes? (ArrayBuffer), error? }
//   frame  → parent : { type: "mail-peek:compose-result", id, ok, error?, downloadId? }
//   frame  → parent : { type: "mail-peek:escape" }   (Esc pressed in the frame)

const LABELS = { reply: "Reply", replyAll: "Reply all", forward: "Forward" };
const OPEN_TIMEOUT_MS = 30_000;

let seq = 0;
const pending = new Map();

function post(message, transfer) {
  try {
    window.parent.postMessage(message, "*", transfer);
  } catch {
    /* parent gone */
  }
}

document.querySelectorAll("button[data-mode]").forEach((button) => {
  button.title = `${LABELS[button.getAttribute("data-mode")]} — opens this email in your mail app`;
});

function setBusy(busy) {
  document.querySelectorAll("button[data-mode]").forEach((button) => {
    button.disabled = busy;
  });
}

document.querySelectorAll("button[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = ++seq;
    pending.set(id, { mode: button.getAttribute("data-mode"), at: Date.now() });
    setBusy(true);
    post({ type: "mail-peek:compose", id, mode: button.getAttribute("data-mode") });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") post({ type: "mail-peek:escape" });
});

function waitForComplete(downloadId) {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      chrome.downloads.onChanged.removeListener(onChanged);
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, new Error("Download timed out")), OPEN_TIMEOUT_MS);
    function onChanged(delta) {
      if (delta.id !== downloadId) return;
      if (delta.error?.current) finish(reject, new Error(delta.error.current));
      else if (delta.state?.current === "complete") finish(resolve);
    }
    chrome.downloads.onChanged.addListener(onChanged);
    chrome.downloads.search({ id: downloadId }).then((items) => {
      const item = items?.[0];
      if (item?.state === "complete") finish(resolve);
      else if (item?.state === "interrupted") finish(reject, new Error(item.error || "interrupted"));
    }).catch(() => {});
  });
}

async function saveAndOpen({ filename, mime, bytes }) {
  const name = String(filename || "message.eml").replace(/[/\\]/g, "_");
  // Tell the background's onDeterminingFilename listener which name to use:
  // once any extension listens to that event Chrome ignores download()'s
  // own `filename` option and would save the file as "download.eml".
  await chrome.runtime.sendMessage({ type: "DRAFT_NAME", filename: name }).catch(() => {});

  const blob = new Blob([bytes], { type: mime || "message/rfc822" });
  const url = URL.createObjectURL(blob);
  let downloadId;
  try {
    downloadId = await chrome.downloads.download({
      url,
      filename: name,
      saveAs: false,
      conflictAction: "uniquify",
    });
    await waitForComplete(downloadId);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  // Still within the click's activation window (small file, local write) and
  // called from a frame in the interacted tab → opens directly, no dialog.
  // Re-check the item right before opening: if anything removed it in the
  // meantime, report cleanly instead of letting open() fail.
  const [item] = await chrome.downloads.search({ id: downloadId }).catch(() => []);
  if (!item || item.state !== "complete") {
    const error = new Error(item ? `Download is ${item.state}` : "Saved file is no longer in the download list");
    error.downloadId = item ? downloadId : null;
    throw error;
  }
  try {
    await chrome.downloads.open(downloadId);
  } catch (err) {
    const error = new Error(String(err?.message || err));
    error.downloadId = downloadId;
    throw error;
  }
  return downloadId;
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  const data = event.data;
  if (!data || data.type !== "mail-peek:draft") return;
  const job = pending.get(data.id);
  if (!job) return;
  pending.delete(data.id);

  if (data.error || !data.bytes) {
    setBusy(false);
    post({ type: "mail-peek:compose-result", id: data.id, ok: false, error: data.error || "No file" });
    return;
  }

  saveAndOpen(data)
    .then((downloadId) => {
      post({ type: "mail-peek:compose-result", id: data.id, ok: true, downloadId });
    })
    .catch((err) => {
      post({
        type: "mail-peek:compose-result",
        id: data.id,
        ok: false,
        error: String(err?.message || err),
        downloadId: err?.downloadId ?? null,
      });
    })
    .finally(() => setBusy(false));
});
