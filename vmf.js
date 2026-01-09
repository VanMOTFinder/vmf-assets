/* VMF assets v0.2.1 */
(() => {
  const v = "v0.2.1";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);

  try {
    const qs = new URLSearchParams(location.search || "");
    const hash = (location.hash || "");

    const hasDebugParam =
      qs.get("vmf_debug") === "1" ||
      hash.includes("vmf_debug=1");

    if (hasDebugParam) localStorage.setItem("vmf_debug", "1");

    const debug =
      hasDebugParam ||
      localStorage.getItem("vmf_debug") === "1";

    if (debug) {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();

/*! VMF-AUTOHOOK v2026-01-08a — STAGING2 ONLY
    - Deterministic proximity policy via URL (no slider DOM required)
    - 1x on-load correction redirect if proximity mismatched
    - ?vmfdebug=1 shows badge
    - ?vmftest=1 shows QA panel + PASS/FAIL + Copy report
    - Hides empty "Categories" tab (if present and empty)
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v2026-01-08a';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;

  // ---------- Config ----------
  var POLICY = {
    FULL_POSTCODE_MI: 5,
    OUTCODE_MI: 10,
    TOWN_MI: 10,
    METRO_MI: 12,
    REGION_CLAMP_MI: 20
  };

  var URL_KEYS = {
    PROX: 'proximity',
    LAT: 'lat',
    LNG: 'lng',
    TYPE: 'type',
    SORT: 'sort',
    LOCATION: 'location',
    REGION: 'region'
  };

  // ---------- Utils ----------
  function $(sel, root) {
    try { return (root || document).querySelector(sel); } catch (_) { return null; }
  }
  function $all(sel, root) {
    try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } catch (_) { return []; }
  }

  function isExplore() {
    return !!($('body.page-template-explore') || $('.explore-page') || $('[data-page="explore"]'));
  }

  function getQS() {
    try { return new URLSearchParams(window.location.search || ''); }
    catch (_) { return new URLSearchParams(''); }
  }

  function setQS(qs) {
    var base = window.location.origin + window.location.pathname;
    var q = qs.toString();
    var hash = window.location.hash || '';
    return base + (q ? ('?' + q) : '') + hash;
  }

  function toNum(x) {
    var n = parseFloat(x);
    return isFinite(n) ? n : null;
  }

  function normalize(s) {
    return String(s || '').trim().replace(/\s+/g, ' ');
  }

  function isOutcode(s) {
    s = normalize(s).toUpperCase();
    return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s);
  }

  function isFullPostcode(s) {
    s = normalize(s).toUpperCase();
    return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(s);
  }

  function hasTownishLocation(loc) {
    loc = normalize(loc);
    if (!loc) return false;
    if (isFullPostcode(loc) || isOutcode(loc)) return false;
    return true;
  }

  function isMetro(loc) {
    loc = normalize(loc).toLowerCase();
    return /(london|greater london|manchester|birmingham|leeds|liverpool|glasgow|edinburgh|bristol|sheffield|cardiff|newcastle|nottingham)/.test(loc);
  }

  function desiredMiles() {
    var qs = getQS();
    var loc = qs.get(URL_KEYS.LOCATION);
    var region = qs.get(URL_KEYS.REGION);

    if ((!loc || !normalize(loc)) && region && normalize(region)) return POLICY.REGION_CLAMP_MI;

    loc = normalize(loc);
    if (!loc) return null;

    if (isFullPostcode(loc)) return POLICY.FULL_POSTCODE_MI;
    if (isOutcode(loc)) return POLICY.OUTCODE_MI;

    if (hasTownishLocation(loc)) {
      if (isMetro(loc)) return POLICY.METRO_MI;
      return POLICY.TOWN_MI;
    }

    return null;
  }

  function currentMiles() {
    var qs = getQS();
    return toNum(qs.get(URL_KEYS.PROX));
  }

  function shouldRedirectFix() {
    if (!isExplore()) return false;
    var want = desiredMiles();
    if (want == null) return false;
    var cur = currentMiles();
    if (cur == null) return true;
    return Math.round(cur) !== Math.round(want);
  }

  function applyProximityFix() {
    var qs = getQS();
    var want = desiredMiles();
    if (want == null) return { did: false, why: 'no-target' };

    qs.set(URL_KEYS.PROX, String(want));
    var url = setQS(qs);
    return { did: true, url: url, want: want };
  }

  function onceKeyFor(url) {
    return 'VMF_PROX_FIX_ONCE::' + String(url || window.location.href);
  }

  function markOnce(k) {
    try { sessionStorage.setItem(k, '1'); } catch (_) {}
  }

  function wasOnce(k) {
    try { return sessionStorage.getItem(k) === '1'; } catch (_) { return false; }
  }

  // ---------- QA Panel ----------
  function ensurePanel() {
    var wrap = document.createElement('div');
    wrap.id = 'vmf-test-panel';
    wrap.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:999999;background:#fff;color:#111;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:12px;min-width:260px;max-width:360px;box-shadow:0 10px 30px rgba(0,0,0,.15);font:12px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;';
    wrap.innerHTML =
      '<div style="font-weight:700;margin-bottom:8px;">VMF Test Runner — ' + VERSION + '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<button id="vmf-run" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);background:#111;color:#fff;cursor:pointer;">Run suite</button>' +
        '<button id="vmf-copy" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);background:#fff;color:#111;cursor:pointer;">Copy report</button>' +
      '</div>' +
      '<pre id="vmf-out" style="white-space:pre-wrap;max-height:220px;overflow:auto;margin:0;padding:10px;border-radius:10px;background:#f6f6f6;border:1px solid rgba(0,0,0,.08);"></pre>';
    document.documentElement.appendChild(wrap);

    var out = $('#vmf-out', wrap);
    var run = $('#vmf-run', wrap);
    var copy = $('#vmf-copy', wrap);

    function report(lines) {
      out.textContent = (lines || []).join('\n');
    }

    function suite() {
      var lines = [];
      lines.push('VERSION=' + VERSION);
      lines.push('URL=' + window.location.href);
      lines.push('EXPLORE=' + (isExplore() ? 'yes' : 'no'));

      var want = desiredMiles();
      var cur = currentMiles();
      lines.push('PROX_WANT=' + (want == null ? 'n/a' : want));
      lines.push('PROX_CUR=' + (cur == null ? 'n/a' : cur));

      var links = $all('a[href*="/listing/"], a[href*="/listings/"]');
      lines.push('LISTING_LINKS=' + (links.length || 0));

      lines.push('CATEGORIES_TAB=' + ($all('a[href*="#categories"], a[href*="#category"]').length ? 'present' : 'none'));

      return lines;
    }

    function runSuite() { report(suite()); }

    run.addEventListener('click', runSuite);
    copy.addEventListener('click', function () {
      try { navigator.clipboard.writeText(out.textContent || ''); } catch (_) {}
    });

    runSuite();
  }

  // ---------- UI: hide empty Categories tab ----------
  function hideEmptyCategoriesTab() {
    try {
      var tabLinks = $all('.tabs-menu a, .c27-listing-tabs .tabs-menu a, .c27-tabs .tabs-menu a');
      tabLinks.forEach(function (a) {
        var t = normalize(a.textContent).toLowerCase();
        if (t !== 'categories' && t !== 'category') return;

        var href = a.getAttribute('href') || '';
        if (!href || href.charAt(0) !== '#') return;

        var pane = $(href);
        if (!pane) return;

        var has = !!(pane.querySelector('a, li, .tag, .category, .term'));
        if (!has) {
          var li = a.closest('li');
          if (li) li.style.display = 'none';
        }
      });
    } catch (_) {}
  }

  // ---------- Debug ----------
  function shouldShowDebugBadge() {
    try {
      var qs = getQS();
      return qs.get('vmfdebug') === '1';
    } catch (_) { return false; }
  }

  function showDebugBadge() {
    try {
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;z-index:999999;left:12px;bottom:12px;padding:8px 10px;border-radius:10px;background:#111;color:#fff;font:12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;opacity:.92;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.25)';
      el.textContent = VERSION;
      document.documentElement.appendChild(el);
    } catch (_) {}
  }

  function shouldShowTestPanel() {
    try {
      var qs = getQS();
      return qs.get('vmftest') === '1';
    } catch (_) { return false; }
  }

  // ---------- Boot ----------
  function boot() {
    if (shouldRedirectFix()) {
      var fix = applyProximityFix();
      if (fix.did) {
        var k = onceKeyFor(fix.url);
        if (!wasOnce(k)) {
          markOnce(k);
          window.location.replace(fix.url);
          return;
        }
      }
    }

    hideEmptyCategoriesTab();

    if (shouldShowDebugBadge()) showDebugBadge();
    if (shouldShowTestPanel()) ensurePanel();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
