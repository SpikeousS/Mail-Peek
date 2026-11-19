function toUint8(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  return new TextEncoder().encode(String(input ?? ""));
}

function decode(input, encoding) {
  const bytes = toUint8(input);
  const enc = String(encoding || "utf-8").toLowerCase();
  const label =
    enc === "utf16le" || enc === "utf-16le" || enc === "ucs2"
      ? "utf-16le"
      : enc.includes("1252") || enc === "latin1" || enc === "iso-8859-1"
        ? "windows-1252"
        : "utf-8";
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function encode(str, _encoding) {
  return new TextEncoder().encode(String(str ?? ""));
}

const iconv = { decode, encode, encodingExists: () => true };
export default iconv;
export { decode, encode };
