/* VMF assets v0.2.2 */
(() => {
  const v = "v0.2.2";
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

/*! VMF-AUTOHOOK v0.2.2
    - Fixed isExplore() detection for MyListing theme
    - Proximity policy: postcode 5mi, outcode 10mi, town 10mi, metro 12mi, region 20mi
    - Mobile: default map view
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.2';
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

  // FIXED: More robust explore page detection for MyListing theme
  function isExplore() {
    // Check URL path
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/van-mot-garage') > -1 || 
        path.indexOf('/explore') > -1 || 
        path.indexOf('/listings') > -1 ||
        path.indexOf('/directory') > -1) {
      return true;
    }
    
    // Check body classes (various themes)
    var body = document.body;
    if (body) {
      var cls = body.className || '';
      if (cls.indexOf('explore') > -1 || 
          cls.indexOf('archive') > -1 ||
          cls.indexOf('listing') > -1 ||
          cls.indexOf('directory') > -1) {
        return true;
      }
    }
    
    // Check for explore-specific elements
    if ($('.c27-explore-listings') || 
        $('.explore-listings') || 
        $('#c27-explore-map') ||
        $('.finder-listings') ||
        $('[data-page="explore"]')) {
      return true;
    }
    
    // Check URL params that indicate explore/search
    var qs = getQS();
    if (qs.get('type') || qs.get('lat') || qs.get('lng') || qs.get('location')) {
      return true;
    }
    
    return false;
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
    // UK outcode: 1-2 letters, 1-2 digits, optional letter (e.g., SW1A, E1, W1)
    return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s);
  }

  function isFullPostcode(s) {
    s = normalize(s).toUpperCase();
    // UK full postcode with space or without (e.g., SW1A 1AA or SW1A1AA)
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
    // Major UK metro areas
    var metros = [
      'london', 'greater london', 'central london',
      'manchester', 'greater manchester',
      'birmingham', 'west midlands',
      'leeds', 'west yorkshire',
      'liverpool', 'merseyside',
      'glasgow', 'greater glasgow',
      'edinburgh',
      'bristol',
      'sheffield', 'south yorkshire',
      'cardiff',
      'newcastle', 'tyne and wear',
      'nottingham',
      'leicester',
      'coventry',
      'bradford'
    ];
    
    for (var i = 0; i < metros.length; i++) {
      if (loc.indexOf(metros[i]) > -1) return true;
    }
    return false;
  }

  function isRegion(loc) {
    loc = normalize(loc).toLowerCase();
    // UK counties/regions
    var regions = [
      'shire', 'county', 'region',
      'yorkshire', 'lancashire', 'cheshire', 'derbyshire',
      'kent', 'essex', 'sussex', 'surrey', 'hampshire',
      'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire',
      'norfolk', 'suffolk', 'cambridgeshire', 'lincolnshire',
      'wales', 'scotland', 'northern ireland'
    ];
    
    for (var i = 0; i < regions.length; i++) {
      if (loc.indexOf(regions[i]) > -1) return true;
    }
    return false;
  }

  function desiredMiles() {
    var qs = getQS();
    var loc = qs.get(URL_KEYS.LOCATION);
    var region = qs.get(URL_KEYS.REGION);

    // If region param is set (county-level search)
    if (region && normalize(region)) {
      return POLICY.REGION_CLAMP_MI;
    }

    loc = normalize(loc);
    if (!loc) return null;

    // Check location type in order of specificity
    if (isFullPostcode(loc)) return POLICY.FULL_POSTCODE_MI;
    if (isOutcode(loc)) return POLICY.OUTCODE_MI;
    if (isRegion(loc)) return POLICY.REGION_CLAMP_MI;
    if (isMetro(loc)) return POLICY.METRO_MI;
    if (hasTownishLocation(loc)) return POLICY.TOWN_MI;

    return null;
  }

  function currentMiles() {
    var qs = getQS();
    return toNum(qs.get(URL_KEYS.PROX));
  }

  function shouldRedirectFix() {
    if (!isExplore()) {
      console.log('[VMF] Not explore page, skipping proximity fix');
      return false;
    }
    
    var want = desiredMiles();
    console.log('[VMF] Desired proximity:', want);
    
    if (want == null) return false;
    
    var cur = currentMiles();
    console.log('[VMF] Current proximity:', cur);
    
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

  // ---------- Mobile: Force map view ----------
  function isMobile() {
    return window.innerWidth < 768;
  }

  function forceMapViewOnMobile() {
    if (!isMobile()) return;
    if (!isExplore()) return;
    
    // Try to click map toggle if list is showing
    var mapToggle = $('button[data-view="map"], a[data-view="map"], .map-toggle, [aria-label*="map" i]');
    if (mapToggle) {
      try {
        mapToggle.click();
        console.log('[VMF] Clicked map toggle for mobile');
      } catch (_) {}
    }
    
    // Also try to show map container directly
    var mapContainer = $('.explore-map, #c27-explore-map, .map-container, .c27-map');
    if (mapContainer) {
      mapContainer.style.display = 'block';
      mapContainer.style.visibility = 'visible';
    }
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
      lines.push('IS_EXPLORE=' + (isExplore() ? 'yes' : 'no'));
      lines.push('IS_MOBILE=' + (isMobile() ? 'yes' : 'no'));

      var qs = getQS();
      lines.push('LOCATION=' + (qs.get('location') || 'none'));
      lines.push('REGION=' + (qs.get('region') || 'none'));
      
      var want = desiredMiles();
      var cur = currentMiles();
      lines.push('PROX_WANT=' + (want == null ? 'n/a' : want));
      lines.push('PROX_CUR=' + (cur == null ? 'n/a' : cur));
      lines.push('PROX_MATCH=' + (want === cur ? 'YES' : 'NO'));

      var links = $all('a[href*="/listing/"]');
      lines.push('LISTING_LINKS=' + (links.length || 0));

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
    console.log('[VMF] Boot:', VERSION);
    console.log('[VMF] isExplore:', isExplore());
    
    // 1) One-time proximity correction redirect
    if (shouldRedirectFix()) {
      var fix = applyProximityFix();
      if (fix.did) {
        var k = onceKeyFor(fix.url);
        if (!wasOnce(k)) {
          markOnce(k);
          console.log('[VMF] Redirecting to fix proximity:', fix.url);
          window.location.replace(fix.url);
          return;
        }
      }
    }

    // 2) Mobile: force map view
    forceMapViewOnMobile();

    // 3) UI tweaks
    hideEmptyCategoriesTab();

    // 4) Debug / QA UIs
    if (shouldShowDebugBadge()) showDebugBadge();
    if (shouldShowTestPanel()) ensurePanel();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
