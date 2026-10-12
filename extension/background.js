// Service worker: fetches published claims from the TrustLab site and caches
// them. Content scripts ask it for claims, so only this worker needs host access.

const DEFAULT_BASE = "http://localhost:3000";
const CACHE_MS = 10 * 60 * 1000;

async function getSettings() {
  const s = await chrome.storage.local.get(["baseUrl", "enabled"]);
  return { baseUrl: (s.baseUrl || DEFAULT_BASE).replace(/\/+$/, ""), enabled: s.enabled !== false };
}

async function loadClaims(force) {
  const { baseUrl } = await getSettings();
  const cached = (await chrome.storage.local.get("cache")).cache;
  if (!force && cached && cached.baseUrl === baseUrl && Date.now() - cached.at < CACHE_MS) {
    return cached.claims;
  }
  const res = await fetch(`${baseUrl}/api/claims`, { cache: "no-store" });
  if (!res.ok) throw new Error(`TrustLab API ${res.status}`);
  const { claims } = await res.json();
  // Keep only what matching and the badge need.
  const slim = claims.map((c) => ({
    id: c.id,
    status: c.status,
    title: c.title,
    claim: c.claim,
  }));
  await chrome.storage.local.set({ cache: { baseUrl, at: Date.now(), claims: slim } });
  return slim;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === "getState") {
      const { baseUrl, enabled } = await getSettings();
      if (!enabled) return sendResponse({ ok: true, enabled, baseUrl, claims: [] });
      try {
        sendResponse({ ok: true, enabled, baseUrl, claims: await loadClaims(false) });
      } catch (e) {
        sendResponse({ ok: false, enabled, baseUrl, error: String(e) });
      }
    } else if (msg?.type === "refresh") {
      try {
        const claims = await loadClaims(true);
        sendResponse({ ok: true, count: claims.length });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    }
  })();
  return true; // keep the channel open for the async response
});

// Re-sync when the site address or the toggle changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.baseUrl || changes.enabled)) chrome.storage.local.remove("cache");
});
