// Sensor data management functions

/**
 * Fetch data using current CORS proxy
 * @param {string} location - Location name
 * @returns {Promise} - Promise that resolves to sensor data
 */
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
async function fetchSensorData(location) {
    try {
        const data = await fetchWithCurrentProxy(location);
        console.log(`Received data for ${location}:`, data);

        if (!data) {
            throw new Error('Empty response received');
        }

        retryCount = 0;
        
        return {
            dataIAS: parseFloat(data.DataIAS || data.dataIAS || data.data_ias) || 'N/A',
            temperature: parseFloat(data.Temperature || data.temperature || data.temp) || 'N/A',
            humidity: parseFloat(data.Humidity || data.humidity) || 'N/A',
            sensorIAS: data.SensorIAS || 'N/A',
            concentracionIASCO: parseFloat(data.ConcentracionIASCO) || 'N/A',
            concentracionIASO3: parseFloat(data.ConcentracionIASO3) || 'N/A',
            concentracionIASPM10: parseFloat(data.ConcentracionIASPM10) || 'N/A',
            concentracionIASPM2_5: parseFloat(data.ConcentracionIASPM2_5) || 'N/A',
            modesensor: data.ModeSensor || 'N/A',
            locationsensor: data.LocationSensor || 'N/A'
        };

    } catch (error) {
        console.error(`Error fetching sensor data for ${location}:`, error);
        
        if (retryCount < APP_SETTINGS.maxRetries) {
            retryCount++;
            console.log(`Retry ${retryCount}/${APP_SETTINGS.maxRetries} with current proxy...`);
            await sleep(1000);
            return fetchSensorData(location);
        } else {
            retryCount = 0;
            currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
            console.log(`Switching to next proxy: ${CORS_PROXIES[currentProxyIndex].name}`);
            return fetchSensorData(location);
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
        token: token || API_CONFIG.tokens['Hipódromo'], // Default to Hipódromo token
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
    
    // Initial update of marker data
    updateMarkerData();
}

// ===== CRÍTICO: Hacer funciones disponibles globalmente =====
// ¡ESTAS LÍNEAS FALTABAN! Sin ellas, los popups no funcionan
window.fetchWithCurrentProxy = fetchWithCurrentProxy;
window.fetchSensorData = fetchSensorData;
window.fetchSensorDataWithProxy = fetchSensorDataWithProxy;
window.updateMarkerColor = updateMarkerColor;
window.updateMarkerData = updateMarkerData;
window.initializeMarkers = initializeMarkers;
