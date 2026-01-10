/* VMF assets v0.2.5 - Geographic-Based Proximity */
(() => {
  const v = "v0.2.5";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);
  try {
    const qs = new URLSearchParams(location.search || "");
    const hash = (location.hash || "");
    const hasDebugParam = qs.get("vmf_debug") === "1" || hash.includes("vmf_debug=1");
    if (hasDebugParam) localStorage.setItem("vmf_debug", "1");
    if (hasDebugParam || localStorage.getItem("vmf_debug") === "1") {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();

/*! VMF-AUTOHOOK v0.2.5
    Geographic-based proximity policy
    
    PROXIMITY BY GEOGRAPHIC COVERAGE:
    - Full postcode: 3mi (street-level, want nearest)
    - Outcode: 5mi (postal district ~5 sq mi urban avg)
    - Town (<200k): 8mi (typical town diameter)
    - Small city (200k-400k): 10mi (~20-50 sq mi)
    - Large city (400k-700k): 12mi (~50-150 sq mi)
    - Major city (700k+): 15mi (Leeds, Birmingham ~80-100 sq mi)
    - Greater metro / Region: 20mi (practical cap)
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.5';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;
  console.log('[VMF] AUTOHOOK initializing:', VERSION);

  // ============ PROXIMITY POLICY (GEOGRAPHIC) ============
  var POLICY = {
    FULL_POSTCODE: 3,
    OUTCODE: 5,
    TOWN: 8,
    SMALL_CITY: 10,
    LARGE_CITY: 12,
    MAJOR_CITY: 15,
    METRO_CAP: 20
  };

  // ============ UK LOCATION DATA ============
  
  // Greater Metros - 20mi cap (massive sprawl, 200+ sq mi)
  var GREATER_METROS = [
    'greater london', 'london', 'central london',
    'greater manchester',
    'west midlands',
    'west yorkshire',
    'merseyside',
    'south yorkshire',
    'tyneside', 'tyne and wear'
  ];
  
  // Major Cities - 15mi (700k+ pop, ~80-150 sq mi)
  var MAJOR_CITIES = [
    'birmingham',    // 1.1M, ~103 sq mi
    'glasgow',       // 620k, ~68 sq mi (but dense)
    'leeds',         // 536k, ~85 sq mi
    'liverpool',     // 486k, ~43 sq mi
    'sheffield',     // 480k, ~142 sq mi
    'manchester',    // 473k, ~116 sq mi
    'edinburgh',     // 512k, ~101 sq mi
    'bristol'        // 467k, ~43 sq mi
  ];
  
  // Large Cities - 12mi (400k-700k pop, ~50-100 sq mi)
  var LARGE_CITIES = [
    'leicester', 'coventry', 'cardiff', 'belfast',
    'nottingham', 'newcastle', 'newcastle upon tyne',
    'southampton', 'portsmouth', 'plymouth', 'brighton',
    'wolverhampton', 'stoke', 'stoke-on-trent', 'derby',
    'swansea', 'aberdeen', 'dundee'
  ];
  
  // Small Cities - 10mi (200k-400k pop, ~20-50 sq mi)
  var SMALL_CITIES = [
    'reading', 'luton', 'milton keynes', 'northampton',
    'peterborough', 'cambridge', 'oxford', 'ipswich', 'norwich',
    'hull', 'kingston upon hull', 'middlesbrough', 'bolton',
    'sunderland', 'warrington', 'stockport', 'york',
    'blackpool', 'preston', 'blackburn', 'burnley',
    'wakefield', 'barnsley', 'doncaster', 'rotherham',
    'wigan', 'oldham', 'rochdale', 'salford',
    'dudley', 'walsall', 'wolverhampton'
  ];
  
  // Regions/Counties - 20mi cap
  var REGIONS = [
    'yorkshire', 'lancashire', 'cheshire', 'derbyshire', 'nottinghamshire',
    'leicestershire', 'northamptonshire', 'warwickshire', 'staffordshire',
    'kent', 'essex', 'sussex', 'surrey', 'hampshire', 'berkshire',
    'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire',
    'norfolk', 'suffolk', 'cambridgeshire',
    'northumberland', 'durham', 'cumbria',
    'wales', 'scotland', 'northern ireland',
    'shire', 'county', 'region'
  ];

  // ============ UTILS ============
  function $(sel) { try { return document.querySelector(sel); } catch (_) { return null; } }
  function $all(sel) { try { return Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (_) { return []; } }

  function getQS() {
    try { return new URLSearchParams(window.location.search || ''); }
    catch (_) { return new URLSearchParams(''); }
  }

  function setQS(qs) {
    return window.location.origin + window.location.pathname + 
           (qs.toString() ? '?' + qs.toString() : '') + 
           (window.location.hash || '');
  }

  function normalize(s) {
    return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function isExplore() {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/van-mot-garage') > -1) return true;
    var qs = getQS();
    if (qs.get('lat') || qs.get('lng') || qs.get('location') || qs.get('region')) return true;
    return false;
  }

  // ============ LOCATION DETECTION ============
  
  function isFullPostcode(s) {
    return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(normalize(s).toUpperCase());
  }

  function isOutcode(s) {
    return /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(normalize(s).toUpperCase());
  }

  function matchesList(loc, list) {
    loc = normalize(loc);
    for (var i = 0; i < list.length; i++) {
      if (loc === list[i] || loc.indexOf(list[i]) === 0) {
        console.log('[VMF] Match:', loc, '→', list[i]);
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
    var loc = qs.get('location') || '';
    var region = qs.get('region') || '';

    console.log('[VMF] desiredMiles: loc="' + loc + '", region="' + region + '"');

    // Region param = 20mi cap
    if (region && normalize(region)) {
      console.log('[VMF] → Region param, returning', POLICY.METRO_CAP);
      return POLICY.METRO_CAP;
    }

    if (!loc) return null;

    // Check in order
    if (isFullPostcode(loc)) {
      console.log('[VMF] → Full postcode:', POLICY.FULL_POSTCODE);
      return POLICY.FULL_POSTCODE;
    }
    if (isOutcode(loc)) {
      console.log('[VMF] → Outcode:', POLICY.OUTCODE);
      return POLICY.OUTCODE;
    }
    if (isRegion(loc)) {
      console.log('[VMF] → Region name:', POLICY.METRO_CAP);
      return POLICY.METRO_CAP;
    }
    if (matchesList(loc, GREATER_METROS)) {
      console.log('[VMF] → Greater metro:', POLICY.METRO_CAP);
      return POLICY.METRO_CAP;
    }
    if (matchesList(loc, MAJOR_CITIES)) {
      console.log('[VMF] → Major city:', POLICY.MAJOR_CITY);
      return POLICY.MAJOR_CITY;
    }
    if (matchesList(loc, LARGE_CITIES)) {
      console.log('[VMF] → Large city:', POLICY.LARGE_CITY);
      return POLICY.LARGE_CITY;
    }
    if (matchesList(loc, SMALL_CITIES)) {
      console.log('[VMF] → Small city:', POLICY.SMALL_CITY);
      return POLICY.SMALL_CITY;
    }
    
    // Default: town
    console.log('[VMF] → Town (default):', POLICY.TOWN);
    return POLICY.TOWN;
  }

  function currentMiles() {
    var prox = parseFloat(getQS().get('proximity'));
    return isFinite(prox) ? prox : null;
  }

  function shouldRedirect() {
    if (!isExplore()) return false;
    var want = desiredMiles();
    if (want == null) return false;
    var cur = currentMiles();
    if (cur == null) return true;
    return Math.round(cur) !== Math.round(want);
  }

  function onceKey(url) {
    try {
      var u = new URL(url);
      return 'VMF_ONCE::' + u.pathname + u.search;
    } catch (_) {
      return 'VMF_ONCE::' + url;
    }
  }

  // ============ BOOT ============
  
  function boot() {
    console.log('[VMF] Boot:', VERSION);
    
    if (shouldRedirect()) {
      var qs = getQS();
      var want = desiredMiles();
      qs.set('proximity', String(want));
      var url = setQS(qs);
      var k = onceKey(url);
      
      try {
        if (sessionStorage.getItem(k) !== '1') {
          sessionStorage.setItem(k, '1');
          console.log('[VMF] Redirecting to:', url);
          window.location.replace(url);
          return;
        }
      } catch (_) {}
    }

    // QA Panel
    if (getQS().get('vmftest') === '1') {
      var panel = document.createElement('div');
      panel.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:999999;background:#fff;padding:12px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.2);font:11px/1.4 system-ui;max-width:320px;';
      var loc = getQS().get('location') || '';
      var want = desiredMiles();
      var cur = currentMiles();
      panel.innerHTML = '<b>VMF ' + VERSION + '</b><br>' +
        'Location: ' + (loc || '(none)') + '<br>' +
        'Expected: ' + (want || 'n/a') + 'mi<br>' +
        'Current: ' + (cur || 'n/a') + 'mi<br>' +
        'Match: ' + (want === cur ? '✓' : '✗');
      document.body.appendChild(panel);
    }

    console.log('[VMF] Boot complete');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
