(() => {
  const v = "v0.1.2";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);

  try {
    const qs = new URLSearchParams(location.search);
    const debug =
      qs.get("vmf_debug") === "1" ||
      (location.hash || "").includes("vmf_debug=1") ||
      localStorage.getItem("vmf_debug") === "1";

    // If query param present once, persist for this browser session
    if (qs.get("vmf_debug") === "1") localStorage.setItem("vmf_debug", "1");

    if (debug) {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();
