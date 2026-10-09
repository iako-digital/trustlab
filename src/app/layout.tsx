import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "TrustLab — Fact-checking regional disinformation",
  description:
    "Crowdsourced fact-checking against regional fake news in Georgia and Armenia. Verified checks in Georgian, Armenian and English.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <head>
        {/* Multi-script fonts: Noto covers Georgian + Armenian + Latin consistently */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;600;700&family=Noto+Serif+Armenian:wght@400;600;700&family=Noto+Serif:wght@400;600;700&family=Noto+Sans+Georgian:wght@400;500;600&family=Noto+Sans+Armenian:wght@400;500;600&family=Noto+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col paper-grain">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-paper-line py-8">
      <div className="container flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          TrustLab · Prototype
        </p>
        <p className="text-xs text-ink-faint">
          Crowdsourced fact-checking · ka · hy · en
        </p>
      </div>
    </footer>
  );
}
