// De-encapsulate HTML from Outlook RTF (MS-OXRTFEX) and extract plain text from RTF.

const CODEPAGES = {
  874: "windows-874",
  932: "shift_jis",
  936: "gbk",
  949: "euc-kr",
  950: "big5",
  1250: "windows-1250",
  1251: "windows-1251",
  1252: "windows-1252",
  1253: "windows-1253",
  1254: "windows-1254",
  1255: "windows-1255",
  1256: "windows-1256",
  1257: "windows-1257",
  1258: "windows-1258",
  65001: "utf-8",
};

const SKIP_DESTINATIONS = new Set([
  "fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "header", "footer",
  "headerl", "headerr", "headerf", "footerl", "footerr", "footerf", "themedata",
  "colorschememapping", "datastore", "latentstyles", "listtable", "listoverridetable",
  "rsidtbl", "xmlnstbl", "generator", "pntext", "pntxta", "pntxtb", "mmathPr", "fldinst",
  "docvar", "xmlopen", "xmlclose", "factoidname", "atnid", "atnauthor", "annotation",
  "revtbl", "protusertbl", "userprops", "ftnsep", "ftnsepc", "aftnsep", "aftnsepc",
  "mhtmltag", "wgrffmtfilter", "background", "shp", "shpinst", "sp", "sn", "sv",
  "objdata", "objclass", "template", "operator", "author", "company", "title", "subject",
  "keywords", "comment", "doccomm", "creatim", "revtim", "printim", "buptim", "nesttableprops",
  "fldrslt-ignored",
]);

const SYMBOLS = {
  par: "\n",
  line: "\n",
  tab: "\t",
  lquote: "\u2018",
  rquote: "\u2019",
  ldblquote: "\u201c",
  rdblquote: "\u201d",
  bullet: "\u2022",
  endash: "\u2013",
  emdash: "\u2014",
  emspace: " ",
  enspace: " ",
  qmspace: " ",
  zwj: "\u200d",
  zwnj: "\u200c",
  ltrmark: "",
  rtlmark: "",
};

function bytesToLatin1(bytes) {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return out;
}

function makeDecoder(codepage) {
  const label = CODEPAGES[codepage] || "windows-1252";
  try {
    return new TextDecoder(label);
  } catch {
    return new TextDecoder("windows-1252");
  }
}

function countReplacements(text) {
  return (String(text).match(/\uFFFD/g) || []).length;
}

function isDbcsCodepage(codepage) {
  return [932, 936, 949, 950].includes(Number(codepage));
}

/**
 * Outlook pads columns with 0xA0 (NBSP). In GBK/Big5/Shift-JIS, 0xA0 is a lead
 * byte, so runs of NBSP become U+7B3A U+7B3A U+7B3A and then eat the following ASCII ("Email").
 */
function decodeDbcsPreservingNbsp(bytes, codepage) {
  const decoder = makeDecoder(codepage);
  const parts = [];
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    parts.push(decoder.decode(new Uint8Array(buf)));
    buf = [];
  };
  for (let i = 0; i < bytes.length; ) {
    if (bytes[i] === 0xa0) {
      flush();
      let n = 0;
      while (i < bytes.length && bytes[i] === 0xa0) {
        n += 1;
        i += 1;
      }
      parts.push("\u00a0".repeat(n));
      continue;
    }
    const lead = bytes[i];
    // DBCS lead bytes (excluding 0xA0 which is handled above)
    if (lead >= 0x81 && lead <= 0xfe && i + 1 < bytes.length) {
      const trail = bytes[i + 1];
      if (trail >= 0x40 && trail !== 0x7f && trail !== 0xa0) {
        buf.push(lead, trail);
        i += 2;
        continue;
      }
    }
    buf.push(lead);
    i += 1;
  }
  flush();
  return parts.join("");
}

function mostlyWesternBytes(bytes) {
  if (!bytes.length) return true;
  let ok = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i];
    if (b < 0x80 || b === 0xa0 || b === 0x09 || b === 0x0a || b === 0x0d) ok += 1;
  }
  return ok / bytes.length >= 0.92;
}

/**
 * Prefer UTF-8 when valid; otherwise use the RTF ANSI code page.
 * Never feed NBSP runs through GBK — that turns "    Email" into "U+7B3A x3 + E".
 */
