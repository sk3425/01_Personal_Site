// map.js

mapboxgl.accessToken = 'pk.eyJ1Ijoic2szNDI1IiwiYSI6ImNtNmpmeTVnYzAwaTEyaXE4ZWZ4OG9yazIifQ.TsQiMmufb4nsdomDobl1nA';

// Function to create a Mapbox map in a given container with a specific classification type and projection.
function createMap(containerId, mapType, projection) {
  const map = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/sk3425/cm6o41tya01b701qmdpu9boh5',
    zoom: 1,
    center: [0, 0],
    minZoom: 0,
    maxZoom: 18,  
  });

  map.setProjection(projection);

  map.on('load', function() {
    let layers = map.getStyle().layers;
    let firstSymbolId;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        firstSymbolId = layers[i].id;
        break;
      }
    }

    let fillColor;

    if (mapType === "step") {
      fillColor = ['step', ['get', 'value_legend'],
        '#ffebef',  
        0.01, '#f7cad0',  
        0.03, '#f4a4b7',  
        0.05, '#ee7d99',  
        0.10, '#e75480',  
        0.20, '#dc3066',  
        0.35, '#c2185b',  
        0.50, '#a61149',  
        0.60, '#800033'   
      ];
    } else if (mapType === "linear") {
      fillColor = ['interpolate', ['linear'], ['get', 'value_legend'],
        0.0, '#ffebef',   
        0.01, '#f7cad0',  
        0.03, '#f4a4b7',  
        0.05, '#ee7d99',  
        0.10, '#e75480',  
        0.20, '#dc3066',  
        0.35, '#c2185b',  
        0.50, '#a61149',  
        0.60, '#800033'   
      ];
    } else if (mapType === "equal") {
      fillColor = ['step', ['get', 'value_legend'],
        '#ffebef',  
        0.10, '#f7cad0',  
        0.20, '#f4a4b7',  
        0.30, '#ee7d99',  
        0.40, '#e75480',  
        0.50, '#c2185b',  
        0.60, '#800033'  
      ];
    }

    // Add the Bikeways + Public Transport Access layer
    map.addLayer({
      'id': 'Bikeways and Public Transport',
      'type': 'fill',
      'source': {
        'type': 'geojson',
        'data': 'data/fullglobal.geojson'
      },
      'paint': {
        'fill-color': fillColor,
        'fill-opacity': ['case', ['==', ['get', 'value_legend'], null], 0, 0.8],
        'fill-outline-color': '#333333'
      }
    }, 'water');

    // ✅ RESTORED: Add transit hubs layer (Point Data)
    map.addLayer({
      'id': 'Transit Hubs',
      'type': 'circle',
      'source': {
        'type': 'geojson',
        'data': 'data/fullglobal.geojson'
      },
      'filter': ['>', ['get', 'value_legend'], 0.5], 
      'paint': {
        'circle-color': '#cc0066',  
        'circle-stroke-color': '#660033',  
        'circle-stroke-width': 1,
        'circle-radius': [
          'interpolate',
          ['exponential', 2],
          ['zoom'],
          2, 3,
          10, 8
        ],
        'circle-opacity': 0.8
      }
    }, firstSymbolId);

    // Tooltip for hover effect
    const tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.on('mousemove', 'Bikeways and Public Transport', function (e) {
      if (e.features.length > 0) {
        let feature = e.features[0];
        let value = feature.properties.value_legend ? (feature.properties.value_legend * 100).toFixed(1) + '%' : 'No Data';

        tooltip.setLngLat(e.lngLat)
          .setHTML(`<strong>${feature.properties.name}</strong><br>Bikeways & Public Transport Access: ${value}`)
          .addTo(map);
      }
    });

    map.on('mouseleave', 'Bikeways and Public Transport', function () {
      tooltip.remove();
    });

    // Updated popup logic without Public Transit Index
    map.on('click', 'Bikeways and Public Transport', function (e) {
      let feature = e.features[0];
      let value = feature.properties.value_legend ? (feature.properties.value_legend * 100).toFixed(1) + '%' : 'No Data';

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<h4>${feature.properties.name}</h4>
          <p><b>Bikeways + Public Transport Access:</b> ${value}</p>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'Bikeways and Public Transport', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'Bikeways and Public Transport', () => map.getCanvas().style.cursor = '');
  });

  return map;
}

// Create maps for each slide with corresponding classification style and projection:
// Map 1: Step-based classification with Albers projection.
const map1 = createMap('map1', 'step', 'albers');
// Map 2: Linear gradient classification with Mercator projection.
const map2 = createMap('map2', 'linear', 'mercator');
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