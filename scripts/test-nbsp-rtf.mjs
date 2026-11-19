import { createRequire } from "module";
import { readFileSync } from "fs";
import { runInThisContext } from "vm";

runInThisContext(readFileSync("extension/lib/msgreader.js", "utf8"));
const { rtfToHtml } = globalThis.MailPeekRtf;

const rtf =
  "{\\rtf1\\ansi\\ansicpg936\\fromhtml1{\\*\\htmltag64 <div>Enablement Helpdesk" +
  "\\'a0".repeat(20) +
  "Email</div>}}";
const html = rtfToHtml(new TextEncoder().encode(rtf));
console.log(JSON.stringify(html));
console.log("has Email:", html.includes("Email"));
console.log("has 笺:", html.includes("笺"));
if (!html.includes("Email") || html.includes("笺")) process.exit(1);

const cn =
  "{\\rtf1\\ansi\\ansicpg936\\fromhtml1{\\*\\htmltag64 <p>}\\'c4\\'e3\\'ba\\'c3{\\*\\htmltag0 </p>}}";
const html2 = rtfToHtml(new TextEncoder().encode(cn));
console.log("chinese:", html2);
if (!html2.includes("你好")) process.exit(1);
console.log("ok");
