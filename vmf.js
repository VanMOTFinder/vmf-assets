/* VMF assets v0.2.9 */
(() => {
  const v = "v0.2.9";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);
  try {
    if (new URLSearchParams(location.search).get("vmf_debug") === "1" || location.hash.includes("vmf_debug=1")) localStorage.setItem("vmf_debug", "1");
    if (localStorage.getItem("vmf_debug") === "1") {
      const el = document.createElement("div");
      el.className = "vmf-asset-badge";
      el.textContent = `VMF assets ${v}`;
      document.documentElement.appendChild(el);
    }
  } catch (_) {}
})();

(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.9';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;
  console.log('[VMF] AUTOHOOK:', VERSION);

  var POLICY = { FULL_POSTCODE: 3, OUTCODE: 5, TOWN: 8, SMALL_CITY: 10, LARGE_CITY: 12, MAJOR_CITY: 15, METRO_CAP: 20 };

  // FIXED: Added england, scotland, wales, uk, britain
  var GREATER_METROS = ['greater london', 'london', 'central london', 'greater manchester', 'west midlands', 'west yorkshire', 'merseyside', 'south yorkshire', 'tyneside', 'tyne and wear'];
  var MAJOR_CITIES = ['birmingham', 'glasgow', 'leeds', 'liverpool', 'sheffield', 'manchester', 'edinburgh', 'bristol'];
  var LARGE_CITIES = ['leicester', 'coventry', 'cardiff', 'belfast', 'nottingham', 'newcastle', 'newcastle upon tyne', 'southampton', 'portsmouth', 'plymouth', 'brighton', 'wolverhampton', 'stoke', 'stoke-on-trent', 'derby', 'swansea', 'aberdeen', 'dundee'];
  var SMALL_CITIES = ['reading', 'luton', 'milton keynes', 'northampton', 'peterborough', 'cambridge', 'oxford', 'ipswich', 'norwich', 'hull', 'kingston upon hull', 'middlesbrough', 'bolton', 'sunderland', 'warrington', 'stockport', 'york', 'blackpool', 'preston', 'blackburn', 'burnley', 'wakefield', 'barnsley', 'doncaster', 'rotherham', 'wigan', 'oldham', 'rochdale', 'salford', 'dudley', 'walsall'];
  
  // COMPREHENSIVE REGIONS - includes countries, regions, counties
  var REGIONS = [
    // COUNTRIES
    'england', 'scotland', 'wales', 'northern ireland', 'united kingdom', 'uk', 'britain', 'great britain',
    // ENGLISH REGIONS
    'north east', 'north west', 'east midlands', 'west midlands region', 'east of england', 'south east', 'south west', 'east anglia',
    // COUNTIES
    'yorkshire', 'west yorkshire', 'north yorkshire', 'south yorkshire', 'east yorkshire',
    'lancashire', 'cheshire', 'derbyshire', 'nottinghamshire', 'lincolnshire',
    'leicestershire', 'northamptonshire', 'warwickshire', 'staffordshire', 'shropshire', 'herefordshire', 'worcestershire',
    'kent', 'essex', 'sussex', 'east sussex', 'west sussex', 'surrey', 'hampshire', 'berkshire', 'buckinghamshire', 'oxfordshire', 'hertfordshire', 'bedfordshire', 'cambridgeshire', 'norfolk', 'suffolk',
    'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire', 'gloucestershire',
    'northumberland', 'durham', 'cumbria', 'westmorland',
    // SCOTTISH
    'highlands', 'lowlands', 'borders', 'fife', 'lothian', 'strathclyde', 'grampian', 'tayside',
    // WELSH
    'gwynedd', 'powys', 'dyfed', 'glamorgan', 'clwyd',
    // GENERIC SUFFIXES
    'shire', 'county', 'region'
  ];

  function normalize(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function isFullPostcode(s) { return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(s); }
  function isOutcode(s) { return /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(normalize(s).toUpperCase()); }
  
  function inList(loc, list) { 
    loc = normalize(loc); 
    for (var i = 0; i < list.length; i++) { 
      if (loc === list[i] || loc.indexOf(list[i]) === 0) return true; 
    } 
    return false; 
  }
  
  function hasRegion(loc) { 
    loc = normalize(loc); 
    for (var i = 0; i < REGIONS.length; i++) { 
      if (loc === REGIONS[i] || loc.indexOf(REGIONS[i]) > -1) return true; 
    } 
    return false; 
  }

  function getProximity(loc) {
    if (!loc || loc.length < 2) return POLICY.TOWN;
    var locNorm = normalize(loc);
    console.log('[VMF] getProximity:', loc);
    
    if (isFullPostcode(loc)) { console.log('[VMF] → Postcode:', POLICY.FULL_POSTCODE); return POLICY.FULL_POSTCODE; }
    if (isOutcode(loc)) { console.log('[VMF] → Outcode:', POLICY.OUTCODE); return POLICY.OUTCODE; }
    
    // Check regions BEFORE cities (England contains London but should be 20mi)
    if (hasRegion(locNorm)) { console.log('[VMF] → Region:', POLICY.METRO_CAP); return POLICY.METRO_CAP; }
    
    if (inList(locNorm, GREATER_METROS)) { console.log('[VMF] → Metro:', POLICY.METRO_CAP); return POLICY.METRO_CAP; }
    if (inList(locNorm, MAJOR_CITIES)) { console.log('[VMF] → Major:', POLICY.MAJOR_CITY); return POLICY.MAJOR_CITY; }
    if (inList(locNorm, LARGE_CITIES)) { console.log('[VMF] → Large:', POLICY.LARGE_CITY); return POLICY.LARGE_CITY; }
    if (inList(locNorm, SMALL_CITIES)) { console.log('[VMF] → Small:', POLICY.SMALL_CITY); return POLICY.SMALL_CITY; }
    
    console.log('[VMF] → Town:', POLICY.TOWN);
    return POLICY.TOWN;
  }

  function checkAndRedirect() {
    var url = new URL(window.location.href);
    var loc = url.searchParams.get('search_location') || url.searchParams.get('location') || '';
    var region = url.searchParams.get('region') || '';
    var currentProx = parseFloat(url.searchParams.get('proximity'));
    
    if (!loc && !region) {
      console.log('[VMF] No location in URL');
      return;
    }
    
    var wantProx = region ? POLICY.METRO_CAP : getProximity(loc);
    console.log('[VMF] URL check - loc:', loc, 'want:', wantProx, 'have:', currentProx);
    
    if (!currentProx || Math.round(currentProx) !== Math.round(wantProx)) {
      var redirKey = 'VMF_R_' + (loc || region).substring(0, 30);
      if (sessionStorage.getItem(redirKey)) {
        console.log('[VMF] Already redirected, skipping');
        return;
      }
      sessionStorage.setItem(redirKey, '1');
      url.searchParams.set('proximity', wantProx);
      console.log('[VMF] *** REDIRECTING ***');
      window.location.replace(url.href);
    }
  }

  console.log('[VMF] Boot:', VERSION);
  checkAndRedirect();
  console.log('[VMF] Boot complete');
})();
