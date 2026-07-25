"use client";

import { useState } from "react";
import {
  Sparkle,
  CaretDown,
  CaretRight,
  SealCheck,
  Warning,
  MagnifyingGlass,
  Question,
} from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import type { AIAnalysisResult } from "@/features/metadata-parser/types";
import type { MlDetectorState } from "@/features/ai-ml-detector/use-ml-detector";

interface AiVerdictCardProps {
  aiAnalysis: AIAnalysisResult;
  mlState: MlDetectorState;
  onDeepScan: () => void;
}

function verdictColor(verdict: AIAnalysisResult["verdict"]): string {
  switch (verdict) {
    case "confirmed": return "#3b82f6";
    case "likely": return "#f59e0b";
    case "inconclusive": return "#6b7280";
    case "none": return "#777777";
  }
}

function verdictBg(verdict: AIAnalysisResult["verdict"]): string {
  switch (verdict) {
    case "confirmed": return "#3b82f610";
    case "likely": return "#f59e0b08";
    case "inconclusive": return "#6b728008";
    case "none": return "#77777708";
  }
}

function verdictBorder(verdict: AIAnalysisResult["verdict"]): string {
  switch (verdict) {
    case "confirmed": return "#3b82f640";
    case "likely": return "#f59e0b30";
    case "inconclusive": return "#6b728030";
    case "none": return "#2a2a2a";
  }
}

function VerdictIcon({ verdict }: { verdict: AIAnalysisResult["verdict"] }) {
  const color = verdictColor(verdict);
  switch (verdict) {
    case "confirmed": return <SealCheck size={18} color={color} weight="thin" />;
    case "likely": return <Warning size={18} color={color} weight="thin" />;
    case "inconclusive": return <Question size={18} color={color} weight="thin" />;
    case "none": return <Sparkle size={18} color={color} weight="thin" />;
  }
}

export function AiVerdictCard({ aiAnalysis, mlState, onDeepScan }: AiVerdictCardProps) {
  const { t } = useI18n();
  const [showEvidence, setShowEvidence] = useState(false);

  const { verdict, generator, signedBy, evidence, mlProbability } = aiAnalysis;
  const color = verdictColor(verdict);
  const bg = verdictBg(verdict);
  const border = verdictBorder(verdict);

  const badgeText = t(`ai.verdict.${verdict}`);

  let subtitle = "";
  if (verdict === "confirmed" && generator) {
    subtitle = signedBy
      ? t("ai.verdict.confirmedSigned").replace("{generator}", generator).replace("{signer}", signedBy)
      : t("ai.verdict.confirmedGenerator").replace("{generator}", generator);
  } else if (verdict === "likely" && mlProbability != null && mlProbability >= 0.8) {
    subtitle = t("ai.verdict.likelyPercent").replace("{percent}", Math.round(mlProbability * 100).toString());
  } else if (verdict === "likely" && generator) {
    subtitle = t("ai.verdict.likelyTool").replace("{tool}", generator);
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ backgroundColor: bg, borderColor: border }}
      aria-live="polite"
      role="region"
      aria-label={t("ai.sectionTitle")}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5 shrink-0">
          <VerdictIcon verdict={verdict} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color }}>
            {badgeText}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#999999] mt-1">{subtitle}</p>
          )}
          {verdict === "none" && (
            <p className="text-[11px] text-[#666666] mt-1">{t("ai.verdict.noneDisclaimer")}</p>
          )}
        </div>
      </div>

      {evidence.length > 0 && (
        <div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center gap-1.5 min-h-[28px] text-[11px] text-[#777777] uppercase tracking-wider hover:text-[#999999] transition-colors duration-150"
            aria-expanded={showEvidence}
          >
            {showEvidence ? <CaretDown size={12} weight="regular" /> : <CaretRight size={12} weight="regular" />}
            {t("ai.why")} ({evidence.length})
          </button>

          {showEvidence && (
            <div className="mt-2 space-y-1.5 animate-slide-down">
              {evidence.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a]"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: verdictColor(item.source === "c2pa-sdk" || item.source === "c2pa" ? "confirmed" : "likely") }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#cccccc] leading-relaxed">
                      {item.description}
                    </p>
                    <span className="text-[10px] text-[#666666] uppercase tracking-wider font-medium mt-0.5 inline-block">
                      {item.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pt-1 border-t border-[#1a1a1a]">
        {mlState.status === "idle" && (
          <button
            onClick={onDeepScan}
            className="flex items-center gap-2 min-h-[28px] text-xs text-[#777777] hover:text-[#00e5a0] transition-colors duration-150 group"
          >
            <MagnifyingGlass size={14} weight="thin" className="group-hover:text-[#00e5a0] transition-colors duration-150" />
            {t("ai.deepScan")}
          </button>
        )}
        {mlState.status === "loading" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-[#777777]">
                {mlState.progressMessage || t("ai.loadingModel")}
              </span>
            </div>
            {mlState.progress > 0 && mlState.progress < 100 && (
              <div className="w-full h-1 rounded-full bg-[#141414] overflow-hidden">
                <div
                  className="h-full bg-[#00e5a0] rounded-full transition-all duration-300"
                  style={{ width: `${mlState.progress}%` }}
                />
              </div>
            )}
          </div>
        )}
        {mlState.status === "classifying" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-[#777777]">{t("ai.classifying")}</span>
          </div>
        )}
        {mlState.status === "error" && (
          <p className="text-[11px] text-red-400/90">{mlState.error}</p>
        )}
        {mlState.status === "ready" && mlState.probability != null && verdict !== "confirmed" && (
          <button
            onClick={onDeepScan}
            className="flex items-center gap-2 min-h-[28px] text-xs text-[#777777] hover:text-[#00e5a0] transition-colors duration-150 group"
          >
            <MagnifyingGlass size={14} weight="thin" className="group-hover:text-[#00e5a0] transition-colors duration-150" />
            {t("ai.deepScanAgain")}
          </button>
        )}
      </div>

      <p className="text-[10px] text-[#555555] leading-relaxed">
        {t("ai.heuristicDisclaimer")}
      </p>
    </div>
  );
}
