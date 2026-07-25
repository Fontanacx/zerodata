/**
 * AI generation metadata detection.
 *
 * Scans metadata from multiple sources to detect if an image was AI-generated:
 *
 * 1. C2PA/JUMBF manifests: if a valid C2PA manifest exists, the image has
 *    provenance data. Check assertions for "stds.schema-org.CreativeWork"
 *    or similar that mention AI tools.
 *
 * 2. PNG tEXt/iTXt chunks: Stable Diffusion, Automatic1111, ComfyUI, and
 *    other AI tools embed generation parameters as PNG text chunks.
 *    Common keywords: "parameters", "prompt", "negative_prompt",
 *    "sd-metadata", "comfy", "workflow"
 *
 * 3. EXIF UserComment: Some tools (e.g., Midjourney, early SD tools)
 *    store generation parameters in EXIF UserComment as JSON or key-value text.
 *
 * 4. XMP metadata: Adobe Firefly and other tools may store AI generation
 *    info in XMP namespaces like xmpMM:DerivedFrom or custom namespaces.
 */

import type {
  AIDetectionFlag,
  AIAnalysisResult,
  AIVerdict,
  AIEvidenceItem,
  ParsedC2PA,
  ParsedExif,
  ParsedXmp,
} from "./types";
import { bytesToString } from "@/lib/binary-reader";

const AI_GENERATOR_PATTERNS: Record<string, string> = {
  "openai": "OpenAI",
  "dall-e": "OpenAI",
  "dalle": "OpenAI",
  "google": "Google",
  "gemini": "Google",
  "imagen": "Google",
  "adobe": "Adobe",
  "firefly": "Adobe",
  "microsoft": "Microsoft",
  "copilot": "Microsoft",
  "midjourney": "Midjourney",
  "stability": "Stability AI",
  "stable-diffusion": "Stability AI",
  "meta": "Meta",
  "flux": "Black Forest Labs",
};

const AI_DIGITAL_SOURCE_TYPES = [
  "trainedAlgorithmicMedia",
  "compositeWithTrainedAlgorithmicMedia",
  "algorithmicMedia",
  "trainedAlgorithmicData",
  "digitalArt",
  "digitalCreation",
];

const PNG_TEXT_AI_KEYWORDS = [
  "parameters",
  "prompt",
  "negative_prompt",
  "sd-metadata",
  "comfy",
  "workflow",
  "invokeai_metadata",
  "a1111",
  "stable-diffusion",
  "midjourney",
];

const EXIF_AI_PATTERNS: { pattern: RegExp; tool: string }[] = [
  { pattern: /midjourney/i, tool: "Midjourney" },
  { pattern: /dall[-\s]?e/i, tool: "DALL-E" },
  { pattern: /stable[-\s]?diffusion/i, tool: "Stable Diffusion" },
  { pattern: /comfyui/i, tool: "ComfyUI" },
  { pattern: /automatic1111/i, tool: "Automatic1111" },
  { pattern: /invokeai/i, tool: "InvokeAI" },
  { pattern: /firefly/i, tool: "Adobe Firefly" },
  { pattern: /copilot/i, tool: "Microsoft Copilot" },
  { pattern: /gemini/i, tool: "Google Gemini" },
  { pattern: /imagen/i, tool: "Google Imagen" },
  { pattern: /flux/i, tool: "Flux" },
];

const XMP_AI_TOOLS = ["Firefly", "Adobe Firefly", "DALL-E", "Midjourney"];

