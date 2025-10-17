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

        // Filtrar estaciones reference Y smaa
        const filteredStations = stationsArray.filter(station => {
            if (!station || typeof station !== 'object') {
                console.warn('⚠️ Invalid station object:', station);
                return false;
            }
            return station.device_type === 'reference' || station.device_type === 'smaa';
        });

        console.log(`✅ Filtered ${filteredStations.length} reference+smaa stations from ${stationsArray.length} total`);
        
        // Log reference+smaa stations con los campos que nos interesan
        console.log('🎯 Reference+SMAA stations found:');
        filteredStations.forEach(station => {
            const isMapped = window.REFERENCE_STATION_MAPPING && window.REFERENCE_STATION_MAPPING[station.station_id];
            console.log(`  - ${station.station_id} (${station.station_name}) - Type: ${station.device_type}`);
            console.log(`    IAS: ${station.ias_numeric_value}, Color: ${station.color_code}, Status: ${station.reading_status}`);
            console.log(`    Mapped: ${isMapped ? '✅ YES' : '⚠️ NO'}`);
        });
        
        // Check para estaciones mapeadas específicamente
        const mappedStations = filteredStations.filter(s => window.REFERENCE_STATION_MAPPING[s.station_id]);
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
            console.warn('⚠️ NO MAPPED STATIONS FOUND in filtered stations');
            window.logSchedule('No mapped stations found');
            
            const allFilteredIds = filteredStations.map(s => s.station_id);
            console.log('📋 Available filtered station IDs:', allFilteredIds);
            console.log('📋 Configured mappings:', Object.keys(window.REFERENCE_STATION_MAPPING));
        }
        
        // Cache the results
        window.MASTER_API_CONFIG.cache.set('all_stations', filteredStations);
        window.MASTER_API_CONFIG.lastFetch = now;
        
        return filteredStations;

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
 * Process Master API data and update reference station squares - VERSIÓN CORREGIDA
 * Actualiza TODAS las estaciones mapeadas de una vez
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
        
        // Filtrar solo estaciones mapeadas
        const mappedStations = stations.filter(station => 
            window.ALL_STATIONS_MAPPING[station.station_id]
        );
        
        if (mappedStations.length === 0) {
            console.log('⚠️ No mapped stations found');
            window.logSchedule('No mapped stations found');
            return;
        }
        
        console.log(`🎯 Found ${mappedStations.length} mapped stations to update`);
        mappedStations.forEach(station => {
            console.log(`  - ${station.station_id} (${station.station_name}) - IAS: ${station.ias_numeric_value}`);
        });
        
        // NUEVO: Actualizar todas las estaciones de una vez
        const updateResult = updateAllReferenceStationSquares(mappedStations);
        
        console.log(`✅ Reference stations update complete: ${updateResult.updated}/${mappedStations.length} mapped stations updated`);
        if (updateResult.errors.length > 0) {
            console.log('⚠️ Update errors:', updateResult.errors);
        }
        
        window.logSchedule('Update complete', {
            total: stations.length,
            mapped: mappedStations.length,
            updated: updateResult.updated
        });

    } catch (error) {
        console.error('❌ Error updating reference stations:', error);
        window.logSchedule('Update error', error.message);
    }
}

/**
 * NUEVA FUNCIÓN: Actualizar todas las estaciones reference de una vez
 * @param {Array} mappedStations - Array de estaciones mapeadas
 * @returns {Object} - Resultado de la actualización
 */
