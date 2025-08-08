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
        
        // Set up data refresh - SOLO UNA VEZ
        setupDataRefresh();
        
        // Force immediate marker initialization
        setTimeout(() => {
            console.log('Force initializing markers...');
            try {
                const features = map.querySourceFeatures(MAP_LAYERS.source, {
                    sourceLayer: MAP_LAYERS.sourceLayer
                });
                
                if (features && features.length > 0) {
                    console.log('Found features, creating markers...');
                    features.forEach(feature => {
                        if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                            if (!markers.has(feature.properties.name)) {
                                const el = createMarkerElement('#cccccc', '...');
                                const marker = new mapboxgl.Marker({ element: el })
                                    .setLngLat(feature.geometry.coordinates)
                                    .addTo(map);
                                markers.set(feature.properties.name, marker);
                                console.log('Created marker for:', feature.properties.name);
                            }
                        }
                    });
                    
                    // Update markers with real data
                    setTimeout(() => {
                        console.log('Updating marker data...');
                        updateMarkerData();
                    }, 500);
                } else {
                    console.log('No features found, retrying...');
                    // Retry after another second if no features found
                    setTimeout(arguments.callee, 1000);
                }
            } catch (error) {
                console.error('Error initializing markers:', error);
            }
        }, 1500);
        
        // Initialize IAS values after map loads
        setTimeout(() => {
            console.log('Initializing IAS values...');
            updateAllMarkerIAS();
        }, 2000);

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
    
        // NUEVO: AQ Network toggle consolidado (reemplaza SIMAT y Smability)
        const toggleButton = document.getElementById('toggleAQNetwork');
        if (toggleButton) {
            let aqNetworkVisible = true;
            
            toggleButton.addEventListener('click', () => {
                aqNetworkVisible = !aqNetworkVisible;
                
                if (aqNetworkVisible) {
                    // Mostrar toda la red AQ (SIMAT + Smability)
                    map.setFilter('smaa_network', null);
                    map.setLayoutProperty('smaa_network_ias', 'visibility', 'visible');
                    map.setLayoutProperty('smaa_network_labels', 'visibility', 'visible');
                    
                    // Mostrar markers de Smability
                    APP_SETTINGS.activeStations.forEach(location => {
                        if (markers.has(location)) {
                            markers.get(location).getElement().style.display = 'flex';
                        }
                    });
                } else {
                    // Ocultar toda la red AQ
                    map.setFilter('smaa_network', ['==', ['get', 'name'], '___NONE___']);
                    map.setLayoutProperty('smaa_network_ias', 'visibility', 'none');
                    map.setLayoutProperty('smaa_network_labels', 'visibility', 'none');
                    
                    // Ocultar markers de Smability
                    APP_SETTINGS.activeStations.forEach(location => {
                        if (markers.has(location)) {
                            markers.get(location).getElement().style.display = 'none';
                        }
                    });
                }
                
                // Update button style
                if (aqNetworkVisible) {
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

    function addMapLayers() {
        // Add vector tile source
        map.addSource(MAP_LAYERS.source, {
            'type': 'vector',
            'url': MAP_LAYERS.vectorTileUrl
        });
    
        // Add layer for stations - CUADRADOS para SIMAT, CÍRCULOS para Smability via Mapbox markers
        map.addLayer({
            'id': 'smaa_network',
            'type': 'circle',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'paint': {
                'circle-color': [
                    'case',
                    ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
                    'transparent', // Transparente para estaciones activas (usarán Mapbox markers circulares)
                    'gray'         // Gris para estaciones SIMAT (cuadradas)
                ],
                'circle-radius': [
                    'case',
                    ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
                    0,  // Sin radio para estaciones activas (serán markers circulares)
                    0   // Sin radio, usaremos símbolo cuadrado
                ],
                'circle-stroke-width': 0
            }
        });
        
        // NUEVO: Layer para markers cuadrados de SIMAT
        map.addLayer({
            'id': 'smaa_network_squares',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'filter': ['!in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]], // Solo estaciones NO activas
            'layout': {
                'text-field': '■', // Símbolo cuadrado
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            'paint': {
                'text-color': 'gray'
            }
        });
    
        // Add IAS values as simple text - solo para estaciones activas
        map.addLayer({
            'id': 'smaa_network_ias',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'layout': {
                'text-field': [
                    'case',
                    ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
                    '...', // Default placeholder
                    ''
                ],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 10,
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            'paint': {
                'text-color': '#FFFFFF'
            }
        });
    
        // Add station labels - solo para estaciones activas
        map.addLayer({
            'id': 'smaa_network_labels',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'layout': {
                'text-field': [
                    'case',
                    ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
                    'ON',
                    ''
                ],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 6,
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-offset': [0, 1.5]
            },
            'paint': {
                'text-color': '#4264fb'
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
            
            // NUEVO: Mostrar panel Smability si es una estación activa
            if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                console.log('Showing Smability panel for:', feature.properties.name);
                if (window.SmabilityPanels && window.SmabilityPanels.showPanel) {
                    window.SmabilityPanels.showPanel(feature.properties.name);
                }
            }
            
            /* ===== POPUP LEGACY COMENTADO =====
            const popup = new mapboxgl.Popup({ 
                offset: [0, -15],
                maxWidth: '300px'
            })
            .setLngLat(feature.geometry.coordinates);
    
            // NUEVO: Event listener para cerrar panel cuando se cierre el popup
            popup.on('close', () => {
                console.log('Popup closed, checking if chart panel should close...');
                if (window.currentLocation === feature.properties.name) {
                    console.log('Closing chart panel because popup closed for current location');
                    closeChartPanel();
                }
            });
    
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
            ===== FIN POPUP LEGACY COMENTADO ===== */
        });
    
        // NUEVO: Click handler para markers cuadrados (SIMAT)
        map.on('click', 'smaa_network_squares', (event) => {
            const features = map.queryRenderedFeatures(event.point, {
                layers: ['smaa_network_squares']
            });
            
            if (!features.length) return;
            
            const feature = features[0];
            console.log('Clicked on SIMAT station:', feature.properties.name);
            
            // Mostrar popup básico para estaciones SIMAT
            const popup = new mapboxgl.Popup({ offset: [0, -15], maxWidth: '300px' })
                .setLngLat(feature.geometry.coordinates)
                .setHTML(createPopupContent(feature, null))
                .addTo(map);
        });
    
        /* ===== CERRAR CHART PANEL COMENTADO =====
        // NUEVO: Cerrar panel cuando se hace click fuera de popup/panel
        map.on('click', (event) => {
            // Si no se hizo click en una estación y hay un panel abierto, cerrarlo
            const features = map.queryRenderedFeatures(event.point, {
                layers: ['smaa_network']
            });
            
            if (features.length === 0 && window.currentLocation) {
                console.log('Clicked outside station, closing chart panel if open');
                setTimeout(() => {
                    // Verificar si no hay popups visibles después de un pequeño delay
                    const visiblePopups = document.querySelectorAll('.mapboxgl-popup');
                    if (visiblePopups.length === 0) {
                        closeChartPanel();
                    }
                }, 100);
            }
        });
        ===== FIN CERRAR CHART PANEL COMENTADO ===== */
    
        // Change cursor on hover - para estaciones circulares (activas)
        map.on('mouseenter', 'smaa_network', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
    
        map.on('mouseleave', 'smaa_network', () => {
            map.getCanvas().style.cursor = '';
        });
        
        // NUEVO: Change cursor on hover - para markers cuadrados (SIMAT)
        map.on('mouseenter', 'smaa_network_squares', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'smaa_network_squares', () => {
            map.getCanvas().style.cursor = '';
        });
    }

    /**
     * Update marker color and size with IAS value
     */
    async function updateMarkerColor(location) {
        if (!markers.has(location)) return;
        
        try {
            const sensorData = await fetchSensorData(location);
            const marker = markers.get(location);
            
            if (sensorData && sensorData.dataIAS !== 'N/A') {
                const { color } = getIndicatorColor(sensorData.dataIAS);
                const el = marker.getElement();
                
                // Update marker: smaller size + IAS value + BLACK text
                el.style.backgroundColor = color;
                el.style.width = '24px';  // 35% smaller
                el.style.height = '24px';
                el.textContent = Math.round(sensorData.dataIAS);
                el.style.fontSize = '10px';
                el.style.fontWeight = 'bold';
                el.style.color = '#000000';  // BLACK text instead of white
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.border = '2px solid white';
                el.style.borderRadius = '50%';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                
                console.log(`Updated marker for ${location}: IAS=${sensorData.dataIAS}, Color=${color}`);
            }
        } catch (error) {
            console.error(`Error updating marker for ${location}:`, error);
        }
    }
    
    /**
     * Create marker element with correct size and IAS value
     * @param {string} color - Marker color
     * @param {string|number} iasValue - IAS value to display
     * @returns {HTMLElement} - Marker element
     */
    function createMarkerElement(color, iasValue = '') {
        const el = document.createElement('div');
        el.className = 'marker-pin';
        el.style.cssText = `
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 10px;
        `;
        if (iasValue) {
            el.textContent = iasValue;
        }
        return el;
    }
    
    /**
     * Update all marker data
     */
    async function updateMarkerData() {
        for (const location of APP_SETTINGS.activeStations) {
            if (markers.has(location)) {
                await updateMarkerColor(location);
            }
        }
    }

    /**
     * Update IAS values in markers
     * @param {string} location - Location name
     * @param {number} iasValue - IAS value to display
     */
    function updateMarkerIAS(location, iasValue) {
        if (!map.getSource(MAP_LAYERS.source)) return;
        
        try {
            const features = map.querySourceFeatures(MAP_LAYERS.source, {
                sourceLayer: MAP_LAYERS.sourceLayer,
                filter: ['==', 'name', location]
            });
            
            if (features.length > 0) {
                map.setFeatureState(
                    { source: MAP_LAYERS.source, sourceLayer: MAP_LAYERS.sourceLayer, id: features[0].id },
                    { iasValue: iasValue }
                );
            }
        } catch (error) {
            console.error('Error updating marker IAS:', error);
        }
    }

    /**
     * Update all marker IAS values
     */
    async function updateAllMarkerIAS() {
        for (const location of APP_SETTINGS.activeStations) {
            try {
                if (typeof fetchSensorData === 'function') {
                    const sensorData = await fetchSensorData(location);
                    if (sensorData && sensorData.dataIAS !== 'N/A') {
                        updateMarkerIAS(location, sensorData.dataIAS);
                    }
                }
            } catch (error) {
                console.error(`Error fetching IAS for ${location}:`, error);
            }
        }
    }

    /**
     * Setup data refresh with proper timing (5 and 20 minutes after each hour)
     */
    function setupDataRefresh() {
        console.log('Setting up data refresh schedule...');
        
        /**
         * Calculate milliseconds until next target minute (5 or 20)
         */
        function getTimeUntilNextRefresh() {
            const now = new Date();
            const currentMinute = now.getMinutes();
            
            let nextMinute;
            if (currentMinute < 5) {
                nextMinute = 5;
            } else if (currentMinute < 20) {
                nextMinute = 20;
            } else {
                // Next refresh is at 5 minutes of next hour
                nextMinute = 65; // 60 + 5
            }
            
            const targetTime = new Date(now);
            if (nextMinute >= 60) {
                targetTime.setHours(targetTime.getHours() + 1);
                targetTime.setMinutes(nextMinute - 60);
            } else {
                targetTime.setMinutes(nextMinute);
            }
            targetTime.setSeconds(0);
            targetTime.setMilliseconds(0);
            
            return targetTime.getTime() - now.getTime();
        }
        
        /**
         * Perform data refresh
         */
        async function performRefresh() {
            console.log('Performing scheduled data refresh at:', new Date().toLocaleTimeString());
            
            // Update marker colors and IAS values for active stations
            if (typeof updateMarkerData === 'function') {
                await updateMarkerData();
            }
            
            // Force update of all markers
            for (const location of APP_SETTINGS.activeStations) {
                if (markers.has(location)) {
                    await updateMarkerColor(location);
                }
            }
            
            // Update any visible popups
            const visiblePopups = document.querySelectorAll('.mapboxgl-popup');
            if (visiblePopups.length > 0) {
                try {
                    const features = map.queryRenderedFeatures({
                        layers: ['smaa_network']
                    });
                    
                    for (const feature of features) {
                        if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                            const sensorData = await fetchSensorData(feature.properties.name);
                            // Update popup content if it exists
                            const popupContent = visiblePopups[0].querySelector('.mapboxgl-popup-content');
                            if (popupContent) {
                                popupContent.innerHTML = createPopupContent(feature, sensorData);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error updating popup during refresh:', error);
                }
            }
            
            console.log('Scheduled refresh complete');
        }
        
        /**
         * Schedule next refresh
         */
        function scheduleNextRefresh() {
            const timeUntilNext = getTimeUntilNextRefresh();
            const nextRefreshTime = new Date(Date.now() + timeUntilNext);
            
            console.log(`Next refresh scheduled for: ${nextRefreshTime.toLocaleTimeString()} (in ${Math.round(timeUntilNext/1000)} seconds)`);
            
            setTimeout(async () => {
                await performRefresh();
                
                // Set up recurring 15-minute interval (between 5 and 20, then 20 and next 5)
                setInterval(async () => {
                    await performRefresh();
                }, 15 * 60 * 1000); // 15 minutes = 900,000 ms
                
            }, timeUntilNext);
        }
        
        // Initial refresh immediately
        setTimeout(async () => {
            await performRefresh();
            scheduleNextRefresh();
        }, 2000); // Wait 2 seconds for map to be fully loaded
    }

    // ELIMINAR TODO EL CÓDIGO DUPLICADO DESDE AQUÍ HACIA ABAJO:
    // ❌ NO INCLUIR map.on('sourcedata') duplicado que cause refresh cada 3s
    // ❌ NO INCLUIR ningún setInterval adicional
    // ❌ NO INCLUIR funciones duplicadas

    // Error handling for map load
    map.on('error', (e) => {
        console.error('Map error:', e);
    });

}, 800); // Wait 800ms for all dependencies to load

console.log('Map script loaded');
