"use client";

import { Sparkle } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import type { AIAnalysisResult, AIDetectionFlag } from "@/features/metadata-parser/types";

interface AIBadgeProps {
  aiAnalysis: AIAnalysisResult;
}

function flagColor(confidence: AIDetectionFlag["confidence"]): string {
  switch (confidence) {
    case "high": return "#00e5a0";
    case "medium": return "#f0c040";
    case "low": return "#888888";
  }
}

function confidenceLabel(confidence: AIDetectionFlag["confidence"], t: (k: string) => string): string {
  switch (confidence) {
    case "high": return t("summary.high");
    case "medium": return t("summary.medium");
    case "low": return t("summary.low");
  }
}

export function AIBadge({ aiAnalysis }: AIBadgeProps) {
  const { t } = useI18n();

  if (!aiAnalysis.isAIGenerated) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222222] text-xs text-[#555555]">
        <Sparkle size={14} color="#555555" weight="thin" />
        {t("summary.aiNotDetected")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00e5a040] bg-[#00e5a006] text-xs text-[#00e5a0] font-medium">
        <Sparkle size={14} color="#00e5a0" weight="thin" />
        {t("summary.aiDetected")}
      </div>

      {aiAnalysis.flags.length > 0 && (
        <div className="space-y-1.5">
          {aiAnalysis.flags.map((flag, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]"
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: flagColor(flag.confidence) }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-[#cccccc] leading-relaxed">
                    {flag.description}
                  </p>
                  <span className="text-[10px] text-[#555555] uppercase tracking-wider">
                    · {confidenceLabel(flag.confidence, t)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#444444] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-[#111111]">
                    {flag.source}
                  </span>
                  {flag.params && Object.keys(flag.params).length > 0 && (
                    <span className="text-[10px] text-[#555555]">
                      {Object.keys(flag.params)[0]}: {String(Object.values(flag.params)[0]).substring(0, 60)}
                    </span>
                  )}
                </div>
                {flag.params && Object.keys(flag.params).length > 1 && (
                  <pre className="mt-2 p-2 rounded bg-[#080808] text-[10px] text-[#555555] overflow-x-auto max-h-20 leading-relaxed font-mono border border-[#111111]">
                    {JSON.stringify(flag.params, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
