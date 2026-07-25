"use client";

import { I18nProvider } from "@/lib/i18n";
import { Navbar } from "@/features/navigation/navbar";
import type { ReactNode } from "react";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <Navbar />
      {children}
    </I18nProvider>
  );
}
