Mail Peek — Privacy Policy

Last updated: 17 September 2026

Mail Peek is a Chrome extension that previews Outlook email files (.msg, .eml) and .html attachments inside the browser, so you can read them without downloading them first.

What data Mail Peek handles

When you click a .msg, .eml or .html attachment on a web page, Mail Peek:





reads the attachment link and file name on that page (website content), and



fetches the file from the same website you are already signed in to and renders it — message body, sender, recipients, dates and inline images (personal communications).

This happens only for the file you click, only at the moment you click it, and only so the preview can be shown.

Where processing happens

Entirely on your device, inside your browser. Mail Peek has no servers. No email content, attachment, file name, page content, URL, cookie or personal information is ever transmitted to the developer or to any third party.

What is stored

Only two things, using Chrome's built-in chrome.storage.sync:





your preferences (preview .msg/.eml on/off, preview .html on/off), and



a counter of how many previews you have opened, used solely to decide whether to show a one-time "support the project" note.

No email content, addresses, names, URLs or browsing history is stored. Preview data is discarded as soon as the preview is closed. Removing the extension deletes the stored preferences.

Tracking and analytics

None. Mail Peek contains no analytics, advertising, telemetry or tracking code.

Permissions





Host access (all sites): attachments live on whichever site you work in (Jira, Confluence, help-desk tools, intranets). Mail Peek must run there to detect the click and fetch the file. It stays passive until you click a matching attachment.



downloads: to cancel the browser download that some sites start when an attachment is clicked, and open the preview instead. Only .msg/.eml/.html downloads are affected.



contextMenus: adds a single "Preview with Mail Peek" right-click item.



scripting: injects the extension's own bundled script into tabs that were already open before installation or an update. No remote code is used.



storage: saves the preferences described above.

Third parties

Mail Peek does not sell, share or transfer user data to anyone. The optional "Buy me a coffee" link opens buymeacoffee.com in a new tab only when you click it; that site has its own privacy policy.

Changes

If this policy changes, the updated version will be published at this address and the "Last updated" date will change.

Contact

Questions about this policy: open an issue at https://github.com/SpikesuS/Mail-Peek/issues
