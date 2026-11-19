# Chrome Web Store — Privacy tab answers (Mail Peek)

Copy each block into the matching field. All are under the 1,000-character limit.

## Single purpose description

Mail Peek lets users preview Outlook email files (.msg / .eml) and HTML attachments directly in the browser, without downloading them first. When the user clicks such an attachment on a web page (for example in Jira or a ticketing tool), Mail Peek opens the file in an in-page popup showing the message body, inline images, From/To/Cc, dates and reply separators. That is its only function. All parsing happens locally in the browser; no file content is sent anywhere.

## Permission justification

### storage

Stores the user's two on/off preferences (preview .msg/.eml, preview .html) and a small counter used to show the optional "support the project" note. Only these settings are stored, via chrome.storage.sync. No email content, URLs or personal data is stored.

### downloads

When the user clicks a .msg/.eml/.html attachment, many sites (e.g. Jira) immediately start a browser download. Mail Peek listens to chrome.downloads.onCreated / onDeterminingFilename so it can cancel that single download and open the preview instead. It only acts on files whose extension or MIME type is .msg, .eml or .html; every other download is left untouched. It also uses chrome.downloads.download to save the email file when the user clicks Reply / Reply all / Forward in the preview. It never reads the user's download history or other downloaded files.

### downloads.open

Used only for the Reply / Reply all / Forward buttons in the preview. When the user clicks one of them, Mail Peek saves the email being previewed (the original .msg/.eml, or on Mac/Linux the same message rebuilt as .eml) to the Downloads folder and immediately calls chrome.downloads.open on that one file so it opens in the user's default mail app, where they reply. It is only ever called in direct response to that click, only on the file Mail Peek itself just saved, and never on any other download.

### contextMenus

Adds one right-click menu item, "Preview with Mail Peek", on links. This lets users open the preview for an attachment link whose file type cannot be detected from the page, and is the only context-menu entry the extension adds.

### scripting

After the extension is installed or updated, tabs that are already open do not have the content script yet. Mail Peek uses chrome.scripting.executeScript to inject its own bundled content script (content.js, lib/msgreader.js) into such a tab only when the user clicks an attachment or uses the context menu there. No remote or dynamically generated code is injected.

### Host permission (<all_urls>)

Attachments live on whatever site the user works in — Jira Cloud/Server, Confluence, help-desk and ticketing tools, intranet portals, file shares. The content script must run on those pages to detect the click on a .msg/.eml/.html attachment, and the extension must fetch the file from that same site (with the user's existing session cookies) to render it. Because customers host these tools on their own domains, a fixed list of hosts is not possible. The script is passive until the user clicks a matching attachment; it does not read, modify or transmit page content otherwise.

## Are you using remote code?

Select: **No, I am not using remote code**

(All JavaScript is bundled in the package. There are no external <script> tags, no remote modules, and no eval of remote strings. The sandboxed viewer page only renders the email's HTML — scripts inside emails are removed before rendering.)

## Data usage

Chrome's User Data FAQ (Q3) says handling must be disclosed even when data is only
processed locally and never transmitted. Mail Peek reads email files and page
content locally, so tick exactly these two:

- [x] **Personal communications** — the extension opens and renders .msg/.eml email files
  (body, From/To/Cc, attachments) the user clicks. Processed in the browser only.
- [x] **Website content** — it reads the attachment link/filename on the page and
  fetches the attachment from that site to display it.

Leave unticked: Personally identifiable information, Health, Financial and payment,
Authentication, Location, Web history, User activity. (Mail Peek does not log
clicks, keystrokes, browsing history or IP addresses; it stores no email
addresses or names.)

- Tick all three certifications:
  - I do not sell or transfer user data to third parties, outside of the approved use cases
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose
  - I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy URL

Required because the extension requests host permissions. Host a short page (e.g. GitHub Pages / Notion) with the text below and paste its URL.

Mail Peek Privacy Policy

Mail Peek is a Chrome extension that previews .msg, .eml and .html attachments inside the browser.

- What is handled: when you click a .msg, .eml or .html attachment, Mail Peek reads that file (personal communications: message body, sender, recipients, dates, inline images) and the attachment link on the web page (website content) in order to display the preview.
- Local processing only: files are fetched from the site you are already logged into and parsed entirely in your browser. No email content, attachment, URL or page data is ever sent to us or to any third party, and nothing is retained after the preview is closed.
- No tracking: the extension contains no analytics, advertising or tracking code.
- Stored data: only your two preview preferences and a counter for the optional support note, saved via Chrome's built-in storage (chrome.storage.sync). You can clear them by removing the extension.
- Permissions: host access and download interception are used solely to detect and open attachments you click. See the Chrome Web Store listing for per-permission details.
- Contact: <your email>

Last updated: <date>
