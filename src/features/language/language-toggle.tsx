"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="fixed top-4 right-6 z-50 flex items-center gap-1">
      <button
        onClick={() => setLang("en")}
        aria-label="Switch to English"
        aria-current={lang === "en" ? "true" : undefined}
        className={`px-2.5 py-1.5 rounded text-[11px] font-medium uppercase tracking-wider transition-colors duration-150 ${
          lang === "en"
            ? "bg-[#1a1a1a] text-white"
            : "text-[#666666] hover:text-[#999999]"
        }`}
      >
        EN
      </button>
      <span className="text-[#444444] text-[11px]" aria-hidden="true">/</span>
      <button
        onClick={() => setLang("es")}
        aria-label="Cambiar a Español"
        aria-current={lang === "es" ? "true" : undefined}
        className={`px-2.5 py-1.5 rounded text-[11px] font-medium uppercase tracking-wider transition-colors duration-150 ${
          lang === "es"
            ? "bg-[#1a1a1a] text-white"
            : "text-[#666666] hover:text-[#999999]"
        }`}
      >
        ES
      </button>
    </div>
  );
}