export function detectAIGeneration(
  exif: ParsedExif | null,
  xmp: ParsedXmp | null,
  c2pa: ParsedC2PA | null,
  rawBuffer: ArrayBuffer
): AIAnalysisResult {
  const flags: AIDetectionFlag[] = [];
  const evidence: AIEvidenceItem[] = [];
  let verdict: AIVerdict = "none";
  let generator: string | undefined;
  let model: string | undefined;
  let signedBy: string | undefined;
  let date: string | undefined;
  let confidence = 0;

  if (c2pa?.detected && c2pa.sdkResult) {
    const sdk = c2pa.sdkResult;
    const hasAiSourceType = sdk.digitalSourceType
      ? AI_DIGITAL_SOURCE_TYPES.some((t) => sdk.digitalSourceType!.includes(t))
      : false;
    const hasAiActions = sdk.actions.some(
      (a) =>
        a.digitalSourceType &&
        AI_DIGITAL_SOURCE_TYPES.some((t) => a.digitalSourceType!.includes(t))
    );
    const generatorName = sdk.generatorName ?? sdk.vendor;
    const knownGenerator = generatorName
      ? Object.entries(AI_GENERATOR_PATTERNS).find(([k]) =>
          generatorName.toLowerCase().includes(k)
        )?.[1]
      : undefined;

    if (hasAiSourceType || hasAiActions || knownGenerator) {
      verdict = "confirmed";
      generator = knownGenerator ?? generatorName ?? undefined;
      signedBy = sdk.signatureIssuer ?? undefined;
      date = sdk.signatureTime ?? undefined;
      confidence = 0.95;

      if (hasAiSourceType) {
        evidence.push({
          source: "c2pa-sdk",
          description: `C2PA manifest declares digitalSourceType: ${sdk.digitalSourceType}`,
        });
      }
      if (generatorName) {
        evidence.push({
          source: "c2pa-sdk",
          description: `Claim generator: ${generatorName}${sdk.generatorVersion ? ` v${sdk.generatorVersion}` : ""}`,
        });
      }
      if (sdk.signatureIssuer) {
        evidence.push({
          source: "c2pa-sdk",
          description: `Cryptographically signed by: ${sdk.signatureIssuer}`,
        });
      }

      flags.push({
        source: "c2pa",
        confidence: "high",
        description: `C2PA manifest confirms AI generation${generator ? ` by ${generator}` : ""}`,
        params: {
          generator: generatorName ?? "",
          digitalSourceType: sdk.digitalSourceType ?? "",
          issuer: sdk.signatureIssuer ?? "",
        },
      });
    } else if (sdk.validationState !== "Invalid") {
      verdict = "likely";
      confidence = 0.7;
      generator = generatorName ?? undefined;
      evidence.push({
        source: "c2pa-sdk",
        description: "C2PA provenance manifest found (content authenticity verified)",
      });
      flags.push({
        source: "c2pa",
        confidence: "medium",
        description: "C2PA provenance manifest detected (content authenticity verified)",
        params: null,
      });
    }
  } else if (c2pa?.detected) {
    const aiAssertions = c2pa.manifests.flatMap((m) =>
      m.assertions.filter(
        (a) =>
          a.label.toLowerCase().includes("creativework") ||
          a.label.toLowerCase().includes("ai") ||
          a.label.toLowerCase().includes("generated") ||
          a.label.toLowerCase().includes("trained")
      )
    );
    if (aiAssertions.length > 0) {
      verdict = "likely";
      confidence = 0.75;
      evidence.push({
        source: "c2pa",
        description: `C2PA manifest with ${aiAssertions.length} AI-related assertion(s)`,
      });
      flags.push({
        source: "c2pa",
        confidence: "high",
        description: `C2PA manifest with ${aiAssertions.length} AI-related assertion(s)`,
        params: Object.fromEntries(
          aiAssertions.map((a) => [a.label, a.data ?? ""])
        ),
      });
    } else {
      evidence.push({
        source: "c2pa",
        description: "C2PA provenance manifest detected (content authenticity verified)",
      });
      flags.push({
        source: "c2pa",
        confidence: "medium",
        description: "C2PA provenance manifest detected (content authenticity verified)",
        params: null,
      });
    }
  }

  const pngAiChunks = scanPngTextChunks(rawBuffer);
  if (pngAiChunks.length > 0) {
    const params: Record<string, string> = {};
    for (const chunk of pngAiChunks) {
      let value = chunk.value;
      if (value.length > 500) {
        const newlineIdx = value.indexOf("\n");
        value = newlineIdx > 0 ? value.substring(0, newlineIdx) + "..." : value.substring(0, 500) + "...";
      }
      params[chunk.keyword] = value;
    }

    if (verdict !== "confirmed") {
      verdict = "likely";
      confidence = Math.max(confidence, 0.8);
      const detectedTool = detectToolFromParams(params);
      if (detectedTool) {
        generator = detectedTool;
        model = detectedTool;
      }
    }

    evidence.push({
      source: "png-text-chunk",
      description: `AI generation parameters found in PNG text chunk: ${pngAiChunks.map((c) => c.keyword).join(", ")}`,
    });

    flags.push({
      source: "png-text-chunk",
      confidence: "high",
      description: `AI generation parameters found in PNG text chunk: ${pngAiChunks.map((c) => c.keyword).join(", ")}`,
      params,
    });
  }

  if (exif?.userComment) {
    for (const { pattern, tool } of EXIF_AI_PATTERNS) {
      if (pattern.test(exif.userComment)) {
        if (verdict !== "confirmed") {
          verdict = "likely";
          confidence = Math.max(confidence, 0.8);
          if (!generator) generator = tool;
        }
        evidence.push({
          source: "exif-usercomment",
          description: `AI tool detected in EXIF UserComment: ${tool}`,
        });
        flags.push({
          source: "exif-usercomment",
          confidence: "high",
          description: `AI tool detected in EXIF UserComment: ${tool}`,
          params: { tool, userComment: exif.userComment.substring(0, 300) },
        });
        break;
      }
    }
  }

  if (exif?.software) {
    for (const { pattern, tool } of EXIF_AI_PATTERNS) {
      if (pattern.test(exif.software)) {
        if (verdict !== "confirmed") {
          verdict = "likely";
          confidence = Math.max(confidence, 0.75);
          if (!generator) generator = tool;
        }
        evidence.push({
          source: "exif-software",
          description: `AI tool detected in Software tag: ${tool}`,
        });
        flags.push({
          source: "exif-software",
          confidence: "medium",
          description: `AI tool detected in Software tag: ${tool}`,
          params: { tool, software: exif.software },
        });
        break;
      }
    }
  }

  if (xmp?.creatorTool) {
    for (const tool of XMP_AI_TOOLS) {
      if (xmp.creatorTool.toLowerCase().includes(tool.toLowerCase())) {
        if (verdict !== "confirmed") {
          verdict = "likely";
          confidence = Math.max(confidence, 0.8);
          if (!generator) generator = tool;
        }
        evidence.push({
          source: "xmp",
          description: `AI tool detected in XMP CreatorTool: ${tool}`,
        });
        flags.push({
          source: "xmp",
          confidence: "high",
          description: `AI tool detected in XMP CreatorTool: ${tool}`,
          params: { tool, creatorTool: xmp.creatorTool },
        });
        break;
      }
    }
  }

  return {
    isAIGenerated: flags.length > 0,
    flags,
    verdict,
    generator,
    model,
    signedBy,
    date,
    confidence,
    evidence,
  };
}

