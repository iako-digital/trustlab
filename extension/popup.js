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
chrome.storage.local.get("lastCheck", ({ lastCheck }) => {
  chrome.action.setBadgeText({ text: "" });
  if (!lastCheck) return;
  const box = $("check");
  const quote = document.createElement("blockquote");
  quote.textContent = `“${lastCheck.text}”`;
  const result = document.createElement("p");
  box.append(quote, result);
  if (lastCheck.error) {
    result.textContent = "Could not reach the TrustLab site.";
  } else if (lastCheck.match) {
    const t = lastCheck.match.title || {};
    const a = document.createElement("a");
    a.href = `${lastCheck.baseUrl}/claim/${lastCheck.match.id}`;
    a.target = "_blank";
    a.textContent = t.en || t.ka || t.hy || "View fact-check";
    result.append(`Match (${lastCheck.match.status}): `, a);
  } else {
    result.textContent = "No matching fact-check found.";
  }
  box.hidden = false;
});
