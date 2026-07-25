/**
 * Metadata stripper: removes metadata from image files without re-encoding.
 *
 * Strategy per format:
 *
 * JPEG: Remove APP1 (EXIF), APP13 (IPTC/XMP), APP11 (C2PA/JUMBF) markers,
 *        and any unrecognized APPn markers. Keep SOI (0xFFD8), SOS + image data,
 *        DQT, DHT, SOF, and other essential markers.
 *        Com chunks (0xFFFE) are also stripped.
 *
 * PNG:  Remove ancillary chunks: tEXt, iTXt, zTXt, eXIf, tIME, c2pa, etc.
 *        Keep critical chunks: IHDR, PLTE, IDAT, IEND.
 *        Recalculate CRC for all chunks.
 *
 * WebP: Remove EXIF and XMP chunks from RIFF container.
 *
 * All operations work on the raw byte level - no decoding/re-encoding of
 * pixel data occurs. The image quality is preserved byte-identically.
 */

import type { StripCategoryId } from "@/features/metadata-parser/types";
import { bytesToString } from "@/lib/binary-reader";

const JPEG_EXIF_MARKER = 0xffe1;
const JPEG_IPTC_XMP_MARKER = 0xffed;
const JPEG_C2PA_MARKER = 0xffeb;
const JPEG_COM_MARKER = 0xfffe;

const JPEG_APP_MARKERS_NON_ESSENTIAL = [
  0xffe0, 0xffe1, 0xffe2, 0xffe3, 0xffe4, 0xffe5,
  0xffe6, 0xffe7, 0xffe8, 0xffe9, 0xffea, 0xffeb,
  0xffec, 0xffed, 0xffee, 0xffef,
  0xfffe,
];

const JPEG_SOS_MARKER = 0xffda;
const JPEG_EOI_MARKER = 0xffd9;

const PNG_ANCILLARY_CHUNKS = new Set([
  "tEXt", "iTXt", "zTXt", "eXIf", "tIME", "c2pa",
  "bKGD", "cHRM", "gAMA", "hIST", "iCCP", "pHYs",
  "sBIT", "sPLT", "sRGB", "tRNS",
]);

const PNG_CRITICAL_CHUNKS = new Set(["IHDR", "PLTE", "IDAT", "IEND"]);

export interface StripOptions {
  categories: Set<StripCategoryId>;
}

export interface StripResult {
  cleanedBuffer: ArrayBuffer;
  byteReduction: number;
  chunksRemoved: number;
}

export function stripMetadata(
  buffer: ArrayBuffer,
  mimeType: string,
  options: StripOptions
): StripResult {
  if (options.categories.has("all")) {
    return stripAllMetadata(buffer, mimeType);
  }

  const bytes = new Uint8Array(buffer);

  if (mimeType === "image/jpeg") {
    return stripJpegSelective(bytes, options);
  }
  if (mimeType === "image/png") {
    return stripPngSelective(bytes, options);
  }
  if (mimeType === "image/webp") {
    return stripWebp(bytes, options);
  }

  return { cleanedBuffer: buffer, byteReduction: 0, chunksRemoved: 0 };
}

function stripAllMetadata(buffer: ArrayBuffer, mimeType: string): StripResult {
  const bytes = new Uint8Array(buffer);

  if (mimeType === "image/jpeg") {
    return stripJpegAll(bytes);
  }
  if (mimeType === "image/png") {
    return stripPngAll(bytes);
  }
  if (mimeType === "image/webp") {
    return stripWebp(bytes, { categories: new Set<StripCategoryId>(["all"]) });
  }

  return { cleanedBuffer: buffer, byteReduction: 0, chunksRemoved: 0 };
}

