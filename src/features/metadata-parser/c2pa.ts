import type { ParsedC2PA, C2PAManifest, C2PAAssertion, C2PASdkResult } from "./types";
import { BinaryReader, bytesToString } from "@/lib/binary-reader";

const JPEG_APP11_MARKER = 0xffeb;
const C2PA_UUID_BYTES = [
  0x63, 0x32, 0x70, 0x61, 0x00, 0x11, 0x00, 0x10,
  0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71,
];

export function hasJumbfSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 2) return false;

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 1) {
      if (bytes[offset] !== 0xff) break;
      const marker = (bytes[offset] << 8) | bytes[offset + 1];
      if (marker === 0xffd9) break;

      if (marker === JPEG_APP11_MARKER) {
        offset += 2;
        if (offset + 1 >= bytes.length) break;
        const segLen = ((bytes[offset] << 8) | bytes[offset + 1]) - 2;
        offset += 2;
        if (offset + segLen > bytes.length) break;
        if (segLen >= 4) {
          const b0 = bytes[offset];
          const b1 = bytes[offset + 1];
          const b2 = bytes[offset + 2];
          const b3 = bytes[offset + 3];
          if (
            (b0 === 0x4a && b1 === 0x50) ||
            (b0 === 0x6a && b1 === 0x75 && b2 === 0x6d && b3 === 0x62)
          ) {
            return true;
          }
        }
        offset += segLen;
        continue;
      }

      if (marker >= 0xffe0 && marker <= 0xffef) {
        offset += 2;
        if (offset + 1 >= bytes.length) break;
        const segLen = ((bytes[offset] << 8) | bytes[offset + 1]) - 2;
        offset += 2 + segLen;
        continue;
      }

      offset += 2;
    }
    return false;
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const chunkLen =
        (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      const chunkType = bytesToString(bytes.slice(offset + 4, offset + 8));
      offset += 8;
      if (chunkType === "c2pa" || chunkType === "jumb") return true;
      if (chunkType === "IEND") break;
      offset += chunkLen + 4;
    }
    return false;
  }

  return false;
}

let sdkInstance: Awaited<ReturnType<typeof loadSdk>> | null = null;

async function loadSdk() {
  const { createC2pa } = await import("@contentauth/c2pa-web");
  const wasmSrc = "/c2pa.wasm";
  const sdk = await createC2pa({ wasmSrc });
  return sdk;
}

async function getSdk() {
  if (!sdkInstance) {
    sdkInstance = await loadSdk();
  }
  return sdkInstance;
}

function extractSdkResult(manifest: import("@contentauth/c2pa-types").Manifest): C2PASdkResult {
  const claimGenInfo = manifest.claim_generator_info ?? [];
  const claimGeneratorInfo = claimGenInfo.map((info) => ({
    name: info.name,
    version: info.version ?? null,
  }));

  const actions: C2PASdkResult["actions"] = [];
  let digitalSourceType: string | null = null;

  if (manifest.assertions) {
    for (const assertion of manifest.assertions) {
      if (assertion.label === "c2pa.actions" || assertion.label.includes("actions")) {
        const data = assertion.data as Record<string, unknown> | undefined;
        if (data && Array.isArray(data.actions)) {
          for (const a of data.actions as Array<Record<string, unknown>>) {
            const action = String(a.action ?? "");
            const agent = a.softwareAgent != null ? String(a.softwareAgent) : null;
            const dst = a.digitalSourceType != null ? String(a.digitalSourceType) : null;
            actions.push({ action, softwareAgent: agent, digitalSourceType: dst });
            if (dst && !digitalSourceType) digitalSourceType = dst;
          }
        }
      }
      if (assertion.label.includes("stds.iptc.photoMetadata") || assertion.label.includes("digitalSourceType")) {
        const data = assertion.data as Record<string, unknown> | undefined;
        if (data?.digitalSourceType) {
          digitalSourceType = String(data.digitalSourceType);
        }
      }
    }
  }

  const sigInfo = manifest.signature_info;

  return {
    generatorName: claimGenInfo[0]?.name ?? manifest.claim_generator ?? null,
    generatorVersion: claimGenInfo[0]?.version ?? null,
    vendor: manifest.vendor ?? null,
    claimGeneratorInfo,
    digitalSourceType,
    actions,
    signatureIssuer: sigInfo?.issuer ?? null,
    signatureTime: sigInfo?.time ?? null,
    signatureAlg: sigInfo?.alg ?? null,
    validationState: null,
    thumbnailFormat: manifest.thumbnail?.format ?? null,
  };
}

