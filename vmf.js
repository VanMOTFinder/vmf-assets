(() => {
  const v = "v0.1.1";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);

  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get("vmf_debug") === "1") {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();
