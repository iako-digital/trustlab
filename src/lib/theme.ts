export const THEME_KEY = "trustlab-theme";

/**
 * Runs in <head> before first paint so there is no light flash in dark mode.
 * A saved choice wins; otherwise the system preference decides.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
