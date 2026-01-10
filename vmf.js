/* VMF assets v0.2.3 */
(() => {
  const v = "v0.2.3";
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

/*! VMF-AUTOHOOK v0.2.3
    FIXES:
    - Removed Leeds/West Yorkshire from metros (were incorrect)
    - Fixed region detection to trigger on ?region= param
    - Added extensive console logging for debugging
    - Proximity policy: postcode 5mi, outcode 10mi, town 10mi, metro 12mi, region 20mi
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.3';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;
  
  console.log('[VMF] AUTOHOOK initializing:', VERSION);

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
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/van-mot-garage') > -1 || 
        path.indexOf('/explore') > -1 || 
        path.indexOf('/listings') > -1 ||
        path.indexOf('/directory') > -1) {
      return true;
    }
    
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
    
    if ($('.c27-explore-listings') || 
        $('.explore-listings') || 
        $('#c27-explore-map') ||
        $('.finder-listings') ||
        $('[data-page="explore"]')) {
      return true;
    }
    
    var qs = getQS();
    if (qs.get('lat') || qs.get('lng') || qs.get('location') || qs.get('region')) {
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
    return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s);
  }

  function isFullPostcode(s) {
    s = normalize(s).toUpperCase();
    return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(s);
  }

  // FIXED: Only true UK metros - removed Leeds, West Yorkshire
  function isMetro(loc) {
    loc = normalize(loc).toLowerCase();
    var metros = [
      'london', 'greater london', 'central london', 'city of london',
      'manchester', 'greater manchester',
      'birmingham', 'west midlands',
      'liverpool', 'merseyside',
      'glasgow', 'greater glasgow',
      'edinburgh',
      'bristol',
      'sheffield', 'south yorkshire',
      'newcastle', 'tyne and wear', 'newcastle upon tyne',
      'nottingham',
      'leicester',
      'coventry'
    ];
    
    for (var i = 0; i < metros.length; i++) {
      if (loc === metros[i] || loc.indexOf(metros[i]) === 0) {
        console.log('[VMF] isMetro: "' + loc + '" matches metro "' + metros[i] + '"');
        return true;
      }
    }
    return false;
  }

  function isRegion(loc) {
    loc = normalize(loc).toLowerCase();
    var regions = [
      'yorkshire', 'west yorkshire', 'north yorkshire', 'south yorkshire', 'east yorkshire',
      'lancashire', 'cheshire', 'derbyshire', 'lincolnshire', 'nottinghamshire',
      'kent', 'essex', 'sussex', 'surrey', 'hampshire', 'berkshire', 'buckinghamshire',
      'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire', 'gloucestershire',
      'norfolk', 'suffolk', 'cambridgeshire', 'bedfordshire', 'hertfordshire',
      'oxfordshire', 'warwickshire', 'worcestershire', 'staffordshire', 'shropshire',
      'northumberland', 'durham', 'cumbria',
      'wales', 'scotland', 'northern ireland',
      'county', 'region', 'shire'
    ];
    
    for (var i = 0; i < regions.length; i++) {
      if (loc.indexOf(regions[i]) > -1) {
        console.log('[VMF] isRegion: "' + loc + '" matches region "' + regions[i] + '"');
        return true;
      }
    }
    return false;
  }

  function desiredMiles() {
    var qs = getQS();
    var loc = qs.get(URL_KEYS.LOCATION);
    var region = qs.get(URL_KEYS.REGION);

    console.log('[VMF] desiredMiles: location="' + loc + '", region="' + region + '"');

    // If region param is explicitly set, always use region proximity
    if (region && normalize(region)) {
      console.log('[VMF] Region param set, returning', POLICY.REGION_CLAMP_MI);
      return POLICY.REGION_CLAMP_MI;
    }

    loc = normalize(loc);
    if (!loc) {
      console.log('[VMF] No location, returning null');
      return null;
    }

    // Check in order of specificity
    if (isFullPostcode(loc)) {
      console.log('[VMF] Full postcode detected, returning', POLICY.FULL_POSTCODE_MI);
      return POLICY.FULL_POSTCODE_MI;
    }
    if (isOutcode(loc)) {
      console.log('[VMF] Outcode detected, returning', POLICY.OUTCODE_MI);
      return POLICY.OUTCODE_MI;
    }
    if (isRegion(loc)) {
      console.log('[VMF] Region detected, returning', POLICY.REGION_CLAMP_MI);
      return POLICY.REGION_CLAMP_MI;
    }
    if (isMetro(loc)) {
      console.log('[VMF] Metro detected, returning', POLICY.METRO_MI);
      return POLICY.METRO_MI;
    }
    
    // Default: treat as town
    console.log('[VMF] Town (default), returning', POLICY.TOWN_MI);
    return POLICY.TOWN_MI;
  }

  function currentMiles() {
    var qs = getQS();
    var prox = toNum(qs.get(URL_KEYS.PROX));
    console.log('[VMF] currentMiles:', prox);
    return prox;
  }

  function shouldRedirectFix() {
    var isExp = isExplore();
    console.log('[VMF] isExplore:', isExp);
    
    if (!isExp) {
      return false;
    }
    
    var want = desiredMiles();
    var cur = currentMiles();
    
    console.log('[VMF] shouldRedirectFix: want=' + want + ', cur=' + cur);
    
    if (want == null) return false;
    if (cur == null) return true;
    return Math.round(cur) !== Math.round(want);
  }

  function applyProximityFix() {
    var qs = getQS();
    var want = desiredMiles();
    if (want == null) return { did: false, why: 'no-target' };

    qs.set(URL_KEYS.PROX, String(want));
    var url = setQS(qs);
    console.log('[VMF] applyProximityFix: new URL =', url);
    return { did: true, url: url, want: want };
  }

  function onceKeyFor(url) {
    // Use just the path+search, not full URL, to avoid issues with hash
    try {
      var u = new URL(url);
      return 'VMF_PROX_ONCE::' + u.pathname + u.search;
    } catch (_) {
      return 'VMF_PROX_ONCE::' + String(url);
    }
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
    
    var mapToggle = $('button[data-view="map"], a[data-view="map"], .map-toggle, [aria-label*="map" i]');
    if (mapToggle) {
      try {
        mapToggle.click();
        console.log('[VMF] Clicked map toggle for mobile');
      } catch (_) {}
    }
    
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
    wrap.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:999999;background:#fff;color:#111;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:12px;min-width:280px;max-width:380px;box-shadow:0 10px 30px rgba(0,0,0,.15);font:12px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;';
    wrap.innerHTML =
      '<div style="font-weight:700;margin-bottom:8px;">VMF Test Runner — ' + VERSION + '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<button id="vmf-run" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);background:#111;color:#fff;cursor:pointer;">Run suite</button>' +
        '<button id="vmf-copy" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.15);background:#fff;color:#111;cursor:pointer;">Copy report</button>' +
      '</div>' +
      '<pre id="vmf-out" style="white-space:pre-wrap;max-height:260px;overflow:auto;margin:0;padding:10px;border-radius:10px;background:#f6f6f6;border:1px solid rgba(0,0,0,.08);font-size:11px;"></pre>';
    document.documentElement.appendChild(wrap);

    var out = $('#vmf-out', wrap);
    var run = $('#vmf-run', wrap);
    var copy = $('#vmf-copy', wrap);

    function report(lines) {
      out.textContent = (lines || []).join('\n');
    }

    function suite() {
      var lines = [];
      var qs = getQS();
      
      lines.push('VERSION=' + VERSION);
      lines.push('URL=' + window.location.href);
      lines.push('IS_EXPLORE=' + (isExplore() ? 'yes' : 'no'));
      lines.push('IS_MOBILE=' + (isMobile() ? 'yes' : 'no'));
      lines.push('');
      lines.push('LOCATION=' + (qs.get('location') || '(none)'));
      lines.push('REGION=' + (qs.get('region') || '(none)'));
      lines.push('');
      
      var loc = normalize(qs.get('location') || '');
      lines.push('isFullPostcode=' + isFullPostcode(loc));
      lines.push('isOutcode=' + isOutcode(loc));
      lines.push('isRegion=' + isRegion(loc));
      lines.push('isMetro=' + isMetro(loc));
      lines.push('');
      
      var want = desiredMiles();
      var cur = currentMiles();
      lines.push('PROX_WANT=' + (want == null ? 'n/a' : want));
      lines.push('PROX_CUR=' + (cur == null ? 'n/a' : cur));
      lines.push('PROX_MATCH=' + (want === cur ? 'YES ✓' : 'NO ✗'));

      var links = $all('a[href*="/listing/"]');
      lines.push('');
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
      var tabLinks = $all('.tabs-menu a, .c27-listing-tabs .tabs-menu a');
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
    console.log('[VMF] Boot:', VERSION, 'URL:', window.location.href);
    
    // 1) One-time proximity correction redirect
    if (shouldRedirectFix()) {
      var fix = applyProximityFix();
      if (fix.did) {
        var k = onceKeyFor(fix.url);
        console.log('[VMF] Once key:', k, 'wasOnce:', wasOnce(k));
        if (!wasOnce(k)) {
          markOnce(k);
          console.log('[VMF] REDIRECTING to:', fix.url);
          window.location.replace(fix.url);
          return;
        } else {
          console.log('[VMF] Skipping redirect (already done)');
        }
      }
    } else {
      console.log('[VMF] No redirect needed');
    }

    // 2) Mobile: force map view
    forceMapViewOnMobile();

    // 3) UI tweaks
    hideEmptyCategoriesTab();

    // 4) Debug / QA UIs
    if (shouldShowDebugBadge()) showDebugBadge();
    if (shouldShowTestPanel()) ensurePanel();
    
    console.log('[VMF] Boot complete');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
