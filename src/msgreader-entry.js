import * as msgreaderNs from "@kenjiuno/msgreader";
import * as decompressNs from "@kenjiuno/decompressrtf";
import { rtfToHtml, rtfToText, isEncapsulatedHtml } from "./rtf-html.js";

function pickDefault(ns, name) {
  const candidates = [ns?.default?.default, ns?.default, ns?.[name], ns?.default?.[name]];
  return candidates.find((value) => typeof value === "function") || null;
}

const MsgReader = pickDefault(msgreaderNs, "MsgReader");
const decompressRTF = pickDefault(decompressNs, "decompressRTF");

globalThis.MailPeekMsgReader = MsgReader;
globalThis.MailPeekRtf = {
  decompress(bytes) {
    if (!decompressRTF) throw new Error("RTF decompression library is not loaded");
    const input = bytes instanceof Uint8Array ? Array.from(bytes) : Array.from(new Uint8Array(bytes));
    return new Uint8Array(decompressRTF(input));
  },
  rtfToHtml,
  rtfToText,
  isEncapsulatedHtml,
};
