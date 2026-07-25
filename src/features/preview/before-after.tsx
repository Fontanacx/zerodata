"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { formatFileSize } from "@/lib/file-utils";
import type { ImageMetadata } from "@/features/metadata-parser/types";
import { SummaryCard } from "./summary-card";
import { MetadataTable } from "./metadata-table";

interface BeforeAfterProps {
  metadata: ImageMetadata;
  cleanedBuffer: ArrayBuffer | null;
}

export function BeforeAfter({ metadata, cleanedBuffer }: BeforeAfterProps) {
  const { t } = useI18n();

  const stats = useMemo(() => {
    const originalSize = metadata.fileSize;
    const cleanedSize = cleanedBuffer?.byteLength ?? 0;
    const reduction = originalSize - cleanedSize;
    const pct = originalSize > 0 ? ((reduction / originalSize) * 100).toFixed(1) : "0";
    return { originalSize, cleanedSize, reduction, pct };
  }, [metadata.fileSize, cleanedBuffer]);

  return (
    <div className="space-y-8">
      <SummaryCard metadata={metadata} />

      <div>
        <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider mb-3">
          {t("metadata.inspection")}
        </h2>
        <MetadataTable metadata={metadata} />
      </div>

      {cleanedBuffer && (
        <div className="animate-fade-in">
          <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider mb-3">
            {t("metadata.stripResult")}
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
              <p className="text-[10px] text-[#777777] uppercase tracking-wider">{t("metadata.originalSize")}</p>
              <p className="text-sm text-[#cccccc] mt-1.5 font-mono">{formatFileSize(stats.originalSize)}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
              <p className="text-[10px] text-[#777777] uppercase tracking-wider">{t("metadata.cleanedSize")}</p>
              <p className="text-sm text-[#00e5a0] mt-1.5 font-mono">{formatFileSize(stats.cleanedSize)}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]">
              <p className="text-[10px] text-[#777777] uppercase tracking-wider">{t("metadata.bytesRemoved")}</p>
              <p className="text-sm text-[#00e5a0] mt-1.5 font-mono">
                {formatFileSize(stats.reduction)} ({stats.pct}%)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
