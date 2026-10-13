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

// ---- Live check panel -------------------------------------------------------------------
const AI_LABEL = { TRUE: "TRUE", FAKE: "FAKE", MANIPULATIVE: "MANIPULATIVE", UNVERIFIED: "UNVERIFIED" };
const MIN_CHARS = 15;
const SLOW_MS = 20000;
const GIVE_UP_MS = 70000;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

const box = $("check");
let runId = 0; // bumped on every new state so late callbacks are ignored
let slowTimer = null;
let giveUpTimer = null;

function clearTimers() {
  clearTimeout(slowTimer);
  clearTimeout(giveUpTimer);
}

function show(...nodes) {
  box.replaceChildren(...nodes);
  box.hidden = false;
}

function quote(text) {
  return el("blockquote", null, `\u201c${String(text).slice(0, 300)}\u201d`);
}

function showLoading(text) {
  clearTimers();
  const spinner = el("span", "spinner");
  spinner.setAttribute("aria-hidden", "true");
  const row = el("div", "loading-row");
  const label = el("p", "loading-text", "\u10DB\u10DD\u10EC\u10DB\u10D3\u10D4\u10D1\u10D0 AI-\u10E1 \u10DB\u10D8\u10D4\u10E0... / Fact-checking in progress...");
  row.append(spinner, label);
  const dots = el("span", "dots");
  dots.setAttribute("aria-hidden", "true");
  dots.append(el("i"), el("i"), el("i"));
  const wrap = el("div", "loading");
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  wrap.append(row, dots);
  show(quote(text), wrap);
  slowTimer = setTimeout(() => {
    label.textContent = "\u10E8\u10D4\u10DB\u10DD\u10EC\u10DB\u10D4\u10D1\u10D0 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1\u10D0 \u10DB\u10D4\u10E2\u10E1 \u10D3\u10E0\u10DD\u10E1 \u10D8\u10D7\u10EE\u10DD\u10D5\u10E1\u2026 / Still working, this is taking longer than usual\u2026";
  }, SLOW_MS);
}

function showError(text, message, retryText) {
  clearTimers();
  const retry = el("button", "retry", "\u10EE\u10D4\u10DA\u10D0\u10EE\u10DA\u10D0 \u10EA\u10D3\u10D0 / Retry");
  retry.type = "button";
  retry.addEventListener("click", () => runCheck(retryText || text));
  const msg = el("p", "result error", message);
  msg.setAttribute("role", "alert");
  show(quote(text), msg, retry);
}

function showHint() {
  show(el("p", "hint", "Select some text on the page, then open TrustLab again, or right-click it and choose \u201cCheck with TrustLab\u201d."));
}

function renderAi(ai) {
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
  card.append(
    el(
      "p",
      "ai-note",
      ai.grounded === false
        ? "Live web search was unavailable: based on the AI's general knowledge only, not verified against sources. Not a TrustLab editorial verdict."
        : "AI result from live web search. Not a TrustLab editorial verdict.",
    ),
  );
  return card;
}

function errorText(check) {
  const kind = check.aiError && check.aiError.kind;
  return kind === "rate"
    ? "Too many live checks right now. Try again in a few minutes."
    : kind === "unconfigured"
      ? "The live AI check is not configured on the TrustLab server yet."
      : kind === "timeout"
        ? "The check took too long. Please try again."
        : kind === "http"
          ? "The TrustLab server could not complete the check. Try again later."
          : `Could not reach the TrustLab site (${check.baseUrl || "unknown address"}). Check the site address in the settings below.`;
}

function showCheck(check) {
  clearTimers();
  chrome.action.setBadgeText({ text: "" });
  const text = check.text;
  if (check.match) {
    const t = check.match.title || {};
    const a = el("a", null, t.en || t.ka || t.hy || "View fact-check");
    a.href = `${check.baseUrl}/claim/${check.match.id}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const result = el("p", "result");
    result.append(`Match (${check.match.status}): `, a);
    show(quote(text), result);
  } else if (check.ai) {
    show(quote(text), renderAi(check.ai));
  } else {
    showError(text, errorText(check), check.query);
  }
}

/** Starts a check from inside the popup: loading state first, then the background does the work. */
function runCheck(text) {
  const id = ++runId;
  if (text.trim().length < MIN_CHARS) {
    return showError(text, `Select a longer text (at least ${MIN_CHARS} characters).`, text);
  }
  showLoading(text);
  giveUpTimer = setTimeout(() => {
    if (id === runId) showError(text, "The check took too long. Please try again.", text);
  }, GIVE_UP_MS);
  chrome.runtime.sendMessage({ type: "check", text }, (res) => {
    if (id !== runId) return;
    if (chrome.runtime.lastError || !res || !res.check) {
      console.error("[TrustLab] popup check failed", chrome.runtime.lastError);
      return showError(text, "The extension could not run the check. Please try again.", text);
    }
    showCheck(res.check);
  });
}

/** The text highlighted on the active tab (any page, any frame), or "". */
async function readSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id == null) return "";
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => String(window.getSelection() || "").trim(),
    });
    return results.map((r) => r.result || "").sort((a, b) => b.length - a.length)[0] || "";
  } catch (e) {
    console.warn("[TrustLab] cannot read the selection on this page", e); // chrome:// pages, the web store, …
    return "";
  }
}

(async () => {
  const { pendingCheck, lastCheck } = await chrome.storage.local.get(["pendingCheck", "lastCheck"]);

  // Opened by the right-click menu: the background is already checking, so just wait for it.
  if (pendingCheck && Date.now() - pendingCheck.at < GIVE_UP_MS) {
    const id = ++runId;
    showLoading(pendingCheck.text);
    giveUpTimer = setTimeout(() => {
      if (id === runId) showError(pendingCheck.text, "The check took too long. Please try again.", pendingCheck.text);
    }, GIVE_UP_MS - (Date.now() - pendingCheck.at));
    chrome.storage.onChanged.addListener((changes, area) => {
      const next = changes.lastCheck && changes.lastCheck.newValue;
      if (area === "local" && next && next.at >= pendingCheck.at && id === runId) showCheck(next);
    });
    return;
  }

  // Opened with text highlighted on the page: check it right away.
  const selection = await readSelection();
  if (selection) return runCheck(selection);

  if (lastCheck) showCheck(lastCheck);
  else showHint();
})();
