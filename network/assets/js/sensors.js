// Sensor data management functions

/**
 * Fetch data using current CORS proxy
 * @param {string} location - Location name
 * @returns {Promise} - Promise that resolves to sensor data
 */

// NUEVO: Cache para evitar múltiples requests simultáneos
const requestCache = new Map();

async function fetchWithCurrentProxy(location) {
    const proxy = CORS_PROXIES[currentProxyIndex];
    const token = API_CONFIG.tokens[location];
    const encodedUrl = encodeURIComponent(`${API_CONFIG.baseUrl}?token=${token}`);
    const proxyUrl = `${proxy.url}${encodedUrl}`;
    
    console.log(`Attempting with proxy: ${proxy.name} for location: ${location}`);

    const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Proxy ${proxy.name} failed with status: ${response.status}`);
    }

    return await response.json();
}

/**
 * Fetch sensor data for a specific location
 * @param {string} location - Location name
 * @returns {Promise} - Promise that resolves to processed sensor data
 */

/**
 * Fetch sensor data con throttling para evitar requests múltiples
 */
async function fetchSensorData(location) {
    // Evitar requests simultáneos
    if (requestCache.has(location)) {
        console.log(`⏳ Request for ${location} already in progress, waiting...`);
        return requestCache.get(location);
    }

    try {
        console.log(`📡 Starting new request for ${location}`);
        
        // Cachear la promesa
        const requestPromise = actualFetchSensorData(location);
        requestCache.set(location, requestPromise);
        
        const result = await requestPromise;
        
        // Limpiar cache después de completar (mantener por 5 segundos)
        setTimeout(() => {
            requestCache.delete(location);
            console.log(`🗑️ Cache cleared for ${location}`);
        }, 5000);
        
        return result;
        
    } catch (error) {
        // Limpiar cache inmediatamente en caso de error
        requestCache.delete(location);
        throw error;
    }
}

/**
 * Función interna con la lógica original de fetch
 */
async function actualFetchSensorData(location) {
    try {
        const data = await fetchWithCurrentProxy(location);
        console.log(`Received data for ${location}:`, data);

        if (!data) {
            throw new Error('Empty response received');
        }

        retryCount = 0;
        
        // NUEVO: Debug de todos los campos de tiempo disponibles
        console.log('=== TIMESTAMP DEBUG FOR', location, '===');
        console.log('DateTime:', data.DateTime);
        console.log('TimeStamp:', data.TimeStamp);
        console.log('timestamp:', data.timestamp);
        console.log('All available keys:', Object.keys(data));
        
        // NUEVO: Intentar encontrar el timestamp más relevante
        const possibleTimestamps = [
            data.DateTime,
            data.TimeStamp,
            data.timestamp,
            data.lastUpdate,
            data.date,
            data.time
        ].filter(t => t != null && t !== '');
        
        console.log('Available timestamps:', possibleTimestamps);
        
        const lastUpdateTime = possibleTimestamps[0] || new Date().toISOString();
        console.log('Selected timestamp:', lastUpdateTime);
        
        // NUEVO: Verificar antigüedad de los datos
        const isRecentEnough = isDataRecentEnoughForIAS(lastUpdateTime, 8); // 8 horas umbral
        
        // NUEVO: Calcular horas desde última actualización
        const lastUpdate = new Date(lastUpdateTime);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
        
        // NUEVO: Obtener configuración de display
        const displayConfig = getDisplayConfigByDataAge(hoursSinceUpdate);
        
        console.log(`📊 ${location} data age: ${hoursSinceUpdate.toFixed(2)}h, config:`, displayConfig);
        console.log('===============================');
        
        // FIXED: Return ALL data from API, not just selected fields
        return {
            // Legacy fields for compatibility
            dataIAS: parseFloat(data.DataIAS || data.dataIAS || data.data_ias) || 'N/A',
            temperature: parseFloat(data.Temperature || data.temperature || data.temp) || 'N/A',
            humidity: parseFloat(data.Humidity || data.humidity) || 'N/A',
            sensorIAS: data.SensorIAS || data.sensorIAS || 'N/A',
            concentracionIASCO: parseFloat(data.ConcentracionIASCO) || 'N/A',
            concentracionIASO3: parseFloat(data.ConcentracionIASO3) || 'N/A',
            concentracionIASPM10: parseFloat(data.ConcentracionIASPM10) || 'N/A',
            concentracionIASPM2_5: parseFloat(data.ConcentracionIASPM2_5) || 'N/A',
            modesensor: data.ModeSensor || data.ModeSensor || 'N/A',
            locationsensor: data.LocationSensor || data.LocationSensor || 'N/A',
            
            // NUEVO: Metadatos de freshness
            lastUpdateTime: lastUpdateTime,
            hoursSinceUpdate: hoursSinceUpdate,
            isRecentEnough: isRecentEnough,
            displayConfig: displayConfig,
            
            // NUEVO: IAS condicionado por freshness
            displayIAS: isRecentEnough ? parseFloat(data.DataIAS || data.dataIAS || data.data_ias) : 'N/A',
            
            // NEW: Pass through ALL new API fields
            DataIAS: data.DataIAS,
            Temperature: data.Temperature,
            Humidity: data.Humidity,
            SensorIAS: data.SensorIAS,
            ModeSensor: data.ModeSensor,
            LocationSensor: data.LocationSensor,
            Battery_Now: data.Battery_Now,
            ConcentrationIASCO_8hr: data.ConcentrationIASCO_8hr,
            ConcentrationIASO3_1hr: data.ConcentrationIASO3_1hr,
            ConcentrationIASPM10_12hr: data.ConcentrationIASPM10_12hr,
            ConcentrationIASPM2_5_12hr: data.ConcentrationIASPM2_5_12hr,
            CO_1hr: data.CO_1hr,
            O3_1hr: data.O3_1hr,
            PM10_1hr: data.PM10_1hr,
            PM2_5_1hr: data.PM2_5_1hr,
            Temp_1hr: data.Temp_1hr,
            HR_1hr: data.HR_1hr,
            ColorIAS: data.ColorIAS,
            IndiceIAS: data.IndiceIAS,
            RisklevelIAS: data.RisklevelIAS,
            DateTime: data.DateTime,
            DataAQI: data.DataAQI,
            IndiceAQI: data.IndiceAQI,
            SensorAQI: data.SensorAQI,
            ColorAQI: data.ColorAQI,
            CO_Max_in_24hr: data.CO_Max_in_24hr,
            O3_Max_in_24hr: data.O3_Max_in_24hr,
            PM2_5_24hr: data.PM2_5_24hr,
            PM10_24hr: data.PM10_24hr,
            Lat_Long: data.Lat_Long,
            NameSensor: data.NameSensor,
            RecomendationsIAS_poblacion_general: data.RecomendationsIAS_poblacion_general,
            RecomendationsIAS_poblacion_mayor_60: data.RecomendationsIAS_poblacion_mayor_60,
            RecomendationsIAS_poblacion_menor_12: data.RecomendationsIAS_poblacion_menor_12
        };

    } catch (error) {
        console.error(`Error fetching sensor data for ${location}:`, error);
        
        if (retryCount < APP_SETTINGS.maxRetries) {
            retryCount++;
            console.log(`Retry ${retryCount}/${APP_SETTINGS.maxRetries} with current proxy...`);
            await sleep(1000);
            return actualFetchSensorData(location);
        } else {
            retryCount = 0;
            currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
            
        // NUEVO: Límite global de intentos mejorado
        if (currentProxyIndex === 0) {
            console.error(`❌ All proxies failed for ${location}, skipping...`);
            // FORZAR limpieza de cache y estado
            requestCache.delete(location);
            retryCount = 0;
            return { 
                dataIAS: 'N/A', 
                error: 'All proxies failed',
                displayConfig: { showIAS: false, status: 'offline', indicator: '×', color: '#ff0000', label: 'Offline' }
            };
        }
            
            console.log(`Switching to next proxy: ${CORS_PROXIES[currentProxyIndex].name}`);
            return actualFetchSensorData(location);
        }
    }
}

/**
 * Fetch historical sensor data with proxy support
 * @param {number} hours - Number of hours to fetch
 * @param {string} sensorId - Sensor ID
 * @param {string} token - API token
 * @returns {Promise} - Promise that resolves to historical data array
 */
async function fetchSensorDataWithProxy(hours = 24, sensorId = '12', token = null) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setHours(endDate.getHours() - hours);

    const startDateStr = formatDateForAPI(startDate);
    const endDateStr = formatDateForAPI(endDate);

    console.log(`Fetching ${SENSOR_CONFIG[sensorId].name} data for last ${hours} hours`);
    console.log('Start date:', startDateStr);
    console.log('End date:', endDateStr);

    const baseUrl = API_CONFIG.dataUrl;
    const params = new URLSearchParams({
        token: token || API_CONFIG.tokens['Hipódromo'],
        idSensor: sensorId,
        dtStart: startDateStr,
        dtEnd: endDateStr
    });

    const apiUrl = `${baseUrl}?${params.toString()}`;
    let currentRetryCount = 0;

    while (currentRetryCount < APP_SETTINGS.maxRetries) {
        try {
            const proxy = CORS_PROXIES[currentProxyIndex];
            const proxyUrl = `${proxy.url}${encodeURIComponent(apiUrl)}`;
            
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('API response is not an array');
            }

            return data.map(item => ({
                timestamp: new Date(item.TimeStamp),
                value: parseFloat(item.Data)
            })).filter(item => !isNaN(item.value));

        } catch (error) {
            console.error(`Attempt ${currentRetryCount + 1} failed:`, error);
            currentRetryCount++;
            
            if (currentRetryCount === APP_SETTINGS.maxRetries) {
                currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
                currentRetryCount = 0;
            }
            
            await sleep(1000);
        }
    }
    return null;
}

/**
 * Update marker color based on sensor data
 * @param {string} location - Location name
 */
async function updateMarkerColor(location) {
    if (!markers.has(location)) return;
    
    try {
        const sensorData = await fetchSensorData(location);
        const marker = markers.get(location);
        const { color } = getIndicatorColor(sensorData.dataIAS);
        
        const el = marker.getElement();
        el.style.backgroundColor = color;
        
    } catch (error) {
        console.error(`Error updating marker color for ${location}:`, error);
    }
}

/**
 * Update all marker data
 */
async function updateMarkerData() {
    for (const location of APP_SETTINGS.activeStations) {
        if (markers.has(location)) {
            updateMarkerColor(location);
        }
    }
}

/**
 * Initialize markers for map features
 * @param {Array} features - Array of map features
 */
function initializeMarkers(features) {
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
    
    updateMarkerData();
}

/**
 * Verificar si los datos del sensor son suficientemente recientes para mostrar IAS
 */
function isDataRecentEnoughForIAS(lastUpdateTime, maxHoursThreshold = 8) {
    try {
        const lastUpdate = new Date(lastUpdateTime);
        const now = new Date();
        const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
        
        console.log(`⏰ Data age check: ${hoursDiff.toFixed(2)} hours ago, threshold: ${maxHoursThreshold}h`);
        
        return hoursDiff <= maxHoursThreshold;
    } catch (error) {
        console.error('Error parsing timestamp:', error);
        return false;
    }
}

/**
 * Determinar qué mostrar basado en la antigüedad de los datos
 */
function getDisplayConfigByDataAge(hoursSinceLastUpdate) {
    if (hoursSinceLastUpdate <= 1) {
        return {
            showIAS: true,
            status: 'current',
            indicator: '●',
            color: '#00ff00',
            label: 'Live'
        };
    } else if (hoursSinceLastUpdate <= 8) {
        return {
            showIAS: true,
            status: 'recent',
            indicator: '◐',
            color: '#ffaa00',
            label: `${Math.round(hoursSinceLastUpdate)}h ago`
        };
    } else if (hoursSinceLastUpdate <= 16) {
        return {
            showIAS: false,
            status: 'stale',
            indicator: '○',
            color: '#cccccc',
            label: 'Stale'
        };
    } else {
        return {
            showIAS: false,
            status: 'offline',
            indicator: '×',
            color: '#ff0000',
            label: 'Offline'
        };
    }
}

// Make functions globally available
window.isDataRecentEnoughForIAS = isDataRecentEnoughForIAS;
window.getDisplayConfigByDataAge = getDisplayConfigByDataAge;
window.fetchWithCurrentProxy = fetchWithCurrentProxy;
window.fetchSensorData = fetchSensorData;
window.fetchSensorDataWithProxy = fetchSensorDataWithProxy;
window.updateMarkerColor = updateMarkerColor;
window.updateMarkerData = updateMarkerData;
window.initializeMarkers = initializeMarkers;
