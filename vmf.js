/* VMF assets v0.2.7 - Aggressive Polling */
(() => {
  const v = "v0.2.7";
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

/*! VMF-AUTOHOOK v0.2.7
    Aggressive polling approach - watches location input value
    and sets proximity slider when it changes
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.7';
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
    if (!loc || loc.length < 2) return null;
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

  // ============ SET PROXIMITY ============
  var lastSetProximity = null;
  
  function setProximity(miles) {
    if (miles === lastSetProximity) return;
    lastSetProximity = miles;
    console.log('[VMF] *** SETTING PROXIMITY TO:', miles, '***');
    
    // Method 1: jQuery UI Slider
    if (window.jQuery) {
      try {
        var $slider = jQuery('.proximity-slider .slider-range, .proximity-filter .slider-range, .radius .slider-range');
        if ($slider.length) {
          $slider.slider('value', miles);
          // Trigger change event
          $slider.trigger('slidechange', { value: miles });
          console.log('[VMF] Set jQuery slider to', miles);
        }
      } catch (e) { console.log('[VMF] jQuery slider error:', e.message); }
      
      // Also try setting the display text
      try {
        jQuery('.proximity-slider .amount, .proximity-filter .amount, .radius .amount').text(miles + 'mi');
      } catch (e) {}
    }
    
    // Method 2: Find and set hidden inputs
    try {
      document.querySelectorAll('input[name="proximity"], input[name="radius"], input[data-key="proximity"]').forEach(function(inp) {
        inp.value = miles;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[VMF] Set input to', miles);
      });
    } catch (e) {}
    
    // Method 3: Vue.js 
    try {
      var exploreEl = document.querySelector('[data-explore], .explore-filters, #explore-filters');
      if (exploreEl && exploreEl.__vue__) {
        var vm = exploreEl.__vue__;
        if (vm.$data && vm.$data.proximity !== undefined) {
          vm.$data.proximity = miles;
          console.log('[VMF] Set Vue proximity');
        }
        if (vm.filters && vm.filters.proximity !== undefined) {
          vm.filters.proximity = miles;
          console.log('[VMF] Set Vue filters.proximity');
        }
      }
    } catch (e) {}
  }

  // ============ WATCH LOCATION INPUT ============
  var lastLocation = '';
  var locationInput = null;
  
  function findLocationInput() {
    var selectors = [
      'input[name="search_location"]',
      'input[name="location"]', 
      'input.pac-target-input',
      '.explore-location input',
      '.location-field input',
      'input[placeholder*="location" i]',
      'input[placeholder*="postcode" i]',
      'input[placeholder*="address" i]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var inp = document.querySelector(selectors[i]);
      if (inp) return inp;
    }
    return null;
  }
  
  function checkLocationChange() {
    if (!locationInput) {
      locationInput = findLocationInput();
      if (locationInput) {
        console.log('[VMF] Found location input:', locationInput.name || locationInput.className);
      }
    }
    
    if (locationInput) {
      var currentLoc = locationInput.value;
      if (currentLoc && currentLoc !== lastLocation && currentLoc.length > 2) {
        console.log('[VMF] Location changed:', lastLocation, '→', currentLoc);
        lastLocation = currentLoc;
        
        // Wait a tick for autocomplete to fully populate
        setTimeout(function() {
          var loc = locationInput.value;
          var prox = getProximity(loc);
          if (prox) {
            setProximity(prox);
          }
        }, 100);
      }
    }
  }
  
  // ============ URL PARAM HANDLER ============
  function handleUrlProximity() {
    var qs = new URLSearchParams(window.location.search);
    var loc = qs.get('location') || qs.get('search_location') || '';
    var region = qs.get('region') || '';
    var currentProx = parseFloat(qs.get('proximity'));
    
    console.log('[VMF] URL params - loc:', loc, 'region:', region, 'prox:', currentProx);
    
    if (region) {
      if (currentProx !== POLICY.METRO_CAP) {
        console.log('[VMF] Region detected, need', POLICY.METRO_CAP, 'have', currentProx);
        redirectWithProximity(POLICY.METRO_CAP);
      }
      return;
    }
    
    if (loc) {
      var wantProx = getProximity(loc);
      if (wantProx && (!currentProx || Math.round(currentProx) !== Math.round(wantProx))) {
        console.log('[VMF] Location detected, need', wantProx, 'have', currentProx);
        redirectWithProximity(wantProx);
      }
    }
  }
  
  function redirectWithProximity(prox) {
    var url = new URL(window.location.href);
    var key = 'VMF_REDIR_' + url.pathname + url.search;
    
    if (sessionStorage.getItem(key)) {
      console.log('[VMF] Already redirected, skipping');
      return;
    }
    
    url.searchParams.set('proximity', prox);
    sessionStorage.setItem(key, '1');
    console.log('[VMF] Redirecting to:', url.href);
    window.location.replace(url.href);
  }

  // ============ BOOT ============
  function boot() {
    console.log('[VMF] Boot:', VERSION);
    
    // Handle URL params (for direct links with location)
    handleUrlProximity();
    
    // Poll for location input changes every 500ms
    setInterval(checkLocationChange, 500);
    
    // Also check on various events
    document.addEventListener('click', function() { setTimeout(checkLocationChange, 200); }, true);
    document.addEventListener('keyup', function() { setTimeout(checkLocationChange, 200); }, true);
    document.addEventListener('focusout', function() { setTimeout(checkLocationChange, 200); }, true);
    
    console.log('[VMF] Boot complete - polling active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
