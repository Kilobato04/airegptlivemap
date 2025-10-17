// ============================================================================
// MASTER API FUNCTIONS - Archivo separado
// network/assets/js/master-api.js
// 
// Depende de: master-api-config.js, config.js (para MAP_LAYERS)
// ============================================================================

console.log('📡 Loading Master API functions...');

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

/**
 * Fetch data from Master API - Función principal
 * @returns {Promise<Array>} Array of station data
 */
async function fetchMasterAPIData() {
    const now = Date.now();
    
    // Check cache first
    if (window.MASTER_API_CONFIG.lastFetch && 
        (now - window.MASTER_API_CONFIG.lastFetch) < window.MASTER_API_CONFIG.cacheTimeout &&
        window.MASTER_API_CONFIG.cache.has('all_stations')) {
        console.log('📋 Using cached Master API data');
        window.logSchedule('Using cached data');
        return window.MASTER_API_CONFIG.cache.get('all_stations');
    }

    try {
        console.log('🌐 Fetching from Master API...');
        window.logSchedule('Fetching fresh data from API');
        
        const params = new URLSearchParams(window.MASTER_API_CONFIG.params);
        const url = `${window.MASTER_API_CONFIG.baseUrl}?${params.toString()}`;
        
        console.log('📍 API URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Master API failed with status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('📊 Raw API response type:', typeof data);
        console.log('📊 API response structure:', Object.keys(data));
        
        // Extraer el array de estaciones de la respuesta
        let stationsArray;
        if (Array.isArray(data)) {
            stationsArray = data;
            console.log('✅ Response is direct array format');
        } else if (data.stations && Array.isArray(data.stations)) {
            stationsArray = data.stations;
            console.log('✅ Response is nested in data.stations format');
        } else {
            console.error('❌ API response does not contain stations array. Response:', data);
            throw new Error(`Expected stations array but got: ${typeof data}`);
        }

        console.log(`📊 Master API response: ${stationsArray.length} stations total`);

        // Mostrar primeras estaciones para debug
        console.log('📋 First 3 stations from API:');
        stationsArray.slice(0, 3).forEach((station, index) => {
            console.log(`  ${index + 1}. ID: ${station.station_id}, Name: ${station.station_name}, Type: ${station.device_type}, IAS: ${station.ias_numeric_value}`);
        });

        // Filtrar solo estaciones reference
        const referenceStations = stationsArray.filter(station => {
            if (!station || typeof station !== 'object') {
                console.warn('⚠️ Invalid station object:', station);
                return false;
            }
            return station.device_type === 'reference';
        });

        console.log(`✅ Filtered ${referenceStations.length} reference stations from ${stationsArray.length} total`);
        
        // Log reference stations con los campos que nos interesan
        console.log('🎯 Reference stations found:');
        referenceStations.forEach(station => {
            const isMapped = window.REFERENCE_STATION_MAPPING && window.REFERENCE_STATION_MAPPING[station.station_id];
            console.log(`  - ${station.station_id} (${station.station_name})`);
            console.log(`    IAS: ${station.ias_numeric_value}, Color: ${station.color_code}, Status: ${station.reading_status}`);
            console.log(`    Mapped: ${isMapped ? '✅ YES' : '⚠️ NO'}`);
        });
        
        // Check para estaciones mapeadas específicamente
        const mappedStations = referenceStations.filter(s => window.REFERENCE_STATION_MAPPING[s.station_id]);
        mappedStations.forEach(station => {
            console.log(`🎯 MAPPED STATION FOUND: ${station.station_id} (${station.station_name})`);
            console.log(`  IAS Value: ${station.ias_numeric_value}`);
            console.log(`  Color Code: ${station.color_code}`);
            console.log(`  Reading Status: ${station.reading_status}`);
            console.log(`  Category: ${station.category}`);
            
            window.logSchedule(`Station ${station.station_id} found`, {
                station_id: station.station_id,
                ias: station.ias_numeric_value,
                color: station.color_code,
                status: station.reading_status
            });
        });
        
        if (mappedStations.length === 0) {
            console.warn('⚠️ NO MAPPED STATIONS FOUND in reference stations');
            window.logSchedule('No mapped stations found');
            
            const allReferenceIds = referenceStations.map(s => s.station_id);
            console.log('📋 Available reference station IDs:', allReferenceIds);
            console.log('📋 Configured mappings:', Object.keys(window.REFERENCE_STATION_MAPPING));
        }
        
        // Cache the results
        window.MASTER_API_CONFIG.cache.set('all_stations', referenceStations);
        window.MASTER_API_CONFIG.lastFetch = now;

        return referenceStations;

    } catch (error) {
        console.error('❌ Error fetching Master API data:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            url: `${window.MASTER_API_CONFIG.baseUrl}?${new URLSearchParams(window.MASTER_API_CONFIG.params).toString()}`
        });
        
        window.logSchedule('API fetch error', error.message);
        
        // Return cached data if available, even if expired
        if (window.MASTER_API_CONFIG.cache.has('all_stations')) {
            console.log('⚠️ Using expired cache due to fetch error');
            window.logSchedule('Using expired cache due to error');
            return window.MASTER_API_CONFIG.cache.get('all_stations');
        }
        
        // Return empty array instead of undefined
        console.log('❌ No cached data available, returning empty array');
        return [];
    }
}

