# Mail Peek

Simple, high-fidelity email viewer for Chrome. Open Outlook `.msg` / `.eml` and see the mail **as written**—body, images, From/To/Cc, time, and reply separators.

## Chrome Web Store copy (ready to paste)

The full listing copy lives in [`store-assets/LISTING.md`](store-assets/LISTING.md).

**Name:** Mail Peek

**Short description:**
> See Outlook .msg/.eml exactly as written—body, images, From/To/Cc, dates & reply separators. No Outlook. No download first.

**Detailed description:** see `store-assets/LISTING.md`

## Usage

- Click a `.msg` / `.eml` (or `.html`) **filename** → it opens in a popup.
- Hold **Shift** while clicking to download the file normally.
- Right-click any link → **Preview with Mail Peek**.
- The preview window opens large (up to 1360 × 980). Mail is shown at its original size: a wide image or fixed-width table is **not squeezed to the window** — scroll/swipe horizontally inside the preview (or Shift+scroll) to see the rest at the original aspect ratio.
- Zoom the preview with **Ctrl/⌘ +**, **Ctrl/⌘ −**, **Ctrl/⌘ 0** (reset), or Ctrl+wheel / pinch. Only the preview zooms; the page underneath keeps its own zoom level.
- Clicking a page’s own **Preview** / **Download** / **预览** / **下载** button or menu item always triggers **that page’s** preview/download: Mail Peek neither replaces it with its own preview nor cancels the resulting file. Use Shift+click or the preview’s **Download** button to save an attachment directly.
- **Reply / Reply all / Forward** (icon buttons in the preview header). Mail Peek never composes or sends mail itself. Each button saves the **original** `.msg` / `.eml` exactly as previewed and opens it with the OS default app for that file type (associate `.msg` / `.eml` with Outlook) — directly, with no confirmation step or Chrome "Allow Mail Peek to open…" dialog, because the save-and-open runs inside an extension frame in the header (`compose.html`) right after your click. Reply / Reply all / Forward in the mail app from there, with full fidelity and the recipients filled in by the mail client.
  - On **Windows** a `.msg` is handed over untouched (Outlook reads it natively). On **Mac / Linux**, Outlook for Mac and Apple Mail cannot read `.msg` — the sender is stored only as an Exchange X.500 address, so From shows up empty. There Mail Peek rebuilds the message as a standards `.eml` with the same HTML body, inline images, attachments, embedded messages and transport headers, and From/To/Cc written as name + SMTP address (people without an SMTP address in the file get their name plus a placeholder `@unresolved.invalid`). `.eml` originals are always passed through unchanged.

### Settings (toolbar popup)

| Setting | Default | What it does |
| --- | --- | --- |
| Preview HTML attachments | on | Preview `.html` / `.htm` attachments (click or download). |
| Preview MSG / EML emails | on | Preview Outlook `.msg` and `.eml` (click or download). |
Turning both format switches off disables all previews and shows an **OFF** badge on the toolbar icon. Hold **Shift** while clicking (or use the preview’s **Download** button) to save the original file. Sites like Jira start downloads from JavaScript — when a type’s preview is on, those downloads are turned into previews automatically. Clicks on a page’s own **Preview** / **Download** / **预览** / **下载** / **Save as** controls are excluded and always run the page’s own action.

## Support

Mail Peek is free. Donations go through [Buy Me a Coffee](https://buymeacoffee.com/spikesu). The extension only links out to that page — no third-party scripts are loaded and no user data is sent anywhere.

- Toolbar popup: "Enjoying Mail Peek?" card at the bottom.
- Preview window: ☕ button in the title bar.
- After 20 successful previews a small, dismissable bar appears once in the preview window; "Later" shows it one more time after 30 days, "Don't show again" hides it permanently. State lives in `chrome.storage.sync` under `support`.

## Install (developer mode)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → choose `extension/`

## Store package

```bash
npm install
npm run build
npm run zip    # → dist/mail-peek.zip
```

Upload the zip to the store; use `extension/` for local development and debugging.
