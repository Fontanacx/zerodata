"use client";

import { Question, ShieldCheck, Scales } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";

export default function FaqPage() {
  const { t } = useI18n();

  const questions = [
    { key: "q1" },
    { key: "q2" },
    { key: "q3" },
    { key: "q4" },
    { key: "q5" },
    { key: "q6" },
    { key: "q7" },
    { key: "q8" },
    { key: "q9" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-10 w-full">
        <header className="mb-12">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {t("faq.title")}
          </h1>
          <p className="text-sm text-[#888888] mt-2">
            {t("faq.subtitle")}
          </p>
        </header>

        <div className="space-y-6 mb-16">
          {questions.map(({ key }) => (
            <div
              key={key}
              className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] p-5"
            >
              <div className="flex items-start gap-3">
                <Question
                  size={18}
                  color="#00e5a0"
                  weight="thin"
                  className="shrink-0 mt-0.5"
                />
                <div>
                  <h2 className="text-sm font-medium text-[#cccccc] mb-2">
                    {t(`faq.${key}.q`)}
                  </h2>
                  <p className="text-sm text-[#999999] leading-relaxed">
                    {t(`faq.${key}.a`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#f59e0b20] bg-[#f59e0b06] p-5 mb-10">
          <div className="flex items-start gap-3">
            <Scales
              size={18}
              color="#f59e0b"
              weight="thin"
              className="shrink-0 mt-0.5"
            />
            <div>
              <h2 className="text-sm font-medium text-[#f59e0b] uppercase tracking-wider mb-2">
                {t("faq.disclaimer")}
              </h2>
              <p className="text-sm text-[#999999] leading-relaxed">
                {t("faq.disclaimerText")}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1a1a1a] bg-[#060606] px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">
              ZeroData
            </span>
            <span className="text-xs text-[#777777]">
              {t("footer.developed")}{" "}
              <span className="text-[#888888] font-medium">Fontanac</span>
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-[#777777]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} color="#00e5a0" weight="thin" />
              {t("footer.noTelemetry")}
            </span>
            <span>{t("footer.openSource")}</span>
            <span className="text-[#666666]">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
