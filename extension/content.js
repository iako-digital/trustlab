// Content script for Facebook and Telegram. Finds post text, matches it against
// published TrustLab claims and appends a badge that links to the full check.

(function () {
  const HOST = location.hostname;
  const SELECTORS = HOST.endsWith("facebook.com")
    ? ['[role="article"]']
    : [
        ".tgme_widget_message_text", // t.me/s/<channel>
        ".message .text-content", // web.telegram.org/a
        ".message .text", // web.telegram.org/k
        ".Message .text-content",
      ];

  const COLORS = {
    true: { label: "Verified by TrustLab", cls: "tl-true" },
    fake: { label: "Flagged as false · TrustLab", cls: "tl-fake" },
    manipulative: { label: "Manipulative · TrustLab", cls: "tl-manip" },
  };

  let index = [];
  let baseUrl = "";
  let timer = null;

  function badge(match) {
    const meta = COLORS[match.status];
    if (!meta) return null;
    const a = document.createElement("a");
    a.className = `trustlab-badge ${meta.cls}`;
    a.href = `${baseUrl}/claim/${match.id}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = `🛡 ${meta.label}`;
    a.title = (match.title && (match.title.en || match.title.ka || match.title.hy)) || "TrustLab";
    return a;
  }

  function scan() {
    if (!index.length) return;
    for (const sel of SELECTORS) {
      for (const el of document.querySelectorAll(sel)) {
        const text = el.innerText || "";
        // Re-check only when the text changed (feeds recycle DOM nodes).
        if (el.dataset.trustlabText === text) continue;
        el.dataset.trustlabText = text;
        el.querySelectorAll(":scope > .trustlab-badge").forEach((b) => b.remove());
        const match = self.TrustLabMatcher.findMatch(index, text);
        const b = match && badge(match);
        if (b) el.appendChild(b);
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(scan, 600); // feeds mutate constantly: debounce
  }

  chrome.runtime.sendMessage({ type: "getState" }, (state) => {
    if (chrome.runtime.lastError || !state || !state.ok || !state.enabled) return;
    baseUrl = state.baseUrl;
    index = self.TrustLabMatcher.buildIndex(state.claims);
    scan();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  });
})();
