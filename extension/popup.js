const DEFAULTS = {
  previewHtml: true,
  previewMsg: true,
};

const ids = Object.keys(DEFAULTS);

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    // Treat anything other than explicit false as on.
    el.checked = stored[id] !== false;
  }
}

async function save(event) {
  const id = event?.target?.id;
  if (!id || !(id in DEFAULTS)) return;
  const checked = !!event.target.checked;
  try {
    await chrome.storage.sync.set({ [id]: checked });
  } catch (err) {
    // Revert the checkbox if storage write failed.
    event.target.checked = !checked;
    console.warn("[Mail Peek] Failed to save setting:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await load();
  for (const id of ids) {
    document.getElementById(id)?.addEventListener("change", save);
  }
});
