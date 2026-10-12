"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import { ChatWidget } from "@/components/chat-widget";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider initialLocale="ka">
      <StoreProvider>
        {children}
        <ChatWidget />
      </StoreProvider>
    </I18nProvider>
  );
}
