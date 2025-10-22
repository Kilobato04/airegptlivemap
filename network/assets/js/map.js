// Map initialization and control functions - Complete Version

console.log('Starting map initialization...');
let mapInitializationAttempted = false;

// Wait for config and dependencies to load
setTimeout(() => {
    // CRÍTICO: Evitar múltiples intentos
    if (mapInitializationAttempted) {
        console.log('❌ Map initialization already attempted, STOPPING to prevent loop');
        return;
    }
    mapInitializationAttempted = true;
    
    // Check if all required dependencies are loaded
    const requiredDeps = ['MAPBOX_CONFIG', 'APP_SETTINGS', 'AQI_THRESHOLDS', 'MAP_LAYERS', 'createLegendHTML', 'createPopupContent'];
    const missingDeps = requiredDeps.filter(dep => typeof window[dep] === 'undefined');
    
    if (missingDeps.length > 0) {
        console.error('Missing dependencies:', missingDeps);
        console.log('STOPPING - Dependencies missing, will NOT retry');
        return; // QUITAR setTimeout recursivo
    }

    console.log('All dependencies loaded, initializing map...');

    // CRÍTICO: WebGL check ANTES de crear mapa
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) throw new Error('WebGL not supported');
    } catch (error) {
        console.error('❌ WebGL check failed:', error);
        document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: red;"><h3>WebGL Error</h3><p>' + error.message + '</p><button onclick="location.reload()">Refresh</button></div>';
        return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    // CRÍTICO: TRY-CATCH alrededor de Map creation
    let map;
    try {
        map = new mapboxgl.Map({
            container: 'map',
            style: MAPBOX_CONFIG.style,
            center: MAPBOX_CONFIG.center,
            zoom: MAPBOX_CONFIG.zoom
        });
    } catch (error) {
        console.error('❌ Map creation failed:', error);
        document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: red;"><h3>Map Failed</h3><p>' + error.message + '</p><button onclick="location.reload()">Refresh</button></div>';
        return;
    }

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
        
        // NUEVO: Debug de capas después de cargar
        setTimeout(() => {
            console.log('🔍 Debugging map layers...');
            const layers = map.getStyle().layers;
            console.log('Available layers:', layers.map(l => l.id));
            
            // Verificar si las capas existen
            console.log('smaa_network layer exists:', !!map.getLayer('smaa_network'));
            console.log('smaa_network_squares layer exists:', !!map.getLayer('smaa_network_squares'));
            
            // Verificar features
            try {
                const features = map.querySourceFeatures(MAP_LAYERS.source, {
                    sourceLayer: MAP_LAYERS.sourceLayer
                });
                console.log('Total features found:', features.length);
                
                // Filtrar por estaciones activas vs no activas
                const activeFeatures = features.filter(f => APP_SETTINGS.activeStations.includes(f.properties.name));
                const inactiveFeatures = features.filter(f => !APP_SETTINGS.activeStations.includes(f.properties.name));
                
                console.log('Active stations features:', activeFeatures.length, activeFeatures.map(f => f.properties.name));
                console.log('Inactive stations features:', inactiveFeatures.length, inactiveFeatures.map(f => f.properties.name));
            } catch (error) {
                console.error('Error querying features:', error);
            }
        }, 2000);
        
        // Crear marcadores independientes
        setTimeout(() => {
            createIndependentMarkers();
        }, 1000);
        
        // Initialize IAS values after map loads
        setTimeout(() => {
            console.log('Initializing IAS values...');
            updateAllMarkerIAS();
            // NUEVO: Inicializar Master API squares
            updateMasterAPISquares();
        }, 2000);
        
        // NUEVO: Asegurar que SmabilityPanels esté inicializado
        setTimeout(() => {
            console.log('🎯 Ensuring SmabilityPanels is ready...');
            if (window.SmabilityPanels) {
                console.log('✅ SmabilityPanels module found');
                console.log('✅ showPanel function:', typeof window.SmabilityPanels.showPanel);
            } else {
                console.error('❌ SmabilityPanels module NOT found');
            }
            
            // Test panel container
            const container = document.getElementById('smabilityPanelContainer');
            const mainPanel = document.getElementById('smabilityMainPanel');
            console.log('📦 Panel container exists:', !!container);
            console.log('📱 Main panel exists:', !!mainPanel);
        }, 3000);
    
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
    
        // AQ Network toggle consolidado - FILTROS ACTUALIZADOS
        const toggleButton = document.getElementById('toggleAQNetwork');
        if (toggleButton) {
            let aqNetworkVisible = true;
            
            toggleButton.addEventListener('click', () => {
                aqNetworkVisible = !aqNetworkVisible;
                
                if (aqNetworkVisible) {
                    // Mostrar toda la red AQ (SIMAT + Smability)
                    map.setFilter('smaa_network', ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]); 
                    map.setFilter('smaa_network_squares', ['!', ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]]);
                    map.setLayoutProperty('smaa_network_ias', 'visibility', 'visible');
                    map.setLayoutProperty('smaa_network_labels', 'visibility', 'visible');
                    map.setLayoutProperty('smaa_network_squares', 'visibility', 'visible');

                    if (map.getLayer('smaa_network_squares_border')) {
                        map.setLayoutProperty('smaa_network_squares_border', 'visibility', 'visible');
                    }
                    
                    // NUEVO: Mostrar layer de texto para cuadrados Master API
                    if (map.getLayer('smaa_network_squares_text')) {
                        map.setLayoutProperty('smaa_network_squares_text', 'visibility', 'visible');
                    }
                    
                    
                    // Mostrar markers independientes de Smability
                    APP_SETTINGS.activeStations.forEach(location => {
                        if (markers.has(location)) {
                            markers.get(location).getElement().style.display = 'flex';
                        }
                    });
                } else {
                    // Ocultar toda la red AQ
                    map.setFilter('smaa_network', ['==', ['get', 'name'], '___NONE___']);
                    map.setFilter('smaa_network_squares', ['==', ['get', 'name'], '___NONE___']);
                    map.setLayoutProperty('smaa_network_ias', 'visibility', 'none');
                    map.setLayoutProperty('smaa_network_labels', 'visibility', 'none');
                    map.setLayoutProperty('smaa_network_squares', 'visibility', 'none');

                    if (map.getLayer('smaa_network_squares_border')) {
                        map.setLayoutProperty('smaa_network_squares_border', 'visibility', 'none');
                    }
                    
                    // NUEVO: Ocultar layer de texto para cuadrados Master API
                    if (map.getLayer('smaa_network_squares_text')) {
                        map.setLayoutProperty('smaa_network_squares_text', 'visibility', 'none');
                    }
                    
                    // Ocultar markers independientes de Smability
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
    
        // Add circle layer SOLO para estaciones activas (Smability)
        map.addLayer({
            'id': 'smaa_network',
            'type': 'circle',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'filter': ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]], // SOLO activas
            'paint': {
                'circle-color': '#4264fb', // Solo azul para Smability
                'circle-radius': 6,
                'circle-stroke-width': 1.2,
                'circle-stroke-color': '#ffffff'
            }
        });
        
        // Layer de MARCO BLANCO para cuadrados (va atrás)
        map.addLayer({
            'id': 'smaa_network_squares_border',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'filter': ['!', ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]],
            'layout': {
                'text-field': '■',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 20, // 4px más grande que el principal (29 + 4)
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            'paint': {
                'text-color': '#ffffff' // Marco blanco
            }
        });
        
        // Layer para markers cuadrados de SIMAT - FORMA DOMINANTE
        map.addLayer({
            'id': 'smaa_network_squares',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'filter': ['!', ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]], 
            'layout': {
                'text-field': '■', // Símbolo ASCII compatible
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12, // Tamaño ajustado para mejor visibilidad
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            'paint': {
                    'text-color': 'rgba(0,0,0,0)', // Transparente
                    'text-halo-color': '#666666',   // Color de fondo
                    'text-halo-width': 8           // Tamaño del fondo
                }
        });
        
        // Layer de texto para números IAS en cuadrados Master API
        map.addLayer({
            'id': 'smaa_network_squares_text',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'filter': ['!', ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]]],
            'layout': {
                'text-field': '', // Vacío por defecto, se llenará via Master API
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 10, // Tamaño más grande para mejor legibilidad
                'text-allow-overlap': true,
                'text-ignore-placement': true
            },
            'paint': {
                'text-color': '#FFFFFF'        // ← Texto negro #000000
             //   'text-halo-color': '#f0f0f0',   // ← Contorno gris claro
             //   'text-halo-width': 1.5          // ← Contorno sutil
            }
        });
    
        // Add IAS values - solo para estaciones activas
        map.addLayer({
            'id': 'smaa_network_ias',
            'type': 'symbol',
            'source': MAP_LAYERS.source,
            'source-layer': MAP_LAYERS.sourceLayer,
            'filter': ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
            'layout': {
                'text-field': '...', 
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
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
            'filter': ['in', ['get', 'name'], ['literal', APP_SETTINGS.activeStations]],
            'layout': {
                'text-field': 'ON',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 6,
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-offset': [0, 1.5]
            },
            'paint': {
                'text-color': '#4264fb'
            }
        });
        
        console.log('✅ All map layers added successfully');
    }

        // AGREGAR AQUÍ LA VERIFICACIÓN:
    /**
     * Verificar y corregir el orden de layers para mantener el marco blanco visible
     */
    function ensureProperLayerOrder() {
        setTimeout(() => {
            console.log('🔍 Verifying layer order for proper border display...');
            
            const borderLayer = map.getLayer('smaa_network_squares_border');
            const mainLayer = map.getLayer('smaa_network_squares');
            const textLayer = map.getLayer('smaa_network_squares_text');
            
            if (!borderLayer || !mainLayer) {
                console.log('⚠️ Required layers not found for ordering');
                return;
            }
            
            try {
                // Obtener la posición actual de los layers
                const allLayers = map.getStyle().layers;
                const borderIndex = allLayers.findIndex(l => l.id === 'smaa_network_squares_border');
                const mainIndex = allLayers.findIndex(l => l.id === 'smaa_network_squares');
                const textIndex = textLayer ? allLayers.findIndex(l => l.id === 'smaa_network_squares_text') : -1;
                
                console.log('📊 Current layer positions:', {
                    border: borderIndex,
                    main: mainIndex,
                    text: textIndex
                });
                
                // El marco debe estar ANTES (índice menor) que el cuadrado principal
                if (borderIndex > mainIndex) {
                    console.log('🔄 Correcting layer order: moving border behind main square');
                    map.moveLayer('smaa_network_squares_border', 'smaa_network_squares');
                }
                
                // El texto debe estar DESPUÉS (índice mayor) que ambos
                if (textLayer && textIndex < mainIndex) {
                    console.log('🔄 Correcting layer order: moving text in front of squares');
                    // Mover el texto al final, después de todos los otros layers de squares
                    map.moveLayer('smaa_network_squares_text');
                }
                
                console.log('✅ Layer order verified and corrected if needed');
                
            } catch (error) {
                console.error('❌ Error adjusting layer order:', error);
                // Si falla el ajuste automático, mostrar el orden actual para debug manual
                console.log('📋 Current layers order (for manual debugging):');
                map.getStyle().layers.forEach((layer, index) => {
                    if (layer.id.includes('smaa_network_squares')) {
                        console.log(`  ${index}: ${layer.id}`);
                    }
                });
            }
        }, 1000); // Esperar 1 segundo después de crear los layers
    }

    /**
     * Set up map click handlers
     */
    function setupMapInteractions() {
        // Click handler principal para todas las estaciones
        map.on('click', 'smaa_network', async (event) => {
            console.log('🖱️ Click detected on smaa_network layer');
            
            const features = map.queryRenderedFeatures(event.point, {
                layers: ['smaa_network']
            });
            
            if (!features.length) {
                console.log('❌ No features found at click point');
                return;
            }
    
            const feature = features[0];
            console.log('🎯 Clicked on station:', feature.properties.name);
            console.log('📊 Station properties:', feature.properties);
            
            if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                console.log('✅ This is an ACTIVE station (Smability)');
                console.log('🔍 Checking SmabilityPanels...');
                console.log('SmabilityPanels exists:', !!window.SmabilityPanels);
                console.log('showPanel function exists:', !!window.SmabilityPanels?.showPanel);
                
                if (window.SmabilityPanels && window.SmabilityPanels.showPanel) {
                    console.log('🚀 Calling SmabilityPanels.showPanel()...');
                    try {
                        window.SmabilityPanels.showPanel(feature.properties.name);
                        console.log('✅ SmabilityPanels.showPanel() called successfully');
                    } catch (error) {
                        console.error('❌ Error calling showPanel:', error);
                    }
                } else {
                    console.error('❌ SmabilityPanels or showPanel not available');
                }
            } else {
                console.log('📍 This is a SIMAT station (inactive)');
                const popup = new mapboxgl.Popup({ offset: [0, -15], maxWidth: '300px' })
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML(createPopupContent(feature, null))
                    .addTo(map);
            }
        });
        
        // Click handler para markers cuadrados (SIMAT) - INCLUIR AMBOS LAYERS
        map.on('click', 'smaa_network_squares', (event) => {
            console.log('Click detected on smaa_network_squares layer');
            
            const features = map.queryRenderedFeatures(event.point, {
                layers: ['smaa_network_squares']
            });
            
            if (!features.length) return;
            
            const feature = features[0];
            console.log('Clicked on SIMAT square station:', feature.properties.name);
            
            const popup = new mapboxgl.Popup({ offset: [0, -15], maxWidth: '300px' })
                .setLngLat(feature.geometry.coordinates)
                .setHTML(createPopupContent(feature, null))
                .addTo(map);
        });
        
        // NUEVO: Click handler para el layer de texto también
        map.on('click', 'smaa_network_squares_text', (event) => {
            const features = map.queryRenderedFeatures(event.point, {
                layers: ['smaa_network_squares_text']
            });
            
            if (!features.length) return;
            
            const feature = features[0];
            const popup = new mapboxgl.Popup({ offset: [0, -15], maxWidth: '300px' })
                .setLngLat(feature.geometry.coordinates)
                .setHTML(createPopupContent(feature, null))
                .addTo(map);
        });

    
        /* ===== POPUP LEGACY COMENTADO - BACKUP =====
        const popup = new mapboxgl.Popup({ 
            offset: [0, -15],
            maxWidth: '300px'
        })
        .setLngLat(feature.geometry.coordinates);
    
        // Event listener para cerrar panel cuando se cierre el popup
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
        ===== FIN POPUP LEGACY COMENTADO - BACKUP ===== */
    
        /* ===== CERRAR CHART PANEL COMENTADO - BACKUP =====
        // Cerrar panel cuando se hace click fuera de popup/panel
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
        ===== FIN CERRAR CHART PANEL COMENTADO - BACKUP ===== */
    
        // OPCIONAL: Cerrar panel Smability cuando se hace click fuera
        map.on('click', (event) => {
            // Si no se hizo click en una estación y hay un panel Smability abierto, cerrarlo
            const features = map.queryRenderedFeatures(event.point, {
                layers: ['smaa_network', 'smaa_network_squares']
            });
            
            // También verificar si no se hizo click en un marker de Mapbox
            const clickedMarker = event.originalEvent && event.originalEvent.target && 
                                 event.originalEvent.target.classList.contains('marker-pin');
            
            if (features.length === 0 && !clickedMarker) {
                console.log('Clicked outside station, closing Smability panel if open');
                setTimeout(() => {
                    // Verificar si no hay popups visibles y cerrar panel Smability
                    const visiblePopups = document.querySelectorAll('.mapboxgl-popup');
                    const smabilityPanel = document.getElementById('smabilityMainPanel');
                    
                    if (visiblePopups.length === 0 && smabilityPanel && 
                        smabilityPanel.style.display !== 'none') {
                        if (window.SmabilityPanels && window.SmabilityPanels.closeMainPanel) {
                            window.SmabilityPanels.closeMainPanel();
                        }
                    }
                }, 100);
            }
        });
    
        // Change cursor on hover - para todas las estaciones
        map.on('mouseenter', 'smaa_network', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
    
        map.on('mouseleave', 'smaa_network', () => {
            map.getCanvas().style.cursor = '';
        });
        
        // Change cursor on hover - para markers cuadrados
        map.on('mouseenter', 'smaa_network_squares', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', 'smaa_network_squares', () => {
            map.getCanvas().style.cursor = '';
        });
        
        console.log('✅ Map interactions setup complete');
       
        // Click handler adicional para marcadores independientes
        document.addEventListener('click', (event) => {
            if (event.target && event.target.classList.contains('marker-pin')) {
                const stationName = event.target.getAttribute('data-station');
                if (stationName) {
                    console.log('🎯 Independent marker clicked via document listener:', stationName);
                    
                    if (window.SmabilityPanels && window.SmabilityPanels.showPanel) {
                        console.log('🚀 Calling showPanel from independent marker...');
                        window.SmabilityPanels.showPanel(stationName);
                    }
                }
            }
        });
    }
    

        /**
     * Crear marcadores independientes basados únicamente en DEVICE_COORDINATES
     * No depende del dataset de Mapbox para nombres ni ubicaciones
     */
    function createIndependentMarkers() {
        console.log('🚀 Creating independent markers from DEVICE_COORDINATES...');
        console.log('Active stations to create:', APP_SETTINGS.activeStations);
        console.log('Available coordinates:', DEVICE_COORDINATES);
        
        APP_SETTINGS.activeStations.forEach(stationName => {
            if (DEVICE_COORDINATES[stationName]) {
                const coordinates = DEVICE_COORDINATES[stationName];
                
                // Evitar duplicados
                if (!markers.has(stationName)) {
                    // Crear elemento del marker
                    const el = createMarkerElement('#cccccc', '...');
                    el.setAttribute('data-station', stationName); // Para identificación
                    el.style.cursor = 'pointer';
                    
                    // Crear marker de Mapbox
                    const marker = new mapboxgl.Marker({ element: el })
                        .setLngLat(coordinates)
                        .addTo(map);
                    
                    // Guardar referencia
                    markers.set(stationName, marker);
                    
                    // Agregar click handler directamente al elemento
                    el.addEventListener('click', (event) => {
                        event.stopPropagation();
                        console.log(`🎯 Independent marker clicked: ${stationName}`);
                        
                        if (window.SmabilityPanels && window.SmabilityPanels.showPanel) {
                            console.log('🚀 Opening SmabilityPanels for:', stationName);
                            window.SmabilityPanels.showPanel(stationName);
                        } else {
                            console.error('❌ SmabilityPanels not available');
                        }
                    });
                    
                    console.log(`✅ Created independent marker: ${stationName} at [${coordinates}]`);
                } else {
                    console.log(`⚠️ Marker already exists for: ${stationName}`);
                }
            } else {
                console.error(`❌ No coordinates found for station: ${stationName}`);
                console.log('Available coordinates keys:', Object.keys(DEVICE_COORDINATES));
            }
        });
        
        console.log(`📍 Created ${markers.size} independent markers`);
        
        // Actualizar datos de los marcadores después de crearlos
        setTimeout(() => {
            console.log('🔄 Updating independent marker data...');
            updateMarkerData();
        }, 1000);
    }
    

    /**
     * Update marker color and size with IAS value
     */
    async function updateMarkerColor(location) {
        if (!markers.has(location)) return;
        
        try {
            const sensorData = await fetchSensorData(location);
            const marker = markers.get(location);
            
            if (sensorData && sensorData.displayConfig) {
                const { displayConfig } = sensorData;
                const el = marker.getElement();
                
                if (displayConfig.showIAS && sensorData.displayIAS !== 'N/A') {
                    // CASO 1: Datos LIVE (≤ 1 hora) - Mostrar IAS con color normal
                    const { color } = getIndicatorColor(sensorData.displayIAS);
                    el.style.backgroundColor = color; // Color basado en calidad del aire
                    el.textContent = Math.round(sensorData.displayIAS); // Valor numérico
                    el.style.color = '#000000';  // Texto negro
                    el.title = `IAS: ${sensorData.displayIAS} (${displayConfig.label})`;
                    
                    console.log(`✅ ${location}: Live IAS ${sensorData.displayIAS} (${displayConfig.label})`);
                } else {
                    // CASO 2: Datos NO LIVE (> 1 hora) - Fondo gris + icono de estado
                    el.style.backgroundColor = '#888888'; // Gris uniforme para todos los estados no-live
                    el.textContent = displayConfig.indicator; // ◐, ○, o ×
                    el.style.color = '#ffffff';  // Texto blanco para contraste
                    el.title = `${displayConfig.status.toUpperCase()} - Last update: ${displayConfig.label}`;
                    
                    console.log(`⚠️ ${location}: ${displayConfig.status} indicator (${displayConfig.label})`);
                }
                
                // Estilo común para todos los markers
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.fontSize = '10px';
                el.style.fontWeight = 'bold';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.border = '2px solid white';
                el.style.borderRadius = '50%';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                
            } else {
                // Fallback al comportamiento original (para compatibilidad)
                if (sensorData && sensorData.dataIAS !== 'N/A') {
                    const { color } = getIndicatorColor(sensorData.dataIAS);
                    const el = marker.getElement();
                    
                    el.style.backgroundColor = color;
                    el.style.width = '24px';
                    el.style.height = '24px';
                    el.textContent = Math.round(sensorData.dataIAS);
                    el.style.fontSize = '10px';
                    el.style.fontWeight = 'bold';
                    el.style.color = '#000000';
                    
                    console.log(`📊 ${location}: Fallback IAS display ${sensorData.dataIAS}`);
                }
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
     * Update Master API square markers with IAS data
     * Función específica para marcadores cuadrados de la API Master
     */
    async function updateMasterAPISquares() {
        try {
            console.log('🔄 Updating Master API square markers...');
            
            // Verificar que el sistema Master API esté disponible
            if (typeof window.MasterAPI !== 'undefined' && window.MasterAPI.updateStations) {
                console.log('✅ Master API system found, triggering update...');
                await window.MasterAPI.updateStations();
            } else if (typeof updateReferenceStations === 'function') {
                console.log('✅ Legacy Master API function found, triggering update...');
                await updateReferenceStations();
            } else {
                console.log('⚠️ Master API system not available yet');
            }
            
        } catch (error) {
            console.error('❌ Error updating Master API squares:', error);
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
            
            // 1. Update marker colors and IAS values for active stations (Smability circular markers)
            if (typeof updateMarkerData === 'function') {
                await updateMarkerData();
            }
            
            // 2. NUEVO: Update Master API square markers
            await updateMasterAPISquares();
            
            // 3. Force update of all circular markers
            for (const location of APP_SETTINGS.activeStations) {
                if (markers.has(location)) {
                    await updateMarkerColor(location);
                }
            }
            
            // 4. Update any visible popups
            const visiblePopups = document.querySelectorAll('.mapboxgl-popup');
            if (visiblePopups.length > 0) {
                try {
                    const features = map.queryRenderedFeatures({
                        layers: ['smaa_network', 'smaa_network_squares'] // Incluir ambos layers
                    });
                    
                    for (const feature of features) {
                        if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
                            // Smability stations - usar API BioBox
                            const sensorData = await fetchSensorData(feature.properties.name);
                            const popupContent = visiblePopups[0].querySelector('.mapboxgl-popup-content');
                            if (popupContent) {
                                popupContent.innerHTML = createPopupContent(feature, sensorData);
                            }
                        } else {
                            // Master API stations - crear popup básico
                            const popupContent = visiblePopups[0].querySelector('.mapboxgl-popup-content');
                            if (popupContent) {
                                popupContent.innerHTML = createPopupContent(feature, null);
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