/**
 * Process Master API data and update reference station squares
 */
async function updateReferenceStations() {
    try {
        console.log('🔄 Starting reference stations update...');
        window.logSchedule('Starting station update process');
        
        const stations = await fetchMasterAPIData();
        
        if (!stations.length) {
            console.log('⚠️ No reference stations data available');
            window.logSchedule('No stations data available');
            return;
        }

        console.log(`📍 Processing ${stations.length} reference stations`);
        
        // Update square markers for each mapped reference station
        let updatedCount = 0;
        let mappedCount = 0;
        
        stations.forEach(station => {
            const isMapped = window.REFERENCE_STATION_MAPPING[station.station_id];
            if (isMapped) {
                mappedCount++;
                const updated = updateReferenceStationSquare(station);
                if (updated) updatedCount++;
            } else {
                console.log(`⚠️ Station ${station.station_id} not in mapping, skipping`);
            }
        });

        console.log(`✅ Reference stations update complete: ${updatedCount}/${mappedCount} mapped stations updated`);
        window.logSchedule('Update complete', {
            total: stations.length,
            mapped: mappedCount,
            updated: updatedCount
        });

    } catch (error) {
        console.error('❌ Error updating reference stations:', error);
        window.logSchedule('Update error', error.message);
    }
}

/**
 * Update individual reference station square marker
 * @param {Object} stationData - Station data from Master API
 * @returns {boolean} - Whether the update was successful
 */
function updateReferenceStationSquare(stationData) {
    const { station_id, station_name, ias_numeric_value, color_code, category, reading_status } = stationData;
    
    try {
        console.log(`🎯 Updating station: ${station_id} (${station_name})`);
        
        // Verificar que el mapa y las capas existen
        if (!window.map || !window.map.getLayer || !window.map.getLayer('smaa_network_squares')) {
            console.log(`⚠️ Map or smaa_network_squares layer not ready for ${station_id}`);
            return false;
        }

        // Buscar features que coincidan con este station_id o station_name
        let features = [];
        
        // Intentar con station_id primero
        try {
            features = window.map.querySourceFeatures(window.MAP_LAYERS.source, {
                sourceLayer: window.MAP_LAYERS.sourceLayer,
                filter: ['==', 'name', station_id]
            });
            console.log(`🔍 Query with station_id '${station_id}': ${features.length} features found`);
        } catch (queryError) {
            console.log(`⚠️ Error querying with station_id ${station_id}:`, queryError);
        }

        // Si no encuentra con station_id, intentar con station_name
        if (features.length === 0) {
            try {
                features = window.map.querySourceFeatures(window.MAP_LAYERS.source, {
                    sourceLayer: window.MAP_LAYERS.sourceLayer,
                    filter: ['==', 'name', station_name]
                });
                console.log(`🔍 Query with station_name '${station_name}': ${features.length} features found`);
            } catch (queryError) {
                console.log(`⚠️ Error querying with station_name ${station_name}:`, queryError);
            }
        }

        // Si aún no encuentra, intentar con mapeo
        if (features.length === 0 && window.REFERENCE_STATION_MAPPING[station_id]) {
            const mappedName = window.REFERENCE_STATION_MAPPING[station_id];
            try {
                features = window.map.querySourceFeatures(window.MAP_LAYERS.source, {
                    sourceLayer: window.MAP_LAYERS.sourceLayer,
                    filter: ['==', 'name', mappedName]
                });
                console.log(`🔍 Query with mapped name '${mappedName}': ${features.length} features found`);
            } catch (queryError) {
                console.log(`⚠️ Error querying with mapped name ${mappedName}:`, queryError);
            }
        }

        if (features.length === 0) {
            console.log(`❌ No map feature found for station: ${station_id} (${station_name})`);
            return false;
        }

        console.log(`🎯 Found ${features.length} feature(s) for ${station_id}`);

        // Determinar qué mostrar basado en reading_status
        let displayText, textColor;
        
        if (reading_status === 'current' && ias_numeric_value) {
            displayText = Math.round(ias_numeric_value).toString();
            textColor = getContrastColor(color_code);
            console.log(`📊 Displaying IAS: ${displayText} with color: ${color_code} (text: ${textColor})`);
        } else {
            displayText = reading_status === 'stale' ? '○' : '×';
            textColor = '#ffffff';
            console.log(`⚠️ Displaying status: ${displayText} (${reading_status})`);
        }

        // Crear identificadores para esta estación
        const stationIdentifiers = [station_id, station_name];
        if (window.REFERENCE_STATION_MAPPING[station_id]) {
            stationIdentifiers.push(window.REFERENCE_STATION_MAPPING[station_id]);
        }

        console.log(`🏷️ Station identifiers: [${stationIdentifiers.join(', ')}]`);

        // Actualizar propiedades del mapa
        try {
            console.log(`🎨 Updating map properties for identifiers: ${stationIdentifiers}`);
            
            // Actualizar color de texto del square
            window.map.setPaintProperty('smaa_network_squares', 'text-color', [
                'case',
                ['in', ['get', 'name'], ['literal', stationIdentifiers]],
                textColor,
                '#666666' // color por defecto
            ]);

            // Actualizar texto mostrado
            window.map.setLayoutProperty('smaa_network_squares', 'text-field', [
                'case',
                ['in', ['get', 'name'], ['literal', stationIdentifiers]],
                displayText,
                '■' // símbolo por defecto
            ]);

            // Agregar fondo de color IAS usando halo
            if (reading_status === 'current' && color_code) {
                window.map.setPaintProperty('smaa_network_squares', 'text-halo-color', [
                    'case',
                    ['in', ['get', 'name'], ['literal', stationIdentifiers]],
                    color_code,
                    'rgba(0,0,0,0)' // transparente por defecto
                ]);

                window.map.setPaintProperty('smaa_network_squares', 'text-halo-width', [
                    'case',
                    ['in', ['get', 'name'], ['literal', stationIdentifiers]],
                    4, // Halo más prominente
                    0 // sin halo por defecto
                ]);
                
                console.log(`🎨 Applied halo color: ${color_code} with width: 4`);
            }

            console.log(`✅ Successfully updated square for ${station_id}: ${displayText} (${color_code})`);
            return true;

        } catch (mapError) {
            console.error(`❌ Error updating map layer for ${station_id}:`, mapError);
            return false;
        }

    } catch (error) {
        console.error(`❌ Error processing station ${station_id}:`, error);
        return false;
    }
}

