/* VMF assets v0.2.4 - Comprehensive UK Location Classification */
(() => {
  const v = "v0.2.4";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);

  try {
    const qs = new URLSearchParams(location.search || "");
    const hash = (location.hash || "");
    const hasDebugParam = qs.get("vmf_debug") === "1" || hash.includes("vmf_debug=1");
    if (hasDebugParam) localStorage.setItem("vmf_debug", "1");
    const debug = hasDebugParam || localStorage.getItem("vmf_debug") === "1";
    if (debug) {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();

/*! VMF-AUTOHOOK v0.2.4
    Comprehensive UK location classification with proper proximity radii
    Based on ONS 2024 population data
    
    PROXIMITY POLICY:
    - Full postcode: 5mi (pinpoint location)
    - Outcode: 8mi (postal district)
    - Town (<200k pop): 10mi
    - Large city (200k-500k): 12mi  
    - Major city (500k+): 15mi
    - Greater metro region: 20mi
    - Region/County search: 25mi
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.4';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;
  
  console.log('[VMF] AUTOHOOK initializing:', VERSION);

  // ============ PROXIMITY POLICY ============
  var POLICY = {
    FULL_POSTCODE_MI: 5,
    OUTCODE_MI: 8,
    TOWN_MI: 10,
    LARGE_CITY_MI: 12,
    MAJOR_CITY_MI: 15,
    GREATER_METRO_MI: 20,
    REGION_MI: 25
  };

  // ============ UK LOCATION DATA ============
  
  // Greater Metro Regions - massive urban sprawls (20mi radius)
  // These are multi-city conurbations where user could be anywhere in a 30+ mile area
  var GREATER_METROS = [
    'greater london', 'london',
    'greater manchester', 'gtr manchester',
    'west midlands', 'west midlands conurbation',
    'west yorkshire',
    'south yorkshire', 
    'merseyside',
    'tyneside', 'tyne and wear',
    'greater glasgow', 'clydeside'
  ];
  
  // Major Cities - 500k+ population (15mi radius)
  // Source: ONS 2024 population estimates
  var MAJOR_CITIES = [
    'birmingham',      // 1.1M
    'glasgow',         // 620k
    'leeds',           // 536k
    'edinburgh',       // 512k
    'liverpool',       // 486k
    'sheffield',       // 480k
    'manchester',      // 473k
    'bristol'          // 467k
  ];
  
  // Large Cities - 200k-500k population (12mi radius)
  var LARGE_CITIES = [
    'leicester',       // 380k
    'coventry',        // 345k
    'bradford',        // 346k (but part of West Yorkshire metro)
    'cardiff',         // 360k
    'belfast',         // 340k
    'nottingham',      // 330k
    'kingston upon hull', 'hull', // 285k
    'newcastle upon tyne', 'newcastle', // 280k
    'stoke-on-trent', 'stoke', // 270k
    'southampton',     // 260k
    'derby',           // 260k
    'portsmouth',      // 240k
    'brighton', 'brighton and hove', // 230k
    'plymouth',        // 265k
    'wolverhampton',   // 265k
    'reading',         // 230k
    'luton',           // 225k
    'aberdeen',        // 230k
    'middlesbrough',   // 200k
    'bolton',          // 200k
    'sunderland',      // 190k
    'swansea',         // 245k
    'dundee',          // 150k (but major Scottish city)
    'milton keynes',   // 230k
    'northampton',     // 225k
    'warrington',      // 210k
    'stockport',       // 295k
    'dudley',          // 195k
    'rotherham',       // 265k
    'wigan',           // 330k
    'wakefield',       // 350k
    'barnsley',        // 245k
    'doncaster',       // 310k
    'york',            // 210k
    'oldham',          // 235k
    'rochdale',        // 220k
    'salford',         // 275k
    'st helens',       // 180k
    'walsall',         // 285k
    'sandwell',        // 340k
    'sefton',          // 280k
    'wirral',          // 325k
    'tameside',        // 230k
    'trafford',        // 235k
    'blackburn',       // 150k
    'burnley',         // 90k
    'blackpool',       // 140k (but major resort)
    'preston',         // 145k
    'peterborough',    // 215k
    'cambridge',       // 145k (but significant city)
    'oxford',          // 155k (but significant city)
    'ipswich',         // 140k
    'norwich'          // 145k
  ];
  
  // UK Regions and Counties (25mi radius)
  var REGIONS = [
    // English regions
    'north east', 'north west', 'yorkshire', 'east midlands', 'west midlands region',
    'east of england', 'south east', 'south west',
    
    // Counties
    'yorkshire', 'west yorkshire', 'north yorkshire', 'south yorkshire', 'east yorkshire',
    'lancashire', 'cheshire', 'derbyshire', 'nottinghamshire', 'lincolnshire',
    'leicestershire', 'northamptonshire', 'warwickshire', 'staffordshire',
    'shropshire', 'herefordshire', 'worcestershire',
    'kent', 'essex', 'sussex', 'east sussex', 'west sussex', 'surrey', 
    'hampshire', 'berkshire', 'buckinghamshire', 'oxfordshire', 'hertfordshire',
    'bedfordshire', 'cambridgeshire', 'norfolk', 'suffolk',
    'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire', 'gloucestershire',
    'northumberland', 'durham', 'cumbria',
    
    // Nations/regions
    'wales', 'scotland', 'northern ireland',
    'highlands', 'lowlands', 'midlands',
    
    // Common suffixes
    'shire', 'county'
  ];

  var URL_KEYS = {
    PROX: 'proximity',
    LAT: 'lat',
    LNG: 'lng',
    LOCATION: 'location',
    REGION: 'region'
  };

  // ============ UTILS ============
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
      if (cls.indexOf('explore') > -1 || cls.indexOf('archive') > -1 ||
          cls.indexOf('listing') > -1 || cls.indexOf('directory') > -1) {
        return true;
      }
    }
    if ($('.c27-explore-listings') || $('.explore-listings') || 
        $('#c27-explore-map') || $('.finder-listings')) {
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
    return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // ============ LOCATION TYPE DETECTION ============
  
  function isOutcode(s) {
    s = normalize(s).toUpperCase();
    // UK outcode: 1-2 letters, 1-2 digits, optional letter
    // Examples: E1, SW1, SW1A, M1, LS1
    return /^[A-Z]{1,2}\d[A-Z\d]?$/.test(s);
  }

  function isFullPostcode(s) {
    s = normalize(s).toUpperCase();
    // UK full postcode: outcode + space + digit + 2 letters
    // Examples: SW1A 1AA, LS1 4AP, M1 1AA
    return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(s);
  }

  function isGreaterMetro(loc) {
    loc = normalize(loc);
    for (var i = 0; i < GREATER_METROS.length; i++) {
      if (loc === GREATER_METROS[i] || loc.indexOf(GREATER_METROS[i]) === 0) {
        console.log('[VMF] Greater Metro match:', loc, '→', GREATER_METROS[i]);
        return true;
      }
    }
    return false;
  }

  function isMajorCity(loc) {
    loc = normalize(loc);
    for (var i = 0; i < MAJOR_CITIES.length; i++) {
      if (loc === MAJOR_CITIES[i] || loc.indexOf(MAJOR_CITIES[i]) === 0) {
        console.log('[VMF] Major City match:', loc, '→', MAJOR_CITIES[i]);
        return true;
      }
    }
    return false;
  }

  function isLargeCity(loc) {
    loc = normalize(loc);
    for (var i = 0; i < LARGE_CITIES.length; i++) {
      if (loc === LARGE_CITIES[i] || loc.indexOf(LARGE_CITIES[i]) === 0) {
        console.log('[VMF] Large City match:', loc, '→', LARGE_CITIES[i]);
        return true;
      }
    }
    return false;
  }

  function isRegion(loc) {
    loc = normalize(loc);
    for (var i = 0; i < REGIONS.length; i++) {
      if (loc.indexOf(REGIONS[i]) > -1) {
        console.log('[VMF] Region match:', loc, '→', REGIONS[i]);
        return true;
      }
    }
    return false;
  }

  // ============ PROXIMITY CALCULATION ============
  
  function desiredMiles() {
    var qs = getQS();
    var loc = qs.get(URL_KEYS.LOCATION);
    var region = qs.get(URL_KEYS.REGION);

    console.log('[VMF] desiredMiles: location="' + loc + '", region="' + region + '"');

    // Region param explicitly set → region radius
    if (region && normalize(region)) {
      console.log('[VMF] → Region param set, returning', POLICY.REGION_MI);
      return POLICY.REGION_MI;
    }

    var locNorm = normalize(loc);
    if (!locNorm) {
      console.log('[VMF] → No location, returning null');
      return null;
    }

    // Check in order of specificity
    if (isFullPostcode(loc)) {
      console.log('[VMF] → Full postcode, returning', POLICY.FULL_POSTCODE_MI);
      return POLICY.FULL_POSTCODE_MI;
    }
    
    if (isOutcode(loc)) {
      console.log('[VMF] → Outcode, returning', POLICY.OUTCODE_MI);
      return POLICY.OUTCODE_MI;
    }
    
    if (isRegion(locNorm)) {
      console.log('[VMF] → Region name, returning', POLICY.REGION_MI);
      return POLICY.REGION_MI;
    }
    
    if (isGreaterMetro(locNorm)) {
      console.log('[VMF] → Greater Metro, returning', POLICY.GREATER_METRO_MI);
      return POLICY.GREATER_METRO_MI;
    }
    
    if (isMajorCity(locNorm)) {
      console.log('[VMF] → Major City, returning', POLICY.MAJOR_CITY_MI);
      return POLICY.MAJOR_CITY_MI;
    }
    
    if (isLargeCity(locNorm)) {
      console.log('[VMF] → Large City, returning', POLICY.LARGE_CITY_MI);
      return POLICY.LARGE_CITY_MI;
    }
    
    // Default: treat as town
    console.log('[VMF] → Town (default), returning', POLICY.TOWN_MI);
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
    
    if (!isExp) return false;
    
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

  // ============ MOBILE MAP VIEW ============
  
  function isMobile() {
    return window.innerWidth < 768;
  }

  function forceMapViewOnMobile() {
    if (!isMobile()) return;
    if (!isExplore()) return;
    
    var mapToggle = $('button[data-view="map"], a[data-view="map"], .map-toggle');
    if (mapToggle) {
      try {
        mapToggle.click();
        console.log('[VMF] Clicked map toggle for mobile');
      } catch (_) {}
    }
  }

  // ============ QA PANEL ============
  
  function ensurePanel() {
    var wrap = document.createElement('div');
    wrap.id = 'vmf-test-panel';
    wrap.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:999999;background:#fff;color:#111;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:12px;min-width:300px;max-width:400px;box-shadow:0 10px 30px rgba(0,0,0,.15);font:11px/1.4 system-ui, -apple-system, sans-serif;';
    wrap.innerHTML =
      '<div style="font-weight:700;margin-bottom:8px;font-size:12px;">VMF Test Runner — ' + VERSION + '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
        '<button id="vmf-run" style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;background:#111;color:#fff;cursor:pointer;font-size:11px;">Run</button>' +
        '<button id="vmf-copy" style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;background:#fff;color:#111;cursor:pointer;font-size:11px;">Copy</button>' +
      '</div>' +
      '<pre id="vmf-out" style="white-space:pre-wrap;max-height:300px;overflow:auto;margin:0;padding:10px;border-radius:8px;background:#f5f5f5;border:1px solid #e0e0e0;font-size:10px;line-height:1.5;"></pre>';
    document.documentElement.appendChild(wrap);

    var out = $('#vmf-out', wrap);
    var run = $('#vmf-run', wrap);
    var copy = $('#vmf-copy', wrap);

    function suite() {
      var lines = [];
      var qs = getQS();
      var loc = qs.get('location') || '';
      var locNorm = normalize(loc);
      
      lines.push('=== VMF DIAGNOSTIC ===');
      lines.push('VERSION: ' + VERSION);
      lines.push('URL: ' + window.location.href);
      lines.push('');
      lines.push('=== LOCATION ===');
      lines.push('Raw: "' + loc + '"');
      lines.push('Normalized: "' + locNorm + '"');
      lines.push('Region param: "' + (qs.get('region') || '') + '"');
      lines.push('');
      lines.push('=== CLASSIFICATION ===');
      lines.push('isFullPostcode: ' + isFullPostcode(loc));
      lines.push('isOutcode: ' + isOutcode(loc));
      lines.push('isRegion: ' + isRegion(locNorm));
      lines.push('isGreaterMetro: ' + isGreaterMetro(locNorm));
      lines.push('isMajorCity: ' + isMajorCity(locNorm));
      lines.push('isLargeCity: ' + isLargeCity(locNorm));
      lines.push('');
      lines.push('=== PROXIMITY ===');
      var want = desiredMiles();
      var cur = currentMiles();
      lines.push('Expected: ' + (want == null ? 'n/a' : want + 'mi'));
      lines.push('Current: ' + (cur == null ? 'n/a' : cur + 'mi'));
      lines.push('Match: ' + (want === cur ? '✓ YES' : '✗ NO'));
      lines.push('');
      lines.push('=== POLICY ===');
      lines.push('Postcode: ' + POLICY.FULL_POSTCODE_MI + 'mi');
      lines.push('Outcode: ' + POLICY.OUTCODE_MI + 'mi');
      lines.push('Town: ' + POLICY.TOWN_MI + 'mi');
      lines.push('Large City: ' + POLICY.LARGE_CITY_MI + 'mi');
      lines.push('Major City: ' + POLICY.MAJOR_CITY_MI + 'mi');
      lines.push('Greater Metro: ' + POLICY.GREATER_METRO_MI + 'mi');
      lines.push('Region: ' + POLICY.REGION_MI + 'mi');

      return lines;
    }

    function runSuite() { out.textContent = suite().join('\n'); }

    run.addEventListener('click', runSuite);
    copy.addEventListener('click', function () {
      try { navigator.clipboard.writeText(out.textContent || ''); } catch (_) {}
    });

    runSuite();
  }

  // ============ UI TWEAKS ============
  
  function hideEmptyCategoriesTab() {
    try {
      var tabLinks = $all('.tabs-menu a');
      tabLinks.forEach(function (a) {
        var t = normalize(a.textContent);
        if (t !== 'categories' && t !== 'category') return;
        var href = a.getAttribute('href') || '';
        if (!href || href.charAt(0) !== '#') return;
        var pane = $(href);
        if (!pane) return;
        var has = !!(pane.querySelector('a, li, .tag, .category'));
        if (!has) {
          var li = a.closest('li');
          if (li) li.style.display = 'none';
        }
      });
    } catch (_) {}
  }

  function shouldShowDebugBadge() {
    try {
      return getQS().get('vmfdebug') === '1';
    } catch (_) { return false; }
  }

  function showDebugBadge() {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;z-index:999999;left:12px;bottom:12px;padding:8px 10px;border-radius:10px;background:#111;color:#fff;font:12px/1.2 system-ui;opacity:.92;pointer-events:none;';
    el.textContent = VERSION;
    document.documentElement.appendChild(el);
  }

  function shouldShowTestPanel() {
    try {
      return getQS().get('vmftest') === '1';
    } catch (_) { return false; }
  }

  // ============ BOOT ============
  
  function boot() {
    console.log('[VMF] Boot:', VERSION, 'URL:', window.location.href);
    
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
        }
      }
    }

    forceMapViewOnMobile();
    hideEmptyCategoriesTab();
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
