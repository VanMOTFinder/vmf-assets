/* VMF assets v0.2.8 - Forced Redirect */
(() => {
  const v = "v0.2.8";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);
  try {
    if (new URLSearchParams(location.search).get("vmf_debug") === "1" || location.hash.includes("vmf_debug=1")) {
      localStorage.setItem("vmf_debug", "1");
    }
    if (localStorage.getItem("vmf_debug") === "1") {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();

/*! VMF-AUTOHOOK v0.2.8
    Strategy: When user selects location, redirect to URL with correct proximity
    This forces MyListing to use our proximity value
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.8';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;
  console.log('[VMF] AUTOHOOK initializing:', VERSION);

  // ============ PROXIMITY POLICY ============
  var POLICY = { FULL_POSTCODE: 3, OUTCODE: 5, TOWN: 8, SMALL_CITY: 10, LARGE_CITY: 12, MAJOR_CITY: 15, METRO_CAP: 20 };

  // ============ UK LOCATION DATA ============
  var GREATER_METROS = ['greater london', 'london', 'central london', 'greater manchester', 'west midlands', 'west yorkshire', 'merseyside', 'south yorkshire', 'tyneside', 'tyne and wear'];
  var MAJOR_CITIES = ['birmingham', 'glasgow', 'leeds', 'liverpool', 'sheffield', 'manchester', 'edinburgh', 'bristol'];
  var LARGE_CITIES = ['leicester', 'coventry', 'cardiff', 'belfast', 'nottingham', 'newcastle', 'newcastle upon tyne', 'southampton', 'portsmouth', 'plymouth', 'brighton', 'wolverhampton', 'stoke', 'stoke-on-trent', 'derby', 'swansea', 'aberdeen', 'dundee'];
  var SMALL_CITIES = ['reading', 'luton', 'milton keynes', 'northampton', 'peterborough', 'cambridge', 'oxford', 'ipswich', 'norwich', 'hull', 'kingston upon hull', 'middlesbrough', 'bolton', 'sunderland', 'warrington', 'stockport', 'york', 'blackpool', 'preston', 'blackburn', 'burnley', 'wakefield', 'barnsley', 'doncaster', 'rotherham', 'wigan', 'oldham', 'rochdale', 'salford', 'dudley', 'walsall'];
  var REGIONS = ['yorkshire', 'lancashire', 'cheshire', 'derbyshire', 'nottinghamshire', 'leicestershire', 'northamptonshire', 'warwickshire', 'staffordshire', 'kent', 'essex', 'sussex', 'surrey', 'hampshire', 'berkshire', 'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire', 'norfolk', 'suffolk', 'cambridgeshire', 'northumberland', 'durham', 'cumbria', 'wales', 'scotland', 'northern ireland', 'shire', 'county', 'region'];

  function normalize(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function isFullPostcode(s) { return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(s); }
  function isOutcode(s) { return /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(normalize(s).toUpperCase()); }
  function inList(loc, list) { loc = normalize(loc); for (var i = 0; i < list.length; i++) { if (loc === list[i] || loc.indexOf(list[i]) === 0) return true; } return false; }
  function hasRegion(loc) { loc = normalize(loc); for (var i = 0; i < REGIONS.length; i++) { if (loc.indexOf(REGIONS[i]) > -1) return true; } return false; }

  function getProximity(loc) {
    if (!loc || loc.length < 2) return POLICY.TOWN;
    console.log('[VMF] getProximity:', loc);
    if (isFullPostcode(loc)) { console.log('[VMF] → Postcode:', POLICY.FULL_POSTCODE); return POLICY.FULL_POSTCODE; }
    if (isOutcode(loc)) { console.log('[VMF] → Outcode:', POLICY.OUTCODE); return POLICY.OUTCODE; }
    if (hasRegion(loc)) { console.log('[VMF] → Region:', POLICY.METRO_CAP); return POLICY.METRO_CAP; }
    if (inList(loc, GREATER_METROS)) { console.log('[VMF] → Metro:', POLICY.METRO_CAP); return POLICY.METRO_CAP; }
    if (inList(loc, MAJOR_CITIES)) { console.log('[VMF] → Major:', POLICY.MAJOR_CITY); return POLICY.MAJOR_CITY; }
    if (inList(loc, LARGE_CITIES)) { console.log('[VMF] → Large:', POLICY.LARGE_CITY); return POLICY.LARGE_CITY; }
    if (inList(loc, SMALL_CITIES)) { console.log('[VMF] → Small:', POLICY.SMALL_CITY); return POLICY.SMALL_CITY; }
    console.log('[VMF] → Town:', POLICY.TOWN);
    return POLICY.TOWN;
  }

  // ============ CHECK URL AND REDIRECT IF NEEDED ============
  function checkAndRedirect() {
    var url = new URL(window.location.href);
    var loc = url.searchParams.get('search_location') || url.searchParams.get('location') || '';
    var region = url.searchParams.get('region') || '';
    var currentProx = parseFloat(url.searchParams.get('proximity'));
    
    // Skip if no location in URL
    if (!loc && !region) {
      console.log('[VMF] No location in URL, skipping redirect check');
      return;
    }
    
    // Calculate desired proximity
    var wantProx = region ? POLICY.METRO_CAP : getProximity(loc);
    
    console.log('[VMF] URL check - loc:', loc, 'want:', wantProx, 'have:', currentProx);
    
    // If proximity is missing or wrong, redirect
    if (!currentProx || Math.round(currentProx) !== Math.round(wantProx)) {
      // Prevent infinite redirect loops
      var redirKey = 'VMF_R_' + loc.substring(0, 20);
      if (sessionStorage.getItem(redirKey)) {
        console.log('[VMF] Already redirected for this location, skipping');
        return;
      }
      sessionStorage.setItem(redirKey, '1');
      
      url.searchParams.set('proximity', wantProx);
      console.log('[VMF] *** REDIRECTING TO:', url.href);
      window.location.replace(url.href);
    }
  }

  // ============ BOOT ============
  function boot() {
    console.log('[VMF] Boot:', VERSION);
    
    // Check URL immediately - if there's a location but wrong proximity, redirect
    checkAndRedirect();
    
    console.log('[VMF] Boot complete');
  }

  // Run immediately - don't wait for DOMContentLoaded
  boot();
})();