function detectToolFromParams(params: Record<string, string>): string | null {
  const allValues = Object.values(params).join(" ").toLowerCase();
  for (const [pattern, name] of Object.entries(AI_GENERATOR_PATTERNS)) {
    if (allValues.includes(pattern)) return name;
  }
  if (allValues.includes("parameters") && allValues.includes("steps")) return "Stable Diffusion";
  if (allValues.includes("comfyui")) return "ComfyUI";
  return null;
}

export function applyMlResult(
  current: AIAnalysisResult,
  probability: number
): AIAnalysisResult {
  const result = { ...current, mlProbability: probability };

  if (current.verdict === "confirmed") {
    if (probability < 0.5) {
      result.evidence = [
        ...current.evidence,
        {
          source: "ml-model" as const,
          description: `ML model disagrees (${(probability * 100).toFixed(0)}% AI probability)`,
        },
      ];
    }
    return result;
  }

  if (probability >= 0.8) {
    result.verdict = "likely";
    result.confidence = Math.max(current.confidence, probability);
    result.evidence = [
      ...current.evidence,
      {
        source: "ml-model" as const,
        description: `ML model detected AI-generated content (${(probability * 100).toFixed(0)}% confidence)`,
      },
    ];
  } else if (probability >= 0.5) {
    result.evidence = [
      ...current.evidence,
      {
        source: "ml-model" as const,
        description: `ML model inconclusive (${(probability * 100).toFixed(0)}% — may be AI-generated)`,
      },
    ];
    if (result.verdict === "none") {
      result.verdict = "inconclusive";
      result.confidence = probability;
    }
  } else {
    result.evidence = [
      ...current.evidence,
      {
        source: "ml-model" as const,
        description: `ML model: low AI probability (${(probability * 100).toFixed(0)}%)`,
      },
    ];
  }

  return result;
}