function mapManifestToLegacy(
  manifest: import("@contentauth/c2pa-types").Manifest
): C2PAManifest {
  const assertions: C2PAAssertion[] = [];
  if (manifest.assertions) {
    for (const a of manifest.assertions) {
      assertions.push({
        label: a.label,
        data: a.data != null ? JSON.stringify(a.data) : null,
      });
    }
  }

  const genInfo = manifest.claim_generator_info?.[0];
  return {
    claimGenerator: genInfo?.name ?? manifest.claim_generator ?? null,
    signature: manifest.signature_info?.alg ?? null,
    issuer: manifest.signature_info?.issuer ?? null,
    assertions,
  };
}

export async function parseC2PA(input: ArrayBuffer): Promise<ParsedC2PA> {
  const bytes = new Uint8Array(input);

  if (!hasJumbfSignature(bytes)) {
    return { detected: false, manifests: [], rawSize: 0 };
  }

  try {
    const sdk = await getSdk();
    const mimeType = detectMimeType(bytes);
    const blob = new Blob([input], { type: mimeType });
    const reader = await sdk.reader.fromBlob(mimeType, blob);

    if (!reader) {
      return { detected: false, manifests: [], rawSize: 0 };
    }

    try {
      const manifestStore = await reader.manifestStore();
      const activeManifest = await reader.activeManifest();

      const sdkResult = extractSdkResult(activeManifest);
      sdkResult.validationState = manifestStore.validation_state ?? null;

      const manifests: C2PAManifest[] = [];
      if (manifestStore.manifests) {
        for (const [, m] of Object.entries(manifestStore.manifests)) {
          manifests.push(mapManifestToLegacy(m));
        }
      }

      return {
        detected: true,
        manifests,
        rawSize: input.byteLength,
        sdkResult,
      };
    } finally {
      await reader.free();
    }
  } catch {
    return parseC2PAFromBuffer(input);
  }
}

function detectMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "image/webp";
  return "application/octet-stream";
}

function parseC2PAFromBuffer(buffer: ArrayBuffer): ParsedC2PA {
  const bytes = new Uint8Array(buffer);
  const manifests: C2PAManifest[] = [];
  let rawSize = 0;
  let detected = false;

  if (bytes.length < 2) return { detected: false, manifests: [], rawSize: 0 };

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const result = scanJpegForC2PA(bytes);
    detected = result.detected;
    manifests.push(...result.manifests);
    rawSize = result.rawSize;
  } else if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const result = scanPngForC2PA(bytes);
    detected = result.detected;
    manifests.push(...result.manifests);
    rawSize = result.rawSize;
  }

  return { detected, manifests, rawSize };
}

function scanJpegForC2PA(bytes: Uint8Array): {
  detected: boolean;
  manifests: C2PAManifest[];
  rawSize: number;
} {
  const manifests: C2PAManifest[] = [];
  let rawSize = 0;
  let detected = false;
  const combinedPayload: Uint8Array[] = [];

  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) break;
    const marker = (bytes[offset] << 8) | bytes[offset + 1];

    if (marker === 0xffd9) break;

    if (marker === JPEG_APP11_MARKER) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]) - 2;
      offset += 2;
      if (offset + segLen > bytes.length) break;

      const segmentData = bytes.slice(offset, offset + segLen);
      rawSize += segLen;

      if (segmentData.length >= 2 &&
          segmentData[0] === 0x4A && segmentData[1] === 0x50) {
        combinedPayload.push(segmentData.slice(2));
      } else {
        combinedPayload.push(segmentData);
      }

      offset += segLen;
      continue;
    }

    if (marker >= 0xffe0 && marker <= 0xffef) {
      offset += 2;
      if (offset + 1 >= bytes.length) break;
      const segLen = ((bytes[offset] << 8) | bytes[offset + 1]) - 2;
      offset += 2 + segLen;
      continue;
    }

    offset += 2;
  }

  if (combinedPayload.length > 0) {
    const all = concatPayloads(combinedPayload);
    const jumbfResult = parseJumbfBox(all);
    if (jumbfResult.detected) {
      detected = true;
      manifests.push(...jumbfResult.manifests);
    }
  }

  return { detected, manifests, rawSize };
}

function concatPayloads(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    result.set(p, off);
    off += p.length;
  }
  return result;
}

const BOX_TYPE_JUMB = 0x6a756d62;
const BOX_TYPE_JUMD = 0x6a756d64;