function decodeBytesSmart(bytes, codepage) {
  if (!bytes.length) return "";

  // Pure ASCII / NBSP / whitespace (Outlook column padding) → Latin-1 / CP1252
  if (mostlyWesternBytes(bytes)) {
    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch {
      return bytesToLatin1(bytes);
    }
  }

  let utf8 = "";
  let utf8Ok = false;
  try {
    utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    utf8Ok = true;
  } catch {
    try {
      utf8 = new TextDecoder("utf-8").decode(bytes);
    } catch {
      utf8 = "";
    }
  }

  let legacy = "";
  try {
    legacy = isDbcsCodepage(codepage)
      ? decodeDbcsPreservingNbsp(bytes, codepage)
      : makeDecoder(codepage).decode(bytes);
  } catch {
    legacy = utf8;
  }

  if (utf8Ok && countReplacements(utf8) === 0) {
    const utf8Cjk = (utf8.match(/[\u4e00-\u9fff]/g) || []).length;
    const legacyCjk = (legacy.match(/[\u4e00-\u9fff]/g) || []).length;
    // Prefer legacy only when it clearly recovers more real CJK and fewer .
    if (
      countReplacements(legacy) <= countReplacements(utf8)
      && legacyCjk > utf8Cjk + 5
      && !/\u7b3a{3,}/.test(legacy)
    ) {
      return legacy;
    }
    return utf8;
  }

  // Reject obvious NBSP-as-CJK garbage even if replacement counts look fine
  if (/\u7b3a{6,}|\u817e{6,}/.test(legacy) && !/\u7b3a{6,}|\u817e{6,}/.test(utf8)) {
    if (utf8 && countReplacements(utf8) < bytes.length / 10) return utf8;
    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch {
      return bytesToLatin1(bytes);
    }
  }

  if (countReplacements(legacy) <= countReplacements(utf8)) return legacy || utf8;
  return utf8 || legacy;
}

