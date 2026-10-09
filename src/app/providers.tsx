"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider initialLocale="ka">
      <StoreProvider>{children}</StoreProvider>
    </I18nProvider>
  );
}
