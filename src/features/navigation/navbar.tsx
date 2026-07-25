"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 ${
      isActive(path)
        ? "bg-[#1a1a1a] text-white"
        : "text-[#888888] hover:text-[#cccccc] hover:bg-[#111111]"
    }`;

  return (
    <nav className="border-b border-[#1a1a1a] bg-[#080808]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white hover:text-[#cccccc] transition-colors duration-150 shrink-0"
        >
          <ShieldCheck size={18} color="#00e5a0" weight="thin" />
          <span className="text-sm font-semibold tracking-tight">ZeroData</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/" className={linkClass("/")}>
            {t("nav.tool")}
          </Link>
          <Link href="/faq" className={linkClass("/faq")}>
            {t("nav.faq")}
          </Link>

          <span className="w-px h-4 bg-[#222222] mx-2" aria-hidden="true" />

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setLang("en")}
              aria-label="Switch to English"
              aria-current={lang === "en" ? "true" : undefined}
              className={`px-2 py-1 rounded text-[11px] font-medium uppercase tracking-wider transition-colors duration-150 ${
                lang === "en"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:text-[#999999]"
              }`}
            >
              EN
            </button>
            <span className="text-[#333333] text-[11px] px-0.5" aria-hidden="true">/</span>
            <button
              onClick={() => setLang("es")}
              aria-label="Cambiar a Español"
              aria-current={lang === "es" ? "true" : undefined}
              className={`px-2 py-1 rounded text-[11px] font-medium uppercase tracking-wider transition-colors duration-150 ${
                lang === "es"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:text-[#999999]"
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
