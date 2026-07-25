export interface ExifGPS {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  latitudeRef: string | null;
  longitudeRef: string | null;
}

export interface ExifDevice {
  make: string | null;
  model: string | null;
  lensMake: string | null;
  lensModel: string | null;
  serialNumber: string | null;
}

export interface ExifImage {
  width: number | null;
  height: number | null;
  orientation: number | null;
  colorSpace: number | null;
  bitsPerSample: number | null;
}

export interface ExifCapture {
  iso: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  focalLength: number | null;
  focalLength35mm: number | null;
  flash: number | null;
  exposureProgram: number | null;
  meteringMode: number | null;
  whiteBalance: number | null;
}

export interface ExifTimestamps {
  dateTimeOriginal: string | null;
  dateTimeDigitized: string | null;
  offsetTime: string | null;
  offsetTimeOriginal: string | null;
  offsetTimeDigitized: string | null;
}

export interface ParsedExif {
  gps: ExifGPS;
  device: ExifDevice;
  image: ExifImage;
  capture: ExifCapture;
  timestamps: ExifTimestamps;
  software: string | null;
  artist: string | null;
  copyright: string | null;
  userComment: string | null;
  imageDescription: string | null;
  processingSoftware: string | null;
  hostComputer: string | null;
  raw: Record<string, unknown> | null;
}

export interface ParsedIptc {
  caption: string | null;
  headline: string | null;
  keywords: string[];
  copyrightNotice: string | null;
  creditLine: string | null;
  source: string | null;
  byline: string | null;
  bylineTitle: string | null;
  city: string | null;
  provinceState: string | null;
  country: string | null;
  countryCode: string | null;
  category: string | null;
  supplementalCategories: string[];
  urgency: number | null;
  raw: Record<string, unknown> | null;
}

export interface ParsedXmp {
  creator: string | null;
  creatorTool: string | null;
  description: string | null;
  rights: string | null;
  title: string | null;
  createDate: string | null;
  modifyDate: string | null;
  rating: number | null;
  label: string | null;
  raw: Record<string, unknown> | null;
}

export interface C2PAAssertion {
  label: string;
  data: string | null;
}

export interface C2PAManifest {
  claimGenerator: string | null;
  signature: string | null;
  issuer: string | null;
  assertions: C2PAAssertion[];
}

export interface ParsedC2PA {
  detected: boolean;
  manifests: C2PAManifest[];
  rawSize: number;
  sdkResult?: C2PASdkResult;
}

export interface C2PASdkResult {
  generatorName: string | null;
  generatorVersion: string | null;
  vendor: string | null;
  claimGeneratorInfo: Array<{ name: string; version: string | null }>;
  digitalSourceType: string | null;
  actions: Array<{ action: string; softwareAgent: string | null; digitalSourceType: string | null }>;
  signatureIssuer: string | null;
  signatureTime: string | null;
  signatureAlg: string | null;
  validationState: string | null;
  thumbnailFormat: string | null;
}

export type AIDetectionSource =
  | "c2pa"
  | "png-text-chunk"
  | "exif-usercomment"
  | "exif-software"
  | "xmp";

export interface AIDetectionFlag {
  source: AIDetectionSource;
  confidence: "high" | "medium" | "low";
  description: string;
  params: Record<string, string> | null;
}

export type AIVerdict = "confirmed" | "likely" | "inconclusive" | "none";

export interface AIEvidenceItem {
  source: AIDetectionSource | "ml-model" | "c2pa-sdk";
  description: string;
  details?: string;
}

export interface AIAnalysisResult {
  isAIGenerated: boolean;
  flags: AIDetectionFlag[];
  verdict: AIVerdict;
  generator?: string;
  model?: string;
  signedBy?: string;
  date?: string;
  confidence: number;
  evidence: AIEvidenceItem[];
  mlProbability?: number;
}

export interface ImageMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  exif: ParsedExif | null;
  iptc: ParsedIptc | null;
  xmp: ParsedXmp | null;
  c2pa: ParsedC2PA | null;
  aiAnalysis: AIAnalysisResult;
}

export type StripCategoryId =
  | "all"
  | "exif"
  | "iptc"
  | "xmp"
  | "ai-signature"
  | "copyright";

export interface StripCategory {
  id: StripCategoryId;
  defaultEnabled: boolean;
}

export type AppPhase = "idle" | "uploaded" | "processing" | "stripping" | "done";

export interface ExifrOutput {
  data: Record<string, unknown>;
  [key: string]: unknown;
}
