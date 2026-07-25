"use client";

import { useState, useCallback, useMemo } from "react";
import { ShieldCheck, ArrowLeft } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import { UploadZone } from "@/features/upload/upload-zone";
import type { ReadFileResult } from "@/features/upload/file-reader";
import { BeforeAfter } from "@/features/preview/before-after";
import { StripPanel } from "@/features/strip-options/strip-panel";
import { DownloadButton } from "@/features/download/download-button";
import { getDefaultSelection } from "@/features/strip-options/strip-categories";
import { AiVerdictCard } from "@/features/preview/ai-verdict-card";
import { useMlDetector } from "@/features/ai-ml-detector/use-ml-detector";
import {
  parseExif,
  parseIptc,
  parseXmp,
  parseC2PA,
  detectAIGeneration,
} from "@/features/metadata-parser";
import { stripMetadata } from "@/features/metadata-stripper";
import type { ImageMetadata, StripCategoryId, AppPhase } from "@/features/metadata-parser/types";
import { formatFileSize } from "@/lib/file-utils";

export default function HomePage() {
  const { t } = useI18n();

  const [phase, setPhase] = useState<AppPhase>("idle");
  const [fileInfo, setFileInfo] = useState<ReadFileResult | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [selectedCategories, setSelectedCategories] =
    useState<Set<StripCategoryId>>(getDefaultSelection());
  const [cleanedBuffer, setCleanedBuffer] = useState<ArrayBuffer | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mlDetector = useMlDetector();

  const handleFileRead = useCallback(async (result: ReadFileResult) => {
    setError(null);
    setFileInfo(result);
    setPhase("processing");
    setCleanedBuffer(null);

    try {
      const buffer = result.buffer;
      const rawBuffer = new Uint8Array(buffer).buffer;

      const [exif, iptc, xmp, c2pa] = await Promise.all([
        parseExif(buffer).catch(() => null),
        parseIptc(buffer).catch(() => null),
        parseXmp(buffer).catch(() => null),
        parseC2PA(rawBuffer).catch(() => null),
      ]);

      const aiAnalysis = detectAIGeneration(exif, xmp, c2pa, rawBuffer);

      setMetadata({
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        exif,
        iptc,
        xmp,
        c2pa,
        aiAnalysis,
      });

      setPhase("uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.parseFailed"));
      setPhase("idle");
    }
  }, [t]);

  const handleDeepScan = useCallback(async () => {
    if (!fileInfo || !metadata) return;

    try {
      if (mlDetector.status !== "ready") {
        await mlDetector.loadModel();
      }

      const updated = await mlDetector.classify(fileInfo.buffer, metadata.aiAnalysis);
      setMetadata((prev) => prev ? { ...prev, aiAnalysis: updated } : null);
    } catch {
    }
  }, [fileInfo, metadata, mlDetector]);

  const handleStrip = useCallback(async () => {
    if (!fileInfo || !metadata) return;
    setIsStripping(true);
    setPhase("stripping");

    try {
      await new Promise((r) => requestAnimationFrame(r));

      const result = stripMetadata(fileInfo.buffer, fileInfo.mimeType, {
        categories: selectedCategories,
      });

      setCleanedBuffer(result.cleanedBuffer);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.parseFailed"));
      setPhase("uploaded");
    } finally {
      setIsStripping(false);
    }
  }, [fileInfo, metadata, selectedCategories, t]);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setFileInfo(null);
    setMetadata(null);
    setCleanedBuffer(null);
    setError(null);
    setSelectedCategories(getDefaultSelection());
  }, []);

  const hasMetadata = useMemo(() => {
    if (!metadata) return false;
    return (
      metadata.exif !== null ||
      metadata.iptc !== null ||
      metadata.xmp !== null ||
      metadata.c2pa?.detected === true
    );
  }, [metadata]);

  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main-content" className="skip-to-content">
        {t("reset.tooltip")}
      </a>

      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-6 py-10 pb-6 w-full">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              {t("app.title")}
            </h1>
            <p className="text-xs text-[#777777] mt-1 tracking-wide">
              {t("app.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#666666] uppercase tracking-widest">
            <ShieldCheck size={14} color="#00e5a0" weight="thin" />
            {t("app.privacy")}
          </div>
        </header>

        {error && (
          <div className="mb-8 p-4 rounded-lg border border-red-400/20 bg-[#ef444408]" role="alert" aria-live="assertive">
            <p className="text-sm text-red-400/90">{error}</p>
            <button
              onClick={handleReset}
              className="mt-2 text-xs text-red-400 underline hover:text-red-300 transition-colors"
            >
              {t("error.tryAgain")}
            </button>
          </div>
        )}

        {phase === "idle" && (
          <div className="animate-fade-in">
            <UploadZone onFileRead={handleFileRead} disabled={false} />
          </div>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="w-6 h-6 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#777777]">{t("processing.parsing")}</p>
          </div>
        )}

        {(phase === "uploaded" || phase === "stripping" || phase === "done") &&
          metadata &&
          fileInfo && (
            <div className="animate-fade-in space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={handleReset}
                    className="p-2.5 rounded-lg hover:bg-[#141414] transition-colors duration-150 shrink-0"
                    aria-label={t("reset.tooltip")}
                  >
                    <ArrowLeft size={18} color="#888888" weight="regular" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm text-[#cccccc] font-medium truncate max-w-[500px]">
                      {fileInfo.fileName}
                    </p>
                    <p className="text-[11px] text-[#777777]">
                      {formatFileSize(fileInfo.fileSize)} &middot;{" "}
                      {fileInfo.mimeType.split("/")[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <AiVerdictCard
                aiAnalysis={metadata.aiAnalysis}
                mlState={{
                  status: mlDetector.status,
                  progress: mlDetector.progress,
                  progressMessage: mlDetector.progressMessage,
                  probability: mlDetector.probability,
                  error: mlDetector.error,
                }}
                onDeepScan={handleDeepScan}
              />

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <BeforeAfter metadata={metadata} cleanedBuffer={cleanedBuffer} />
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <StripPanel
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    onStrip={handleStrip}
                    isStripping={isStripping}
                    hasMetadata={hasMetadata}
                    disabled={false}
                  />

                  {phase === "done" && cleanedBuffer && (
                    <div className="animate-fade-in">
                      <DownloadButton
                        buffer={cleanedBuffer}
                        originalFileName={fileInfo.fileName}
                        mimeType={fileInfo.mimeType}
                        disabled={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </main>

      <footer className="border-t border-[#1a1a1a] bg-[#060606] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <a
            href="https://fontanacdev.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <span className="text-sm font-semibold text-white tracking-tight group-hover:text-[#00e5a0] transition-colors">
              ZeroData
            </span>
            <span className="text-xs text-[#777777] group-hover:text-[#aaaaaa] transition-colors">
              {t("footer.developed")}{" "}
              <span className="text-[#aaaaaa] font-medium group-hover:text-white transition-colors">
                Fontanac
              </span>
              <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#00e5a0]">
                &#8599;
              </span>
            </span>
          </a>

          <div className="flex items-center gap-5 text-xs text-[#777777]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} color="#00e5a0" weight="thin" />
              {t("footer.noTelemetry")}
            </span>
            <span>{t("footer.openSource")}</span>
            <span className="text-[#666666]">&copy; {new Date().getFullYear()}</span>
          </div>

          <p className="text-[11px] text-[#666666] max-w-md text-center sm:text-right leading-relaxed">
            {t("footer.deepScanPrivacy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
