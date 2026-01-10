/* VMF assets v0.2.6 - Intercept Autocomplete */
(() => {
  const v = "v0.2.6";
  window.VMF_ASSET_VERSION = v;
  console.log(`[VMF] assets ${v}`);
  try {
    const qs = new URLSearchParams(location.search || "");
    const hash = (location.hash || "");
    if (qs.get("vmf_debug") === "1" || hash.includes("vmf_debug=1")) {
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

/*! VMF-AUTOHOOK v0.2.6
    Intercepts autocomplete selection and sets proximity slider
    BEFORE MyListing's AJAX search fires
*/
(function () {
  'use strict';

  var VERSION = 'VMF-AUTOHOOK v0.2.6';
  if (window.__VMF_AUTOHOOK__ === VERSION) return;
  window.__VMF_AUTOHOOK__ = VERSION;
  console.log('[VMF] AUTOHOOK initializing:', VERSION);

  // ============ PROXIMITY POLICY ============
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
  var GREATER_METROS = ['greater london', 'london', 'central london', 'greater manchester', 'west midlands', 'west yorkshire', 'merseyside', 'south yorkshire', 'tyneside', 'tyne and wear'];
  var MAJOR_CITIES = ['birmingham', 'glasgow', 'leeds', 'liverpool', 'sheffield', 'manchester', 'edinburgh', 'bristol'];
  var LARGE_CITIES = ['leicester', 'coventry', 'cardiff', 'belfast', 'nottingham', 'newcastle', 'newcastle upon tyne', 'southampton', 'portsmouth', 'plymouth', 'brighton', 'wolverhampton', 'stoke', 'stoke-on-trent', 'derby', 'swansea', 'aberdeen', 'dundee'];
  var SMALL_CITIES = ['reading', 'luton', 'milton keynes', 'northampton', 'peterborough', 'cambridge', 'oxford', 'ipswich', 'norwich', 'hull', 'kingston upon hull', 'middlesbrough', 'bolton', 'sunderland', 'warrington', 'stockport', 'york', 'blackpool', 'preston', 'blackburn', 'burnley', 'wakefield', 'barnsley', 'doncaster', 'rotherham', 'wigan', 'oldham', 'rochdale', 'salford', 'dudley', 'walsall'];
  var REGIONS = ['yorkshire', 'lancashire', 'cheshire', 'derbyshire', 'nottinghamshire', 'leicestershire', 'northamptonshire', 'warwickshire', 'staffordshire', 'kent', 'essex', 'sussex', 'surrey', 'hampshire', 'berkshire', 'devon', 'cornwall', 'somerset', 'dorset', 'wiltshire', 'norfolk', 'suffolk', 'cambridgeshire', 'northumberland', 'durham', 'cumbria', 'wales', 'scotland', 'northern ireland', 'shire', 'county', 'region'];

  // ============ DETECTION ============
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
      if (loc.indexOf(REGIONS[i]) > -1) return true;
    }
    return false;
  }

  function getProximityForLocation(loc) {
    console.log('[VMF] getProximityForLocation:', loc);
    if (!loc) return POLICY.TOWN;
    
    if (isFullPostcode(loc)) {
      console.log('[VMF] → Full postcode:', POLICY.FULL_POSTCODE);
      return POLICY.FULL_POSTCODE;
    }
    if (isOutcode(loc)) {
      console.log('[VMF] → Outcode:', POLICY.OUTCODE);
      return POLICY.OUTCODE;
    }
    if (hasRegion(loc)) {
      console.log('[VMF] → Region:', POLICY.METRO_CAP);
      return POLICY.METRO_CAP;
    }
    if (inList(loc, GREATER_METROS)) {
      console.log('[VMF] → Greater metro:', POLICY.METRO_CAP);
      return POLICY.METRO_CAP;
    }
    if (inList(loc, MAJOR_CITIES)) {
      console.log('[VMF] → Major city:', POLICY.MAJOR_CITY);
      return POLICY.MAJOR_CITY;
    }
    if (inList(loc, LARGE_CITIES)) {
      console.log('[VMF] → Large city:', POLICY.LARGE_CITY);
      return POLICY.LARGE_CITY;
    }
    if (inList(loc, SMALL_CITIES)) {
      console.log('[VMF] → Small city:', POLICY.SMALL_CITY);
      return POLICY.SMALL_CITY;
    }
    console.log('[VMF] → Town (default):', POLICY.TOWN);
    return POLICY.TOWN;
  }

  // ============ SET PROXIMITY SLIDER ============
  function setProximitySlider(miles) {
    console.log('[VMF] Setting proximity slider to:', miles);
    
    // Method 1: jQuery UI Slider
    try {
      var $slider = jQuery('.proximity-slider .slider-range, .proximity-filter .slider-range');
      if ($slider.length && $slider.slider) {
        $slider.slider('value', miles);
        console.log('[VMF] Set via jQuery UI slider');
      }
    } catch (e) { console.log('[VMF] jQuery slider failed:', e); }
    
    // Method 2: Hidden input
    try {
      var inputs = document.querySelectorAll('input[name="proximity"], input[data-filter="proximity"]');
      inputs.forEach(function(inp) {
        inp.value = miles;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } catch (e) {}
    
    // Method 3: Vue.js data binding (MyListing uses Vue)
    try {
      var filters = document.querySelector('.explore-filters, [data-explore-filters]');
      if (filters && filters.__vue__) {
        var vm = filters.__vue__;
        if (vm.filters && vm.filters.proximity !== undefined) {
          vm.filters.proximity = miles;
          console.log('[VMF] Set via Vue:', miles);
        }
      }
    } catch (e) {}
    
    // Method 4: URL parameter for page loads with location
    try {
      var url = new URL(window.location.href);
      if (url.searchParams.get('location') || url.searchParams.get('lat')) {
        url.searchParams.set('proximity', miles);
        if (url.href !== window.location.href) {
          console.log('[VMF] Updating URL proximity');
        }
      }
    } catch (e) {}
  }

  // ============ INTERCEPT AUTOCOMPLETE ============
  function interceptAutocomplete() {
    // Watch for location input changes
    var locationInputs = document.querySelectorAll(
      'input[name="search_location"], ' +
      'input[name="location"], ' +
      'input.location-field, ' +
      '.explore-location input, ' +
      '.pac-target-input'
    );
    
    locationInputs.forEach(function(input) {
      if (input._vmfHooked) return;
      input._vmfHooked = true;
      
      console.log('[VMF] Hooking location input:', input);
      
      // Listen for blur (user finished typing/selecting)
      input.addEventListener('blur', function() {
        var loc = input.value;
        if (loc && loc.length > 2) {
          var prox = getProximityForLocation(loc);
          setProximitySlider(prox);
        }
      });
      
      // Listen for Enter key
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          setTimeout(function() {
            var loc = input.value;
            if (loc) {
              var prox = getProximityForLocation(loc);
              setProximitySlider(prox);
            }
          }, 100);
        }
      });
    });
    
    // Hook Google Places Autocomplete
    if (window.google && google.maps && google.maps.places) {
      var origAutocomplete = google.maps.places.Autocomplete;
      if (!origAutocomplete._vmfPatched) {
        google.maps.places.Autocomplete = function(input, opts) {
          var ac = new origAutocomplete(input, opts);
          
          ac.addListener('place_changed', function() {
            var place = ac.getPlace();
            var loc = place.formatted_address || place.name || input.value;
            console.log('[VMF] Place selected:', loc);
            var prox = getProximityForLocation(loc);
            setProximitySlider(prox);
          });
          
          return ac;
        };
        google.maps.places.Autocomplete._vmfPatched = true;
        console.log('[VMF] Patched Google Autocomplete');
      }
    }
    
    // Watch for pac-item clicks (Google autocomplete dropdown)
    document.addEventListener('click', function(e) {
      if (e.target.closest('.pac-item')) {
        setTimeout(function() {
          var input = document.querySelector('.pac-target-input, input[name="search_location"]');
          if (input && input.value) {
            var prox = getProximityForLocation(input.value);
            setProximitySlider(prox);
          }
        }, 200);
      }
    }, true);
  }

  // ============ HANDLE URL PARAMS ============
  function handleUrlParams() {
    var qs = new URLSearchParams(window.location.search);
    var loc = qs.get('location');
    var region = qs.get('region');
    var currentProx = qs.get('proximity');
    
    if (region) {
      setProximitySlider(POLICY.METRO_CAP);
      return;
    }
    
    if (loc && !currentProx) {
      var prox = getProximityForLocation(loc);
      setProximitySlider(prox);
    }
  }

  // ============ BOOT ============
  function boot() {
    console.log('[VMF] Boot:', VERSION);
    
    // Set proximity from URL if present
    handleUrlParams();
    
    // Hook autocomplete
    interceptAutocomplete();
    
    // Re-hook after DOM changes (Vue re-renders)
    var observer = new MutationObserver(function() {
      interceptAutocomplete();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also re-hook after short delay (for late-loading scripts)
    setTimeout(interceptAutocomplete, 1000);
    setTimeout(interceptAutocomplete, 3000);
    
    console.log('[VMF] Boot complete');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
