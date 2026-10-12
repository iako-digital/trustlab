// Matches post text against published TrustLab claims. Loaded before content.js.
// Deliberately simple and conservative: a badge is only shown when a post shares
// most of the distinctive words of a claim, so false positives stay rare.

(function () {
  const MIN_SHARED = 4; // distinctive words a post must share with a claim
  const MIN_RATIO = 0.6; // share of the claim's words that must appear in the post
  const STEM = 5; // Georgian/Armenian are heavily inflected: compare word prefixes

  function tokens(text) {
    const out = new Set();
    for (const w of String(text || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) {
      if (w.length >= 4) out.add(w.slice(0, STEM));
    }
    return out;
  }

  /** Index = one token set per language version of each claim. */
  function buildIndex(claims) {
    return claims.map((c) => ({
      id: c.id,
      status: c.status,
      title: c.title,
      sets: ["ka", "hy", "en"]
        .map((l) => tokens(`${(c.title || {})[l] || ""} ${(c.claim || {})[l] || ""}`))
        .filter((s) => s.size >= MIN_SHARED),
    }));
  }

  /** Returns the best matching indexed claim for a post, or null. */
  function findMatch(index, postText) {
    const post = tokens(postText);
    if (post.size < MIN_SHARED) return null;
    let best = null;
    let bestScore = 0;
    for (const entry of index) {
      for (const set of entry.sets) {
        let shared = 0;
        for (const tkn of set) if (post.has(tkn)) shared++;
        const ratio = shared / set.size;
        if (shared >= MIN_SHARED && ratio >= MIN_RATIO && ratio > bestScore) {
          best = entry;
          bestScore = ratio;
        }
      }
    }
    return best;
  }

  self.TrustLabMatcher = { buildIndex, findMatch };
})();
