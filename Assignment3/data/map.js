mapboxgl.accessToken = 'pk.eyJ1Ijoic2szNDI1IiwiYSI6ImNtNmpmeTVnYzAwaTEyaXE4ZWZ4OG9yazIifQ.TsQiMmufb4nsdomDobl1nA';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sk3425/cm6o41tya01b701qmdpu9boh5',
    zoom: 10,
    center: [-74, 40.725],
    maxZoom: 15,
    minZoom: 8,
    maxBounds: [[-74.45, 40.45], [-73.55, 41]]
});



map.on('load', function() {
    // This is the function that finds the first symbol layer
    let layers = map.getStyle().layers;
    let firstSymbolId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    map.addLayer({
        'id': 'MTA subway stations',
        'type': 'circle',
        'source': {
            'type': 'geojson',
            'data': 'data/subway-stations.geojson'
        },
        'paint': {
            // 'circle-color': ['interpolate', ['linear'],
            //     ['get', 'ENTRIES_DIFF'], -1, '#ff4400', -0.7, '#ffba31', -0.4, '#ffffff'
            // ],
           'circle-color': '#0066ff',  // bright blue color
           'circle-stroke-color': '#003399', // darker blue for the border
           'circle-stroke-width': 1,
            'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            10, 3,  // smaller radius at zoom level 10
            15, 10   // larger radius at zoom level 15
            ]
        }
    }, firstSymbolId); // Here's where we tell Mapbox where to slot this new layer

    map.addLayer({
        'id': 'MTA Bus stops',
        'type': 'circle',
        'source': {
            'type': 'geojson',
            'data': 'data/bus-stops.geojson'
        },
        'paint': {
            'circle-color': '#ADD8E6',  // light blue color
            'circle-opacity': 0.5,      // 50% opacity
            'circle-stroke-color': '#87CEEB',  // slightly darker blue for border
           'circle-stroke-width': 1,
            'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            10, 3,  // smaller radius at zoom level 10
            15, 8   // larger radius at zoom level 15
            ]
        }
    });
   
    map.addLayer({
        'id': 'Housing affordability',
        'type': 'circle',
        'source': {
            'type': 'geojson',
            'data': 'data/Affordable_Housing_Production_by_Building.geojson'
        },
        'paint': {
            'circle-color': [
                'step',
                ['get', 'Counted Rental Units'],
                '#FFE0CC',  // lightest orange (default for 0-20 units)
                20, '#FFD1B3',  // very light orange
                40, '#FFB380',  // light orange
                60, '#FF8533',  // medium orange
                80, '#FF6600',  // dark orange
                100, '#CC5200'  // darkest orange
            ],
            'circle-stroke-color': '#4d4d4d',
            'circle-stroke-width': .5,
            'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, 2,
                15, 8
            ]
        }
    });

    map.addLayer({
        'id': 'Affordable housing',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': 'data/medianIncome.geojson'
        },
        'paint': {
            'fill-color': ['step', ['get', 'MHHI'],
                '#ffffff',
                20000, '#ccedf5',
                50000, '#99daea',
                75000, '#66c7e0',
                100000, '#33b5d5',
                150000, '#00a2ca'
            ],
            'fill-opacity': ['case', ['==', ['get', 'MHHI'], null], 0, 0.65]
        }
    }, 'water');
});

// Create the popup for affordable housing
map.on('click', 'Housing affordability', function(e) {
    const properties = e.features[0].properties;
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
            <h4>${properties['Project Name']}</h4>
            <p>
                <b>Street:</b> ${properties['Number']} ${properties['Street']}<br>
                <b>Community Board:</b> ${properties['Community Board']}<br>
                <b>Extended Affordability Only:</b> ${properties['Extended Affordability Only']}<br>
                <b>Extremely Low Income Units:</b> ${properties['Extremely Low Income Units']}<br>
                <b>Very Low Income Units:</b> ${properties['Very Low Income Units']}<br>
                <b>Low Income Units:</b> ${properties['Low Income Units']}<br>
                <b>Moderate Income Units:</b> ${properties['Moderate Income Units']}<br>
                <b>Middle Income Units:</b> ${properties['Middle Income Units']}<br>
                <b>Other Income Units:</b> ${properties['Middle Income Units']}
            </p>`)
        .addTo(map);
});

// Change the cursor to a pointer when hovering over housing data
map.on('mouseenter', 'Housing affordability', function() {
    map.getCanvas().style.cursor = 'pointer';
});

// Change cursor back to default when leaving housing data
map.on('mouseleave', 'Housing affordability', function() {
    map.getCanvas().style.cursor = '';
});



// add menu

var toggleableLayerIds = ['MTA subway stations', 'MTA Bus stops', 'Housing affordability'];


for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function(e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}