function stripJpegAll(bytes: Uint8Array): StripResult {
  const originalSize = bytes.length;
  const outputParts: Uint8Array[] = [];
  let chunksRemoved = 0;

  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { cleanedBuffer: bytes.buffer as ArrayBuffer, byteReduction: 0, chunksRemoved: 0 };
  }

  outputParts.push(bytes.slice(0, 2));
  let offset = 2;

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = (bytes[offset] << 8) | bytes[offset + 1];

    if (marker === JPEG_EOI_MARKER) {
      outputParts.push(bytes.slice(offset, offset + 2));
      offset += 2;
      break;
    }

    if (marker === JPEG_SOS_MARKER) {
      outputParts.push(bytes.slice(offset, offset + 2));
      offset += 2;
      if (offset + 1 < bytes.length) {
        const scanLen = 2 + (bytes[offset] << 8 | bytes[offset + 1]);
        outputParts.push(bytes.slice(offset, Math.min(offset + scanLen, bytes.length)));
        offset += scanLen;
      }

      if (offset < bytes.length) {
        let eoiFound = false;
        for (let i = offset; i < bytes.length - 1; i++) {
          if (bytes[i] === 0xff && bytes[i + 1] === JPEG_EOI_MARKER) {
            outputParts.push(bytes.slice(offset, i));
            outputParts.push(bytes.slice(i, i + 2));
            offset = i + 2;
            eoiFound = true;
            break;
          }
        }
        if (!eoiFound) {
          outputParts.push(bytes.slice(offset));
          offset = bytes.length;
        }
      }
      continue;
    }

    if (JPEG_APP_MARKERS_NON_ESSENTIAL.includes(marker)) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
      offset += segLen;
      chunksRemoved++;
      continue;
    }

    outputParts.push(bytes.slice(offset, offset + 2));
    offset += 2;
    if (offset + 1 >= bytes.length) break;
    const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
    outputParts.push(bytes.slice(offset, Math.min(offset + segLen, bytes.length)));
    offset += segLen;
  }

  const cleaned = concatUint8Arrays(outputParts);
  return {
    cleanedBuffer: (cleaned.buffer as ArrayBuffer).slice(cleaned.byteOffset, cleaned.byteOffset + cleaned.byteLength),
    byteReduction: originalSize - cleaned.length,
    chunksRemoved,
  };
}

function stripJpegSelective(
  bytes: Uint8Array,
  options: StripOptions
): StripResult {
  const originalSize = bytes.length;
  const outputParts: Uint8Array[] = [];
  let chunksRemoved = 0;

  if (bytes.length < 2 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { cleanedBuffer: bytes.buffer as ArrayBuffer, byteReduction: 0, chunksRemoved: 0 };
  }

  outputParts.push(bytes.slice(0, 2));
  let offset = 2;

  const removeExif = options.categories.has("all") || options.categories.has("exif");
  const removeC2pa = options.categories.has("ai-signature");
  const removeIptcXmp = options.categories.has("iptc") || options.categories.has("xmp");
  const removeCopyright = options.categories.has("copyright");

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = (bytes[offset] << 8) | bytes[offset + 1];

    if (marker === JPEG_EOI_MARKER) {
      outputParts.push(bytes.slice(offset, offset + 2));
      offset += 2;
      break;
    }

    if (marker === JPEG_SOS_MARKER) {
      outputParts.push(bytes.slice(offset, offset + 2));
      offset += 2;
      if (offset + 1 < bytes.length) {
        const scanLen = 2 + (bytes[offset] << 8 | bytes[offset + 1]);
        outputParts.push(bytes.slice(offset, Math.min(offset + scanLen, bytes.length)));
        offset += scanLen;
      }
      if (offset < bytes.length) {
        let eoiFound = false;
        for (let i = offset; i < bytes.length - 1; i++) {
          if (bytes[i] === 0xff && bytes[i + 1] === JPEG_EOI_MARKER) {
            outputParts.push(bytes.slice(offset, i));
            outputParts.push(bytes.slice(i, i + 2));
            offset = i + 2;
            eoiFound = true;
            break;
          }
        }
        if (!eoiFound) {
          outputParts.push(bytes.slice(offset));
          offset = bytes.length;
        }
      }
      continue;
    }

    if (marker === JPEG_EXIF_MARKER && removeExif) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
      offset += segLen;
      chunksRemoved++;
      continue;
    }

    if (marker === JPEG_C2PA_MARKER && removeC2pa) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
      offset += segLen;
      chunksRemoved++;
      continue;
    }

    if (marker === JPEG_IPTC_XMP_MARKER && (removeIptcXmp || removeCopyright)) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
      offset += segLen;
      chunksRemoved++;
      continue;
    }

    if (marker === JPEG_COM_MARKER && removeCopyright) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
      offset += segLen;
      chunksRemoved++;
      continue;
    }

    outputParts.push(bytes.slice(offset, offset + 2));
    offset += 2;
    if (offset + 1 >= bytes.length) break;
    const segLen = ((bytes[offset] << 8) | bytes[offset + 1]);
    outputParts.push(bytes.slice(offset, Math.min(offset + segLen, bytes.length)));
    offset += segLen;
  }

  const cleaned = concatUint8Arrays(outputParts);
  return {
    cleanedBuffer: (cleaned.buffer as ArrayBuffer).slice(cleaned.byteOffset, cleaned.byteOffset + cleaned.byteLength),
    byteReduction: originalSize - cleaned.length,
    chunksRemoved,
  };
}