function updateAllReferenceStationSquares(mappedStations) {
    try {
        console.log('🎨 Updating all reference station squares...');
        
        // Verificar que el mapa y las capas existen
        if (!window.map || !window.map.getLayer || !window.map.getLayer('smaa_network_squares')) {
            console.log('⚠️ Map or smaa_network_squares layer not ready');
            return { updated: 0, errors: ['Map not ready'] };
        }

        // Obtener todas las features del mapa
        let allFeatures;
        try {
            allFeatures = window.map.querySourceFeatures(window.MAP_LAYERS.source, {
                sourceLayer: window.MAP_LAYERS.sourceLayer
            });
            console.log(`📋 Found ${allFeatures.length} total features in map`);
        } catch (error) {
            console.error('❌ Error querying map features:', error);
            return { updated: 0, errors: ['Map query failed'] };
        }

        // Preparar arrays para las expresiones de Mapbox
        const textColorCases = [];
        const textFieldCases = [];
        const haloColorCases = [];
        const haloWidthCases = [];
        
        let updatedCount = 0;
        const errors = [];

        // Procesar cada estación mapeada
        mappedStations.forEach(station => {
            const { station_id, station_name, ias_numeric_value, color_code, reading_status } = station;
            
            console.log(`🎯 Processing station: ${station_id} (${station_name})`);
            
            // Buscar features para esta estación
            const mappedName = window.ALL_STATIONS_MAPPING[station_id];
            const stationIdentifiers = [station_id, station_name, mappedName].filter(Boolean);
            
            console.log(`🔍 Looking for identifiers: [${stationIdentifiers.join(', ')}]`);
            
            // Encontrar features que coincidan
            const matchingFeatures = allFeatures.filter(feature => 
                stationIdentifiers.includes(feature.properties.name)
            );
            
            if (matchingFeatures.length === 0) {
                console.log(`❌ No features found for ${station_id} with identifiers: ${stationIdentifiers}`);
                
                // Debug: buscar nombres similares
                const similarFeatures = allFeatures.filter(f => 
                    f.properties.name && (
                        f.properties.name.toLowerCase().includes(station_id.toLowerCase()) ||
                        f.properties.name.toLowerCase().includes(station_name.toLowerCase().substring(0, 5))
                    )
                );
                if (similarFeatures.length > 0) {
                    console.log(`🔍 Similar features found: ${similarFeatures.map(f => f.properties.name)}`);
                }
                
                errors.push(`No features for ${station_id}`);
                return;
            }
            
            console.log(`✅ Found ${matchingFeatures.length} feature(s) for ${station_id}: ${matchingFeatures.map(f => f.properties.name)}`);
            
            // Determinar qué mostrar
            let displayText, textColor;
            
            if (reading_status === 'current' && ias_numeric_value) {
                displayText = Math.round(ias_numeric_value).toString();
                textColor = getContrastColor(color_code);
                console.log(`📊 ${station_id}: IAS ${displayText}, Color ${color_code}, Text ${textColor}`);
            } else {
                displayText = reading_status === 'stale' ? '○' : '×';
                textColor = '#ffffff';
                console.log(`⚠️ ${station_id}: Status ${displayText} (${reading_status})`);
            }
            
            // Agregar casos a las expresiones de Mapbox SOLO para features encontradas
            matchingFeatures.forEach(feature => {
                const featureName = feature.properties.name;
                
                // Text color
                textColorCases.push(['==', ['get', 'name'], featureName]);
                textColorCases.push(textColor);
                
                // Text field (display text)
                textFieldCases.push(['==', ['get', 'name'], featureName]);
                textFieldCases.push(displayText);
                
                // Halo color y width para estaciones con datos actuales
                if (reading_status === 'current' && color_code) {
                    haloColorCases.push(['==', ['get', 'name'], featureName]);
                    haloColorCases.push(color_code);
                    
                    haloWidthCases.push(['==', ['get', 'name'], featureName]);
                    haloWidthCases.push(4);
                }
            });
            
            updatedCount++;
        });

        // Aplicar todas las actualizaciones al mapa de una vez
        try {
            console.log(`🎨 Applying map style updates for ${updatedCount} stations...`);
            console.log(`📊 Text cases: ${textColorCases.length / 2}, Halo cases: ${haloColorCases.length / 2}`);
            
            // Actualizar color de texto
            if (textColorCases.length > 0) {
                window.map.setPaintProperty('smaa_network_squares', 'text-color', [
                    'case',
                    ...textColorCases,
                    '#666666' // color por defecto
                ]);
                console.log('✅ Text color updated');
            }
            
            // Actualizar texto mostrado
            if (textFieldCases.length > 0) {
                window.map.setLayoutProperty('smaa_network_squares', 'text-field', [
                    'case',
                    ...textFieldCases,
                    '■' // símbolo por defecto
                ]);
                console.log('✅ Text field updated');
            }
            
            // Actualizar color del halo
            if (haloColorCases.length > 0) {
                window.map.setPaintProperty('smaa_network_squares', 'text-halo-color', [
                    'case',
                    ...haloColorCases,
                    'rgba(0,0,0,0)' // transparente por defecto
                ]);
                console.log('✅ Halo color updated');
            }
            
            // Actualizar ancho del halo
            if (haloWidthCases.length > 0) {
                window.map.setPaintProperty('smaa_network_squares', 'text-halo-width', [
                    'case',
                    ...haloWidthCases,
                    0 // sin halo por defecto
                ]);
                console.log('✅ Halo width updated');
            }
            
            console.log(`✅ Successfully updated ${updatedCount} stations on map`);
            
        } catch (mapError) {
            console.error('❌ Error applying map updates:', mapError);
            errors.push('Map update failed: ' + mapError.message);
        }
        
        return { updated: updatedCount, errors };
        
    } catch (error) {
        console.error('❌ Error in updateAllReferenceStationSquares:', error);
        return { updated: 0, errors: [error.message] };
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
        if (features.length === 0 && window.ALL_STATIONS_MAPPING[station_id]) {
            const mappedName = window.ALL_STATIONS_MAPPING[station_id];
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
        if (window.ALL_STATIONS_MAPPING[station_id]) {
            stationIdentifiers.push(window.ALL_STATIONS_MAPPING[station_id]);
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
            window.logSchedule('Active mappings', Object.keys(window.ALL_STATIONS_MAPPING));
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
    
    console.log('🔄 Fallback Master API update (every 30 min)...');
        updateReferenceStations();
    }, window.MASTER_API_CONFIG.scheduleConfig.fallbackInterval);
    
    console.log('✅ Hourly scheduling system configured');
}

// ============================================================================
// TESTING AND DEBUG FUNCTIONS
// ============================================================================

/**
 * Manual trigger for testing con logging mejorado
 */
function testMasterAPI() {
    console.log('🧪 Manual Master API test triggered...');
    if (window.logSchedule) {
        window.logSchedule('Manual test triggered');
    }
    updateReferenceStations();
}

/**
 * Test function para probar el sistema de scheduling
 */
function testScheduling() {
    console.log('🧪 Testing scheduling system...');
    if (window.debugScheduling) {
        window.debugScheduling();
    } else {
        console.log('❌ debugScheduling function not available');
    }
}

/**
 * Debug function to check current map state
 */
function debugMapState() {
    console.log('=== MAP STATE DEBUG ===');
    console.log('Map exists:', !!window.map);
    console.log('Map loaded:', window.map && window.map.isStyleLoaded ? window.map.isStyleLoaded() : 'unknown');
    console.log('smaa_network_squares layer exists:', window.map && window.map.getLayer ? !!window.map.getLayer('smaa_network_squares') : 'unknown');
    
    if (window.map && window.MAP_LAYERS) {
        try {
            const allFeatures = window.map.querySourceFeatures(window.MAP_LAYERS.source, {
                sourceLayer: window.MAP_LAYERS.sourceLayer
            });
            console.log('Total features in source:', allFeatures.length);
            
            // Sample de nombres de features
            const sampleNames = allFeatures.slice(0, 10).map(f => f.properties.name);
            console.log('Sample feature names:', sampleNames);
            
            // Buscar específicamente features mapeadas
            Object.keys(window.ALL_STATIONS_MAPPING).forEach(stationId => {
                const mappedName = window.ALL_STATIONS_MAPPING[stationId];
                const matchingFeatures = allFeatures.filter(f => 
                    f.properties.name === stationId ||
                    f.properties.name === mappedName
                );
                console.log(`${stationId} → ${mappedName}: ${matchingFeatures.length} features found`);
            });
            
        } catch (error) {
            console.log('Error querying features:', error);
        }
    }
    console.log('=======================');
}

/**
 * Función para simular diferentes horarios (solo para testing)
 * @param {number} hour - Hora a simular (0-23)
 * @param {number} minute - Minuto a simular (0-59)
 */
function simulateTimeAndTest(hour, minute) {
    console.log(`🕐 Simulating time: ${hour}:${minute.toString().padStart(2, '0')}`);
    
    // Crear fecha simulada
    const simulatedNow = new Date();
    simulatedNow.setHours(hour);
    simulatedNow.setMinutes(minute);
    simulatedNow.setSeconds(0);
    
    // Temporalmente sobrescribir Date para la simulación
    const originalNow = Date;
    window.Date = function(...args) {
        if (args.length === 0) {
            return simulatedNow;
        }
        return new originalNow(...args);
    };
    window.Date.now = () => simulatedNow.getTime();
    
    // Probar el scheduling
    const scheduleInfo = window.getTimeUntilNextScheduledUpdate();
    console.log('📊 Simulation results:');
    console.log('  Next update minute:', scheduleInfo.targetMinute);
    console.log('  Time until next:', Math.round(scheduleInfo.timeUntilNext / 1000), 'seconds');
    console.log('  Target time:', window.formatTimeForLogging(scheduleInfo.targetTime));
    
    // Restaurar Date original
    window.Date = originalNow;
}

/**
 * Test completo de toda la funcionalidad
 */
function runCompleteTest() {
    console.log('🧪 Running complete Master API test...');
    console.log('=====================================');
    
    // 1. Test configuración
    console.log('1. Testing configuration...');
    if (window.debugMasterAPIConfig) {
        window.debugMasterAPIConfig();
    }
    
    // 2. Test scheduling
    console.log('2. Testing scheduling...');
    testScheduling();
    
    // 3. Test map state
    console.log('3. Testing map state...');
    debugMapState();
    
    // 4. Test API call
    console.log('4. Testing API call...');
    testMasterAPI();
    
    // 5. Test time simulations
    console.log('5. Testing time simulations...');
    simulateTimeAndTest(10, 5);   // Should go to 10:15
    simulateTimeAndTest(10, 17);  // Should go to 10:20
    simulateTimeAndTest(10, 25);  // Should go to 11:15
    
    console.log('=====================================');
    console.log('🧪 Complete test finished');
}

/**
 * Función simplificada de debug para probar solo la estructura de datos
 */
async function debugAPIStructure() {
    console.log('🔍 DEBUG: Testing API structure...');
    console.log('=====================================');
    
    try {
        const params = new URLSearchParams(window.MASTER_API_CONFIG.params);
        const url = `${window.MASTER_API_CONFIG.baseUrl}?${params.toString()}`;
        
        console.log('📍 API URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        console.log('✅ API Response received');
        console.log('📊 Type:', typeof data);
        console.log('📊 Structure:', Object.keys(data));
        
        if (data.stations && Array.isArray(data.stations)) {
            console.log('📊 Stations array length:', data.stations.length);
            
            if (data.stations.length > 0) {
                const firstStation = data.stations[0];
                console.log('📋 First station structure:');
                console.log('  station_id:', firstStation.station_id);
                console.log('  station_name:', firstStation.station_name);
                console.log('  device_type:', firstStation.device_type);
                console.log('  ias_numeric_value:', firstStation.ias_numeric_value);
                console.log('  color_code:', firstStation.color_code);
                console.log('  reading_status:', firstStation.reading_status);
                
                // Buscar estaciones mapeadas específicamente
                Object.keys(window.ALL_STATIONS_MAPPING).forEach(stationId => {
                    const station = data.stations.find(s => s.station_id === stationId);
                    if (station) {
                        console.log(`🎯 ${stationId} Station found:`, {
                            name: station.station_name,
                            ias: station.ias_numeric_value,
                            color: station.color_code,
                            status: station.reading_status
                        });
                    } else {
                        console.log(`⚠️ ${stationId} not found in API response`);
                    }
                });
                
                // Contar tipos de dispositivos
                const deviceTypes = {};
                data.stations.forEach(station => {
                    deviceTypes[station.device_type] = (deviceTypes[station.device_type] || 0) + 1;
                });
                console.log('📊 Device types count:', deviceTypes);
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    console.log('=====================================');
}

// ============================================================================
// AUTO-INITIALIZATION SYSTEM
// ============================================================================

// Variables de control para inicialización
let masterAPIInitAttempts = 0;
const maxMasterAPIAttempts = 15;
let initializationCompleted = false;

function attemptMasterAPIInit() {
    // Evitar múltiples inicializaciones
    if (initializationCompleted) {
        console.log('✅ Master API already initialized, skipping');
        return;
    }
    
    masterAPIInitAttempts++;
    
    if (masterAPIInitAttempts > maxMasterAPIAttempts) {
        console.log('⏰ Master API: Max initialization attempts reached');
        return;
    }
    
    console.log(`🔍 Master API init attempt ${masterAPIInitAttempts}/${maxMasterAPIAttempts}`);
    
    // Verificar que todas las dependencias estén listas
    const dependencies = [
        window.map,
        window.map?.isStyleLoaded,
        window.map?.getLayer,
        window.MAP_LAYERS,
        window.MASTER_API_CONFIG,
        window.getTimeUntilNextScheduledUpdate
    ];
    
    const allDepsReady = dependencies.every(dep => !!dep);
    const mapReady = window.map?.isStyleLoaded();
    const layerReady = window.map?.getLayer('smaa_network_squares');
    
    console.log('🔍 Dependencies check:', {
        allDeps: allDepsReady,
        mapReady: mapReady,
        layerReady: !!layerReady,
        hasConfig: !!window.MASTER_API_CONFIG,
        hasScheduling: !!window.getTimeUntilNextScheduledUpdate
    });
    
    if (allDepsReady && mapReady && layerReady) {
        console.log('✅ All Master API prerequisites ready, initializing...');
        initializationCompleted = true;
        initializeMasterAPI();
    } else {
        console.log('⏳ Master API prerequisites not ready, retrying...');
        setTimeout(attemptMasterAPIInit, 1000);
    }
}

// Función para iniciar el sistema de inicialización
function startMasterAPIInitialization() {
    console.log('🚀 Starting Master API initialization system...');
    
    // Primer intento después de un delay
    setTimeout(attemptMasterAPIInit, 3000);
    
    // También intentar cuando se detecte que el mapa está listo
    if (window.map) {
        window.map.on('sourcedata', (e) => {
            if (e.sourceId === window.MAP_LAYERS?.source && 
                e.isSourceLoaded && 
                !initializationCompleted) {
                console.log('📡 Map source loaded, attempting Master API init...');
                setTimeout(attemptMasterAPIInit, 1000);
            }
        });
    }
    
    // Fallback: intentar después de 10 segundos sin importar el estado
    setTimeout(() => {
        if (!initializationCompleted && masterAPIInitAttempts === 0) {
            console.log('⏰ Fallback Master API initialization...');
            attemptMasterAPIInit();
        }
    }, 10000);
    
    // Backup fallback: forzar inicialización después de 20 segundos
    setTimeout(() => {
        if (!initializationCompleted) {
            console.log('🚨 Force Master API initialization (backup)...');
            initializationCompleted = true;
            
            if (window.map) {
                initializeMasterAPI();
            } else {
                console.log('❌ Map still not available after 20 seconds');
            }
        }
    }, 20000);
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make functions globally available for debugging and external calls
window.MasterAPI = {
    // Core functions
    fetchData: fetchMasterAPIData,
    updateStations: updateReferenceStations,
    updateSquare: updateReferenceStationSquare,
    
    // Scheduling
    initialize: initializeMasterAPI,
    setupScheduling: setupHourlyScheduling,
    
    // Testing functions
    test: testMasterAPI,
    testScheduling: testScheduling,
    testComplete: runCompleteTest,
    debugAPI: debugAPIStructure,
    debugMap: debugMapState,
    simulateTime: simulateTimeAndTest,
    
    // Initialization
    start: startMasterAPIInitialization,
    
    // State
    isInitialized: () => initializationCompleted,
    getAttempts: () => masterAPIInitAttempts
};

// Legacy global functions for backward compatibility
window.fetchMasterAPIData = fetchMasterAPIData;
window.updateReferenceStations = updateReferenceStations;
window.updateReferenceStationSquare = updateReferenceStationSquare;
window.testMasterAPI = testMasterAPI;
window.testScheduling = testScheduling;
window.debugMapState = debugMapState;
window.simulateTimeAndTest = simulateTimeAndTest;
window.setupHourlyScheduling = setupHourlyScheduling;
window.getContrastColor = getContrastColor;
window.runCompleteTest = runCompleteTest;
window.debugAPIStructure = debugAPIStructure;

console.log('✅ Master API functions loaded successfully');
console.log('🔧 Available via window.MasterAPI object');
console.log('🧪 Test functions: testMasterAPI(), runCompleteTest(), debugAPIStructure()');

// Auto-start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, starting Master API initialization...');
    startMasterAPIInitialization();
});
        
