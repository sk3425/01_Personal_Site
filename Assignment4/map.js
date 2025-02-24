// map.js

mapboxgl.accessToken = 'pk.eyJ1Ijoic2szNDI1IiwiYSI6ImNtNmpmeTVnYzAwaTEyaXE4ZWZ4OG9yazIifQ.TsQiMmufb4nsdomDobl1nA';

// Function to create a Mapbox map in a given container with a specific classification type and projection.
function createMap(containerId, mapType, projection) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/sk3425/cm6o41tya01b701qmdpu9boh5',
    // Global view: initially show the entire globe.
    zoom: 1,
    center: [0, 0],
    minZoom: 0,
    maxZoom: 18,  // Allow zooming in to view detailed regional data (e.g., New York)
  });
  
  // Set the desired projection: "albers", "mercator", or "equalEarth".
  map.setProjection(projection);
  
  map.on('load', function() {
    // Find the first symbol layer (for proper layer ordering).
    let layers = map.getStyle().layers;
    let firstSymbolId;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }
    
    // Choose fill-color expression based on classification type.
    let fillColor;
    if (mapType === "default") {
      // Step-based thresholds for Map 1.
      fillColor = ['step', ['get', 'mobindex'],
        '#ffffff',
        20000, '#ffd6a0',
        50000, '#ffa94d',
        75000, '#ff8c1a',
        100000, '#ff6600',
        150000, '#cc4400'
      ];
    } else if (mapType === "quantile") {
      // Linear gradient (interpolated) for Map 2 using mobindex values.
      fillColor = ['interpolate', ['linear'], ['get', 'mobindex'],
        20000, '#fee8c8',
        50000, '#fdd49e',
        75000, '#fdbb84',
        100000, '#fc8d59',
        150000, '#e34a33'
      ];
    } else if (mapType === "equal") {
      // Equal intervals classification for Map 3.
      fillColor = ['step', ['get', 'mobindex'],
        '#f7fbff',
        40000, '#deebf7',
        48000, '#c6dbef',
        56000, '#9ecae1',
        64000, '#6baed6',
        72000, '#3182bd'
      ];
    }
    
    // Add the Mobility Index layer using the chosen fill-color expression.
    map.addLayer({
      'id': 'Mobility Index',
      'type': 'fill',
      'source': {
        'type': 'geojson',
        'data': 'data/tti.geojson'
      },
      'paint': {
        'fill-color': fillColor,
        'fill-opacity': ['case', ['==', ['get', 'mobindex'], null], 0, 0.65]
      }
    }, 'water');
    
    // --- Add Subway Station Layer to all maps ---
    map.addLayer({
      'id': 'MTA subway stations',
      'type': 'circle',
      'source': {
        'type': 'geojson',
        'data': 'data/subway-stations.geojson'
      },
      'paint': {
        'circle-color': '#0066ff',           // Bright blue.
        'circle-stroke-color': '#003399',      // Darker blue border.
        'circle-stroke-width': 1,
        'circle-radius': [
          'interpolate',
          ['exponential', 2],
          ['zoom'],
          10, 3,   // Smaller radius at zoom level 10.
          15, 10   // Larger radius at zoom level 15.
        ]
      }
    }, firstSymbolId); // Insert below symbol layers.
    
    // Popup logic – same for all maps.
    map.on('click', 'Mobility Index', function(e) {
      let mobindex = Number(e.features[0].properties.mobindex);
      let ttiText = "";
      if (mobindex < 20000) {
        ttiText = "1.0 - 1.2: Optimal Mobility";
      } else if (mobindex < 50000) {
        ttiText = "1.2 - 1.4: Moderate Congestion";
      } else if (mobindex < 75000) {
        ttiText = "1.4 - 1.6: High Congestion";
      } else if (mobindex < 100000) {
        ttiText = "1.6 - 1.8: Severe Congestion";
      } else {
        ttiText = "1.8 - 2.5: Extreme Congestion";
      }
      
      let jobcat = e.features[0].properties.jobcat;
      let jobAccessDescription = "";
      switch (jobcat) {
        case "Below -1.5SD":
          jobAccessDescription = "Very low access to jobs";
          break;
        case "-1.5SD ~ -0.5SD":
          jobAccessDescription = "Poor access to jobs";
          break;
        case "-0.5SD ~ +0.5SD":
          jobAccessDescription = "Average access to jobs";
          break;
        case "+0.5SD ~ +1.5SD":
          jobAccessDescription = "Good access to jobs";
          break;
        case "Above +1.5SD":
          jobAccessDescription = "High access to jobs";
          break;
        case ">=+2.5SD":
          jobAccessDescription = "Excellent access to jobs";
          break;
        default:
          jobAccessDescription = jobcat;
      }
      
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          '<h4>Mobility Index</h4>' +
          '<p>' + ttiText + '</p>' +
          '<h4>Job Accessibility</h4>' +
          '<p><b>Job Category:</b> ' + jobAccessDescription + '</p>' +
          '<p><em>The Transit Travelshed Index (TTI) measures transit connectivity efficiency. Lower TTI values indicate optimal mobility and better access to jobs, whereas higher values signal congestion and reduced job access.</em></p>'
        )
        .addTo(map);
    });
    
    map.on('mouseenter', 'Mobility Index', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'Mobility Index', () => map.getCanvas().style.cursor = '');
  });
  
  return map;
}

// Create maps for each slide with corresponding classification style and projection:
// Map 1: Default classification with Albers projection.
const map1 = createMap('map1', 'default', 'albers');
// Map 2: Linear gradient classification with Mercator projection.
const map2 = createMap('map2', 'quantile', 'mercator');
// Map 3: Equal intervals classification with Equal Earth projection.
const map3 = createMap('map3', 'equal', 'equalEarth');

// --- Slider Navigation Logic ---
let currentSlide = 0;
const totalSlides = 3;
const slider = document.getElementById('slider');
function updateSlider() {
  slider.style.transform = 'translateX(-' + (currentSlide * 100) + 'vw)';
  // Show the appropriate legend for the active slide.
  document.getElementById('legend1').style.display = (currentSlide === 0 ? 'block' : 'none');
  document.getElementById('legend2').style.display = (currentSlide === 1 ? 'block' : 'none');
  document.getElementById('legend3').style.display = (currentSlide === 2 ? 'block' : 'none');
}
document.getElementById('next').addEventListener('click', function() {
  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlider();
});
document.getElementById('prev').addEventListener('click', function() {
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateSlider();
});
let touchStartX = null;
slider.addEventListener('touchstart', function(e) {
  touchStartX = e.touches[0].clientX;
});
slider.addEventListener('touchend', function(e) {
  if (touchStartX === null) return;
  let diffX = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diffX) > 50) {
    currentSlide = diffX > 0 ? (currentSlide + 1) % totalSlides : (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
  }
  touchStartX = null;
});
