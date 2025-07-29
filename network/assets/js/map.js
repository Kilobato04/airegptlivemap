// Map initialization and control functions

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: MAPBOX_CONFIG.style,
    center: MAPBOX_CONFIG.center,
    zoom: MAPBOX_CONFIG.zoom
});

// Add map controls
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    })
);

// Disable map rotation
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
map.addControl(new mapboxgl.NavigationControl());

// Variable to track off markers visibility
let offMarkersVisible = true;

/**
 * Initialize legend and toggle functionality
 */
function initializeLegend() {
    const legendContainer = document.createElement('div');
    legendContainer.className = 'legend';
    legendContainer.innerHTML = createLegendHTML();
    document.getElementById('map').appendChild(legendContainer);

    // Legend toggle functionality
    const legendToggle = legendContainer.querySelector('.legend-toggle');
    legendToggle.addEventListener('click', () => {
        legendContainer.classList.toggle('collapsed');
        legendToggle.textContent = legendContainer.classList.contains('collapsed') ? '+' : '−';
    });

    // SIMAT Network toggle functionality
    document.getElementById('toggleOffMarkers').addEventListener('click', () => {
        offMarkersVisible = !offMarkersVisible;
        
        // Toggle visibility of the circle layer
        map.setFilter('smaa_network', offMarkersVisible ? 
            null : 
            ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]
        );
        
        // Update button style
        const button = document.getElementById('toggleOffMarkers');
        if (offMarkersVisible) {
            button.style.backgroundColor = '#4264fb';
            button.style.color = '#ffffff';
            button.style.borderColor = '#4264fb';
        } else {
            button.style.backgroundColor = '#e2e2e2';
            button.style.color = '#333';
            button.style.borderColor = '#ccc';
        }
    });
}

/**
 * Add map layers and sources
 */
function addMapLayers() {
    // Add vector tile source
    map.addSource(MAP_LAYERS.source, {
        'type': 'vector',
        'url': MAP_LAYERS.vectorTileUrl
    });

    // Add circle layer for stations
    map.addLayer({
        'id': 'smaa_network',
        'type': 'circle',
        'source': MAP_LAYERS.source,
        'source-layer': MAP_LAYERS.sourceLayer,
        'paint': {
            'circle-color': [
                'case',
                ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
                '#4264fb', // Color for active stations
                'gray'    // Color for others
            ],
            'circle-radius': 9,
            'circle-stroke-width': 1.7,
            'circle-stroke-color': '#ffffff'
        }
    });

    // Add text labels for active stations
    map.addLayer({
        'id': 'smaa_network_labels',
        'type': 'symbol',
        'source': MAP_LAYERS.source,
        'source-layer': MAP_LAYERS.sourceLayer,
        'layout': {
            'text-field': [
                'case',
                ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
                'ON', // If name is in active stations
                '' // Otherwise
            ],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 8,
            'text-allow-overlap': true,
            'text-ignore-placement': true
        },
        'paint': {
            'text-color': '#FFFFFF'
        }
    });
}

/**
 * Set up map click handlers
 */
function setupMapInteractions() {
    map.on('click', 'smaa_network', async (event) => {
        const features = map.queryRenderedFeatures(event.point, {
            layers: ['smaa_network']
        });
        
        if (!features.length) {
            return;
        }

        const feature = features[0];
        const popup = new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(feature.geometry.coordinates);

        if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
            popup.setHTML(createPopupContent(feature, null)).addTo(map);
            
            try {
                const sensorData = await fetchSensorData(feature.properties.name);
                popup.setHTML(createPopupContent(feature, sensorData));
                updateMarkerColor(feature.properties.name);
            } catch (error) {
                console.error('Error fetching sensor data for popup:', error);
            }
        } else {
            popup.setHTML(createPopupContent(feature)).addTo(map);
        }
    });

    // Change cursor on hover
    map.on('mouseenter', 'smaa_network', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'smaa_network', () => {
        map.getCanvas().style.cursor = '';
    });
}

/**
 * Set up automatic data refresh
 */
function setupDataRefresh() {
    setInterval(async () => {
        updateMarkerData();

        // Update visible popups
        const visiblePopups = document.querySelectorAll('.mapboxgl-popup');
        if (visiblePopups.length > 0) {
            const features = map.queryRenderedFeatures(visiblePopups[0].getBoundingClientRect(), {
                layers: ['smaa_network']
            });
    
            if (features.length && APP_SETTINGS.activeStations.includes(features[0].properties.name)) {
                try {
                    const sensorData = await fetchSensorData(features[0].properties.name);
                    visiblePopups[0].querySelector('.mapboxgl-popup-content').innerHTML = 
                        createPopupContent(features[0], sensorData);
                } catch (error) {
                    console.error('Error updating popup data:', error);
                }
            }
        }
    }, APP_SETTINGS.refreshInterval);
}

/**
 * Update source data for a specific location
 * @param {string} location - Location name
 */
async function updateSourceData(location) {
    if (!map.getSource(MAP_LAYERS.source)) return;

    try {
        const sensorData = await fetchSensorData(location);
        const features = map.querySourceFeatures(MAP_LAYERS.source, {
            sourceLayer: MAP_LAYERS.sourceLayer
        });

        features.forEach(feature => {
            if (feature.properties.name === location && typeof sensorData.dataIAS === 'number') {
                feature.properties.dataIAS = sensorData.dataIAS;
                map.setFeatureState(
                    { source: MAP_LAYERS.source, id: feature.id },
                    { dataIAS: sensorData.dataIAS }
                );
            }
        });
    } catch (error) {
        console.error(`Error updating source data for ${location}:`, error);
    }
}

// Map load event handler
map.on('load', async () => {
    // Add map layers
    addMapLayers();
    
    // Initialize legend
    initializeLegend();
    
    // Set up interactions
    setupMapInteractions();
    
    // Set up data refresh
    setupDataRefresh();

    // Initialize markers when source data is loaded
    map.on('sourcedata', e => {
        if (e.sourceId === MAP_LAYERS.source && e.isSourceLoaded) {
            const features = map.querySourceFeatures(MAP_LAYERS.source, {
                sourceLayer: MAP_LAYERS.sourceLayer
            });
            
            features.forEach(feature => {
                if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                    if (!markers.has(feature.properties.name)) {
                        const el = createMarkerElement('#4264fb', '');
                        const marker = new mapboxgl.Marker({ element: el })
                            .setLngLat(feature.geometry.coordinates)
                            .addTo(map);
                        markers.set(feature.properties.name, marker);
                    }
                }
            });
            
            // Initial update of marker data
            updateMarkerData();
        }
    });

    try {
        // Query features and initialize markers
        const features = map.querySourceFeatures(MAP_LAYERS.source);
        
        if (!features || features.length === 0) {
            console.error('No features found in the dataset. Please check if the dataset is properly loaded.');
            return;
        }

        // Initialize markers for active stations
        features.forEach(feature => {
            if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                const el = createMarkerElement('#cccccc');
                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat(feature.geometry.coordinates)
                    .addTo(map);
                
                markers.set(feature.properties.name, marker);
                updateMarkerColor(feature.properties.name);
            }
        });
    } catch (error) {
        console.error('Error loading map features:', error);
    }
});
