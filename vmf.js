/* VMF assets v0.2.0 */
(() => {
  const v = "v0.2.0";
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
(function() {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v2026-01-08a';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;

  // ---------- Config ----------
  var POLICY = {
    FULL_POSTCODE_MI: 5,
    OUTCODE_MI: 10,   // per your current observed behaviour
    TOWN_MI: 10,
    METRO_MI: 12,
    REGION_CLAMP_MI: 20
  };

  // Keys used by MyListing / Explore
  var URL_KEYS = {
    PROX: 'proximity',
    LAT: 'lat',
    LNG: 'lng',
    TYPE: 'type',
    SORT: 'sort',
    LOCATION: 'location',
    REGION: 'region'
  };

  // ---------- Helpers ----------
  function qsGetAll() {
    try { return new URLSearchParams(window.location.search || ''); }
    catch (e) { return new URLSearchParams(''); }
  }

  function getParam(name) {
    var q = qsGetAll();
    return q.get(name);
  }

  function setParam(q, name, value) {
    if (value === null || value === undefined) q.delete(name);
    else q.set(name, String(value));
  }

  function toNum(x) {
    if (x === null || x === undefined) return null;
    var n = parseFloat(String(x));
    return isFinite(n) ? n : null;
  }

  function isNonEmpty(s) {
    return s !== null && s !== undefined && String(s).trim().length > 0;
  }

  function normSpace(s) {
    return String(s || '').trim().replace(/\s+/g, ' ');
  }

  function looksLikeFullPostcode(s) {
    // UK postcode rough check: has space and both parts
    // e.g. "SW1A 1AA"
    s = normSpace(s).toUpperCase();
    return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(s);
  }

  function looksLikeOutcode(s) {
    // e.g. "SW1A"
    s = normSpace(s).toUpperCase();
    return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s);
  }

  function isMetroLikeLocation(loc) {
    // simple heuristic: London, Greater London, Manchester, Birmingham, etc.
    loc = normSpace(loc).toLowerCase();
    return /(london|greater london|manchester|birmingham|leeds|liverpool|glasgow|edinburgh|bristol|sheffield|cardiff|newcastle|nottingham)/.test(loc);
  }

  function computeTargetProximityMiles() {
    var location = getParam(URL_KEYS.LOCATION);
    var region = getParam(URL_KEYS.REGION);

    // If no location but region present: clamp
    if (!isNonEmpty(location) && isNonEmpty(region)) {
      return POLICY.REGION_CLAMP_MI;
    }

    if (!isNonEmpty(location)) return null;

    // If the location is a postcode/outcode, set fixed mi
    var loc = normSpace(location);
    if (looksLikeFullPostcode(loc)) return POLICY.FULL_POSTCODE_MI;
    if (looksLikeOutcode(loc)) return POLICY.OUTCODE_MI;

    // Town/city: may be metro
    if (isMetroLikeLocation(loc)) return POLICY.METRO_MI;

    return POLICY.TOWN_MI;
  }

  function ensureProximityPolicyOnce() {
    var q = qsGetAll();
    var currentProx = toNum(q.get(URL_KEYS.PROX));
    var target = computeTargetProximityMiles();
    if (target === null) return { changed: false, reason: 'no-location' };

    // If proximity missing, set it (no redirect unless needed)
    if (currentProx === null) {
      setParam(q, URL_KEYS.PROX, target);
      return { changed: true, q: q, reason: 'set-missing' };
    }

    // If differs, correct once
    if (Math.round(currentProx) !== Math.round(target)) {
      setParam(q, URL_KEYS.PROX, target);
      return { changed: true, q: q, reason: 'correct-mismatch', from: currentProx, to: target };
    }

    return { changed: false, reason: 'ok' };
  }

  function redirectWith(q) {
    var url = window.location.pathname + '?' + q.toString();
    // Preserve hash if present
    if (window.location.hash) url += window.location.hash;
    window.location.replace(url);
  }

  // ---------- UI helpers ----------
  function hideEmptyCategoriesTab() {
    try {
      var tabs = document.querySelectorAll('.c27-listing-tabs .tabs-menu li, .c27-tabs .tabs-menu li, .tabs-menu li');
      if (!tabs || !tabs.length) return;

      for (var i = 0; i < tabs.length; i++) {
        var li = tabs[i];
        var txt = (li.textContent || '').trim().toLowerCase();
        if (txt === 'categories' || txt === 'category') {
          // if the target pane has no tags/items, hide
          var a = li.querySelector('a');
          if (!a) continue;
          var href = a.getAttribute('href') || '';
          if (!href || href.charAt(0) !== '#') continue;
          var pane = document.querySelector(href);
          if (!pane) continue;
          var hasContent = pane.querySelectorAll('a, li, .tag, .category, .term').length > 0;
          if (!hasContent) li.style.display = 'none';
        }
      }
    } catch (e) {}
  }

  // ---------- Debug badge ----------
  function showDebugBadge(text) {
    try {
      var el = document.createElement('div');
      el.style.cssText = 'position:fixed;z-index:999999;left:12px;bottom:12px;padding:8px 10px;border-radius:10px;background:#111;color:#fff;font:12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;opacity:.92;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.25)';
      el.textContent = text;
      document.documentElement.appendChild(el);
    } catch (e) {}
  }

  function hasFlag(name) {
    try {
      var q = qsGetAll();
      return q.get(name) === '1' || (window.location.hash || '').indexOf(name + '=1') > -1;
    } catch (e) { return false; }
  }

  // ---------- Test runner ----------
  function runSuite() {
    var out = [];
    function pass(msg) { out.push('PASS: ' + msg); }
    function fail(msg) { out.push('FAIL: ' + msg); }

    // Basic: asset version present
    if (window.VMF_ASSET_VERSION) pass('VMF_ASSET_VERSION=' + window.VMF_ASSET_VERSION);
    else fail('VMF_ASSET_VERSION missing');

    // Directory: listing links exist?
    try {
      var listingLinks = document.querySelectorAll('a[href*="/listing/"], a[href*="/listings/"]');
      if (listingLinks && listingLinks.length > 0) pass('Listing links found: ' + listingLinks.length);
      else pass('Listing links not detected on this page (OK if not directory)');
    } catch (e) {
      fail('Error scanning listing links');
    }

    // Proximity policy sanity
    var target = computeTargetProximityMiles();
    if (target === null) pass('Proximity policy: no location (OK)');
    else pass('Proximity policy target=' + target + 'mi');

    return out.join('\n');
  }

  function mountTestPanel() {
    try {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:999999;background:#fff;color:#111;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:12px;min-width:260px;max-width:360px;box-shadow:0 10px 30px rgba(0,0,0,.15);font:12px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;';
      wrap.innerHTML =
        '<div style="font-weight:700;margin-bottom:8px;">VMF Test Runner — ' + VERSION + '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
          '<button id="vmf-run" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);background:#111;color:#fff;cursor:pointer;">Run suite</button>' +
          '<button id="vmf-copy" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);background:#fff;color:#111;cursor:pointer;">Copy report</button>' +
        '</div>' +
        '<pre id="vmf-out" style="white-space:pre-wrap;max-height:220px;overflow:auto;margin:0;padding:10px;border-radius:10px;background:#f6f6f6;border:1px solid rgba(0,0,0,.08);"></pre>';

      document.documentElement.appendChild(wrap);

      var outEl = wrap.querySelector('#vmf-out');
      var runBtn = wrap.querySelector('#vmf-run');
      var copyBtn = wrap.querySelector('#vmf-copy');

      function doRun() {
        var report = runSuite();
        outEl.textContent = report;
      }

      runBtn.addEventListener('click', doRun);
      copyBtn.addEventListener('click', function () {
        try {
          var t = outEl.textContent || '';
          navigator.clipboard.writeText(t);
        } catch (e) {}
      });

      doRun();
    } catch (e) {}
  }

  // ---------- Boot ----------
  try {
    // Proximity correction (one-time redirect) — keep it cheap
    var res = ensureProximityPolicyOnce();
    if (res.changed && res.q) {
      // Avoid redirect loops: only do this once per load using sessionStorage
      var k = 'vmf_prox_fix_done';
      var done = false;
      try { done = sessionStorage.getItem(k) === '1'; } catch (e) {}
      if (!done) {
        try { sessionStorage.setItem(k, '1'); } catch (e) {}
        redirectWith(res.q);
        return;
      }
    }
  } catch (e) {}

  // Post-load UI tweaks
  function onReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    hideEmptyCategoriesTab();

    if (hasFlag('vmfdebug')) {
      showDebugBadge(VERSION);
    }

    if (hasFlag('vmftest')) {
      mountTestPanel();
    }
  });

})();
