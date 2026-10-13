import { NextResponse } from "next/server";

/**
 * CORS for the few public endpoints the browser extension calls. The extension's
 * service worker is exempt from CORS through its host permissions, but plain pages
 * and other clients are not, so the headers are set explicitly. No credentials are
 * involved, which is what makes a wildcard origin safe here.
 */
export function corsHeaders(methods: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors<T extends NextResponse>(res: T, methods: string): T {
  for (const [k, v] of Object.entries(corsHeaders(methods))) res.headers.set(k, v);
  return res;
}

/** Preflight answer: HTTP 200, no body. */
export function preflight(methods: string): NextResponse {
  return new NextResponse(null, { status: 200, headers: corsHeaders(methods) });
}
