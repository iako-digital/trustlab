// Service worker: fetches published claims from the TrustLab site and caches
// them. Content scripts ask it for claims, so only this worker needs host access.

importScripts("matcher.js");

const DEFAULT_BASE = "https://trustlab-iota.vercel.app";
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

// Right-click "Check with TrustLab" on selected text: match it against the
// published claims, store the result for the popup and flag the toolbar icon.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "trustlab-check",
    title: "Check with TrustLab",
    contexts: ["selection"],
  });
});

// Badge per AI verdict: green check, red cross, amber exclamation, grey question mark.
const AI_BADGE = {
  TRUE: ["\u2713", "#15803d"],
  FAKE: ["\u2717", "#b91c1c"],
  MANIPULATIVE: ["!", "#d97706"],
  UNVERIFIED: ["?", "#6b7280"],
};

function setBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
}

// No published claim matched: ask the site for a live, search-grounded AI check.
async function realtimeCheck(baseUrl, text) {
  let res;
  try {
    res = await fetch(`${baseUrl}/api/verify-realtime`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    throw Object.assign(new Error(`network: ${e}`), { kind: "network" });
  }
  if (!res.ok) {
    const kind = res.status === 429 ? "rate" : res.status === 503 ? "unconfigured" : "http";
    throw Object.assign(new Error(`verify-realtime HTTP ${res.status}`), { kind });
  }
  const j = await res.json();
  if (!AI_BADGE[j.verdict]) throw new Error("bad verdict");
  return {
    verdict: j.verdict,
    summary: String(j.summary || ""),
    sources: (Array.isArray(j.sources) ? j.sources : [])
      .filter((s) => s && /^https?:\/\//.test(s.url))
      .slice(0, 5)
      .map((s) => ({ title: String(s.title || s.url).slice(0, 120), url: s.url })),
  };
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "trustlab-check") return;
  const text = (info.selectionText || "").trim();
  if (!text) return;
  const { baseUrl } = await getSettings();
  const check = { text: text.slice(0, 300), at: Date.now(), baseUrl, match: null };

  try {
    const { buildIndex, findMatch } = self.TrustLabMatcher;
    const match = findMatch(buildIndex(await loadClaims(false)), text);
    if (match) check.match = { id: match.id, status: match.status, title: match.title };
  } catch (e) {
    console.error("[TrustLab] could not load claims from", baseUrl, e);
    check.error = String(e); // local claims unavailable: still try the live check below
  }

  if (check.match) {
    setBadge("\u2713", "#15803d");
  } else {
    setBadge("\u2026", "#6b7280");
    try {
      check.ai = await realtimeCheck(baseUrl, text);
      setBadge(...AI_BADGE[check.ai.verdict]);
    } catch (e) {
      console.error("[TrustLab] live check failed for", baseUrl, e);
      check.aiError = { kind: e.kind || "network", message: String(e) };
      setBadge("!", "#b91c1c");
    }
  }

  await chrome.storage.local.set({ lastCheck: check });
  try {
    await chrome.action.openPopup(); // needs a recent Chrome; the badge is the fallback
  } catch {}
});
