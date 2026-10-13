// Inline fact-check widget: highlight text on any page and a small TrustLab button appears next
// to the selection. Clicking it opens a card right on the page (loading state, then the verdict)
// without using the toolbar icon. Rendered in a closed shadow root so page CSS cannot touch it
// and it cannot leak styles into the page. All text goes in through textContent.

(function () {
  if (window.top !== window || window.__trustlabInline) return;
  window.__trustlabInline = true;

  const MIN_CHARS = 15;
  const GIVE_UP_MS = 70000;
  const SLOW_MS = 20000;
  const AI_LABEL = { TRUE: "TRUE", FAKE: "FAKE", MANIPULATIVE: "MANIPULATIVE", UNVERIFIED: "UNVERIFIED" };

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Georgian", "Noto Sans Armenian", sans-serif; }
    .btn { position: fixed; z-index: 2147483647; width: 34px; height: 34px; border-radius: 50%; border: 2px solid #fff;
      background: #0b2d5b; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 4px 14px rgba(11,45,91,.45); padding: 0; animation: pop .15s ease-out; }
    .btn:hover { background: #2563eb; }
    .btn:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
    .btn svg { width: 18px; height: 18px; }
    .card { position: fixed; z-index: 2147483647; width: min(340px, calc(100vw - 16px)); max-height: min(70vh, 520px); overflow: auto;
      background: #fff; color: #0b2d5b; border: 1px solid #d6e4f7; border-radius: 14px; padding: 14px 14px 12px;
      box-shadow: 0 10px 40px rgba(11,45,91,.35); font-size: 13px; line-height: 1.45; animation: pop .15s ease-out; }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    .brand { font-weight: 800; font-size: 14px; letter-spacing: -.01em; }
    .brand b { color: #10b981; }
    .x { border: 0; background: transparent; color: #5b6b82; font-size: 20px; line-height: 1; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
    .x:hover { background: #e6f1ff; }
    blockquote { margin: 0 0 10px; padding: 6px 10px; border-left: 3px solid #2563eb; background: #f3f6fb; border-radius: 6px;
      font-style: italic; color: #1f2937; word-break: break-word; }
    .loading { display: flex; align-items: center; gap: 10px; font-weight: 600; }
    .spin { flex: none; width: 18px; height: 18px; border: 3px solid #d6e4f7; border-top-color: #2563eb; border-radius: 50%; animation: spin .8s linear infinite; }
    .dots { display: inline-flex; gap: 5px; margin: 8px 0 0 28px; }
    .dots i { width: 6px; height: 6px; border-radius: 50%; background: #2563eb; animation: pulse 1.2s ease-in-out infinite; }
    .dots i:nth-child(2) { animation-delay: .2s; } .dots i:nth-child(3) { animation-delay: .4s; }
    .eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #5b6b82; }
    .verdict { display: inline-block; padding: 3px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; color: #fff; }
    .v-true { background: #047857; } .v-fake { background: #b91c1c; } .v-manipulative { background: #b45309; } .v-unverified { background: #475569; }
    .summary { margin: 8px 0 0; }
    .st { margin: 10px 0 4px; font-size: 11px; font-weight: 700; color: #5b6b82; }
    ul { margin: 0; padding-left: 18px; font-size: 12px; } a { color: #2563eb; word-break: break-word; }
    .note { margin: 8px 0 0; font-size: 10.5px; color: #5b6b82; }
    .err { margin: 0; color: #b91c1c; font-weight: 600; }
    .retry { margin-top: 10px; padding: 7px 14px; border: 0; border-radius: 999px; background: #0b2d5b; color: #fff; font-weight: 600; cursor: pointer; }
    .retry:hover { background: #2563eb; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 80%, 100% { opacity: .25; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
    @keyframes pop { from { opacity: 0; transform: translateY(4px) scale(.97); } to { opacity: 1; transform: none; } }
    @media (prefers-color-scheme: dark) {
      .card { background: #121b2e; color: #e6eefa; border-color: #24324d; }
      blockquote { background: #172540; color: #c5d1e3; }
      .x { color: #93a4bc; } .x:hover { background: #172540; }
      .eyebrow, .st, .note { color: #93a4bc; } a { color: #60a5fa; }
      .err { color: #fca5a5; } .retry { background: #3b82f6; }
    }
    @media (prefers-reduced-motion: reduce) { .spin, .dots i, .btn, .card { animation: none; } }
  `;

  const SHIELD =
    '<svg viewBox="0 0 100 120" aria-hidden="true"><path d="M50 8 88 22v36c0 24-18 42-38 54C30 100 12 82 12 58V22z" fill="#7db4ff"/><path d="M36 54l10 10 20-22" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const host = document.createElement("div");
  host.style.cssText = "all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = STYLE;
  root.append(style);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function mount() {
    if (!host.isConnected) (document.documentElement || document.body).append(host);
  }

  let button = null;
  let card = null;
  let pending = ""; // text the button will check
  let anchor = null; // viewport rect of the selection when the button was placed
  let runId = 0;
  let timers = [];
  let mouseDown = false;

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const removeButton = () => {
    button?.remove();
    button = null;
  };
  function closeCard() {
    runId++;
    clearTimers();
    card?.remove();
    card = null;
  }

  function selectionInfo() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const text = String(sel).replace(/\s+/g, " ").trim();
    if (text.length < MIN_CHARS) return null;
    const rects = sel.getRangeAt(0).getClientRects();
    const rect = rects.length ? rects[rects.length - 1] : sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;
    return { text: text.slice(0, 1500), rect };
  }

  function placeButton(info) {
    mount();
    removeButton();
    pending = info.text;
    anchor = info.rect;
    const b = el("button", "btn");
    b.type = "button";
    b.setAttribute("aria-label", "Check with TrustLab");
    b.title = "Check with TrustLab";
    b.innerHTML = SHIELD; // constant markup, no page data
    const left = Math.min(Math.max(8, info.rect.right + 6), window.innerWidth - 42);
    const top = Math.min(Math.max(8, info.rect.bottom + 6), window.innerHeight - 42);
    b.style.left = `${left}px`;
    b.style.top = `${top}px`;
    // mousedown must not clear the page selection before we read it.
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openCard(pending, anchor);
    });
    root.append(b);
    button = b;
  }

  function positionCard(c, rect) {
    const w = Math.min(340, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - w - 8);
    c.style.left = `${left}px`;
    const below = rect.bottom + 12;
    c.style.top = `${Math.min(below, Math.max(8, window.innerHeight - 160))}px`;
  }

  function cardShell(text) {
    const c = el("div", "card");
    c.setAttribute("role", "dialog");
    c.setAttribute("aria-label", "TrustLab fact-check");
    const head = el("div", "head");
    const brand = el("span", "brand");
    brand.append("Trust", Object.assign(el("b"), { textContent: "Lab" }));
    const x = el("button", "x", "×");
    x.type = "button";
    x.setAttribute("aria-label", "Close");
    x.addEventListener("click", closeCard);
    head.append(brand, x);
    const q = el("blockquote", null, `“${text.slice(0, 300)}”`);
    c.append(head, q);
    return c;
  }

  function setBody(c, ...nodes) {
    while (c.children.length > 2) c.lastChild.remove();
    c.append(...nodes);
  }

  function showLoading(c) {
    const row = el("div", "loading");
    row.setAttribute("role", "status");
    row.setAttribute("aria-live", "polite");
    const label = el("span", null, "მოწმდება AI-ს მიერ... / Fact-checking in progress...");
    row.append(el("span", "spin"), label);
    const dots = el("span", "dots");
    dots.append(el("i"), el("i"), el("i"));
    setBody(c, row, dots);
    timers.push(
      setTimeout(() => {
        label.textContent = "შემოწმება გასაღება მეტს დროს ითხოვს… / Still working…";
      }, SLOW_MS),
    );
  }

  function showError(c, message, text) {
    clearTimers();
    const p = el("p", "err", message);
    p.setAttribute("role", "alert");
    const retry = el("button", "retry", "ხელახლა ცდა / Retry");
    retry.type = "button";
    retry.addEventListener("click", () => run(c, text));
    setBody(c, p, retry);
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
            : "Could not reach the TrustLab site. Check the site address in the extension settings.";
  }

  const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : null);

  function showResult(c, check) {
    clearTimers();
    const nodes = [];
    if (check.match) {
      const t = check.match.title || {};
      const p = el("p", "summary", `Already checked by TrustLab editors (${check.match.status}): `);
      const a = el("a", null, t.en || t.ka || t.hy || "View fact-check");
      a.href = `${check.baseUrl}/claim/${encodeURIComponent(check.match.id)}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      p.append(a);
      nodes.push(el("p", "eyebrow", "TrustLab"), p);
    } else if (check.ai) {
      const ai = check.ai;
      nodes.push(el("p", "eyebrow", "AI Live Fact-Check"));
      nodes.push(el("span", `verdict v-${String(ai.verdict).toLowerCase()}`, AI_LABEL[ai.verdict] || ai.verdict));
      if (ai.summary) nodes.push(el("p", "summary", ai.summary));
      const links = (ai.sources || []).filter((s) => safeUrl(s.url));
      if (links.length) {
        nodes.push(el("p", "st", "Verified Sources / წყაროები:"));
        const ul = el("ul");
        for (const s of links) {
          const li = el("li");
          const a = el("a", null, s.title || s.url);
          a.href = s.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          li.append(a);
          ul.append(li);
        }
        nodes.push(ul);
      }
      nodes.push(
        el(
          "p",
          "note",
          ai.grounded === false
            ? "Live web search was unavailable: based on the AI's general knowledge only, not verified against sources. Not a TrustLab editorial verdict."
            : "AI result from live web search. Not a TrustLab editorial verdict.",
        ),
      );
    } else {
      return showError(c, errorText(check), check.query || check.text);
    }
    setBody(c, ...nodes);
  }

  function run(c, text) {
    const id = ++runId;
    clearTimers();
    showLoading(c);
    timers.push(setTimeout(() => id === runId && showError(c, "The check took too long. Please try again.", text), GIVE_UP_MS));
    try {
      chrome.runtime.sendMessage({ type: "check", text }, (res) => {
        if (id !== runId) return;
        if (chrome.runtime.lastError || !res || !res.check) {
          return showError(c, "The extension could not run the check. Reload the page and try again.", text);
        }
        showResult(c, res.check);
      });
    } catch (e) {
      console.warn("[TrustLab] inline check could not reach the extension", e);
      showError(c, "The extension was updated. Reload this page and try again.", text);
    }
  }

  function openCard(text, rect) {
    closeCard();
    removeButton();
    mount();
    const c = cardShell(text);
    positionCard(c, rect);
    root.append(c);
    card = c;
    run(c, text);
  }

  // ---- when to show the button ----
  let debounce = null;
  function evaluate() {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (mouseDown || card) return;
      const info = selectionInfo();
      if (info) placeButton(info);
      else removeButton();
    }, 120);
  }

  document.addEventListener("mousedown", (e) => {
    mouseDown = true;
    if (e.composedPath().includes(host)) return;
    removeButton();
    closeCard(); // a click anywhere else dismisses the card
  }, true);
  document.addEventListener("mouseup", () => {
    mouseDown = false;
    evaluate();
  }, true);
  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
      closeCard();
      removeButton();
    } else if (e.shiftKey || e.key.startsWith("Arrow")) evaluate();
  }, true);
  window.addEventListener("scroll", () => !card && removeButton(), { passive: true });
  window.addEventListener("resize", () => {
    closeCard();
    removeButton();
  });
})();