function stripPngAll(bytes: Uint8Array): StripResult {
  const originalSize = bytes.length;
  const outputParts: Uint8Array[] = [];
  let chunksRemoved = 0;

  if (bytes.length < 8) {
    return { cleanedBuffer: bytes.buffer as ArrayBuffer, byteReduction: 0, chunksRemoved: 0 };
  }

  outputParts.push(bytes.slice(0, 8));
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const chunkType = bytesToString(bytes.slice(offset + 4, offset + 8));

    const totalChunkSize = 12 + chunkLen;

    if (PNG_CRITICAL_CHUNKS.has(chunkType)) {
      outputParts.push(bytes.slice(offset, offset + totalChunkSize));
    } else if (PNG_ANCILLARY_CHUNKS.has(chunkType)) {
      chunksRemoved++;
    } else {
      const isKnownNonEssential = chunkType[0] !== chunkType[0].toUpperCase() && chunkType !== "IEND";
      if (isKnownNonEssential) {
        chunksRemoved++;
      } else {
        outputParts.push(bytes.slice(offset, offset + totalChunkSize));
      }
    }

    if (chunkType === "IEND") {
      break;
    }

    offset += totalChunkSize;
  }

  const cleaned = concatUint8Arrays(outputParts);
  return {
    cleanedBuffer: (cleaned.buffer as ArrayBuffer).slice(cleaned.byteOffset, cleaned.byteOffset + cleaned.byteLength),
    byteReduction: originalSize - cleaned.length,
    chunksRemoved,
  };
}

function stripPngSelective(
  bytes: Uint8Array,
  options: StripOptions
): StripResult {
  const originalSize = bytes.length;
  const outputParts: Uint8Array[] = [];
  let chunksRemoved = 0;

  if (bytes.length < 8) {
    return { cleanedBuffer: bytes.buffer as ArrayBuffer, byteReduction: 0, chunksRemoved: 0 };
  }

  outputParts.push(bytes.slice(0, 8));
  let offset = 8;

  const removeExif = options.categories.has("exif");
  const removeAi = options.categories.has("ai-signature");
  const removeIptcXmp = options.categories.has("iptc") || options.categories.has("xmp");
  const removeCopyright = options.categories.has("copyright");
  const removeTimestamps = options.categories.has("exif");

  while (offset + 12 <= bytes.length) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const chunkType = bytesToString(bytes.slice(offset + 4, offset + 8));
    const totalChunkSize = 12 + chunkLen;

    let shouldStrip = false;

    if (chunkType === "eXIf" && removeExif) shouldStrip = true;
    if (chunkType === "c2pa" && removeAi) shouldStrip = true;
    if ((chunkType === "tEXt" || chunkType === "iTXt" || chunkType === "zTXt") && (removeIptcXmp || removeAi || removeCopyright)) {
      shouldStrip = true;
    }
    if (chunkType === "tIME" && removeTimestamps) shouldStrip = true;

    if (PNG_CRITICAL_CHUNKS.has(chunkType)) {
      outputParts.push(bytes.slice(offset, offset + totalChunkSize));
    } else if (shouldStrip) {
      chunksRemoved++;
    } else if (chunkType === "IEND") {
      outputParts.push(bytes.slice(offset, offset + totalChunkSize));
      break;
    } else {
      outputParts.push(bytes.slice(offset, offset + totalChunkSize));
    }

    offset += totalChunkSize;
  }

  const cleaned = concatUint8Arrays(outputParts);
  return {
    cleanedBuffer: (cleaned.buffer as ArrayBuffer).slice(cleaned.byteOffset, cleaned.byteOffset + cleaned.byteLength),
    byteReduction: originalSize - cleaned.length,
    chunksRemoved,
  };
}

