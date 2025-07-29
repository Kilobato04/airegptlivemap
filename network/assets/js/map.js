// Map initialization and control functions - Complete Version

console.log('Starting map initialization...');

// Wait for config and dependencies to load
setTimeout(() => {
    // Check if all required dependencies are loaded
    const requiredDeps = ['MAPBOX_CONFIG', 'APP_SETTINGS', 'AQI_THRESHOLDS', 'MAP_LAYERS', 'createLegendHTML', 'createPopupContent'];
    const missingDeps = requiredDeps.filter(dep => typeof window[dep] === 'undefined');
    
    if (missingDeps.length > 0) {
        console.error('Missing dependencies:', missingDeps);
        console.log('Retrying in 500ms...');
        setTimeout(arguments.callee, 500);
        return;
    }

    console.log('All dependencies loaded, initializing map...');

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    // Initialize the map
    const map = new mapboxgl.Map({
        container: 'map',
        style: MAPBOX_CONFIG.style,
        center: MAPBOX_CONFIG.center,
        zoom: MAPBOX_CONFIG.zoom
    });

    // Make map available globally
    window.map = map;

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

    // Variable to track markers visibility
    let offMarkersVisible = true;

    // Map load event handler
    map.on('load', () => {
        console.log('Map loaded successfully');
        
        // Initialize legend
        initializeLegend();
        
        // Add map layers
        addMapLayers();
        
        // Set up interactions
        setupMapInteractions();
        
        // Set up data refresh
        setupDataRefresh();

        console.log('Map setup complete');
    });

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
        if (legendToggle) {
            legendToggle.addEventListener('click', () => {
                legendContainer.classList.toggle('collapsed');
                legendToggle.textContent = legendContainer.classList.contains('collapsed') ? '+' : '−';
            });
        }

        // SIMAT Network toggle functionality
        const toggleButton = document.getElementById('toggleOffMarkers');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                offMarkersVisible = !offMarkersVisible;
                
                // Toggle visibility of the circle layer
                map.setFilter('smaa_network', offMarkersVisible ? 
                    null : 
                    ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]
                );
                
                // Update button style
                if (offMarkersVisible) {
                    toggleButton.style.backgroundColor = '#4264fb';
                    toggleButton.style.color = '#ffffff';
                    toggleButton.style.borderColor = '#4264fb';
                } else {
                    toggleButton.style.backgroundColor = '#e2e2e2';
                    toggleButton.style.color = '#333';
                    toggleButton.style.borderColor = '#ccc';
                }
            });
        }
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
            console.log('Clicked on station:', feature.properties.name);
            
            const popup = new mapboxgl.Popup({ 
                offset: [0, -15],
                maxWidth: '300px'
            })
            .setLngLat(feature.geometry.coordinates);

            if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                // Show loading popup first
                popup.setHTML(createPopupContent(feature, null)).addTo(map);
                
                try {
                    console.log('Fetching sensor data for:', feature.properties.name);
                    const sensorData = await fetchSensorData(feature.properties.name);
                    console.log('Received sensor data:', sensorData);
                    popup.setHTML(createPopupContent(feature, sensorData));
                    
                    // Update marker color based on data
                    if (typeof updateMarkerColor === 'function') {
                        updateMarkerColor(feature.properties.name);
                    }
                } catch (error) {
                    console.error('Error fetching sensor data for popup:', error);
                    popup.setHTML(createPopupContent(feature, { error: 'Failed to load sensor data' }));
                }
            } else {
                // For inactive stations, just show basic info
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
            // Update marker colors for active stations
            if (typeof updateMarkerData === 'function') {
                updateMarkerData();
            }

            // Update visible popups
            const visiblePopups = document.querySelectorAll('.mapboxgl-popup');
            if (visiblePopups.length > 0) {
                try {
                    // Get the popup's coordinates and find matching features
                    const popupLngLat = visiblePopups[0]._lngLat;
                    const features = map.queryRenderedFeatures(
                        map.project(popupLngLat), 
                        { layers: ['smaa_network'] }
                    );
            
                    if (features.length && APP_SETTINGS.activeStations.includes(features[0].properties.name)) {
                        const sensorData = await fetchSensorData(features[0].properties.name);
                        const popupContent = visiblePopups[0].querySelector('.mapboxgl-popup-content');
                        if (popupContent) {
                            popupContent.innerHTML = createPopupContent(features[0], sensorData);
                        }
                    }
                } catch (error) {
                    console.error('Error updating popup data:', error);
                }
            }
        }, APP_SETTINGS.refreshInterval);
    }

    /**
     * Initialize markers for map features (if needed)
     */
    map.on('sourcedata', e => {
        if (e.sourceId === MAP_LAYERS.source && e.isSourceLoaded) {
            const features = map.querySourceFeatures(MAP_LAYERS.source, {
                sourceLayer: MAP_LAYERS.sourceLayer
            });
            
            // Initialize markers for active stations if marker system is being used
            features.forEach(feature => {
                if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                    if (typeof createMarkerElement === 'function' && !markers.has(feature.properties.name)) {
                        const el = createMarkerElement('#4264fb', '');
                        const marker = new mapboxgl.Marker({ element: el })
                            .setLngLat(feature.geometry.coordinates)
                            .addTo(map);
                        markers.set(feature.properties.name, marker);
                    }
                }
            });
            
            // Initial update of marker data
            if (typeof updateMarkerData === 'function') {
                updateMarkerData();
            }
        }
    });

    // Error handling for map load
    map.on('error', (e) => {
        console.error('Map error:', e);
    });

}, 800); // Wait 800ms for all dependencies to load

console.log('Map script loaded');
