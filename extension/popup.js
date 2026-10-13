const $ = (id) => document.getElementById(id);
const status = (msg) => ($("status").textContent = msg);

chrome.storage.local.get(["baseUrl", "enabled"], (s) => {
  $("enabled").checked = s.enabled !== false;
  $("baseUrl").value = s.baseUrl || "https://trustlab-iota.vercel.app";
});

$("enabled").addEventListener("change", () => {
  chrome.storage.local.set({ enabled: $("enabled").checked });
  status($("enabled").checked ? "Badges on. Reload open tabs." : "Badges off. Reload open tabs.");
});

$("save").addEventListener("click", async () => {
  let url;
  try {
    const u = new URL($("baseUrl").value.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    url = u.origin;
  } catch {
    return status("Enter a valid http(s) address.");
  }
  // Hosts other than the built-in ones need the user's permission.
  const granted = await chrome.permissions.request({ origins: [`${url}/*`] });
  if (!granted) return status("Permission denied for that address.");
  await chrome.storage.local.set({ baseUrl: url });
  $("baseUrl").value = url;
  status("Saved.");
});

$("refresh").addEventListener("click", () => {
  status("Refreshing…");
  chrome.runtime.sendMessage({ type: "refresh" }, (res) => {
    status(res && res.ok ? `Loaded ${res.count} verified claims.` : "Could not reach the TrustLab site.");
  });
});

// Result of the last right-click "Check with TrustLab".
const AI_LABEL = { TRUE: "TRUE", FAKE: "FAKE", MANIPULATIVE: "MANIPULATIVE", UNVERIFIED: "UNVERIFIED" };

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function renderAi(box, ai) {
  const card = el("div", "ai-card");
  card.append(el("p", "ai-eyebrow", "AI Live Fact-Check"));
  card.append(el("span", `ai-verdict ai-${ai.verdict.toLowerCase()}`, AI_LABEL[ai.verdict]));
  if (ai.summary) card.append(el("p", "ai-summary", ai.summary));
  if (ai.sources.length) {
    card.append(el("p", "ai-sources-title", "Verified Sources / \u10EC\u10E7\u10D0\u10E0\u10DD\u10D4\u10D1\u10D8:"));
    const list = el("ul", "ai-sources");
    for (const s of ai.sources) {
      const a = el("a", null, s.title);
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const li = el("li");
      li.append(a);
      list.append(li);
    }
    card.append(list);
  }
  card.append(el("p", "ai-note", "AI result from live web search. Not a TrustLab editorial verdict."));
  box.append(card);
}

chrome.storage.local.get("lastCheck", ({ lastCheck }) => {
  chrome.action.setBadgeText({ text: "" });
  if (!lastCheck) return;
  const box = $("check");
  box.append(el("blockquote", null, `\u201c${lastCheck.text}\u201d`));

  if (lastCheck.match) {
    const t = lastCheck.match.title || {};
    const a = el("a", null, t.en || t.ka || t.hy || "View fact-check");
    a.href = `${lastCheck.baseUrl}/claim/${lastCheck.match.id}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const result = el("p", "result");
    result.append(`Match (${lastCheck.match.status}): `, a);
    box.append(result);
  } else if (lastCheck.ai) {
    renderAi(box, lastCheck.ai);
  } else {
    const kind = lastCheck.aiError && lastCheck.aiError.kind;
    const msg =
      kind === "rate"
        ? "Too many live checks right now. Try again in a few minutes."
        : kind === "unconfigured"
          ? "The live AI check is not configured on the TrustLab server yet."
          : kind === "http"
            ? "The TrustLab server could not complete the check. Try again later."
            : `Could not reach the TrustLab site (${lastCheck.baseUrl || "unknown address"}). Check the site address in the settings below.`;
    box.append(el("p", "result", msg));
  }
  box.hidden = false;
});