interface PngTextChunk {
  keyword: string;
  value: string;
}

function scanPngTextChunks(buffer: ArrayBuffer): PngTextChunk[] {
  const bytes = new Uint8Array(buffer);
  const chunks: PngTextChunk[] = [];

  if (bytes.length < 8) return chunks;
  if (
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) return chunks;

  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const chunkLen =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const chunkType = bytesToString(bytes.slice(offset + 4, offset + 8));
    offset += 8;

    if (chunkType === "IEND") break;

    if (chunkType === "tEXt" || chunkType === "iTXt" || chunkType === "zTXt") {
      const chunkData = bytes.slice(offset, offset + chunkLen);
      const nullIdx = chunkData.indexOf(0);
      if (nullIdx === -1) {
        offset += chunkLen + 4;
        continue;
      }

      const keyword = bytesToString(chunkData.slice(0, nullIdx));
      const keywordLower = keyword.toLowerCase();
      const isAI = PNG_TEXT_AI_KEYWORDS.some((k) => keywordLower.includes(k));
      if (!isAI) {
        offset += chunkLen + 4;
        continue;
      }

      let value = "";

      if (chunkType === "tEXt") {
        value = bytesToString(chunkData.slice(nullIdx + 1));
      } else if (chunkType === "zTXt") {
        value = decompressZtxt(chunkData, nullIdx);
      } else if (chunkType === "iTXt") {
        value = parseItxtValue(chunkData, nullIdx);
      }

      if (value) {
        if (value.length > 500) {
          const newlineIdx = value.indexOf("\n");
          value = newlineIdx > 0 ? value.substring(0, newlineIdx) + "..." : value.substring(0, 500) + "...";
        }
        chunks.push({ keyword, value });
      }
    }

    offset += chunkLen + 4;
  }

  return chunks;
}

function parseItxtValue(data: Uint8Array, keywordEnd: number): string {
  let pos = keywordEnd + 1;
  if (pos >= data.length) return "";

  const compressionFlag = data[pos];
  pos += 1;
  if (pos >= data.length) return "";

  const compressionMethod = data[pos];
  pos += 1;
  if (pos >= data.length) return "";

  const langEnd = data.indexOf(0, pos);
  if (langEnd === -1) return "";
  pos = langEnd + 1;

  const transEnd = data.indexOf(0, pos);
  if (transEnd === -1) return "";
  pos = transEnd + 1;

  if (pos >= data.length) return "";

  const textBytes = data.slice(pos);

  if (compressionFlag === 1 && compressionMethod === 0) {
    return "[decompressed async — not decoded]";
  }

  return bytesToString(textBytes);
}

function decompressZtxt(data: Uint8Array, keywordEnd: number): string {
  let pos = keywordEnd + 1;
  if (pos >= data.length) return "";

  const compressionMethod = data[pos];
  pos += 1;
  if (pos >= data.length) return "";

  if (compressionMethod === 0) {
    return "[decompressed async — not decoded]";
  }

  return "";
}
