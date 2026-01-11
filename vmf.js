/* VMF assets v0.3.6 */
(() => {
  const v = "v0.3.6";
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

  var VERSION = 'VMF-AUTOHOOK v0.3.6';
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
    // Strip common suffixes from Google Places
    loc = loc.replace(/,\s*(uk|united kingdom|england|scotland|wales|northern ireland)$/i, '').trim();
    for (var i = 0; i < list.length; i++) { 
      if (loc === list[i] || loc.indexOf(list[i]) === 0) return true; 
    } 
    return false; 
  }
  
  function hasRegion(loc) { 
    loc = normalize(loc);
    // Strip common suffixes from Google Places (e.g., 'Leeds, UK' -> 'Leeds')
    loc = loc.replace(/,\s*(uk|united kingdom|england|scotland|wales|northern ireland)$/i, '').trim();
    // Only match if location IS a region (not contains)
    for (var i = 0; i < REGIONS.length; i++) { 
      if (loc === REGIONS[i]) return true; 
    } 
    return false; 
  }

  function getProximity(loc) {
    if (!loc || loc.length < 2) return POLICY.OUTCODE; // Default to 5mi for unknown
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

    // Unknown place names (like "Isleworth, UK") get 5mi, not 8mi
    // This is more appropriate for specific neighborhoods/areas vs actual towns
    console.log('[VMF] → Local area:', POLICY.OUTCODE);
    return POLICY.OUTCODE;
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

  // ============ VUE.JS AJAX INTERCEPTION ============

  var lastLocation = '';
  var hooked = false;

  function getVueFilters() {
    // MyListing theme: filters are on child Vue components, not parent
    var selectors = [
      '.explore-head-search',      // Main search component
      '.location-wrapper',         // Location filter component  
      '.proximity-slider',         // Proximity slider component
      '[class*="proximity"]',     // Any proximity-related element
      '.explore-filters',          // Legacy fallback
      '#c27-explore-listings'      // Main explore container
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.__vue__ && el.__vue__.filters && el.__vue__.filters.proximity !== undefined) {
        console.log('[VMF] Found Vue filters on:', selectors[i]);
        return el.__vue__.filters;
      }
    }
    // Try children of main explore container
    var main = document.querySelector('#c27-explore-listings');
    if (main && main.__vue__ && main.__vue__.$children) {
      for (var j = 0; j < main.__vue__.$children.length; j++) {
        var child = main.__vue__.$children[j];
        if (child.filters && child.filters.proximity !== undefined) {
          console.log('[VMF] Found Vue filters on child', j);
          return child.filters;
        }
      }
    }
    return null;
  }

  function setVueProximity(miles) {
    var filters = getVueFilters();
    if (filters && filters.proximity !== undefined) {
      if (Math.round(filters.proximity) !== Math.round(miles)) {
        console.log('[VMF] Setting Vue proximity:', miles, '(was:', filters.proximity + ')');
        filters.proximity = miles;
        return true;
      }
    }
    return false;
  }

  function handleLocationChange(loc, fromPacClick) {
    if (!loc || loc.length < 2) return;
    loc = loc.trim();
    if (loc === lastLocation) return;
    lastLocation = loc;
    var proximity = getProximity(loc);
    console.log('[VMF] Location changed:', loc, '->', proximity + 'mi');
    if (setVueProximity(proximity)) {
      console.log('[VMF] Vue proximity updated');
    } else {
      console.log('[VMF] Vue filters not found, will retry...');
      setTimeout(function() { setVueProximity(proximity); }, 100);
      setTimeout(function() { setVueProximity(proximity); }, 300);
    }

    // Mobile: Auto-trigger search when location looks like a Google Places selection
    // Google Places always adds ", UK" or similar suffix
    if (isMobile() && (fromPacClick || loc.indexOf(',') !== -1)) {
      console.log('[VMF] Mobile: Google Places selection detected, triggering search');
      setTimeout(triggerMobileSearch, 200);
    }
  }

  function findLocationInputs() {
    return document.querySelectorAll([
      'input[name="search_location"]',
      'input[name="location"]',
      '.explore-location input',
      '.pac-target-input',
      'input.location-field',
      'input[placeholder*="town"]',
      'input[placeholder*="postcode"]',
      'input[placeholder*="location"]'
    ].join(','));
  }

  function hookInput(input) {
    if (input._vmfHooked) return;
    input._vmfHooked = true;
    console.log('[VMF] Hooking input:', input.name || input.className || 'unknown');
    input.addEventListener('blur', function() {
      setTimeout(function() { handleLocationChange(input.value); }, 50);
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        setTimeout(function() { handleLocationChange(input.value); }, 100);
      }
    });
    if (window.google && window.google.maps && window.google.maps.places) {
      hookGoogleAutocomplete(input);
    }
  }

  function hookGoogleAutocomplete(input) {
    var checkAutocomplete = function() {
      if (input.gm_accessors_ && input.gm_accessors_.place) {
        console.log('[VMF] Found Google Autocomplete on input');
        var pacObserver = new MutationObserver(function() {
          setTimeout(function() {
            if (input.value && input.value !== lastLocation) {
              handleLocationChange(input.value);
            }
          }, 150);
        });
        var pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          pacObserver.observe(pacContainer, { childList: true, subtree: true, attributes: true });
        }
      }
    };
    setTimeout(checkAutocomplete, 500);
    setTimeout(checkAutocomplete, 1500);
  }

  function hookPacItemClicks() {
    document.addEventListener('click', function(e) {
      // Debug: log all clicks to see what's happening
      var target = e.target;
      var targetClasses = target.className || '';
      var targetTag = target.tagName || '';

      // Check if click is on or inside a PAC item
      var pacItem = target.closest ? target.closest('.pac-item') : null;

      // Also check parent elements manually for older browsers
      if (!pacItem) {
        var el = target;
        while (el && el !== document.body) {
          if (el.classList && el.classList.contains('pac-item')) {
            pacItem = el;
            break;
          }
          el = el.parentElement;
        }
      }

      // Log clicks near PAC container for debugging
      var pacContainer = target.closest ? target.closest('.pac-container') : null;
      if (pacContainer || targetClasses.indexOf('pac-') !== -1) {
        console.log('[VMF] Click near PAC:', targetTag, targetClasses.substring(0, 50));
      }

      if (pacItem) {
        console.log('[VMF] PAC item clicked!');
        setTimeout(function() {
          var inputs = findLocationInputs();
          console.log('[VMF] Found', inputs.length, 'inputs after PAC click');
          for (var i = 0; i < inputs.length; i++) {
            var val = inputs[i].value;
            console.log('[VMF] Input', i, 'value:', val);
            if (val && val.length > 2) {
              handleLocationChange(val);
              // Mobile: auto-trigger search after autocomplete selection
              if (isMobile()) {
                console.log('[VMF] Mobile: scheduling triggerMobileSearch');
                setTimeout(triggerMobileSearch, 300);
              }
              break;
            }
          }
        }, 200);
      }
    }, true);
  }

  // ============ MOBILE-SPECIFIC FEATURES (v0.3.3) ============

  function isMobile() {
    // Check viewport width first (most reliable)
    if (window.innerWidth <= 768) return true;
    // Also check Vue's isMobile state
    var main = document.querySelector('#c27-explore-listings');
    if (main && main.__vue__ && main.__vue__.isMobile) return true;
    return false;
  }

  function getExploreVue() {
    var main = document.querySelector('#c27-explore-listings');
    return main && main.__vue__ ? main.__vue__ : null;
  }

  function triggerMobileSearch() {
    if (!isMobile()) return;
    console.log('[VMF] Mobile: triggering search...');

    var vue = getExploreVue();
    if (!vue) {
      console.log('[VMF] Mobile: Vue instance not found');
      return;
    }

    // IMPORTANT: Switch to map view FIRST to avoid flash of list view
    switchToMapView();

    // Call Vue's getListings method directly (most reliable on mobile)
    if (typeof vue.getListings === 'function') {
      console.log('[VMF] Mobile: calling Vue.getListings()');
      try {
        vue.getListings();
        return;
      } catch (err) {
        console.log('[VMF] Error calling getListings:', err);
      }
    }

    // Fallback: try other method names
    var searchMethods = ['fetchListings', 'doSearch', 'search', 'submitSearch'];
    for (var j = 0; j < searchMethods.length; j++) {
      if (typeof vue[searchMethods[j]] === 'function') {
        console.log('[VMF] Mobile: calling Vue.' + searchMethods[j] + '()');
        try {
          vue[searchMethods[j]]();
          return;
        } catch (err) {
          console.log('[VMF] Error calling', searchMethods[j], err);
        }
      }
    }

    console.log('[VMF] Mobile: could not find search method on Vue');
  }

  function switchToMapView() {
    if (!isMobile()) return;

    var vue = getExploreVue();
    if (!vue) {
      console.log('[VMF] Mobile: Vue instance not found');
      return;
    }

    // Check current state
    var currentTab = vue.state && vue.state.mobileTab;
    if (currentTab === 'map') {
      console.log('[VMF] Mobile: already in map view');
      return;
    }

    console.log('[VMF] Mobile: switching to map view (current:', currentTab, ')');

    // Method 1: Set Vue state directly
    if (vue.state && typeof vue.state.mobileTab !== 'undefined') {
      vue.state.mobileTab = 'map';
      console.log('[VMF] Mobile: set state.mobileTab = "map"');
      // Trigger reactivity if needed
      if (vue.$forceUpdate) {
        try { vue.$forceUpdate(); } catch (e) {}
      }
      return;
    }

    // Method 2: Click the map view button
    var mapBtn = document.querySelector('.show-map a, .show-map, [class*="map-view"]');
    if (!mapBtn) {
      // Search by text
      var links = document.querySelectorAll('a, li, button');
      for (var i = 0; i < links.length; i++) {
        var text = (links[i].textContent || '').trim().toLowerCase();
        if (text === 'map view' || text === 'map') {
          mapBtn = links[i];
          break;
        }
      }
    }

    if (mapBtn) {
      console.log('[VMF] Mobile: clicking map view button');
      mapBtn.click();
      return;
    }

    console.log('[VMF] Mobile: could not switch to map view');
  }

  // Watch for search results and auto-switch to map view
  function watchForResults() {
    if (!isMobile()) return;

    var vue = getExploreVue();
    if (!vue) {
      setTimeout(watchForResults, 1000);
      return;
    }

    // Watch for loading state changes
    var lastLoading = vue.loading;
    setInterval(function() {
      if (!isMobile()) return;
      var v = getExploreVue();
      if (!v) return;

      // Detect when loading STARTS (loading goes from false to true)
      // Switch to map view immediately to avoid flash of list view
      if (lastLoading === false && v.loading === true) {
        console.log('[VMF] Mobile: search started, switching to map view');
        switchToMapView();
      }
      lastLoading = v.loading;
    }, 100);
  }

  function startPolling() {
    var pollInterval = 500;
    var lastValues = {};
    setInterval(function() {
      var inputs = findLocationInputs();
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var id = input.name || input.id || 'input_' + i;
        var val = input.value;
        if (val && val.length > 2 && val !== lastValues[id]) {
          lastValues[id] = val;
          (function(v) {
            setTimeout(function() {
              if (input.value === v) { handleLocationChange(v); }
            }, 300);
          })(val);
        }
      }
    }, pollInterval);
  }

  function hookAllInputs() {
    var inputs = findLocationInputs();
    console.log('[VMF] Found', inputs.length, 'location inputs');
    for (var i = 0; i < inputs.length; i++) { hookInput(inputs[i]); }
  }

  function initAjaxInterception() {
    if (hooked) return;
    hooked = true;
    console.log('[VMF] Initializing AJAX interception...');
    hookAllInputs();
    hookPacItemClicks();
    startPolling();
    // Mobile: watch for search results to auto-switch to map view
    if (isMobile()) {
      console.log('[VMF] Mobile mode detected, enabling auto-map-view');
      watchForResults();
    }
    var observer = new MutationObserver(function(mutations) {
      var shouldRehook = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          for (var j = 0; j < mutations[i].addedNodes.length; j++) {
            var node = mutations[i].addedNodes[j];
            if (node.nodeType === 1) {
              if (node.tagName === 'INPUT' || node.querySelector && node.querySelector('input')) {
                shouldRehook = true;
                break;
              }
            }
          }
        }
        if (shouldRehook) break;
      }
      if (shouldRehook) { setTimeout(hookAllInputs, 100); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[VMF] AJAX interception ready');
  }

  // ============ BOOT ============

  console.log('[VMF] Boot:', VERSION);
  checkAndRedirect();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initAjaxInterception, 500); });
  } else {
    setTimeout(initAjaxInterception, 500);
  }
  window.addEventListener('load', function() {
    setTimeout(initAjaxInterception, 1000);
    setTimeout(hookAllInputs, 2000);
  });
  console.log('[VMF] Boot complete');
})();