/**
 * Get contrasting text color (white or black) based on background color
 * @param {string} hexColor - Background color in hex format
 * @returns {string} - Text color (white or black)
 */
function getContrastColor(hexColor) {
    try {
        if (!hexColor) return '#ffffff';
        
        const hex = hexColor.replace('#', '');
        
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
            g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
            b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
        } else {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        }
        
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    } catch (error) {
        console.error('Error calculating contrast color:', error);
        return '#ffffff';
    }
}

// ============================================================================
// SCHEDULING SYSTEM
// ============================================================================

/**
 * Initialize Master API integration con scheduling específico
 */
function initializeMasterAPI() {
    console.log('🚀 Initializing Master API integration with hourly scheduling...');
    
    // Verificar que el mapa esté completamente cargado
    if (window.map && window.map.isStyleLoaded && window.map.isStyleLoaded()) {
        console.log('🗺️ Map is ready, starting Master API scheduled updates...');
        
        // Log de configuración inicial
        if (window.logSchedule) {
            window.logSchedule('Initialization started');
            window.logSchedule('Update schedule', window.MASTER_API_CONFIG.scheduleConfig.updateMinutes);
            window.logSchedule('Active mappings', Object.keys(window.REFERENCE_STATION_MAPPING));
        }
        
        // Primera actualización inmediata (con delay inicial)
        setTimeout(() => {
            console.log('🔄 Running initial Master API update...');
            if (window.logSchedule) {
                window.logSchedule('Running initial update');
            }
            updateReferenceStations();
        }, window.MASTER_API_CONFIG.scheduleConfig.initialDelay);

        // Configurar el sistema de scheduling
        setupHourlyScheduling();

        console.log('✅ Master API integration initialized with hourly scheduling at minutes:', 
                   window.MASTER_API_CONFIG.scheduleConfig.updateMinutes);
    } else {
        console.log('⏳ Map not ready for Master API, retrying in 2 seconds...');
        setTimeout(initializeMasterAPI, 2000);
    }
}

/**
 * Configurar sistema de scheduling para actualizaciones en minutos específicos de cada hora
 */
function setupHourlyScheduling() {
    console.log('⏰ Setting up hourly scheduling system...');
    
    function scheduleNextUpdate() {
        const scheduleInfo = window.getTimeUntilNextScheduledUpdate();
        const timeUntilNext = scheduleInfo.timeUntilNext;
        const targetTime = scheduleInfo.targetTime;
        const targetMinute = scheduleInfo.targetMinute;
        
        if (window.logSchedule) {
            window.logSchedule(`Next update scheduled for ${window.formatTimeForLogging(targetTime)} (minute ${targetMinute})`);
            window.logSchedule(`Time until next update: ${Math.round(timeUntilNext / 1000)} seconds`);
        }
        
        // Programar la próxima actualización
        setTimeout(async () => {
            // Ejecutar la actualización
            if (window.logSchedule) {
                window.logSchedule(`Executing scheduled update at minute ${targetMinute}`);
            }
            
            console.log(`⏰ Scheduled Master API update at minute ${targetMinute}`);
            await updateReferenceStations();
            
            // Programar la siguiente actualización
            scheduleNextUpdate();
            
        }, timeUntilNext);
    }
    
    // Iniciar el sistema de scheduling
    scheduleNextUpdate();
    
    // Configurar fallback timer (cada 30 minutos) por si falla el scheduling
    setInterval(() => {
        if (window.logSchedule) {
            window.logSchedule('Fallback update triggered');
        }
