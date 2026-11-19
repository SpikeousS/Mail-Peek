(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/@kenjiuno/msgreader/lib/utils.js
  var require_utils = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.arraysEqual = arraysEqual;
      exports.uInt2int = uInt2int;
      exports.toHexStr = toHexStr;
      exports.toHex1 = toHex1;
      exports.toHex2 = toHex2;
      exports.toHex4 = toHex4;
      exports.msftUuidStringify = msftUuidStringify;
      exports.emptyToNull = emptyToNull;
      exports.readSystemTime = readSystemTime;
      exports.readTransitionSystemTime = readTransitionSystemTime;
      exports.bin2HexUpper = bin2HexUpper;
      function arraysEqual(a, b) {
        if (a === b)
          return true;
        if (a == null || b == null)
          return false;
        if (a.length != b.length)
          return false;
        for (var i = 0; i < a.length; i++) {
          if (a[i] !== b[i])
            return false;
        }
        return true;
      }
      function uInt2int(data) {
        var result = new Array(data.length);
        for (var i = 0; i < data.length; i++) {
          result[i] = data[i] << 24 >> 24;
        }
        return result;
      }
      function toHexStr(value, padding) {
        var text = "";
        while (value != 0) {
          text = "0123456789abcdef"[value & 15] + text;
          value >>= 4;
          text = "0123456789abcdef"[value & 15] + text;
          value >>= 4;
        }
        while (text.length < padding) {
          text = "0" + text;
        }
        return text;
      }
      var hex = "0123456789abcdef";
      function toHex1(value) {
        return hex[value >> 4 & 15] + hex[value & 15];
      }
      function toHex2(value) {
        return hex[value >> 12 & 15] + hex[value >> 8 & 15] + hex[value >> 4 & 15] + hex[value & 15];
      }
      function toHex4(value) {
        return hex[value >> 28 & 15] + hex[value >> 24 & 15] + hex[value >> 20 & 15] + hex[value >> 16 & 15] + hex[value >> 12 & 15] + hex[value >> 8 & 15] + hex[value >> 4 & 15] + hex[value & 15];
      }
      function msftUuidStringify(array, offset) {
        return "" + toHex1(array[offset + 3]) + toHex1(array[offset + 2]) + toHex1(array[offset + 1]) + toHex1(array[offset + 0]) + "-" + toHex1(array[offset + 5]) + toHex1(array[offset + 4]) + "-" + toHex1(array[offset + 7]) + toHex1(array[offset + 6]) + "-" + toHex1(array[offset + 8]) + toHex1(array[offset + 9]) + "-" + toHex1(array[offset + 10]) + toHex1(array[offset + 11]) + toHex1(array[offset + 12]) + toHex1(array[offset + 13]) + toHex1(array[offset + 14]) + toHex1(array[offset + 15]);
      }
      function emptyToNull(text) {
        return text === "" ? null : text;
      }
      function padNumber(value, maxLen) {
        return ("" + value).padStart(maxLen, "0");
      }
      function readSystemTime(ds) {
        var wYear = ds.readUint16();
        var wMonth = ds.readUint16();
        var wDayOfWeek = ds.readUint16();
        var wDay = ds.readUint16();
        var wHour = ds.readUint16();
        var wMinute = ds.readUint16();
        var wSecond = ds.readUint16();
        var wMilliseconds = ds.readUint16();
        var text = "".concat(padNumber(wYear, 4), "-").concat(padNumber(wMonth, 2), "-").concat(padNumber(wDay, 2), "T").concat(padNumber(wHour, 2), ":").concat(padNumber(wMinute, 2), ":").concat(padNumber(wSecond, 2), "Z");
        if (text === "0000-00-00T00:00:00Z") {
          return null;
        } else {
          return new Date(text);
        }
      }
      function readTransitionSystemTime(ds) {
        var wYear = ds.readUint16();
        var wMonth = ds.readUint16();
        var wDayOfWeek = ds.readUint16();
        var wDay = ds.readUint16();
        var wHour = ds.readUint16();
        var wMinute = ds.readUint16();
        var wSecond = ds.readUint16();
        var wMilliseconds = ds.readUint16();
        return {
          year: wYear,
          month: wMonth,
          dayOfWeek: wDayOfWeek,
          day: wDay,
          hour: wHour,
          minute: wMinute
        };
      }
      function bin2HexUpper(ds) {
        var text = "";
        while (!ds.isEof()) {
          text += toHex1(ds.readUint8());
        }
        return text.toUpperCase();
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/const.js
  var require_const = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/const.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var utils_1 = require_utils();
      exports.default = {
        FILE_HEADER: (0, utils_1.uInt2int)([208, 207, 17, 224, 161, 177, 26, 225]),
        MSG: {
          UNUSED_BLOCK: -1,
          END_OF_CHAIN: -2,
          S_BIG_BLOCK_SIZE: 512,
          S_BIG_BLOCK_MARK: 9,
          L_BIG_BLOCK_SIZE: 4096,
          L_BIG_BLOCK_MARK: 12,
          SMALL_BLOCK_SIZE: 64,
          BIG_BLOCK_MIN_DOC_SIZE: 4096,
          HEADER: {
            PROPERTY_START_OFFSET: 48,
            BAT_START_OFFSET: 76,
            BAT_COUNT_OFFSET: 44,
            SBAT_START_OFFSET: 60,
            SBAT_COUNT_OFFSET: 64,
            XBAT_START_OFFSET: 68,
            XBAT_COUNT_OFFSET: 72
          },
          PROP: {
            NO_INDEX: -1,
            PROPERTY_SIZE: 128,
            NAME_SIZE_OFFSET: 64,
            MAX_NAME_LENGTH: (
              /*NAME_SIZE_OFFSET*/
              64 / 2 - 1
            ),
            TYPE_OFFSET: 66,
            PREVIOUS_PROPERTY_OFFSET: 68,
            NEXT_PROPERTY_OFFSET: 72,
            CHILD_PROPERTY_OFFSET: 76,
            START_BLOCK_OFFSET: 116,
            SIZE_OFFSET: 120,
            TYPE_ENUM: {
              UNALLOCATED: 0,
              DIRECTORY: 1,
              DOCUMENT: 2,
              ROOT: 5
            }
          },
          FIELD: {
            PREFIX: {
              ATTACHMENT: "__attach_version1.0",
              RECIPIENT: "__recip_version1.0",
              DOCUMENT: "__substg1.",
              NAMEID: "__nameid_version1.0"
            },
            // example (use fields as needed)
            NAME_MAPPING: {
              // email specific
              "001a": "messageClass",
              "0037": "subject",
              "0c1a": "senderName",
              "0c1e": "senderAddressType",
              "0c1f": "senderEmail",
              "5d01": "senderSmtpAddress",
              "5d02": "sentRepresentingSmtpAddress",
              "5d0a": "creatorSMTPAddress",
              "5d0b": "lastModifierSMTPAddress",
              "1000": "body",
              "007d": "headers",
              "1009": "compressedRtf",
              "3ffa": "lastModifierName",
              "0039": "clientSubmitTime",
              "0e06": "messageDeliveryTime",
              "3fde": "internetCodepage",
              "3ffd": "messageCodepage",
              "3ff1": "messageLocaleId",
              "0e07": "messageFlags",
              "1035": "messageId",
              "3fd9": "preview",
              // attachment specific
              "3007": "creationTime",
              "3008": "lastModificationTime",
              "3703": "extension",
              "3704": "fileNameShort",
              "3707": "fileName",
              "3712": "pidContentId",
              "7ffe": "attachmentHidden",
              "370e": "attachMimeTag",
              // recipient specific
              "0c15": "recipType",
              "3001": "name",
              "3002": "addressType",
              "3003": "email",
              "39fe": "smtpAddress",
              // contact specific
              "3a18": "departmentName",
              "3a44": "middleName",
              "3a05": "generation",
              "3a11": "surname",
              "3a27": "addressCity",
              "3a16": "companyName",
              "3a24": "businessFaxNumber",
              "3a29": "streetAddress",
              "3a51": "businessHomePage",
              "3a06": "givenName",
              "3a09": "homeTelephoneNumber",
              "3a15": "postalAddress",
              "3a17": "title",
              "3a1c": "mobileTelephoneNumber",
              "3a26": "country",
              "3a28": "stateOrProvince",
              "3a2a": "postalCode",
              "3a45": "displayNamePrefix",
              "0070": "conversationTopic",
              "0e1d": "normalizedSubject",
              "3a08": "businessTelephoneNumber",
              "3a0d": "location"
            },
            FULL_NAME_MAPPING: {
              "1013001f": "bodyHtml",
              "10130102": "html"
            },
            PIDLID_MAPPING: {
              // PSETID_Common
              "00062008-0000-0000-c000-000000000046": {
                34080: { id: "PidLidVerbStream" },
                34084: { id: "PidLidVerbResponse", dispid: "votingResponse" },
                34176: { id: "PidLidInternetAccountName", dispid: "inetAcctName" }
              },
              // PSETID_Appointment
              "00062002-0000-0000-c000-000000000046": {
                33293: { id: "PidLidAppointmentStartWhole", dispid: "apptStartWhole" },
                33294: { id: "PidLidAppointmentEndWhole", dispid: "apptEndWhole" },
                33333: { id: "PidLidClipStart", dispid: "clipStart" },
                33334: { id: "PidLidClipEnd", dispid: "clipEnd" },
                33331: { id: "PidLidTimeZoneStruct", dispid: "timeZoneStruct" },
                33332: { id: "PidLidTimeZoneDescription", dispid: "timeZoneDesc" },
                33374: { id: "PidLidAppointmentTimeZoneDefinitionStartDisplay", dispid: "apptTZDefStartDisplay" },
                33375: { id: "PidLidAppointmentTimeZoneDefinitionEndDisplay", dispid: "apptTZDefEndDisplay" },
                33376: { id: "PidLidAppointmentTimeZoneDefinitionRecur", dispid: "apptTZDefRecur" },
                33302: { id: "PidLidAppointmentRecur", dispid: "apptRecur" },
                33288: { id: "PidLidLocation", dispid: "apptLocation" }
              },
              // PSETID_Address
              "00062004-0000-0000-c000-000000000046": {
                32812: { id: "dispidYomiFirstName", dispid: "yomiFirstName" },
                32899: { id: "dispidEmail1EmailAddress", dispid: "email1EmailAddress" },
                32814: { id: "dispidYomiCompanyName", dispid: "yomiCompanyName" },
                32978: { id: "PidLidFax3AddressType", dispid: "fax3AddrType" },
                32896: { id: "PidLidEmail1DisplayName", dispid: "email1DisplayName" },
                32900: { id: "PidLidEmail1OriginalDisplayName", dispid: "email1OriginalDisplayName" },
                32773: { id: "PidLidFileUnder", dispid: "fileUnder" },
                32813: { id: "PidLidYomiLastName", dispid: "yomiLastName" },
                32946: { id: "PidLidFax1AddressType", dispid: "fax1AddrType" },
                32963: { id: "PidLidFax2EmailAddress", dispid: "fax2EmailAddress" },
                32838: { id: "PidLidWorkAddressCity", dispid: "workAddressCity" },
                32989: { id: "PidLidAddressCountryCode", dispid: "addressCountryCode" },
                32962: { id: "PidLidFax2AddressType", dispid: "fax2AddrType" },
                32964: { id: "PidLidFax2OriginalDisplayName", dispid: "fax2OriginalDisplayName" },
                32840: { id: "PidLidWorkAddressPostalCode", dispid: "workAddressPostalCode" },
                32837: { id: "PidLidWorkAddressStreet", dispid: "workAddressStreet" },
                32839: { id: "PidLidWorkAddressState", dispid: "workAddressState" },
                32987: { id: "PidLidWorkAddressCountryCode", dispid: "workAddressCountryCode" },
                32841: { id: "PidLidWorkAddressCountry", dispid: "workAddressCountry" },
                32811: { id: "PidLidHtml", dispid: "contactHtml" },
                32795: { id: "PidLidWorkAddress", dispid: "workAddress" },
                32948: { id: "PidLidFax1OriginalDisplayName", dispid: "fax1OriginalDisplayName" },
                32866: { id: "PidLidInstantMessagingAddress", dispid: "instMsg" },
                32784: { id: "PidLidDepartment", dispid: "department" },
                32947: { id: "PidLidFax1EmailAddress", dispid: "fax1EmailAddress" },
                32980: { id: "PidLidFax3OriginalDisplayName", dispid: "fax3OriginalDisplayName" },
                32979: { id: "PidLidFax3EmailAddress", dispid: "fax3EmailAddress" }
              },
              // PSETID_Meeting
              "6ed8da90-450b-101b-98da-00aa003f1305": {
                3: { id: "PidLidGlobalObjectId", dispid: "globalAppointmentID" },
                40: { id: "PidLidOldLocation", dispid: "apptOldLocation" }
              }
            },
            CLASS_MAPPING: {
              ATTACHMENT_DATA: "3701"
            },
            TYPE_MAPPING: {
              "001e": "string",
              "001f": "unicode",
              "0040": "time",
              "0102": "binary",
              "0003": "integer",
              "000b": "boolean"
            },
            DIR_TYPE: {
              INNER_MSG: "000d"
            }
          }
        }
      };
    }
  });

  // src/iconv-stub.js
  var iconv_stub_exports = {};
  __export(iconv_stub_exports, {
    decode: () => decode,
    default: () => iconv_stub_default,
    encode: () => encode
  });
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
    const label = enc === "utf16le" || enc === "utf-16le" || enc === "ucs2" ? "utf-16le" : enc.includes("1252") || enc === "latin1" || enc === "iso-8859-1" ? "windows-1252" : "utf-8";
    try {
      return new TextDecoder(label).decode(bytes);
    } catch {
      return new TextDecoder("utf-8").decode(bytes);
    }
  }
  function encode(str, _encoding) {
    return new TextEncoder().encode(String(str ?? ""));
  }
  var iconv, iconv_stub_default;
  var init_iconv_stub = __esm({
    "src/iconv-stub.js"() {
      iconv = { decode, encode, encodingExists: () => true };
      iconv_stub_default = iconv;
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/DataStream.js
  var require_DataStream = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/DataStream.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var iconv2 = (init_iconv_stub(), __toCommonJS(iconv_stub_exports));
      var DataStream = (
        /** @class */
        (function() {
          function DataStream2(arrayBuffer, byteOffset, endianness) {
            this._dynamicSize = true;
            this._byteLength = 0;
            this.failurePosition = 0;
            this._byteOffset = byteOffset || 0;
            if (arrayBuffer instanceof ArrayBuffer) {
              this.buffer = arrayBuffer;
            } else if (arrayBuffer instanceof DataView) {
              this.dataView = arrayBuffer;
            } else if (arrayBuffer && arrayBuffer.buffer instanceof ArrayBuffer) {
              this._byteOffset += arrayBuffer.byteOffset;
              this._buffer = arrayBuffer.buffer;
              this._dataView = new DataView(this._buffer, this._byteOffset);
              this._byteLength = this._dataView.byteLength + this._byteOffset;
            } else {
              throw new Error("Unknown arrayBuffer");
            }
            this.position = 0;
            this.endianness = endianness == null ? DataStream2.LITTLE_ENDIAN : endianness;
          }
          ;
          DataStream2.prototype.save = function(filename) {
            var blob = new Blob([this.buffer]);
            var URL = window["webkitURL"] || window.URL;
            if (URL && URL.createObjectURL) {
              var url = URL.createObjectURL(blob);
              var a = document.createElement("a");
              a.setAttribute("href", url);
              a.setAttribute("download", filename);
              a.click();
              URL.revokeObjectURL(url);
            } else {
              throw "DataStream.save: Can't create object URL.";
            }
          };
          ;
          Object.defineProperty(DataStream2.prototype, "dynamicSize", {
            /**
             * Whether to extend DataStream buffer when trying to write beyond its size.
             * If set, the buffer is reallocated to twice its current size until the
             * requested write fits the buffer.
             */
            get: function() {
              return this._dynamicSize;
            },
            set: function(v) {
              if (!v) {
                this._trimAlloc();
              }
              this._dynamicSize = v;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(DataStream2.prototype, "byteLength", {
            /**
              Returns the byte length of the DataStream object.
              */
            get: function() {
              return this._byteLength - this._byteOffset;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(DataStream2.prototype, "buffer", {
            /**
              Set/get the backing ArrayBuffer of the DataStream object.
              The setter updates the DataView to point to the new buffer.
              */
            get: function() {
              this._trimAlloc();
              return this._buffer;
            },
            set: function(v) {
              this._buffer = v;
              this._dataView = new DataView(this._buffer, this._byteOffset);
              this._byteLength = this._buffer.byteLength;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(DataStream2.prototype, "byteOffset", {
            /**
              Set/get the byteOffset of the DataStream object.
              The setter updates the DataView to point to the new byteOffset.
              */
            get: function() {
              return this._byteOffset;
            },
            set: function(v) {
              this._byteOffset = v;
              this._dataView = new DataView(this._buffer, this._byteOffset);
              this._byteLength = this._buffer.byteLength;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(DataStream2.prototype, "dataView", {
            /**
              Set/get the backing DataView of the DataStream object.
              The setter updates the buffer and byteOffset to point to the DataView values.
              */
            get: function() {
              return this._dataView;
            },
            set: function(v) {
              this._byteOffset = v.byteOffset;
              this._buffer = v.buffer;
              this._dataView = new DataView(this._buffer, this._byteOffset);
              this._byteLength = this._byteOffset + v.byteLength;
            },
            enumerable: false,
            configurable: true
          });
          DataStream2.prototype._realloc = function(extra) {
            if (!this._dynamicSize) {
              return;
            }
            var req = this._byteOffset + this.position + extra;
            var blen = this._buffer.byteLength;
            if (req <= blen) {
              if (req > this._byteLength) {
                this._byteLength = req;
              }
              return;
            }
            if (blen < 1) {
              blen = 1;
            }
            while (req > blen) {
              blen *= 2;
            }
            var buf = new ArrayBuffer(blen);
            var src = new Uint8Array(this._buffer);
            var dst = new Uint8Array(buf, 0, src.length);
            dst.set(src);
            this.buffer = buf;
            this._byteLength = req;
          };
          ;
          DataStream2.prototype._trimAlloc = function() {
            if (this._byteLength == this._buffer.byteLength) {
              return;
            }
            var buf = new ArrayBuffer(this._byteLength);
            var dst = new Uint8Array(buf);
            var src = new Uint8Array(this._buffer, 0, dst.length);
            dst.set(src);
            this.buffer = buf;
          };
          ;
          DataStream2.prototype.seek = function(pos) {
            var npos = Math.max(0, Math.min(this.byteLength, pos));
            this.position = isNaN(npos) || !isFinite(npos) ? 0 : npos;
          };
          ;
          DataStream2.prototype.isEof = function() {
            return this.position >= this.byteLength;
          };
          ;
          DataStream2.prototype.mapInt32Array = function(length, e) {
            this._realloc(length * 4);
            var arr = new Int32Array(this._buffer, this.byteOffset + this.position, length);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += length * 4;
            return arr;
          };
          ;
          DataStream2.prototype.mapInt16Array = function(length, e) {
            this._realloc(length * 2);
            var arr = new Int16Array(this._buffer, this.byteOffset + this.position, length);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += length * 2;
            return arr;
          };
          ;
          DataStream2.prototype.mapInt8Array = function(length) {
            this._realloc(length * 1);
            var arr = new Int8Array(this._buffer, this.byteOffset + this.position, length);
            this.position += length * 1;
            return arr;
          };
          ;
          DataStream2.prototype.mapUint32Array = function(length, e) {
            this._realloc(length * 4);
            var arr = new Uint32Array(this._buffer, this.byteOffset + this.position, length);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += length * 4;
            return arr;
          };
          ;
          DataStream2.prototype.mapUint16Array = function(length, e) {
            this._realloc(length * 2);
            var arr = new Uint16Array(this._buffer, this.byteOffset + this.position, length);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += length * 2;
            return arr;
          };
          ;
          DataStream2.prototype.mapUint8Array = function(length) {
            this._realloc(length * 1);
            var arr = new Uint8Array(this._buffer, this.byteOffset + this.position, length);
            this.position += length * 1;
            return arr;
          };
          ;
          DataStream2.prototype.mapFloat64Array = function(length, e) {
            this._realloc(length * 8);
            var arr = new Float64Array(this._buffer, this.byteOffset + this.position, length);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += length * 8;
            return arr;
          };
          ;
          DataStream2.prototype.mapFloat32Array = function(length, e) {
            this._realloc(length * 4);
            var arr = new Float32Array(this._buffer, this.byteOffset + this.position, length);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += length * 4;
            return arr;
          };
          ;
          DataStream2.prototype.readInt32Array = function(length, e) {
            length = length == null ? (this.byteLength - this.position) / 4 : length;
            var arr = new Int32Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readInt16Array = function(length, e) {
            length = length == null ? (this.byteLength - this.position) / 2 : length;
            var arr = new Int16Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readInt8Array = function(length) {
            length = length == null ? this.byteLength - this.position : length;
            var arr = new Int8Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readUint32Array = function(length, e) {
            length = length == null ? (this.byteLength - this.position) / 4 : length;
            var arr = new Uint32Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readUint16Array = function(length, e) {
            length = length == null ? (this.byteLength - this.position) / 2 : length;
            var arr = new Uint16Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readUint8Array = function(length) {
            length = length == null ? this.byteLength - this.position : length;
            var arr = new Uint8Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readToUint8Array = function(length, arr, dstOffset) {
            length = length == null ? this.byteLength - this.position : length;
            DataStream2.memcpy(arr.buffer, dstOffset, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            this.position += arr.byteLength;
          };
          ;
          DataStream2.prototype.readFloat64Array = function(length, e) {
            length = length == null ? (this.byteLength - this.position) / 8 : length;
            var arr = new Float64Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.readFloat32Array = function(length, e) {
            length = length == null ? (this.byteLength - this.position) / 4 : length;
            var arr = new Float32Array(length);
            DataStream2.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
            DataStream2.arrayToNative(arr, e == null ? this.endianness : e);
            this.position += arr.byteLength;
            return arr;
          };
          ;
          DataStream2.prototype.writeInt32Array = function(arr, e) {
            this._realloc(arr.length * 4);
            if (arr instanceof Int32Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapInt32Array(arr.length, e);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeInt32(arr[i], e);
              }
            }
          };
          ;
          DataStream2.prototype.writeInt16Array = function(arr, e) {
            this._realloc(arr.length * 2);
            if (arr instanceof Int16Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapInt16Array(arr.length, e);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeInt16(arr[i], e);
              }
            }
          };
          ;
          DataStream2.prototype.writeInt8Array = function(arr) {
            this._realloc(arr.length * 1);
            if (arr instanceof Int8Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapInt8Array(arr.length);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeInt8(arr[i]);
              }
            }
          };
          ;
          DataStream2.prototype.writeUint32Array = function(arr, e) {
            this._realloc(arr.length * 4);
            if (arr instanceof Uint32Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapUint32Array(arr.length, e);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeUint32(arr[i], e);
              }
            }
          };
          ;
          DataStream2.prototype.writeUint16Array = function(arr, e) {
            this._realloc(arr.length * 2);
            if (arr instanceof Uint16Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapUint16Array(arr.length, e);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeUint16(arr[i], e);
              }
            }
          };
          ;
          DataStream2.prototype.writeUint8Array = function(arr) {
            this._realloc(arr.length * 1);
            if (arr instanceof Uint8Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapUint8Array(arr.length);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeUint8(arr[i]);
              }
            }
          };
          ;
          DataStream2.prototype.writeFloat64Array = function(arr, e) {
            this._realloc(arr.length * 8);
            if (arr instanceof Float64Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapFloat64Array(arr.length, e);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeFloat64(arr[i], e);
              }
            }
          };
          ;
          DataStream2.prototype.writeFloat32Array = function(arr, e) {
            this._realloc(arr.length * 4);
            if (arr instanceof Float32Array && this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
              DataStream2.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
              this.mapFloat32Array(arr.length, e);
            } else {
              for (var i = 0; i < arr.length; i++) {
                this.writeFloat32(arr[i], e);
              }
            }
          };
          ;
          DataStream2.prototype.readInt32 = function(e) {
            var v = this._dataView.getInt32(this.position, e == null ? this.endianness : e);
            this.position += 4;
            return v;
          };
          ;
          DataStream2.prototype.readInt = function(offset) {
            this.seek(offset);
            return this.readInt32();
          };
          ;
          DataStream2.prototype.readInt16 = function(e) {
            var v = this._dataView.getInt16(this.position, e == null ? this.endianness : e);
            this.position += 2;
            return v;
          };
          ;
          DataStream2.prototype.readShort = function(offset) {
            this.seek(offset);
            return this.readInt16();
          };
          ;
          DataStream2.prototype.readInt8 = function() {
            var v = this._dataView.getInt8(this.position);
            this.position += 1;
            return v;
          };
          ;
          DataStream2.prototype.readByte = function(offset) {
            this.seek(offset);
            return this.readInt8();
          };
          ;
          DataStream2.prototype.readUint32 = function(e) {
            var v = this._dataView.getUint32(this.position, e == null ? this.endianness : e);
            this.position += 4;
            return v;
          };
          ;
          DataStream2.prototype.readUint16 = function(e) {
            var v = this._dataView.getUint16(this.position, e == null ? this.endianness : e);
            this.position += 2;
            return v;
          };
          ;
          DataStream2.prototype.readUint8 = function() {
            var v = this._dataView.getUint8(this.position);
            this.position += 1;
            return v;
          };
          ;
          DataStream2.prototype.readFloat32 = function(e) {
            var v = this._dataView.getFloat32(this.position, e == null ? this.endianness : e);
            this.position += 4;
            return v;
          };
          ;
          DataStream2.prototype.readFloat64 = function(e) {
            var v = this._dataView.getFloat64(this.position, e == null ? this.endianness : e);
            this.position += 8;
            return v;
          };
          ;
          DataStream2.prototype.writeInt32 = function(v, e) {
            this._realloc(4);
            this._dataView.setInt32(this.position, v, e == null ? this.endianness : e);
            this.position += 4;
          };
          ;
          DataStream2.prototype.writeInt16 = function(v, e) {
            this._realloc(2);
            this._dataView.setInt16(this.position, v, e == null ? this.endianness : e);
            this.position += 2;
          };
          ;
          DataStream2.prototype.writeInt8 = function(v) {
            this._realloc(1);
            this._dataView.setInt8(this.position, v);
            this.position += 1;
          };
          ;
          DataStream2.prototype.writeUint32 = function(v, e) {
            this._realloc(4);
            this._dataView.setUint32(this.position, v, e == null ? this.endianness : e);
            this.position += 4;
          };
          ;
          DataStream2.prototype.writeUint16 = function(v, e) {
            this._realloc(2);
            this._dataView.setUint16(this.position, v, e == null ? this.endianness : e);
            this.position += 2;
          };
          ;
          DataStream2.prototype.writeUint8 = function(v) {
            this._realloc(1);
            this._dataView.setUint8(this.position, v);
            this.position += 1;
          };
          ;
          DataStream2.prototype.writeFloat32 = function(v, e) {
            this._realloc(4);
            this._dataView.setFloat32(this.position, v, e == null ? this.endianness : e);
            this.position += 4;
          };
          ;
          DataStream2.prototype.writeFloat64 = function(v, e) {
            this._realloc(8);
            this._dataView.setFloat64(this.position, v, e == null ? this.endianness : e);
            this.position += 8;
          };
          ;
          DataStream2.memcpy = function(dst, dstOffset, src, srcOffset, byteLength) {
            var dstU8 = new Uint8Array(dst, dstOffset, byteLength);
            var srcU8 = new Uint8Array(src, srcOffset, byteLength);
            dstU8.set(srcU8);
          };
          ;
          DataStream2.arrayToNative = function(array, arrayIsLittleEndian) {
            if (arrayIsLittleEndian == this.endianness) {
              return array;
            } else {
              return this.flipArrayEndianness(array);
            }
          };
          ;
          DataStream2.nativeToEndian = function(array, littleEndian) {
            if (this.endianness == littleEndian) {
              return array;
            } else {
              return this.flipArrayEndianness(array);
            }
          };
          ;
          DataStream2.flipArrayEndianness = function(array) {
            var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
            for (var i = 0; i < array.byteLength; i += array.BYTES_PER_ELEMENT) {
              for (var j = i + array.BYTES_PER_ELEMENT - 1, k = i; j > k; j--, k++) {
                var tmp = u8[k];
                u8[k] = u8[j];
                u8[j] = tmp;
              }
            }
            return array;
          };
          ;
          DataStream2.createStringFromArray = function(array) {
            var str = "";
            for (var i = 0; i < array.length; i++) {
              str += String.fromCharCode(array[i]);
            }
            return str;
          };
          ;
          DataStream2.prototype.readStruct = function(structDefinition) {
            var struct = {}, t, v, n;
            var p = this.position;
            for (var i = 0; i < structDefinition.length; i += 2) {
              t = structDefinition[i + 1];
              v = this.readType(t, struct);
              if (v == null) {
                if (this.failurePosition == 0) {
                  this.failurePosition = this.position;
                }
                this.position = p;
                return null;
              }
              struct[structDefinition[i]] = v;
            }
            return struct;
          };
          ;
          DataStream2.prototype.readUCS2String = function(length, endianness) {
            return DataStream2.createStringFromArray(this.readUint16Array(length, endianness));
          };
          ;
          DataStream2.prototype.readStringAt = function(offset, length) {
            this.seek(offset);
            return this.readUCS2String(length);
          };
          ;
          DataStream2.prototype.writeUCS2String = function(str, endianness, lengthOverride) {
            if (lengthOverride == null) {
              lengthOverride = str.length;
            }
            for (var i = 0; i < str.length && i < lengthOverride; i++) {
              this.writeUint16(str.charCodeAt(i), endianness);
            }
            for (; i < lengthOverride; i++) {
              this.writeUint16(0, endianness);
            }
          };
          ;
          DataStream2.prototype.readString = function(length, encoding) {
            if (encoding == null || encoding == "ASCII") {
              return DataStream2.createStringFromArray(this.mapUint8Array(length == null ? this.byteLength - this.position : length));
            } else {
              return iconv2.decode(this.mapUint8Array(length), encoding);
            }
          };
          ;
          DataStream2.prototype.writeString = function(s, encoding, length) {
            if (encoding == null || encoding == "ASCII") {
              if (length != null) {
                var i = 0;
                var len = Math.min(s.length, length);
                for (i = 0; i < len; i++) {
                  this.writeUint8(s.charCodeAt(i));
                }
                for (; i < length; i++) {
                  this.writeUint8(0);
                }
              } else {
                for (var i = 0; i < s.length; i++) {
                  this.writeUint8(s.charCodeAt(i));
                }
              }
            } else {
              this.writeUint8Array(iconv2.encode(s.substring(0, length), encoding));
            }
          };
          ;
          DataStream2.prototype.readCString = function(length) {
            var blen = this.byteLength - this.position;
            var u8 = new Uint8Array(this._buffer, this._byteOffset + this.position);
            var len = blen;
            if (length != null) {
              len = Math.min(length, blen);
            }
            for (var i = 0; i < len && u8[i] != 0; i++)
              ;
            var s = DataStream2.createStringFromArray(this.mapUint8Array(i));
            if (length != null) {
              this.position += len - i;
            } else if (i != blen) {
              this.position += 1;
            }
            return s;
          };
          ;
          DataStream2.prototype.writeCString = function(s, length) {
            if (length != null) {
              var i = 0;
              var len = Math.min(s.length, length);
              for (i = 0; i < len; i++) {
                this.writeUint8(s.charCodeAt(i));
              }
              for (; i < length; i++) {
                this.writeUint8(0);
              }
            } else {
              for (var i = 0; i < s.length; i++) {
                this.writeUint8(s.charCodeAt(i));
              }
              this.writeUint8(0);
            }
          };
          ;
          DataStream2.prototype.readType = function(t, struct) {
            if (typeof t == "function") {
              return t(this, struct);
            } else if (typeof t == "object" && !(t instanceof Array)) {
              return t.get(this, struct);
            } else if (t instanceof Array && t.length != 3) {
              return this.readStruct(t);
            }
            var v = null;
            var lengthOverride = null;
            var charset = "ASCII";
            var pos = this.position;
            var len;
            if (typeof t == "string" && /:/.test(t)) {
              var tp = t.split(":");
              t = tp[0];
              len = tp[1];
              if (struct[len] != null) {
                lengthOverride = parseInt(struct[len]);
              } else {
                lengthOverride = parseInt(tp[1]);
              }
            }
            if (typeof t == "string" && /,/.test(t)) {
              var tp = t.split(",");
              t = tp[0];
              charset = parseInt(tp[1]).toString();
            }
            switch (t) {
              case "uint8":
                v = this.readUint8();
                break;
              case "int8":
                v = this.readInt8();
                break;
              case "uint16":
                v = this.readUint16(this.endianness);
                break;
              case "int16":
                v = this.readInt16(this.endianness);
                break;
              case "uint32":
                v = this.readUint32(this.endianness);
                break;
              case "int32":
                v = this.readInt32(this.endianness);
                break;
              case "float32":
                v = this.readFloat32(this.endianness);
                break;
              case "float64":
                v = this.readFloat64(this.endianness);
                break;
              case "uint16be":
                v = this.readUint16(DataStream2.BIG_ENDIAN);
                break;
              case "int16be":
                v = this.readInt16(DataStream2.BIG_ENDIAN);
                break;
              case "uint32be":
                v = this.readUint32(DataStream2.BIG_ENDIAN);
                break;
              case "int32be":
                v = this.readInt32(DataStream2.BIG_ENDIAN);
                break;
              case "float32be":
                v = this.readFloat32(DataStream2.BIG_ENDIAN);
                break;
              case "float64be":
                v = this.readFloat64(DataStream2.BIG_ENDIAN);
                break;
              case "uint16le":
                v = this.readUint16(DataStream2.LITTLE_ENDIAN);
                break;
              case "int16le":
                v = this.readInt16(DataStream2.LITTLE_ENDIAN);
                break;
              case "uint32le":
                v = this.readUint32(DataStream2.LITTLE_ENDIAN);
                break;
              case "int32le":
                v = this.readInt32(DataStream2.LITTLE_ENDIAN);
                break;
              case "float32le":
                v = this.readFloat32(DataStream2.LITTLE_ENDIAN);
                break;
              case "float64le":
                v = this.readFloat64(DataStream2.LITTLE_ENDIAN);
                break;
              case "cstring":
                v = this.readCString(lengthOverride);
                break;
              case "string":
                v = this.readString(lengthOverride, charset);
                break;
              case "u16string":
                v = this.readUCS2String(lengthOverride, this.endianness);
                break;
              case "u16stringle":
                v = this.readUCS2String(lengthOverride, DataStream2.LITTLE_ENDIAN);
                break;
              case "u16stringbe":
                v = this.readUCS2String(lengthOverride, DataStream2.BIG_ENDIAN);
                break;
              default:
                if (t.length == 3) {
                  var ta = t[1];
                  var len = t[2];
                  var length = 0;
                  if (typeof len == "function") {
                    length = len(struct, this, t);
                  } else if (typeof len == "string" && struct[len] != null) {
                    length = parseInt(struct[len]);
                  } else {
                    length = parseInt(len);
                  }
                  if (typeof ta == "string") {
                    var tap = ta.replace(/(le|be)$/, "");
                    var endianness = null;
                    if (/le$/.test(ta)) {
                      endianness = DataStream2.LITTLE_ENDIAN;
                    } else if (/be$/.test(ta)) {
                      endianness = DataStream2.BIG_ENDIAN;
                    }
                    if (len == "*") {
                      length = null;
                    }
                    switch (tap) {
                      case "uint8":
                        v = this.readUint8Array(length);
                        break;
                      case "uint16":
                        v = this.readUint16Array(length, endianness);
                        break;
                      case "uint32":
                        v = this.readUint32Array(length, endianness);
                        break;
                      case "int8":
                        v = this.readInt8Array(length);
                        break;
                      case "int16":
                        v = this.readInt16Array(length, endianness);
                        break;
                      case "int32":
                        v = this.readInt32Array(length, endianness);
                        break;
                      case "float32":
                        v = this.readFloat32Array(length, endianness);
                        break;
                      case "float64":
                        v = this.readFloat64Array(length, endianness);
                        break;
                      case "cstring":
                      case "utf16string":
                      case "string":
                        if (length == null) {
                          v = [];
                          while (!this.isEof()) {
                            var u = this.readType(ta, struct);
                            if (u == null)
                              break;
                            v.push(u);
                          }
                        } else {
                          v = new Array(length);
                          for (var i = 0; i < length; i++) {
                            v[i] = this.readType(ta, struct);
                          }
                        }
                        break;
                    }
                  } else {
                    if (len == "*") {
                      v = [];
                      this.buffer;
                      while (true) {
                        var p = this.position;
                        try {
                          var o = this.readType(ta, struct);
                          if (o == null) {
                            this.position = p;
                            break;
                          }
                          v.push(o);
                        } catch (e) {
                          this.position = p;
                          break;
                        }
                      }
                    } else {
                      v = new Array(length);
                      for (var i = 0; i < length; i++) {
                        var u = this.readType(ta, struct);
                        if (u == null)
                          return null;
                        v[i] = u;
                      }
                    }
                  }
                  break;
                }
            }
            if (lengthOverride != null) {
              this.position = pos + lengthOverride;
            }
            return v;
          };
          ;
          DataStream2.prototype.writeStruct = function(structDefinition, struct) {
            for (var i = 0; i < structDefinition.length; i += 2) {
              var t = structDefinition[i + 1];
              this.writeType(t, struct[structDefinition[i]], struct);
            }
          };
          ;
          DataStream2.prototype.writeType = function(t, v, struct) {
            if (typeof t == "function") {
              return t(this, v);
            } else if (typeof t == "object" && !(t instanceof Array)) {
              return t.set(this, v, struct);
            }
            var lengthOverride = null;
            var charset = "ASCII";
            var pos = this.position;
            if (typeof t == "string" && /:/.test(t)) {
              var tp = t.split(":");
              t = tp[0];
              lengthOverride = parseInt(tp[1]);
            }
            if (typeof t == "string" && /,/.test(t)) {
              var tp = t.split(",");
              t = tp[0];
              charset = parseInt(tp[1]).toString();
            }
            switch (t) {
              case "uint8":
                this.writeUint8(v);
                break;
              case "int8":
                this.writeInt8(v);
                break;
              case "uint16":
                this.writeUint16(v, this.endianness);
                break;
              case "int16":
                this.writeInt16(v, this.endianness);
                break;
              case "uint32":
                this.writeUint32(v, this.endianness);
                break;
              case "int32":
                this.writeInt32(v, this.endianness);
                break;
              case "float32":
                this.writeFloat32(v, this.endianness);
                break;
              case "float64":
                this.writeFloat64(v, this.endianness);
                break;
              case "uint16be":
                this.writeUint16(v, DataStream2.BIG_ENDIAN);
                break;
              case "int16be":
                this.writeInt16(v, DataStream2.BIG_ENDIAN);
                break;
              case "uint32be":
                this.writeUint32(v, DataStream2.BIG_ENDIAN);
                break;
              case "int32be":
                this.writeInt32(v, DataStream2.BIG_ENDIAN);
                break;
              case "float32be":
                this.writeFloat32(v, DataStream2.BIG_ENDIAN);
                break;
              case "float64be":
                this.writeFloat64(v, DataStream2.BIG_ENDIAN);
                break;
              case "uint16le":
                this.writeUint16(v, DataStream2.LITTLE_ENDIAN);
                break;
              case "int16le":
                this.writeInt16(v, DataStream2.LITTLE_ENDIAN);
                break;
              case "uint32le":
                this.writeUint32(v, DataStream2.LITTLE_ENDIAN);
                break;
              case "int32le":
                this.writeInt32(v, DataStream2.LITTLE_ENDIAN);
                break;
              case "float32le":
                this.writeFloat32(v, DataStream2.LITTLE_ENDIAN);
                break;
              case "float64le":
                this.writeFloat64(v, DataStream2.LITTLE_ENDIAN);
                break;
              case "cstring":
                this.writeCString(v, lengthOverride);
                break;
              case "string":
                this.writeString(v, charset, lengthOverride);
                break;
              case "u16string":
                this.writeUCS2String(v, this.endianness, lengthOverride);
                break;
              case "u16stringle":
                this.writeUCS2String(v, DataStream2.LITTLE_ENDIAN, lengthOverride);
                break;
              case "u16stringbe":
                this.writeUCS2String(v, DataStream2.BIG_ENDIAN, lengthOverride);
                break;
              default:
                if (t.length == 3) {
                  var ta = t[1];
                  for (var i = 0; i < v.length; i++) {
                    this.writeType(ta, v[i], t[2]);
                  }
                  break;
                } else {
                  this.writeStruct(t, v);
                  break;
                }
            }
            if (lengthOverride != null) {
              this.position = pos;
              this._realloc(lengthOverride);
              this.position = pos + lengthOverride;
            }
          };
          ;
          DataStream2.BIG_ENDIAN = false;
          DataStream2.LITTLE_ENDIAN = true;
          DataStream2.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
          return DataStream2;
        })()
      );
      exports.default = DataStream;
      if (Uint8Array.prototype.BYTES_PER_ELEMENT === void 0) {
        Object.defineProperties(Uint8Array.prototype, { BYTES_PER_ELEMENT: { value: Uint8Array.BYTES_PER_ELEMENT } });
        Object.defineProperties(Int8Array.prototype, { BYTES_PER_ELEMENT: { value: Int8Array.BYTES_PER_ELEMENT } });
        Object.defineProperties(Uint8ClampedArray.prototype, { BYTES_PER_ELEMENT: { value: Uint8ClampedArray.BYTES_PER_ELEMENT } });
        Object.defineProperties(Uint16Array.prototype, { BYTES_PER_ELEMENT: { value: Uint16Array.BYTES_PER_ELEMENT } });
        Object.defineProperties(Int16Array.prototype, { BYTES_PER_ELEMENT: { value: Int16Array.BYTES_PER_ELEMENT } });
        Object.defineProperties(Uint32Array.prototype, { BYTES_PER_ELEMENT: { value: Uint32Array.BYTES_PER_ELEMENT } });
        Object.defineProperties(Int32Array.prototype, { BYTES_PER_ELEMENT: { value: Int32Array.BYTES_PER_ELEMENT } });
        Object.defineProperties(Float64Array.prototype, { BYTES_PER_ELEMENT: { value: Float64Array.BYTES_PER_ELEMENT } });
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/Reader.js
  var require_Reader = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/Reader.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Reader = exports.TypeEnum = void 0;
      var DataStream_1 = __importDefault(require_DataStream());
      var utils_1 = require_utils();
      var const_1 = __importDefault(require_const());
      var TypeEnum;
      (function(TypeEnum2) {
        TypeEnum2[TypeEnum2["DIRECTORY"] = 1] = "DIRECTORY";
        TypeEnum2[TypeEnum2["DOCUMENT"] = 2] = "DOCUMENT";
        TypeEnum2[TypeEnum2["ROOT"] = 5] = "ROOT";
      })(TypeEnum || (exports.TypeEnum = TypeEnum = {}));
      var Reader = (
        /** @class */
        (function() {
          function Reader2(arrayBuffer) {
            this.ds = new DataStream_1.default(arrayBuffer, 0, DataStream_1.default.LITTLE_ENDIAN);
          }
          Reader2.prototype.isMSGFile = function() {
            this.ds.seek(0);
            return (0, utils_1.arraysEqual)(const_1.default.FILE_HEADER, this.ds.readInt8Array(const_1.default.FILE_HEADER.length));
          };
          Reader2.prototype.headerData = function() {
            this.bigBlockSize = this.ds.readByte(30) == const_1.default.MSG.L_BIG_BLOCK_MARK ? const_1.default.MSG.L_BIG_BLOCK_SIZE : const_1.default.MSG.S_BIG_BLOCK_SIZE;
            this.bigBlockLength = this.bigBlockSize / 4;
            this.xBlockLength = this.bigBlockLength - 1;
            this.batCount = this.ds.readInt(const_1.default.MSG.HEADER.BAT_COUNT_OFFSET);
            this.propertyStart = this.ds.readInt(const_1.default.MSG.HEADER.PROPERTY_START_OFFSET);
            this.sbatStart = this.ds.readInt(const_1.default.MSG.HEADER.SBAT_START_OFFSET);
            this.sbatCount = this.ds.readInt(const_1.default.MSG.HEADER.SBAT_COUNT_OFFSET);
            this.xbatStart = this.ds.readInt(const_1.default.MSG.HEADER.XBAT_START_OFFSET);
            this.xbatCount = this.ds.readInt(const_1.default.MSG.HEADER.XBAT_COUNT_OFFSET);
          };
          Reader2.prototype.convertName = function(offset) {
            var nameLength = this.ds.readShort(offset + const_1.default.MSG.PROP.NAME_SIZE_OFFSET);
            if (nameLength < 1) {
              return "";
            } else {
              return this.ds.readStringAt(offset, nameLength / 2).split("\0")[0];
            }
          };
          Reader2.prototype.convertProperty = function(offset) {
            return {
              type: this.ds.readByte(offset + const_1.default.MSG.PROP.TYPE_OFFSET),
              name: this.convertName(offset),
              // hierarchy
              previousProperty: this.ds.readInt(offset + const_1.default.MSG.PROP.PREVIOUS_PROPERTY_OFFSET),
              nextProperty: this.ds.readInt(offset + const_1.default.MSG.PROP.NEXT_PROPERTY_OFFSET),
              childProperty: this.ds.readInt(offset + const_1.default.MSG.PROP.CHILD_PROPERTY_OFFSET),
              // data offset
              startBlock: this.ds.readInt(offset + const_1.default.MSG.PROP.START_BLOCK_OFFSET),
              sizeBlock: this.ds.readInt(offset + const_1.default.MSG.PROP.SIZE_OFFSET)
            };
          };
          Reader2.prototype.convertBlockToProperties = function(propertyBlockOffset, props) {
            var propertyCount = this.bigBlockSize / const_1.default.MSG.PROP.PROPERTY_SIZE;
            var propertyOffset = this.getBlockOffsetAt(propertyBlockOffset);
            for (var i = 0; i < propertyCount; i++) {
              if (this.ds.byteLength < propertyOffset + const_1.default.MSG.PROP.TYPE_OFFSET) {
                break;
              }
              var propertyType = this.ds.readByte(propertyOffset + const_1.default.MSG.PROP.TYPE_OFFSET);
              switch (propertyType) {
                case const_1.default.MSG.PROP.TYPE_ENUM.ROOT:
                case const_1.default.MSG.PROP.TYPE_ENUM.DIRECTORY:
                case const_1.default.MSG.PROP.TYPE_ENUM.DOCUMENT:
                  props.push(this.convertProperty(propertyOffset));
                  break;
                case const_1.default.MSG.PROP.TYPE_ENUM.UNALLOCATED:
                default:
                  props.push({
                    type: propertyType,
                    name: "",
                    previousProperty: -1,
                    nextProperty: -1,
                    childProperty: -1,
                    startBlock: 0,
                    sizeBlock: 0
                  });
                  break;
              }
              propertyOffset += const_1.default.MSG.PROP.PROPERTY_SIZE;
            }
          };
          Reader2.prototype.createPropertyHierarchy = function(props, nodeProperty) {
            if (!nodeProperty || nodeProperty.childProperty == const_1.default.MSG.PROP.NO_INDEX) {
              return;
            }
            nodeProperty.children = [];
            var children = [{ currentMode: "walk", currentIndex: nodeProperty.childProperty }];
            while (children.length != 0) {
              var _a = children.pop(), currentMode = _a.currentMode, currentIndex = _a.currentIndex;
              var current = props[currentIndex];
              if (currentMode === "push") {
                nodeProperty.children.push(currentIndex);
              } else {
                if (current.type == const_1.default.MSG.PROP.TYPE_ENUM.DIRECTORY) {
                  this.createPropertyHierarchy(props, current);
                }
                if (current.nextProperty != const_1.default.MSG.PROP.NO_INDEX) {
                  children.push({ currentMode: "walk", currentIndex: current.nextProperty });
                }
                children.push({ currentMode: "push", currentIndex });
                if (current.previousProperty != const_1.default.MSG.PROP.NO_INDEX) {
                  children.push({ currentMode: "walk", currentIndex: current.previousProperty });
                }
              }
            }
          };
          Reader2.prototype.propertyDataReader = function(propertyStart) {
            var props = [];
            var currentOffset = propertyStart;
            while (currentOffset != const_1.default.MSG.END_OF_CHAIN) {
              this.convertBlockToProperties(currentOffset, props);
              currentOffset = this.getNextBlock(currentOffset);
            }
            this.createPropertyHierarchy(props, props[0]);
            return props;
          };
          Reader2.prototype.parse = function() {
            this.headerData();
            this.batData = this.batDataReader();
            if (this.xbatCount > 0) {
              this.xbatDataReader();
            }
            this.sbatData = this.sbatDataReader();
            this.propertyData = this.propertyDataReader(this.propertyStart);
            this.bigBlockTable = this.readBigBlockTable();
          };
          Reader2.prototype.batCountInHeader = function() {
            var maxBatsInHeader = (const_1.default.MSG.S_BIG_BLOCK_SIZE - const_1.default.MSG.HEADER.BAT_START_OFFSET) / 4;
            return Math.min(this.batCount, maxBatsInHeader);
          };
          Reader2.prototype.batDataReader = function() {
            var result = new Array(this.batCountInHeader());
            this.ds.seek(const_1.default.MSG.HEADER.BAT_START_OFFSET);
            for (var i = 0; i < result.length; i++) {
              result[i] = this.ds.readInt32();
            }
            return result;
          };
          Reader2.prototype.getBlockOffsetAt = function(offset) {
            return (offset + 1) * this.bigBlockSize;
          };
          Reader2.prototype.getBlockAt = function(offset) {
            var startOffset = this.getBlockOffsetAt(offset);
            this.ds.seek(startOffset);
            return this.ds.readInt32Array(this.bigBlockLength);
          };
          Reader2.prototype.getBlockValueAt = function(offset, index) {
            var startOffset = this.getBlockOffsetAt(offset);
            this.ds.seek(startOffset + 4 * index);
            return this.ds.readInt32();
          };
          Reader2.prototype.getNextBlockInner = function(offset, blockOffsetData) {
            var currentBlock = Math.floor(offset / this.bigBlockLength);
            var currentBlockIndex = offset % this.bigBlockLength;
            var startBlockOffset = blockOffsetData[currentBlock];
            if (typeof startBlockOffset === "undefined") {
              return const_1.default.MSG.END_OF_CHAIN;
            }
            return this.getBlockValueAt(startBlockOffset, currentBlockIndex);
          };
          Reader2.prototype.getNextBlock = function(offset) {
            return this.getNextBlockInner(offset, this.batData);
          };
          Reader2.prototype.sbatDataReader = function() {
            var result = [];
            var startIndex = this.sbatStart;
            for (var i = 0; i < this.sbatCount && startIndex && startIndex != const_1.default.MSG.END_OF_CHAIN; i++) {
              result.push(startIndex);
              startIndex = this.getNextBlock(startIndex);
            }
            return result;
          };
          Reader2.prototype.xbatDataReader = function() {
            var batCount = this.batCountInHeader();
            var batCountTotal = this.batCount;
            var remainingBlocks = batCountTotal - batCount;
            var nextBlockAt = this.xbatStart;
            for (var i = 0; i < this.xbatCount; i++) {
              var xBatBlock = this.getBlockAt(nextBlockAt);
              var blocksToProcess = Math.min(remainingBlocks, this.xBlockLength);
              for (var j = 0; j < blocksToProcess; j++) {
                var blockStartAt = xBatBlock[j];
                if (blockStartAt == const_1.default.MSG.UNUSED_BLOCK || blockStartAt == const_1.default.MSG.END_OF_CHAIN) {
                  break;
                }
                this.batData.push(blockStartAt);
              }
              remainingBlocks -= blocksToProcess;
              nextBlockAt = xBatBlock[this.xBlockLength];
              if (nextBlockAt == const_1.default.MSG.UNUSED_BLOCK || nextBlockAt == const_1.default.MSG.END_OF_CHAIN) {
                break;
              }
            }
          };
          Reader2.prototype.getNextBlockSmall = function(offset) {
            return this.getNextBlockInner(offset, this.sbatData);
          };
          Reader2.prototype.getChainByBlockSmall = function(fieldProperty) {
            var blockChain = [];
            var nextBlockSmall = fieldProperty.startBlock;
            while (nextBlockSmall != const_1.default.MSG.END_OF_CHAIN) {
              blockChain.push(nextBlockSmall);
              nextBlockSmall = this.getNextBlockSmall(nextBlockSmall);
            }
            return blockChain;
          };
          Reader2.prototype.readBigBlockTable = function() {
            var rootProp = this.propertyData[0];
            var table = [];
            var nextBlock = rootProp.startBlock;
            for (var i = 0; nextBlock != const_1.default.MSG.END_OF_CHAIN; i++) {
              table.push(nextBlock);
              nextBlock = this.getNextBlock(nextBlock);
            }
            return table;
          };
          Reader2.prototype.readDataByBlockSmall = function(startBlock, blockSize, arr, dstOffset) {
            var byteOffset = startBlock * const_1.default.MSG.SMALL_BLOCK_SIZE;
            var bigBlockNumber = Math.floor(byteOffset / this.bigBlockSize);
            var bigBlockOffset = byteOffset % this.bigBlockSize;
            var nextBlock = this.bigBlockTable[bigBlockNumber];
            var blockStartOffset = this.getBlockOffsetAt(nextBlock);
            this.ds.seek(blockStartOffset + bigBlockOffset);
            return this.ds.readToUint8Array(blockSize, arr, dstOffset);
          };
          Reader2.prototype.readChainDataByBlockSmall = function(fieldProperty, chain) {
            var resultData = new Uint8Array(fieldProperty.sizeBlock);
            for (var i = 0, idx = 0; i < chain.length; i++) {
              var readLen = resultData.length < idx + const_1.default.MSG.SMALL_BLOCK_SIZE ? resultData.length - idx : const_1.default.MSG.SMALL_BLOCK_SIZE;
              this.readDataByBlockSmall(chain[i], readLen, resultData, idx);
              idx += readLen;
            }
            return resultData;
          };
          Reader2.prototype.readProperty = function(fieldProperty) {
            if (!fieldProperty.sizeBlock) {
              return new Uint8Array(0);
            } else if (fieldProperty.sizeBlock < const_1.default.MSG.BIG_BLOCK_MIN_DOC_SIZE) {
              var chain = this.getChainByBlockSmall(fieldProperty);
              if (chain.length == 1) {
                var resultData = new Uint8Array(fieldProperty.sizeBlock);
                this.readDataByBlockSmall(fieldProperty.startBlock, fieldProperty.sizeBlock, resultData, 0);
                return resultData;
              } else if (chain.length > 1) {
                return this.readChainDataByBlockSmall(fieldProperty, chain);
              }
              return new Uint8Array(0);
            } else {
              var nextBlock = fieldProperty.startBlock;
              var remaining = fieldProperty.sizeBlock;
              var position = 0;
              var resultData = new Uint8Array(fieldProperty.sizeBlock);
              while (1 <= remaining) {
                var blockStartOffset = this.getBlockOffsetAt(nextBlock);
                this.ds.seek(blockStartOffset);
                var partSize = Math.min(remaining, this.bigBlockSize);
                var part = this.ds.readUint8Array(partSize);
                resultData.set(part, position);
                position += partSize;
                remaining -= partSize;
                nextBlock = this.getNextBlock(nextBlock);
              }
              return resultData;
            }
          };
          Reader2.prototype.readFileOf = function(index) {
            return this.readProperty(this.propertyData[index]);
          };
          Reader2.prototype.folderOf = function(index) {
            var _this = this;
            var propertyData = this.propertyData;
            if (!propertyData) {
              return null;
            }
            var folder = propertyData[index];
            return {
              dataId: index,
              name: folder.name,
              fileNames: function() {
                var children = folder.children;
                if (children) {
                  return children.map(function(subIndex) {
                    return propertyData[subIndex];
                  }).filter(function(it) {
                    return it.type === TypeEnum.DOCUMENT;
                  }).map(function(it) {
                    return it.name;
                  });
                }
                return [];
              },
              fileNameSets: function() {
                var children = folder.children;
                if (children) {
                  return children.map(function(subIndex) {
                    return {
                      subIndex,
                      entry: propertyData[subIndex]
                    };
                  }).filter(function(it) {
                    return it.entry.type === TypeEnum.DOCUMENT;
                  }).map(function(it) {
                    return {
                      name: it.entry.name,
                      length: it.entry.sizeBlock,
                      dataId: it.subIndex,
                      provider: function() {
                        return _this.readProperty(it.entry);
                      }
                    };
                  });
                }
                return [];
              },
              subFolders: function() {
                var children = folder.children;
                if (children) {
                  return children.filter(function(subIndex) {
                    return propertyData[subIndex].type == TypeEnum.DIRECTORY;
                  }).map(function(subIndex) {
                    return _this.folderOf(subIndex);
                  });
                }
                return [];
              },
              readFile: function(fileName) {
                var children = folder.children;
                if (children) {
                  for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var subIndex = children_1[_i];
                    var file = propertyData[subIndex];
                    if (file && file.type === TypeEnum.DOCUMENT && file.name === fileName) {
                      return _this.readProperty(file);
                    }
                  }
                }
                return null;
              }
            };
          };
          Reader2.prototype.rootFolder = function() {
            return this.folderOf(0);
          };
          return Reader2;
        })()
      );
      exports.Reader = Reader;
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/Burner.js
  var require_Burner = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/Burner.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.burn = burn;
      var Reader_1 = require_Reader();
      var DataStream_1 = __importDefault(require_DataStream());
      var const_1 = __importDefault(require_const());
      function RoundUpto512(bytes) {
        return bytes + 511 & ~511;
      }
      function RoundUpto64(bytes) {
        return bytes + 63 & ~63;
      }
      var LiteFat = (
        /** @class */
        (function() {
          function LiteFat2(source) {
            this.sectors = source;
          }
          LiteFat2.prototype.allocate = function(count) {
            var first = this.sectors.length;
            for (var x = 0; x < count; x++) {
              var next = x + 1 === count ? -2 : first + x + 1;
              this.sectors.push(next);
            }
            return first;
          };
          LiteFat2.prototype.allocateAs = function(count, value) {
            var first = this.sectors.length;
            for (var x = 0; x < count; x++) {
              this.sectors.push(value);
            }
            return first;
          };
          LiteFat2.prototype.finalize = function(boundary, value) {
            var num = (boundary - this.sectors.length % boundary) % boundary;
            for (; num >= 1; num -= 1) {
              this.sectors.push(value);
            }
            return this;
          };
          LiteFat2.prototype.count = function() {
            return this.sectors.length;
          };
          return LiteFat2;
        })()
      );
      var LiteBurner = (
        /** @class */
        (function() {
          function LiteBurner2(entries) {
            this.fat = new LiteFat([]);
            this.miniFat = new LiteFat([]);
            this.liteEnts = entries.map(function(it) {
              return {
                entry: it,
                left: -1,
                right: -1,
                child: -1,
                firstSector: 0,
                isMini: it.length < 4096,
                isRed: false
              };
            });
            this.buildTree(0);
            var entriesFirstSector = this.fat.allocate(RoundUpto512(128 * this.liteEnts.length) / 512);
            for (var _i = 0, _a = this.liteEnts.filter(function(it) {
              return it.entry.type == Reader_1.TypeEnum.DOCUMENT && it.isMini === false;
            }); _i < _a.length; _i++) {
              var liteEnt = _a[_i];
              liteEnt.firstSector = liteEnt.entry.length === 0 ? -2 : this.fat.allocate(RoundUpto512(liteEnt.entry.length) / 512);
            }
            for (var _b = 0, _c = this.liteEnts.filter(function(it) {
              return it.entry.type == Reader_1.TypeEnum.DOCUMENT && it.isMini === true;
            }); _b < _c.length; _b++) {
              var liteEnt = _c[_b];
              liteEnt.firstSector = liteEnt.entry.length === 0 ? -2 : this.miniFat.allocate(RoundUpto64(liteEnt.entry.length) / 64);
            }
            var numMiniFatSectors = RoundUpto512(4 * this.miniFat.count()) / 512;
            var firstMiniFatSector = numMiniFatSectors !== 0 ? this.fat.allocate(numMiniFatSectors) : -2;
            var bytesMiniFat = 64 * this.miniFat.count();
            var firstMiniDataSector = this.fat.allocate(RoundUpto512(bytesMiniFat) / 512);
            this.liteEnts[0].firstSector = firstMiniDataSector;
            var firstFatSector = this.fat.allocateAs(RoundUpto512(4 * (this.fat.count() + this.fat.count() / 128 + this.fat.count() / (128 * 109))) / 512, -3);
            var numFatSectors = this.fat.count() - firstFatSector;
            var numDifatSectors = numFatSectors > 109 ? RoundUpto512(4 * Math.floor((numFatSectors - 109) / 127 * 128)) / 512 : 0;
            var firstDifatSector = numDifatSectors !== 0 ? this.fat.allocateAs(numDifatSectors, -4) : -2;
            var array = new ArrayBuffer(512 * (1 + this.fat.count()));
            var ds = new DataStream_1.default(array, 0, DataStream_1.default.LITTLE_ENDIAN);
            ds.dynamicSize = false;
            this.miniFat.finalize(512 / 4, -1);
            var difat1 = [];
            var difat2 = [];
            {
              var x = 0;
              for (; x < 109 && x < numFatSectors; x++) {
                difat1.push(firstFatSector + x);
              }
              var nextDifatSector = firstDifatSector + 1;
              for (; x < numFatSectors; x++) {
                difat2.push(firstFatSector + x);
                var remain = difat2.length & 127;
                if (remain === 127) {
                  difat2.push(nextDifatSector);
                  nextDifatSector++;
                }
              }
              while (true) {
                var remain = difat2.length & 127;
                if (remain === 0) {
                  break;
                }
                difat2.push(remain === 127 ? -2 : -1);
              }
            }
            {
              ds.seek(0);
              ds.writeUint8Array(const_1.default.FILE_HEADER);
              ds.seek(24);
              ds.writeUint16(62);
              ds.writeUint16(3);
              ds.writeUint16(65534);
              ds.writeUint16(9);
              ds.writeUint16(6);
              ds.seek(44);
              ds.writeInt32(numFatSectors);
              ds.writeInt32(entriesFirstSector);
              ds.seek(56);
              ds.writeInt32(4096);
              ds.writeInt32(firstMiniFatSector);
              ds.writeInt32(numMiniFatSectors);
              ds.writeInt32(firstDifatSector);
              ds.writeInt32(numDifatSectors);
              var x = 0;
              for (; x < difat1.length; x++) {
                ds.writeInt32(difat1[x]);
              }
              for (; x < 109; x++) {
                ds.writeInt32(-1);
              }
            }
            for (var x = 0; x < this.liteEnts.length; x++) {
              var liteEnt = this.liteEnts[x];
              var pos = 512 * (1 + entriesFirstSector) + 128 * x;
              ds.seek(pos);
              ds.writeUCS2String(liteEnt.entry.name, null, null);
              var numBytesName = ds.position - pos;
              ds.seek(pos + 64);
              ds.writeUint16(Math.min(64, numBytesName + 2));
              ds.writeUint8(liteEnt.entry.type);
              ds.writeUint8(liteEnt.isRed ? 0 : 1);
              ds.writeInt32(liteEnt.left);
              ds.writeInt32(liteEnt.right);
              ds.writeInt32(liteEnt.child);
              if (x === 0) {
                ds.seek(pos + 80);
                ds.writeUint8Array([11, 13, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70]);
              }
              var length_1 = x === 0 ? bytesMiniFat : liteEnt.entry.length;
              var firstSector = length_1 !== 0 ? liteEnt.firstSector : liteEnt.entry.type === Reader_1.TypeEnum.DIRECTORY ? 0 : -2;
              ds.seek(pos + 116);
              ds.writeInt32(firstSector);
              ds.writeInt32(length_1);
            }
            for (var _d = 0, _e = this.liteEnts.filter(function(it) {
              return it.entry.type == Reader_1.TypeEnum.DOCUMENT && it.isMini === false;
            }); _d < _e.length; _d++) {
              var liteEnt = _e[_d];
              var bytes = liteEnt.entry.binaryProvider();
              ds.seek(512 * (1 + liteEnt.firstSector));
              ds.writeUint8Array(bytes);
            }
            for (var _f = 0, _g = this.liteEnts.filter(function(it) {
              return it.entry.type == Reader_1.TypeEnum.DOCUMENT && it.isMini === true;
            }); _f < _g.length; _f++) {
              var liteEnt = _g[_f];
              var bytes = liteEnt.entry.binaryProvider();
              ds.seek(512 * (1 + firstMiniDataSector) + 64 * liteEnt.firstSector);
              ds.writeUint8Array(bytes);
            }
            ds.seek(512 * (1 + firstMiniFatSector));
            ds.writeInt32Array(this.miniFat.sectors);
            this.fat.finalize(512 / 4, -1);
            ds.seek(512 * (1 + firstFatSector));
            ds.writeInt32Array(this.fat.sectors);
            if (numDifatSectors >= 1) {
              ds.seek(512 * (1 + firstDifatSector));
              ds.writeInt32Array(difat2);
            }
            this.array = array;
          }
          LiteBurner2.prototype.compareName = function(a, b) {
            var t = a.length - b.length;
            if (t === 0) {
              var x = a.toUpperCase();
              var y = b.toUpperCase();
              if (x > y) {
                t = 1;
              } else if (x < y) {
                t = -1;
              }
            }
            return t;
          };
          LiteBurner2.prototype.buildTree = function(dirIndex) {
            var _this = this;
            var liteEnts = this.liteEnts;
            var liteEntry = liteEnts[dirIndex];
            if (liteEntry.entry.type === Reader_1.TypeEnum.DOCUMENT) {
              throw new Error("It must be a storage!");
            }
            var children = liteEntry.entry.children.concat();
            if (1 <= children.length) {
              children.sort(function(a, b) {
                return _this.compareName(liteEnts[a].entry.name, liteEnts[b].entry.name);
              });
              var split2_1 = function(start, end, isRed) {
                if (start < end) {
                  var midNum = Math.floor((start + end) / 2);
                  var entryIndex = children[midNum];
                  var entry = liteEnts[entryIndex];
                  entry.isRed = isRed;
                  entry.left = split2_1(start, midNum, !isRed);
                  entry.right = split2_1(midNum + 1, end, !isRed);
                  return entryIndex;
                } else {
                  return -1;
                }
              };
              var split3 = function() {
                var midNum = Math.floor(children.length / 2);
                var entryIndex = children[midNum];
                var entry = liteEnts[entryIndex];
                entry.isRed = false;
                entry.left = split2_1(0, midNum, true);
                entry.right = split2_1(midNum + 1, children.length, true);
                return entryIndex;
              };
              liteEntry.child = split3();
              for (var _i = 0, _a = children.filter(function(it) {
                return liteEnts[it].entry.type === Reader_1.TypeEnum.DIRECTORY;
              }); _i < _a.length; _i++) {
                var subIndex = _a[_i];
                this.buildTree(subIndex);
              }
            }
          };
          return LiteBurner2;
        })()
      );
      function burn(entries) {
        return new Uint8Array(new LiteBurner(entries).array);
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/EntryStreamParser.js
  var require_EntryStreamParser = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/EntryStreamParser.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parse = parse;
      var DataStream_1 = __importDefault(require_DataStream());
      function parse(array) {
        var ds = new DataStream_1.default(array, 0, DataStream_1.default.LITTLE_ENDIAN);
        var ret = [];
        while (!ds.isEof()) {
          var key = ds.readUint32();
          var low = ds.readUint16();
          var hi = ds.readUint16();
          ret.push({
            key,
            isStringProperty: (low & 1) != 0,
            guidIndex: low >> 1 & 32767,
            propertyIndex: hi
          });
        }
        return ret;
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/VerbStreamParser.js
  var require_VerbStreamParser = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/VerbStreamParser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parse = parse;
      function parse(ds) {
        var items = [];
        var count = 0;
        while (!ds.isEof()) {
          var version = ds.readUint16();
          if (version === 258) {
            count = ds.readUint16();
            var dummy1 = ds.readUint16();
            for (var index = 0; index < count; index += 1) {
              var VerbType = ds.readInt32();
              var DisplayNameCount = ds.readUint8();
              var DisplayName = ds.readString(DisplayNameCount);
              var MsgClsNameCount = ds.readUint8();
              var MsgClsName = ds.readString(MsgClsNameCount);
              var Internal1StringCount = ds.readUint8();
              var Internal1String = ds.readString(Internal1StringCount);
              var DisplayNameCountRepeat = ds.readUint8();
              var DisplayNameRepeat = ds.readString(DisplayNameCountRepeat);
              var Internal2 = ds.readInt32();
              var Internal3 = ds.readUint8();
              var fUseUSHeaders = ds.readInt32();
              var Internal4 = ds.readInt32();
              var SendBehavior = ds.readInt32();
              var Internal5 = ds.readInt32();
              var ID = ds.readInt32();
              var Internal6 = ds.readInt32();
              items.push({ VerbType, DisplayName });
            }
          } else if (version === 260) {
            for (var index = 0; index < count; index += 1) {
              var DisplayNameCount = ds.readUint8();
              var DisplayName = ds.readUCS2String(DisplayNameCount);
              var DisplayNameCountRepeat = ds.readUint8();
              var DisplayNameRepeat = ds.readUCS2String(DisplayNameCountRepeat);
              items[index].DisplayName = DisplayName;
            }
          }
        }
        return items.filter(function(it) {
          return it.VerbType === 4;
        }).map(function(it) {
          return it.DisplayName;
        }).join(";");
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/TZDEFINITIONParser.js
  var require_TZDEFINITIONParser = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/TZDEFINITIONParser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parse = parse;
      var utils_1 = require_utils();
      var TZDEFINITION_FLAG_VALID_GUID = 1;
      var TZDEFINITION_FLAG_VALID_KEYNAME = 2;
      function parse(ds) {
        var tz = { rules: [] };
        if (!ds.isEof()) {
          var bMajorVersion = ds.readUint8();
          if (bMajorVersion !== 2) {
            throw new Error("TZDEFINITION major version not supported");
          }
          var bMinorVersion = ds.readUint8();
          if (bMajorVersion < 1) {
            throw new Error("TZDEFINITION minor version not supported");
          }
          var cbHeader = ds.readUint16();
          var wFlags = ds.readUint16();
          if (wFlags & TZDEFINITION_FLAG_VALID_GUID) {
            ds.readInt32();
            ds.readInt32();
            ds.readInt32();
            ds.readInt32();
          }
          if (wFlags & TZDEFINITION_FLAG_VALID_KEYNAME) {
            var cchKeyName = ds.readUint16();
            tz.keyName = ds.readUCS2String(cchKeyName);
          }
          var cRules = ds.readUint16();
          ds.seek(4 + cbHeader);
          for (var x = 0; x < cRules; x++) {
            var bMajorVersion_1 = ds.readUint8();
            if (bMajorVersion_1 !== 2) {
              break;
            }
            var bMinorVersion_1 = ds.readUint8();
            if (bMajorVersion_1 < 1) {
              break;
            }
            var cbRule = ds.readUint16();
            var basePos = ds.position;
            var wFlags_1 = ds.readUint16();
            var stStart = (0, utils_1.readSystemTime)(ds);
            var lBias = ds.readInt32();
            var lStandardBias = ds.readInt32();
            var lDaylightBias = ds.readInt32();
            var stStandardDate = (0, utils_1.readTransitionSystemTime)(ds);
            var stDaylightDate = (0, utils_1.readTransitionSystemTime)(ds);
            var rule = Object.assign({}, {
              flags: wFlags_1,
              start: (stStart === null || stStart === void 0 ? void 0 : stStart.toUTCString()) || null,
              bias: lBias,
              standardBias: lStandardBias,
              daylightBias: lDaylightBias,
              standardDate: stStandardDate,
              daylightDate: stDaylightDate
            });
            tz.rules.push(rule);
            ds.seek(basePos + cbRule);
          }
        }
        return tz;
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/TZREGParser.js
  var require_TZREGParser = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/TZREGParser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parse = parse;
      var utils_1 = require_utils();
      function parse(ds) {
        if (!ds.isEof()) {
          var lBias = ds.readInt32();
          var lStandardBias = ds.readInt32();
          var lDaylightBias = ds.readInt32();
          var wStandardYear = ds.readUint16();
          var stStandardDate = (0, utils_1.readTransitionSystemTime)(ds);
          var wDaylightYear = ds.readUint16();
          var stDaylightDate = (0, utils_1.readTransitionSystemTime)(ds);
          return Object.assign({}, {
            bias: lBias,
            standardBias: lStandardBias,
            daylightBias: lDaylightBias,
            standardYear: wStandardYear,
            standardDate: stStandardDate,
            daylightYear: wDaylightYear,
            daylightDate: stDaylightDate
          });
        }
        return null;
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/AppointmentRecurParser.js
  var require_AppointmentRecurParser = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/AppointmentRecurParser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.OverrideFlags = exports.EndType = exports.CalendarType = exports.PatternType = exports.RecurFrequency = void 0;
      exports.parse = parse;
      var RecurFrequency;
      (function(RecurFrequency2) {
        RecurFrequency2[RecurFrequency2["Daily"] = 8202] = "Daily";
        RecurFrequency2[RecurFrequency2["Weekly"] = 8203] = "Weekly";
        RecurFrequency2[RecurFrequency2["Monthly"] = 8204] = "Monthly";
        RecurFrequency2[RecurFrequency2["Yearly"] = 8205] = "Yearly";
      })(RecurFrequency || (exports.RecurFrequency = RecurFrequency = {}));
      var PatternType;
      (function(PatternType2) {
        PatternType2[PatternType2["Day"] = 0] = "Day";
        PatternType2[PatternType2["Week"] = 1] = "Week";
        PatternType2[PatternType2["Month"] = 2] = "Month";
        PatternType2[PatternType2["MonthEnd"] = 4] = "MonthEnd";
        PatternType2[PatternType2["MonthNth"] = 3] = "MonthNth";
        PatternType2[PatternType2["HjMonth"] = 10] = "HjMonth";
        PatternType2[PatternType2["HjMonthNth"] = 11] = "HjMonthNth";
        PatternType2[PatternType2["HjMonthEnd"] = 12] = "HjMonthEnd";
      })(PatternType || (exports.PatternType = PatternType = {}));
      var CalendarType;
      (function(CalendarType2) {
        CalendarType2[CalendarType2["Default"] = 0] = "Default";
        CalendarType2[CalendarType2["CAL_GREGORIAN"] = 1] = "CAL_GREGORIAN";
        CalendarType2[CalendarType2["CAL_GREGORIAN_US"] = 2] = "CAL_GREGORIAN_US";
        CalendarType2[CalendarType2["CAL_JAPAN"] = 3] = "CAL_JAPAN";
        CalendarType2[CalendarType2["CAL_TAIWAN"] = 4] = "CAL_TAIWAN";
        CalendarType2[CalendarType2["CAL_KOREA"] = 5] = "CAL_KOREA";
        CalendarType2[CalendarType2["CAL_HIJRI"] = 6] = "CAL_HIJRI";
        CalendarType2[CalendarType2["CAL_THAI"] = 7] = "CAL_THAI";
        CalendarType2[CalendarType2["CAL_HEBREW"] = 8] = "CAL_HEBREW";
        CalendarType2[CalendarType2["CAL_GREGORIAN_ME_FRENCH"] = 9] = "CAL_GREGORIAN_ME_FRENCH";
        CalendarType2[CalendarType2["CAL_GREGORIAN_ARABIC"] = 10] = "CAL_GREGORIAN_ARABIC";
        CalendarType2[CalendarType2["CAL_GREGORIAN_XLIT_ENGLISH"] = 11] = "CAL_GREGORIAN_XLIT_ENGLISH";
        CalendarType2[CalendarType2["CAL_GREGORIAN_XLIT_FRENCH"] = 12] = "CAL_GREGORIAN_XLIT_FRENCH";
        CalendarType2[CalendarType2["CAL_LUNAR_JAPANESE"] = 14] = "CAL_LUNAR_JAPANESE";
        CalendarType2[CalendarType2["CAL_CHINESE_LUNAR"] = 15] = "CAL_CHINESE_LUNAR";
        CalendarType2[CalendarType2["CAL_SAKA"] = 16] = "CAL_SAKA";
        CalendarType2[CalendarType2["CAL_LUNAR_ETO_CHN"] = 17] = "CAL_LUNAR_ETO_CHN";
        CalendarType2[CalendarType2["CAL_LUNAR_ETO_KOR"] = 18] = "CAL_LUNAR_ETO_KOR";
        CalendarType2[CalendarType2["CAL_LUNAR_ROKUYOU"] = 19] = "CAL_LUNAR_ROKUYOU";
        CalendarType2[CalendarType2["CAL_LUNAR_KOREAN"] = 20] = "CAL_LUNAR_KOREAN";
        CalendarType2[CalendarType2["CAL_UMALQURA"] = 23] = "CAL_UMALQURA";
      })(CalendarType || (exports.CalendarType = CalendarType = {}));
      var EndType;
      (function(EndType2) {
        EndType2[EndType2["EndAfterDate"] = 8225] = "EndAfterDate";
        EndType2[EndType2["EndAfterNOccurrences"] = 8226] = "EndAfterNOccurrences";
        EndType2[EndType2["NeverEnd"] = 8227] = "NeverEnd";
        EndType2[EndType2["NeverEnd2"] = 4294967295] = "NeverEnd2";
      })(EndType || (exports.EndType = EndType = {}));
      var OverrideFlags;
      (function(OverrideFlags2) {
        OverrideFlags2[OverrideFlags2["ARO_SUBJECT"] = 1] = "ARO_SUBJECT";
        OverrideFlags2[OverrideFlags2["ARO_MEETINGTYPE"] = 2] = "ARO_MEETINGTYPE";
        OverrideFlags2[OverrideFlags2["ARO_REMINDERDELTA"] = 4] = "ARO_REMINDERDELTA";
        OverrideFlags2[OverrideFlags2["ARO_REMINDER"] = 8] = "ARO_REMINDER";
        OverrideFlags2[OverrideFlags2["ARO_LOCATION"] = 16] = "ARO_LOCATION";
        OverrideFlags2[OverrideFlags2["ARO_BUSYSTATUS"] = 32] = "ARO_BUSYSTATUS";
        OverrideFlags2[OverrideFlags2["ARO_ATTACHMENT"] = 64] = "ARO_ATTACHMENT";
        OverrideFlags2[OverrideFlags2["ARO_SUBTYPE"] = 128] = "ARO_SUBTYPE";
        OverrideFlags2[OverrideFlags2["ARO_APPTCOLOR"] = 256] = "ARO_APPTCOLOR";
        OverrideFlags2[OverrideFlags2["ARO_EXCEPTIONAL_BODY"] = 512] = "ARO_EXCEPTIONAL_BODY";
      })(OverrideFlags || (exports.OverrideFlags = OverrideFlags = {}));
      function parseRecurrencePattern(ds) {
        var ReaderVersion = ds.readUint16();
        if (ReaderVersion !== 12292) {
          throw new Error("ReaderVersion not supported");
        }
        var WriterVersion = ds.readUint16();
        if (WriterVersion !== 12292) {
          throw new Error("WriterVersion not supported");
        }
        var recurFrequency = ds.readUint16();
        var patternType = ds.readUint16();
        var calendarType = ds.readUint16();
        var firstDateTime = ds.readUint32();
        var period = ds.readUint32();
        var slidingFlag = ds.readUint32();
        var patternTypeWeek = void 0;
        var patternTypeMonth = void 0;
        var patternTypeMonthNth = void 0;
        if (false) {
        } else if (patternType === PatternType.Week) {
          patternTypeWeek = {
            dayOfWeekBits: ds.readUint32()
          };
        } else if (patternType === PatternType.Month || patternType === PatternType.MonthEnd || patternType === PatternType.HjMonth || patternType === PatternType.HjMonthEnd) {
          patternTypeMonth = {
            day: ds.readUint32()
          };
        } else if (patternType === PatternType.MonthNth || patternType === PatternType.HjMonthNth) {
          patternTypeMonthNth = {
            dayOfWeekBits: ds.readUint32(),
            n: ds.readUint32()
          };
        }
        var endType = ds.readUint32();
        var occurrenceCount = ds.readUint32();
        var firstDOW = ds.readUint32();
        var deletedInstanceCount = ds.readUint32();
        var deletedInstanceDates = Array.from(ds.readUint32Array(deletedInstanceCount));
        var modifiedInstanceCount = ds.readUint32();
        var modifiedInstanceDates = Array.from(ds.readUint32Array(modifiedInstanceCount));
        var startDate = ds.readUint32();
        var endDate = ds.readUint32();
        return Object.assign({
          recurFrequency,
          patternType,
          calendarType,
          firstDateTime,
          period,
          slidingFlag,
          endType,
          occurrenceCount,
          firstDOW,
          deletedInstanceDates,
          modifiedInstanceDates,
          startDate,
          endDate
        }, patternTypeWeek ? { patternTypeWeek } : {}, patternTypeMonth ? { patternTypeMonth } : {}, patternTypeMonthNth ? { patternTypeMonthNth } : {});
      }
      function parse(ds, ansiEncoding) {
        var recurrencePattern = parseRecurrencePattern(ds);
        var readerVersion2 = ds.readUint32();
        if (readerVersion2 !== 12294) {
          throw new Error("ReaderVersion2 not supported");
        }
        var writerVersion2 = ds.readUint32();
        if (writerVersion2 < 12294) {
          throw new Error("WriterVersion2 not supported");
        }
        var startTimeOffset = ds.readUint32();
        var endTimeOffset = ds.readUint32();
        var exceptionCount = ds.readUint16();
        var exceptionInfo = [];
        for (var x = 0; x < exceptionCount; x++) {
          var startDateTime = ds.readUint32();
          var endDateTime = ds.readUint32();
          var originalStartTime = ds.readUint32();
          var overrideFlags = ds.readUint16();
          var subject = void 0;
          if (overrideFlags & OverrideFlags.ARO_SUBJECT) {
            var subjectLength = ds.readUint16();
            var subjectLength2 = ds.readUint16();
            if (subjectLength - 1 !== subjectLength2) {
              throw new Error("subjectLength ".concat(subjectLength, " and subjectLength2 ").concat(subjectLength2, " are not close!"));
            }
            subject = ds.readString(subjectLength2, ansiEncoding);
          }
          var meetingType = void 0;
          if (overrideFlags & OverrideFlags.ARO_MEETINGTYPE) {
            meetingType = ds.readUint32();
          }
          var reminderDelta = void 0;
          if (overrideFlags & OverrideFlags.ARO_REMINDERDELTA) {
            reminderDelta = ds.readUint32();
          }
          var reminderSet = void 0;
          if (overrideFlags & OverrideFlags.ARO_REMINDER) {
            reminderSet = ds.readUint32();
          }
          var location_1 = void 0;
          if (overrideFlags & OverrideFlags.ARO_LOCATION) {
            var locationLength = ds.readUint16();
            var locationLength2 = ds.readUint16();
            if (locationLength - 1 !== locationLength2) {
              throw new Error("locationLength ".concat(locationLength, " and locationLength2 ").concat(locationLength2, " are not close!"));
            }
            location_1 = ds.readString(locationLength2, ansiEncoding);
          }
          var busyStatus = void 0;
          if (overrideFlags & OverrideFlags.ARO_BUSYSTATUS) {
            busyStatus = ds.readUint32();
          }
          var attachment = void 0;
          if (overrideFlags & OverrideFlags.ARO_ATTACHMENT) {
            attachment = ds.readUint32();
          }
          var subType = void 0;
          if (overrideFlags & OverrideFlags.ARO_SUBTYPE) {
            subType = ds.readUint32();
          }
          var appointmentColor = void 0;
          if (overrideFlags & OverrideFlags.ARO_APPTCOLOR) {
            appointmentColor = ds.readUint32();
          }
          exceptionInfo.push(Object.assign({
            startDateTime,
            endDateTime,
            originalStartTime,
            overrideFlags
          }, subject ? { subject } : {}, meetingType ? { meetingType } : {}, reminderDelta ? { reminderDelta } : {}, reminderSet ? { reminderSet } : {}, location_1 ? { location: location_1 } : {}, busyStatus ? { busyStatus } : {}, attachment ? { attachment } : {}, subType ? { subType } : {}, appointmentColor ? { appointmentColor } : {}));
        }
        var reservedBlock1Size = ds.readUint32();
        if (reservedBlock1Size !== 0) {
          throw new Error("reservedBlock1Size ".concat(reservedBlock1Size, " is not zero, AppointmentRecur is broken"));
        }
        for (var x = 0; x < exceptionCount; x++) {
          var one = exceptionInfo[x];
          if (12297 <= writerVersion2) {
            var changeHighlightSize = ds.readUint32();
            one.changeHighlight = ds.readUint32();
            ds.position += changeHighlightSize - 4;
          }
          var reservedBlockEE1Size = ds.readUint32();
          if (reservedBlockEE1Size !== 0) {
            throw new Error("reservedBlockEE1Size ".concat(reservedBlockEE1Size, " is not zero, AppointmentRecur is broken"));
          }
          if (one.overrideFlags & (OverrideFlags.ARO_SUBJECT | OverrideFlags.ARO_LOCATION)) {
            var startDateTime = ds.readUint32();
            var endDateTime = ds.readUint32();
            var originalStartDate = ds.readUint32();
            if (one.overrideFlags & OverrideFlags.ARO_SUBJECT) {
              var wideCharSubjectLength = ds.readUint16();
              one.subject = ds.readUCS2String(wideCharSubjectLength);
            }
            if (one.overrideFlags & OverrideFlags.ARO_LOCATION) {
              var wideCharLocationLength = ds.readUint16();
              one.location = ds.readUCS2String(wideCharLocationLength);
            }
            var reservedBlockEE2Size = ds.readUint32();
            if (reservedBlockEE2Size !== 0) {
              throw new Error("reservedBlockEE2Size ".concat(reservedBlockEE2Size, " is not zero, AppointmentRecur is broken"));
            }
          }
        }
        var reservedBlock2Size = ds.readUint32();
        if (reservedBlock2Size !== 0) {
          throw new Error("reservedBlock2Size ".concat(reservedBlock2Size, " is not zero, AppointmentRecur is broken"));
        }
        return {
          recurrencePattern,
          startTimeOffset,
          endTimeOffset,
          exceptionInfo
        };
      }
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/MsgReader.js
  var require_MsgReader = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/MsgReader.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.OverrideFlags = exports.EndType = exports.CalendarType = exports.PatternType = exports.RecurFrequency = void 0;
      var const_1 = __importDefault(require_const());
      var DataStream_1 = __importDefault(require_DataStream());
      var Reader_1 = require_Reader();
      var Burner_1 = require_Burner();
      var utils_1 = require_utils();
      var EntryStreamParser_1 = require_EntryStreamParser();
      var VerbStreamParser_1 = require_VerbStreamParser();
      var TZDEFINITIONParser_1 = require_TZDEFINITIONParser();
      var TZREGParser_1 = require_TZREGParser();
      var AppointmentRecurParser_1 = require_AppointmentRecurParser();
      var AppointmentRecurParser_2 = require_AppointmentRecurParser();
      Object.defineProperty(exports, "RecurFrequency", { enumerable: true, get: function() {
        return AppointmentRecurParser_2.RecurFrequency;
      } });
      Object.defineProperty(exports, "PatternType", { enumerable: true, get: function() {
        return AppointmentRecurParser_2.PatternType;
      } });
      Object.defineProperty(exports, "CalendarType", { enumerable: true, get: function() {
        return AppointmentRecurParser_2.CalendarType;
      } });
      Object.defineProperty(exports, "EndType", { enumerable: true, get: function() {
        return AppointmentRecurParser_2.EndType;
      } });
      Object.defineProperty(exports, "OverrideFlags", { enumerable: true, get: function() {
        return AppointmentRecurParser_2.OverrideFlags;
      } });
      var TypeEnum;
      (function(TypeEnum2) {
        TypeEnum2[TypeEnum2["DIRECTORY"] = 1] = "DIRECTORY";
        TypeEnum2[TypeEnum2["DOCUMENT"] = 2] = "DOCUMENT";
        TypeEnum2[TypeEnum2["ROOT"] = 5] = "ROOT";
      })(TypeEnum || (TypeEnum = {}));
      var KeyType;
      (function(KeyType2) {
        KeyType2[KeyType2["root"] = 0] = "root";
        KeyType2[KeyType2["toSub"] = 1] = "toSub";
        KeyType2[KeyType2["named"] = 2] = "named";
      })(KeyType || (KeyType = {}));
      function fileTimeToUnixEpoch(time) {
        return (time - 116444736e9) / 1e4;
      }
      function removeTrailingNull(text) {
        var index = text.indexOf("\0");
        if (index !== -1) {
          return text.substring(0, index);
        }
        return text;
      }
      var MsgReader2 = (
        /** @class */
        (function() {
          function MsgReader3(arrayBuffer) {
            this.reader = new Reader_1.Reader(arrayBuffer);
          }
          MsgReader3.prototype.decodeField = function(fieldClass, fieldType, provider, ansiEncoding, insideProps) {
            var array = provider();
            var ds = new DataStream_1.default(array, 0, DataStream_1.default.LITTLE_ENDIAN);
            var key = const_1.default.MSG.FIELD.FULL_NAME_MAPPING["".concat(fieldClass).concat(fieldType)] || const_1.default.MSG.FIELD.NAME_MAPPING[fieldClass];
            var keyType = KeyType.root;
            var propertySet = void 0;
            var propertyLid = void 0;
            var classValue = parseInt("0x".concat(fieldClass));
            if (classValue >= 32768) {
              var keyed = this.privatePidToKeyed[classValue];
              if (keyed) {
                if (keyed.useName) {
                  key = keyed.name;
                  keyType = KeyType.named;
                } else {
                  propertySet = keyed.propertySet;
                  propertyLid = (0, utils_1.toHex4)(keyed.propertyLid);
                  var lidDict = const_1.default.MSG.FIELD.PIDLID_MAPPING[keyed.propertySet];
                  if (lidDict !== void 0) {
                    var prop = lidDict[keyed.propertyLid];
                    if (prop !== void 0) {
                      if (prop.dispid !== void 0) {
                        key = prop.dispid;
                        keyType = KeyType.root;
                      } else {
                        key = prop.id;
                        keyType = KeyType.toSub;
                      }
                    }
                  }
                }
              }
            }
            var value = array;
            var skip = false;
            var decodeAs = const_1.default.MSG.FIELD.TYPE_MAPPING[fieldType];
            if (0) {
            } else if (decodeAs === "string") {
              value = removeTrailingNull(ds.readString(array.length, ansiEncoding));
              skip = insideProps;
            } else if (decodeAs === "unicode") {
              value = removeTrailingNull(ds.readUCS2String(array.length / 2));
              skip = insideProps;
            } else if (decodeAs === "binary") {
              skip = insideProps;
            } else if (decodeAs === "integer") {
              value = ds.readUint32();
            } else if (decodeAs === "boolean") {
              value = ds.readUint16() ? true : false;
            } else if (decodeAs === "time") {
              var lo = ds.readUint32();
              var fileTime = lo + 4294967296 * ds.readUint32();
              value = new Date(fileTimeToUnixEpoch(fileTime)).toUTCString();
            }
            if (skip) {
              key = void 0;
            }
            if (0) {
            } else if (key === "PidLidVerbStream") {
              key = "votingOptions";
              keyType = KeyType.root;
              value = (0, VerbStreamParser_1.parse)(ds);
            } else if (key === "apptTZDefStartDisplay" || key === "apptTZDefEndDisplay" || key === "apptTZDefRecur") {
              keyType = KeyType.root;
              value = (0, TZDEFINITIONParser_1.parse)(ds);
            } else if (key === "timeZoneStruct") {
              value = (0, TZREGParser_1.parse)(ds);
            } else if (key === "apptRecur") {
              try {
                value = (0, AppointmentRecurParser_1.parse)(ds, ansiEncoding);
              } catch (ex) {
                console.debug(ex);
                key = void 0;
              }
            } else if (key === "recipType") {
              var MAPI_TO = 1;
              var MAPI_CC = 2;
              var MAPI_BCC = 3;
              if (0) {
              } else if (value === MAPI_TO) {
                value = "to";
              } else if (value === MAPI_CC) {
                value = "cc";
              } else if (value === MAPI_BCC) {
                value = "bcc";
              }
            } else if (key === "globalAppointmentID") {
              value = (0, utils_1.bin2HexUpper)(ds);
            }
            var propertyTag = "".concat(fieldClass).concat(fieldType);
            return { key, keyType, value, notForRawProp: skip, propertyTag, propertySet, propertyLid };
          };
          MsgReader3.prototype.fieldsDataDocument = function(parserConfig, documentProperty, fields) {
            var value = documentProperty.name.substring(12).toLowerCase();
            var fieldClass = value.substring(0, 4);
            var fieldType = value.substring(4, 8);
            parserConfig.propertyObserver && parserConfig.propertyObserver(fields, parseInt(value.substring(0, 8), 16), documentProperty.provider());
            if (fieldClass == const_1.default.MSG.FIELD.CLASS_MAPPING.ATTACHMENT_DATA) {
              fields.dataId = documentProperty.dataId;
              fields.contentLength = documentProperty.length;
            } else {
              this.setDecodedFieldTo(parserConfig, fields, this.decodeField(fieldClass, fieldType, documentProperty.provider, parserConfig.ansiEncoding, false));
            }
          };
          MsgReader3.prototype.setDecodedFieldTo = function(parserConfig, fields, pair) {
            var key = pair.key, keyType = pair.keyType, value = pair.value;
            if (key !== void 0) {
              if (keyType === KeyType.root) {
                fields[key] = value;
              }
            }
            if (parserConfig.includeRawProps === true) {
              fields.rawProps = fields.rawProps || [];
              if (!pair.notForRawProp) {
                fields.rawProps.push({
                  propertyTag: pair.propertyTag,
                  propertySet: pair.propertySet,
                  propertyLid: pair.propertyLid,
                  propertyName: pair.keyType === KeyType.named ? pair.key : void 0,
                  value
                });
              }
            }
          };
          MsgReader3.prototype.getFieldType = function(fieldProperty) {
            var value = fieldProperty.name.substring(12).toLowerCase();
            return value.substring(4, 8);
          };
          MsgReader3.prototype.fieldsDataDirInner = function(parserConfig, dirProperty, rootFolder, fields) {
            var _this = this;
            if (dirProperty.name.indexOf(const_1.default.MSG.FIELD.PREFIX.ATTACHMENT) == 0) {
              var attachmentField = {
                dataType: "attachment"
              };
              fields.attachments.push(attachmentField);
              this.fieldsDataDir(parserConfig, dirProperty, rootFolder, attachmentField, "attachment");
            } else if (dirProperty.name.indexOf(const_1.default.MSG.FIELD.PREFIX.RECIPIENT) == 0) {
              var recipientField = {
                dataType: "recipient"
              };
              fields.recipients.push(recipientField);
              this.fieldsDataDir(parserConfig, dirProperty, rootFolder, recipientField, "recip");
            } else if (dirProperty.name.indexOf(const_1.default.MSG.FIELD.PREFIX.NAMEID) == 0) {
              this.fieldsNameIdDir(parserConfig, dirProperty, rootFolder, fields);
            } else {
              var childFieldType = this.getFieldType(dirProperty);
              if (childFieldType != const_1.default.MSG.FIELD.DIR_TYPE.INNER_MSG) {
              } else {
                var innerMsgContentFields = {
                  dataType: "msg",
                  attachments: [],
                  recipients: []
                };
                this.fieldsDataDir(parserConfig, dirProperty, rootFolder, innerMsgContentFields, "sub");
                fields.innerMsgContentFields = innerMsgContentFields;
                fields.innerMsgContent = true;
                fields.folderId = dirProperty.dataId;
                this.innerMsgBurners[dirProperty.dataId] = function() {
                  return _this.burnMsg(dirProperty, rootFolder);
                };
              }
            }
          };
          MsgReader3.prototype.burnMsg = function(folder, rootFolder) {
            var entries = [
              {
                name: "Root Entry",
                type: TypeEnum.ROOT,
                children: [],
                length: 0
              }
            ];
            this.registerFolder(entries, 0, folder, rootFolder, 0);
            return (0, Burner_1.burn)(entries);
          };
          MsgReader3.prototype.registerFolder = function(entries, index, folder, rootFolder, depth) {
            var _loop_1 = function(set2) {
              var provider = set2.provider, length_1 = set2.length;
              if (depth === 0 && set2.name === "__properties_version1.0") {
                var src = provider();
                var dst_1 = new Uint8Array(src.length + 8);
                dst_1.set(src.subarray(0, 24), 0);
                dst_1.set(src.subarray(24), 32);
                provider = function() {
                  return dst_1;
                };
                length_1 = dst_1.length;
              }
              var subIndex2 = entries.length;
              entries[index].children.push(subIndex2);
              entries.push({
                name: set2.name,
                type: TypeEnum.DOCUMENT,
                binaryProvider: provider,
                length: length_1
              });
            };
            for (var _i = 0, _a = folder.fileNameSets(); _i < _a.length; _i++) {
              var set = _a[_i];
              _loop_1(set);
            }
            if (depth === 0) {
              var sources = rootFolder.subFolders().filter(function(it) {
                return it.name === const_1.default.MSG.FIELD.PREFIX.NAMEID;
              });
              for (var _b = 0, sources_1 = sources; _b < sources_1.length; _b++) {
                var source = sources_1[_b];
                var subIndex = entries.length;
                entries[index].children.push(subIndex);
                entries.push({
                  name: source.name,
                  type: TypeEnum.DIRECTORY,
                  children: [],
                  length: 0
                });
                this.registerFolder(entries, subIndex, source, rootFolder, depth + 1);
              }
            }
            for (var _c = 0, _d = folder.subFolders(); _c < _d.length; _c++) {
              var subFolder = _d[_c];
              var subIndex = entries.length;
              entries[index].children.push(subIndex);
              entries.push({
                name: subFolder.name,
                type: TypeEnum.DIRECTORY,
                children: [],
                length: 0
              });
              this.registerFolder(entries, subIndex, subFolder, rootFolder, depth + 1);
            }
          };
          MsgReader3.prototype.fieldsRecipAndAttachmentProperties = function(parserConfig, documentProperty, fields) {
            var propertiesBinary = documentProperty.provider();
            var propertiesDs = new DataStream_1.default(propertiesBinary, 8, DataStream_1.default.LITTLE_ENDIAN);
            this.importPropertiesFromFile(parserConfig, propertiesDs, fields);
          };
          MsgReader3.prototype.importPropertiesFromFile = function(parserConfig, propertiesDs, fields) {
            var typeConverters = {
              64: function(dataView) {
                var fileTime = dataView.getUint32(0, true) + 4294967296 * dataView.getUint32(4, true);
                return new Date(fileTimeToUnixEpoch(fileTime)).toUTCString();
              }
            };
            var _loop_2 = function() {
              var propertyTag = propertiesDs.readUint32();
              if (propertyTag === 0) {
                return "break";
              }
              var flags = propertiesDs.readUint32();
              var arr = propertiesDs.readUint8Array(8);
              parserConfig.propertyObserver(fields, propertyTag, arr);
              var fieldClass = (0, utils_1.toHex2)(propertyTag / 65536 & 65535);
              var fieldType = (0, utils_1.toHex2)(propertyTag & 65535);
              this_1.setDecodedFieldTo(parserConfig, fields, this_1.decodeField(fieldClass, fieldType, function() {
                return arr;
              }, parserConfig.ansiEncoding, true));
            };
            var this_1 = this;
            while (!propertiesDs.isEof()) {
              var state_1 = _loop_2();
              if (state_1 === "break")
                break;
            }
          };
          MsgReader3.prototype.fieldsRootProperties = function(parserConfig, documentProperty, fields) {
            var propertiesBinary = documentProperty.provider();
            var propertiesDs = new DataStream_1.default(propertiesBinary, 32, DataStream_1.default.LITTLE_ENDIAN);
            this.importPropertiesFromFile(parserConfig, propertiesDs, fields);
          };
          MsgReader3.prototype.fieldsDataDir = function(parserConfig, dirProperty, rootFolder, fields, subClass) {
            for (var _i = 0, _a = dirProperty.subFolders(); _i < _a.length; _i++) {
              var subFolder = _a[_i];
              this.fieldsDataDirInner(parserConfig, subFolder, rootFolder, fields);
            }
            for (var _b = 0, _c = dirProperty.fileNameSets(); _b < _c.length; _b++) {
              var fileSet = _c[_b];
              if (0) {
              } else if (fileSet.name.indexOf(const_1.default.MSG.FIELD.PREFIX.DOCUMENT) == 0) {
                this.fieldsDataDocument(parserConfig, fileSet, fields);
              } else if (fileSet.name === "__properties_version1.0") {
                if (subClass === "recip" || subClass === "attachment" || subClass === "sub") {
                  this.fieldsRecipAndAttachmentProperties(parserConfig, fileSet, fields);
                } else if (subClass === "root") {
                  this.fieldsRootProperties(parserConfig, fileSet, fields);
                }
              }
            }
          };
          MsgReader3.prototype.fieldsNameIdDir = function(parserConfig, dirProperty, rootFolder, fields) {
            var guidTable = void 0;
            var stringTable = void 0;
            var entryTable = void 0;
            for (var _i = 0, _a = dirProperty.fileNameSets(); _i < _a.length; _i++) {
              var fileSet = _a[_i];
              if (0) {
              } else if (fileSet.name.indexOf(const_1.default.MSG.FIELD.PREFIX.DOCUMENT) == 0) {
                var value = fileSet.name.substring(12).toLowerCase();
                var fieldClass = value.substring(0, 4);
                var fieldType = value.substring(4, 8);
                if (0) {
                } else if (fieldClass === "0002" && fieldType === "0102") {
                  guidTable = fileSet.provider();
                } else if (fieldClass === "0003" && fieldType === "0102") {
                  entryTable = fileSet.provider();
                } else if (fieldClass === "0004" && fieldType === "0102") {
                  stringTable = fileSet.provider();
                }
              }
            }
            if (guidTable !== void 0 && stringTable !== void 0 && entryTable !== void 0) {
              var entries = (0, EntryStreamParser_1.parse)(entryTable);
              var stringReader = new DataStream_1.default(stringTable, 0, DataStream_1.default.LITTLE_ENDIAN);
              for (var _b = 0, entries_1 = entries; _b < entries_1.length; _b++) {
                var entry = entries_1[_b];
                if (entry.isStringProperty) {
                  stringReader.seek(entry.key);
                  var numTextBytes = stringReader.readUint32();
                  this.privatePidToKeyed[32768 | entry.propertyIndex] = {
                    useName: true,
                    name: stringReader.readUCS2String(numTextBytes / 2)
                  };
                } else {
                  this.privatePidToKeyed[32768 | entry.propertyIndex] = {
                    useName: false,
                    propertySet: entry.guidIndex === 1 ? "00020328-00000-0000-C000-00000000046" : entry.guidIndex === 2 ? "00020329-00000-0000-C000-00000000046" : (0, utils_1.msftUuidStringify)(guidTable, 16 * (entry.guidIndex - 3)),
                    propertyLid: entry.key
                  };
                }
              }
            }
          };
          MsgReader3.prototype.fieldsDataReader = function(parserConfig) {
            var fields = {
              dataType: "msg",
              attachments: [],
              recipients: []
            };
            this.fieldsDataDir(parserConfig, this.reader.rootFolder(), this.reader.rootFolder(), fields, "root");
            return fields;
          };
          MsgReader3.prototype.parseMsgData = function(parserConfig) {
            this.reader.parse();
            return this.fieldsDataReader(parserConfig);
          };
          MsgReader3.prototype.getFileData = function() {
            var _a, _b, _c;
            if (this.fieldsData === void 0) {
              if (!this.reader.isMSGFile()) {
                return {
                  dataType: null,
                  error: "Unsupported file type!"
                };
              }
              this.innerMsgBurners = {};
              this.privatePidToKeyed = {};
              this.fieldsData = this.parseMsgData({
                propertyObserver: ((_a = this.parserConfig) === null || _a === void 0 ? void 0 : _a.propertyObserver) || (function() {
                }),
                includeRawProps: ((_b = this.parserConfig) === null || _b === void 0 ? void 0 : _b.includeRawProps) ? true : false,
                ansiEncoding: (0, utils_1.emptyToNull)((_c = this.parserConfig) === null || _c === void 0 ? void 0 : _c.ansiEncoding)
              });
            }
            return this.fieldsData;
          };
          MsgReader3.prototype.getAttachment = function(attach) {
            var attachData = typeof attach === "number" ? this.fieldsData.attachments[attach] : attach;
            if (attachData.innerMsgContent === true && typeof attachData.folderId === "number") {
              return { fileName: attachData.name + ".msg", content: this.innerMsgBurners[attachData.folderId]() };
            } else {
              var fieldData = this.reader.readFileOf(attachData.dataId);
              return { fileName: attachData.fileName, content: fieldData };
            }
          };
          return MsgReader3;
        })()
      );
      exports.default = MsgReader2;
    }
  });

  // node_modules/@kenjiuno/msgreader/lib/index.js
  var require_lib = __commonJS({
    "node_modules/@kenjiuno/msgreader/lib/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var MsgReader_1 = __importDefault(require_MsgReader());
      __exportStar(require_MsgReader(), exports);
      exports.default = MsgReader_1.default;
    }
  });

  // node_modules/@kenjiuno/decompressrtf/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/@kenjiuno/decompressrtf/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.decompressRTF = void 0;
      var Stream = (
        /** @class */
        (function() {
          function Stream2(buf) {
            this.buf = buf;
          }
          Stream2.prototype.readInt32LE = function(offset) {
            var value = this.buf[offset] & 255 | (this.buf[offset + 1] & 255) << 8 | (this.buf[offset + 2] & 255) << 16 | (this.buf[offset + 3] & 255) << 24;
            return value;
          };
          Stream2.prototype.readUInt16BE = function(offset) {
            var value = (this.buf[offset] & 255) << 8 | this.buf[offset + 1] & 255;
            return value;
          };
          Stream2.prototype.readUInt8 = function(offset) {
            var value = this.buf[offset] & 255;
            return value;
          };
          Stream2.prototype.writeUInt8 = function(value, offset) {
            this.buf[offset] = value & 255;
          };
          return Stream2;
        })()
      );
      function decompressRTF2(inputArray) {
        if (inputArray.length < 16) {
          throw new Error("At least 16 bytes");
        }
        var input = new Stream(inputArray);
        var fileSize = input.readInt32LE(0);
        var rawSize = input.readInt32LE(4);
        var compType = input.readInt32LE(8);
        var crc = input.readInt32LE(12);
        var COMPRESSED = 1967544908;
        var UNCOMPRESSED = 1095517517;
        if (compType == COMPRESSED) {
          var initialDictionary = "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx";
          var outputArray = [];
          var output = new Stream(outputArray);
          var outPos = 0;
          var inPos = 16;
          var control = void 0;
          for (var x = 0; x < initialDictionary.length; x += 1) {
            output.writeUInt8(initialDictionary.charCodeAt(x), outPos);
            outPos += 1;
          }
          var inEnd = fileSize + 4;
          for (var run_1 = 0; inPos < inEnd; run_1 = run_1 + 1 & 7) {
            if (0 == run_1) {
              control = input.readUInt8(inPos);
              inPos += 1;
            }
            if (0 != (1 << run_1 & control)) {
              var token = input.readUInt16BE(inPos);
              inPos += 2;
              var offset = token >> 4;
              var length_1 = (token & 15) + 2;
              var readPos = (outPos & ~4095) + offset;
              if (readPos == outPos) {
                break;
              }
              if (readPos > outPos) {
                readPos -= 4096;
              }
              for (var x = 0; x < length_1; x += 1) {
                var octet = output.readUInt8(readPos);
                output.writeUInt8(octet, outPos);
                readPos += 1;
                outPos += 1;
              }
            } else {
              var octet = input.readUInt8(inPos);
              output.writeUInt8(octet, outPos);
              inPos += 1;
              outPos += 1;
            }
          }
          return outputArray.slice(initialDictionary.length);
        } else if (compType == UNCOMPRESSED) {
          return inputArray.slice(16, 16 + rawSize);
        } else {
          throw new Error("Either COMPRESSED or UNCOMPRESSED");
        }
      }
      exports.decompressRTF = decompressRTF2;
    }
  });

  // src/msgreader-entry.js
  var msgreaderNs = __toESM(require_lib(), 1);
  var decompressNs = __toESM(require_lib2(), 1);

  // src/rtf-html.js
  var CODEPAGES = {
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
    65001: "utf-8"
  };
  var SKIP_DESTINATIONS = /* @__PURE__ */ new Set([
    "fonttbl",
    "colortbl",
    "stylesheet",
    "info",
    "pict",
    "object",
    "header",
    "footer",
    "headerl",
    "headerr",
    "headerf",
    "footerl",
    "footerr",
    "footerf",
    "themedata",
    "colorschememapping",
    "datastore",
    "latentstyles",
    "listtable",
    "listoverridetable",
    "rsidtbl",
    "xmlnstbl",
    "generator",
    "pntext",
    "pntxta",
    "pntxtb",
    "mmathPr",
    "fldinst",
    "docvar",
    "xmlopen",
    "xmlclose",
    "factoidname",
    "atnid",
    "atnauthor",
    "annotation",
    "revtbl",
    "protusertbl",
    "userprops",
    "ftnsep",
    "ftnsepc",
    "aftnsep",
    "aftnsepc",
    "mhtmltag",
    "wgrffmtfilter",
    "background",
    "shp",
    "shpinst",
    "sp",
    "sn",
    "sv",
    "objdata",
    "objclass",
    "template",
    "operator",
    "author",
    "company",
    "title",
    "subject",
    "keywords",
    "comment",
    "doccomm",
    "creatim",
    "revtim",
    "printim",
    "buptim",
    "nesttableprops",
    "fldrslt-ignored"
  ]);
  var SYMBOLS = {
    par: "\n",
    line: "\n",
    tab: "	",
    lquote: "\u2018",
    rquote: "\u2019",
    ldblquote: "\u201C",
    rdblquote: "\u201D",
    bullet: "\u2022",
    endash: "\u2013",
    emdash: "\u2014",
    emspace: " ",
    enspace: " ",
    qmspace: " ",
    zwj: "\u200D",
    zwnj: "\u200C",
    ltrmark: "",
    rtlmark: ""
  };
  function bytesToLatin1(bytes) {
    let out = "";
    const chunk = 32768;
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
      if (bytes[i] === 160) {
        flush();
        let n = 0;
        while (i < bytes.length && bytes[i] === 160) {
          n += 1;
          i += 1;
        }
        parts.push("\xA0".repeat(n));
        continue;
      }
      const lead = bytes[i];
      if (lead >= 129 && lead <= 254 && i + 1 < bytes.length) {
        const trail = bytes[i + 1];
        if (trail >= 64 && trail !== 127 && trail !== 160) {
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
      if (b < 128 || b === 160 || b === 9 || b === 10 || b === 13) ok += 1;
    }
    return ok / bytes.length >= 0.92;
  }
  function decodeBytesSmart(bytes, codepage) {
    if (!bytes.length) return "";
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
      legacy = isDbcsCodepage(codepage) ? decodeDbcsPreservingNbsp(bytes, codepage) : makeDecoder(codepage).decode(bytes);
    } catch {
      legacy = utf8;
    }
    if (utf8Ok && countReplacements(utf8) === 0) {
      const utf8Cjk = (utf8.match(/[\u4e00-\u9fff]/g) || []).length;
      const legacyCjk = (legacy.match(/[\u4e00-\u9fff]/g) || []).length;
      if (countReplacements(legacy) <= countReplacements(utf8) && legacyCjk > utf8Cjk + 5 && !/\u7b3a{3,}/.test(legacy)) {
        return legacy;
      }
      return utf8;
    }
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
    const match = /charset\s*=\s*["']?\s*([a-z0-9._-]+)/i.exec(htmlLatin1) || /charset\s*=\s*([a-z0-9._-]+)/i.exec(htmlLatin1);
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
          pending.push(text.charCodeAt(i) & 255);
        }
        i += 1;
        continue;
      }
      const next = text[i + 1];
      if (next === void 0) break;
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
        emitString("\xA0");
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
      const param = match[2] !== void 0 ? Number(match[2]) : void 0;
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
        } else if (value) emitString(value);
        continue;
      }
      if (mode === "text" && (word === "cell" || word === "row")) {
        emitString(word === "row" ? "\n" : "	");
        continue;
      }
    }
    flush();
    let result = out.join("");
    if (mode === "html" && result) {
      const meta = charsetFromHtmlMeta(result);
      if (meta && meta !== "utf-8" && countReplacements(result) > 0) {
        try {
          const asBytes = Uint8Array.from(result, (c) => c.charCodeAt(0) & 255);
          const retry = new TextDecoder(meta).decode(asBytes);
          if (countReplacements(retry) < countReplacements(result)) result = retry;
        } catch {
        }
      }
    }
    return result;
  }
  function isEncapsulatedHtml(input) {
    const text = input instanceof Uint8Array ? bytesToLatin1(input.subarray(0, 4096)) : String(input || "").slice(0, 4096);
    return /\\fromhtml1?\b/.test(text);
  }
  function rtfToHtml(input) {
    if (!isEncapsulatedHtml(input)) return "";
    const html = walkRtf(input, "html");
    if (!html) return "";
    const trimmed = html.trim();
    if (!trimmed) return "";
    return /<[a-z!/]/i.test(trimmed) ? html : "";
  }
  function rtfToText(input) {
    const text = walkRtf(input, "text");
    return text ? text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : "";
  }

  // src/msgreader-entry.js
  function pickDefault(ns, name) {
    const candidates = [ns?.default?.default, ns?.default, ns?.[name], ns?.default?.[name]];
    return candidates.find((value) => typeof value === "function") || null;
  }
  var MsgReader = pickDefault(msgreaderNs, "MsgReader");
  var decompressRTF = pickDefault(decompressNs, "decompressRTF");
  globalThis.MailPeekMsgReader = MsgReader;
  globalThis.MailPeekRtf = {
    decompress(bytes) {
      if (!decompressRTF) throw new Error("RTF decompression library is not loaded");
      const input = bytes instanceof Uint8Array ? Array.from(bytes) : Array.from(new Uint8Array(bytes));
      return new Uint8Array(decompressRTF(input));
    },
    rtfToHtml,
    rtfToText,
    isEncapsulatedHtml
  };
})();