function parseJumbfBox(data: Uint8Array): {
  detected: boolean;
  manifests: C2PAManifest[];
} {
  const manifests: C2PAManifest[] = [];
  let detected = false;
  let offset = 0;

  while (offset + 8 <= data.length) {
    const boxStart = offset;
    let boxLen = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    const boxType = (data[offset + 4] << 24) | (data[offset + 5] << 16) | (data[offset + 6] << 8) | data[offset + 7];
    offset += 8;

    let headerSize = 8;
    if (boxLen === 0) {
      boxLen = data.length - boxStart;
    } else if (boxLen === 1) {
      if (offset + 8 > data.length) break;
      boxLen = Number(
        (BigInt(data[offset]) << 56n) |
        (BigInt(data[offset + 1]) << 48n) |
        (BigInt(data[offset + 2]) << 40n) |
        (BigInt(data[offset + 3]) << 32n) |
        (BigInt(data[offset + 4]) << 24n) |
        (BigInt(data[offset + 5]) << 16n) |
        (BigInt(data[offset + 6]) << 8n) |
        BigInt(data[offset + 7])
      );
      offset += 8;
      headerSize = 16;
    }

    const contentStart = offset;
    const contentLen = Math.max(0, Math.min(boxLen - headerSize, data.length - contentStart));
    const contentEnd = contentStart + contentLen;

    if (boxType === BOX_TYPE_JUMB) {
      const inner = data.slice(contentStart, contentEnd);
      const innerResult = parseJumbfBox(inner);
      if (innerResult.detected) detected = true;
      manifests.push(...innerResult.manifests);
    } else if (boxType === BOX_TYPE_JUMD) {
      const result = parseJumbDescription(data.slice(contentStart, contentEnd));
      if (result) {
        detected = true;
        manifests.push(result);
      }
    }

    offset = contentEnd;
  }

  return { detected, manifests };
}

function parseJumbDescription(data: Uint8Array): C2PAManifest | null {
  const reader = BinaryReader.fromBytes(data);
  const manifests: C2PAManifest[] = [];
  let foundC2PA = false;

  while (reader.hasRemaining() && reader.remaining() >= 8) {
    const boxStart = reader.position;
    let boxLen = reader.readUint32();
    const boxType = reader.readUint32();

    if (boxLen === 0) boxLen = data.length - boxStart;
    if (boxLen === 1) {
      if (reader.remaining() < 8) break;
      const hi = BigInt(reader.readUint32());
      const lo = BigInt(reader.readUint32());
      boxLen = Number((hi << 32n) | lo);
    }

    const contentStart = reader.position;
    const contentLen = Math.min(boxLen - (reader.position - boxStart), reader.remaining());

    if (boxType === 0x75756964) {
      const uuidBytes = data.slice(contentStart, contentStart + Math.min(16, contentLen));
      if (uuidBytes.length === 16) {
        let match = true;
        for (let i = 0; i < 16; i++) {
          if (uuidBytes[i] !== C2PA_UUID_BYTES[i]) {
            match = false;
            break;
          }
        }
        if (match) foundC2PA = true;
      }
    } else if (boxType === 0x6c626c20) {
      const labelData = data.slice(contentStart, contentStart + contentLen);
      const label = bytesToString(labelData);
      if (label.toLowerCase() === "c2pa") foundC2PA = true;
    } else if (boxType === 0x6a736f6e) {
      const assertions = parseC2PAAssertionsFromJson(
        bytesToString(data.slice(contentStart, contentStart + contentLen))
      );
      manifests.push({
        claimGenerator: null,
        signature: null,
        issuer: null,
        assertions,
      });
    }

    reader.seek(contentStart + contentLen);
  }

  if (foundC2PA) {
    return {
      claimGenerator: null,
      signature: null,
      issuer: null,
      assertions: manifests.flatMap((m) => m.assertions),
    };
  }

  return null;
}

function parseC2PAAssertionsFromJson(json: string): C2PAAssertion[] {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const assertions: C2PAAssertion[] = [];
    if (Array.isArray(parsed.assertions)) {
      for (const a of parsed.assertions as Array<Record<string, unknown>>) {
        assertions.push({
          label: String(a.label ?? a.type ?? "unknown"),
          data: a.data != null ? JSON.stringify(a.data) : null,
        });
      }
    }
    return assertions;
  } catch {
    return [];
  }
}

function scanPngForC2PA(bytes: Uint8Array): {
  detected: boolean;
  manifests: C2PAManifest[];
  rawSize: number;
} {
  const manifests: C2PAManifest[] = [];
  let rawSize = 0;
  let detected = false;
  let offset = 8;

  while (offset + 12 <= bytes.length) {
    const chunkLen = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const chunkType = bytesToString(bytes.slice(offset + 4, offset + 8));
    offset += 8;

    if (chunkType === "c2pa") {
      const chunkData = bytes.slice(offset, offset + chunkLen);
      const result = parseJumbfBox(chunkData);
      if (result.detected) {
        detected = true;
        manifests.push(...result.manifests);
        rawSize += chunkLen;
      }
    } else if (chunkType === "IEND") {
      break;
    }

    offset += chunkLen + 4;
  }

  return { detected, manifests, rawSize };
}

export { parseC2PAFromBuffer };
