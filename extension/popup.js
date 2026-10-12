const $ = (id) => document.getElementById(id);
const status = (msg) => ($("status").textContent = msg);

chrome.storage.local.get(["baseUrl", "enabled"], (s) => {
  $("enabled").checked = s.enabled !== false;
  $("baseUrl").value = s.baseUrl || "http://localhost:3000";
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