function charsetFromHtmlMeta(htmlLatin1) {
  const match =
    /charset\s*=\s*["']?\s*([a-z0-9._-]+)/i.exec(htmlLatin1)
    || /charset\s*=\s*([a-z0-9._-]+)/i.exec(htmlLatin1);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  if (/utf-?8/.test(raw)) return "utf-8";
  if (/gb2312|gbk|gb18030|chinese/.test(raw)) return "gbk";
  if (/big5/.test(raw)) return "big5";
  if (/shift_?jis|sjis|ms932|cp932/.test(raw)) return "shift_jis";
  if (/euc-?kr|ks_c_5601/.test(raw)) return "euc-kr";
  if (/windows-1252|cp1252|latin1|iso-8859-1/.test(raw)) return "windows-1252";
  return raw;
}

function walkRtf(input, mode) {
  const text = input instanceof Uint8Array ? bytesToLatin1(input) : String(input || "");
  if (!/^\s*\{\\rtf/.test(text)) return null;

  const codepageMatch = /\\ansicpg(\d+)/.exec(text.slice(0, 8192));
  const codepage = codepageMatch ? Number(codepageMatch[1]) : 1252;

  const out = [];
  let pending = [];
  const flush = (forceCp) => {
    if (!pending.length) return;
    const bytes = new Uint8Array(pending);
    pending = [];
    if (mode === "html") {
      out.push(decodeBytesSmart(bytes, forceCp || codepage));
    } else {
      out.push(makeDecoder(forceCp || codepage).decode(bytes));
    }
  };

  let state = { skip: false, dest: "normal", uc: 1, starred: false };
  const stack = [];
  let pendingSkip = 0;
  const len = text.length;
  let i = 0;

  const emitByte = (byte) => {
    if (pendingSkip > 0) {
      pendingSkip -= 1;
      return;
    }
    if (state.skip || state.dest === "skip") return;
    pending.push(byte);
  };
  const emitString = (str) => {
    if (state.skip || state.dest === "skip") return;
    flush();
    out.push(str);
  };

  while (i < len) {
    const ch = text[i];

    if (ch === "{") {
      stack.push(state);
      state = { skip: state.skip, dest: state.dest, uc: state.uc, starred: false };
      i += 1;
      continue;
    }
    if (ch === "}") {
      flush();
      state = stack.pop() || { skip: false, dest: "normal", uc: 1, starred: false };
      i += 1;
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      i += 1;
      continue;
    }
    if (ch !== "\\") {
      if (pendingSkip > 0) {
        pendingSkip -= 1;
      } else if (!(state.skip || state.dest === "skip")) {
        pending.push(text.charCodeAt(i) & 0xff);
      }
      i += 1;
      continue;
    }

    const next = text[i + 1];
    if (next === undefined) break;

    if (next === "'") {
      const hex = text.slice(i + 2, i + 4);
      const byte = parseInt(hex, 16);
      if (!Number.isNaN(byte)) emitByte(byte);
      i += 4;
      continue;
    }
    if (next === "\\" || next === "{" || next === "}") {
      emitByte(next.charCodeAt(0));
      i += 2;
      continue;
    }
    if (next === "~") {
      emitString("\u00a0");
      i += 2;
      continue;
    }
    if (next === "-" || next === "_" || next === ":" || next === "|") {
      i += 2;
      continue;
    }
    if (next === "*") {
      state.starred = true;
      i += 2;
      continue;
    }
    if (next === "\r" || next === "\n") {
      emitString("\n");
      i += 2;
      continue;
    }

    const match = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(text.slice(i, i + 40));
    if (!match) {
      i += 2;
      continue;
    }
    const word = match[1];
    const param = match[2] !== undefined ? Number(match[2]) : undefined;
    i += match[0].length;

    if (state.starred) {
      state.starred = false;
      if (word === "htmltag" && mode === "html") {
        flush();
        state.dest = "htmltag";
        state.skip = false;
        continue;
      }
      state.dest = "skip";
      continue;
    }

    if (SKIP_DESTINATIONS.has(word)) {
      flush();
      state.dest = "skip";
      continue;
    }

    if (word === "htmlrtf") {
      if (mode === "html") {
        flush();
        state.skip = param !== 0;
      }
      continue;
    }
    if (word === "htmltag") {
      if (mode === "html") {
        flush();
        state.dest = "htmltag";
        state.skip = false;
      } else {
        state.dest = "skip";
      }
      continue;
    }
    if (word === "uc") {
      state.uc = param ?? 1;
      continue;
    }
    if (word === "u") {
      let code = param ?? 0;
      if (code < 0) code += 65536;
      if (!(state.skip || state.dest === "skip")) {
        flush();
        out.push(String.fromCharCode(code));
      }
      pendingSkip = state.uc;
      continue;
    }
    if (word === "bin") {
      i += Math.max(0, param ?? 0);
      continue;
    }
    if (word in SYMBOLS) {
      const value = SYMBOLS[word];
      if (mode === "text" && (word === "par" || word === "line")) emitString("\n");
      else if (mode === "html" && state.dest === "htmltag") {
        /* ignore RTF paragraph marks inside raw HTML tags */
      } else if (value) emitString(value);
      continue;
    }
    if (mode === "text" && (word === "cell" || word === "row")) {
      emitString(word === "row" ? "\n" : "\t");
      continue;
    }
  }

  flush();
  let result = out.join("");

  // If meta charset disagrees with how we decoded, re-decode raw Latin-1 rebuild is hard;
  // instead, if the string still has lots of replacement chars, try decoding the
  // Latin-1 byte projection with the meta charset.
  if (mode === "html" && result) {
    const meta = charsetFromHtmlMeta(result);
    if (meta && meta !== "utf-8" && countReplacements(result) > 0) {
      try {
        const asBytes = Uint8Array.from(result, (c) => c.charCodeAt(0) & 0xff);
        const retry = new TextDecoder(meta).decode(asBytes);
        if (countReplacements(retry) < countReplacements(result)) result = retry;
      } catch {
        /* keep */
      }
    }
  }

  return result;
}

export function isEncapsulatedHtml(input) {
  const text = input instanceof Uint8Array ? bytesToLatin1(input.subarray(0, 4096)) : String(input || "").slice(0, 4096);
  return /\\fromhtml1?\b/.test(text);
}

export function rtfToHtml(input) {
  if (!isEncapsulatedHtml(input)) return "";
  const html = walkRtf(input, "html");
  if (!html) return "";
  const trimmed = html.trim();
  if (!trimmed) return "";
  return /<[a-z!/]/i.test(trimmed) ? html : "";
}

export function rtfToText(input) {
  const text = walkRtf(input, "text");
  return text ? text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : "";
}

export { decodeBytesSmart };