function stripWebp(bytes: Uint8Array, options: StripOptions): StripResult {
  const originalSize = bytes.length;
  if (bytes.length < 12) {
    return { cleanedBuffer: bytes.buffer as ArrayBuffer, byteReduction: 0, chunksRemoved: 0 };
  }

  const categories = options.categories;
  const removeAll = categories.has("all");
  const removeExif = removeAll || categories.has("exif");
  const removeXmp = removeAll || categories.has("xmp") || categories.has("copyright");
  const removeIccp = removeAll || categories.has("copyright");
  const removeAi = removeAll || categories.has("ai-signature");

  let offset = 12;
  const outputParts: Uint8Array[] = [bytes.slice(0, 8)];
  let chunksRemoved = 0;
  let newRiffSize = 4;
  let vp8xIndex = -1;
  let vp8xData: Uint8Array | null = null;

  while (offset + 8 <= bytes.length) {
    const chunkId = bytesToString(bytes.slice(offset, offset + 4));
    const chunkSize =
      (bytes[offset + 4]) |
      (bytes[offset + 5] << 8) |
      (bytes[offset + 6] << 16) |
      (bytes[offset + 7] << 24);

    const paddedSize = chunkSize + (chunkSize % 2);
    const totalSize = 8 + paddedSize;

    let shouldStrip = false;

    if (chunkId === "EXIF" && removeExif) shouldStrip = true;
    if (chunkId === "XMP " && removeXmp) shouldStrip = true;
    if (chunkId === "ICCP" && removeIccp) shouldStrip = true;
    if (chunkId === "C2PA" && removeAi) shouldStrip = true;

    if (shouldStrip) {
      chunksRemoved++;
    } else {
      if (chunkId === "VP8X") {
        vp8xIndex = outputParts.length;
        vp8xData = bytes.slice(offset, offset + totalSize);
      }
      outputParts.push(bytes.slice(offset, offset + totalSize));
      newRiffSize += totalSize;
    }

    offset += totalSize;
  }

  if (vp8xData && vp8xIndex >= 0) {
    const flags = new Uint8Array(vp8xData);
    let flagByte = flags[8];
    if (removeExif) flagByte &= ~(1 << 3);
    if (removeXmp) flagByte &= ~(1 << 2);
    if (removeIccp) flagByte &= ~(1 << 5);
    flags[8] = flagByte;
    outputParts[vp8xIndex] = flags;
    newRiffSize -= vp8xData.length - flags.length;
  }

  const sizeBytes = new Uint8Array(4);
  sizeBytes[0] = newRiffSize & 0xff;
  sizeBytes[1] = (newRiffSize >> 8) & 0xff;
  sizeBytes[2] = (newRiffSize >> 16) & 0xff;
  sizeBytes[3] = (newRiffSize >> 24) & 0xff;

  outputParts[0] = new Uint8Array([
    ...outputParts[0],
    ...sizeBytes,
    ...bytes.slice(8, 12),
  ]);

  const cleaned = concatUint8Arrays(outputParts);
  return {
    cleanedBuffer: (cleaned.buffer as ArrayBuffer).slice(cleaned.byteOffset, cleaned.byteOffset + cleaned.byteLength),
    byteReduction: originalSize - cleaned.length,
    chunksRemoved,
  };
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
