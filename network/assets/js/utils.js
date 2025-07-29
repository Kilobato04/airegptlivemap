// Utility functions for the Smability Network Map

/**
 * Get indicator color and status based on AQI value
 * @param {number} value - The AQI value
 * @returns {Object} - Object containing color, status, and risk information
 */
function getIndicatorColor(value) {
    if (value <= AQI_THRESHOLDS.good.max) return AQI_THRESHOLDS.good;
    if (value <= AQI_THRESHOLDS.acceptable.max) return AQI_THRESHOLDS.acceptable;
    if (value <= AQI_THRESHOLDS.bad.max) return AQI_THRESHOLDS.bad;
    if (value <= AQI_THRESHOLDS.veryBad.max) return AQI_THRESHOLDS.veryBad;
    return AQI_THRESHOLDS.extremelyBad;
}

/**
 * Get emoji based on IAS value
 * @param {number} value - The IAS value
 * @returns {string} - Appropriate emoji
 */
function getIASEmoji(value) {
    if (value <= 50) return '😊';
    if (value <= 100) return '😐';
    if (value <= 150) return '😷';
    if (value <= 200) return '😨';
    return '😱';
}

/**
 * Translate mode from Spanish to English
 * @param {string} mode - Mode in Spanish
 * @returns {string} - Mode in English
 */
function translateMode(mode) {
    return mode === 'Fijo' ? 'Fix' : mode;
}

/**
 * Translate location from Spanish to English
 * @param {string} location - Location in Spanish
 * @returns {string} - Location in English
 */
function translateLocation(location) {
    return location === 'Exterior' ? 'Outdoors' : location;
}

/**
 * Format date for API requests
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDateForAPI(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Create marker element for map
 * @param {string} color - Color for the marker
 * @param {string} text - Text to display on marker
 * @returns {HTMLElement} - Marker element
 */
function createMarkerElement(color, text = '') {
    const el = document.createElement('div');
    el.className = 'marker-pin';
    el.style.cssText = `
        background-color: ${color};
        width: 37.5px;
        height: 37.5px;
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
    if (text) {
        el.textContent = text;
    }
    return el;
}

/**
 * Create popup content for map markers
 * @param {Object} feature - Map feature object
 * @param {Object} sensorData - Sensor data object (optional)
 * @returns {string} - HTML content for popup
 */
function createPopupContent(feature, sensorData = null) {
    const baseContent = `
        <h3>Name: ${feature.properties.name}</h3>
        <p>Key: ${feature.properties.key} - Entity: ${feature.properties.entity}</p>
        <p>Parameter: ${feature.properties.parameter}</p>
    `;

    if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
        if (sensorData === null) {
            return baseContent + '<p class="loading">Loading sensor data...</p>';
        }

        const { color, status, risk } = getIndicatorColor(sensorData.dataIAS);
        const emoji = getIASEmoji(sensorData.dataIAS);

        return `
            <div style="background-color: ${color}33; padding: 15px; border-radius: 10px;">
                ${baseContent}
                <div class="monitor-readings">
                    <div class="reading ias-reading">
                        <span class="reading-label ias-label">IAS:</span>
                        <span class="reading-value" style="display: flex; align-items: center; gap: 2px;">
                            <span style="font-size: 22px; line-height: 1;">${emoji}</span>
                            <span class="indicator" style="background-color: ${color}"></span>
                            ${sensorData.dataIAS}
                        </span>
                    </div>
                    
                    <div class="status-container">
                        <p class="status-text">Status: ${status}</p>
                        <p class="status-text">Risk: ${risk}</p>
                    </div>

                    <div class="reading" style="font-size: 0.9em;">
                        <span class="reading-label">Dominant Pollutant:</span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.sensorIAS}</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">CO <small>8hr:</small></span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.concentracionIASCO} ppb</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">O3 <small>1hr:</small></span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.concentracionIASO3} ppb</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">PM10 <small>12hr:</small></span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.concentracionIASPM10} μg/m³</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">PM2.5 <small>12hr:</small></span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.concentracionIASPM2_5} μg/m³</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">Temperature:</span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.temperature} ℃</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">Relative Humidity:</span>
                        <span class="reading-value" style="font-size: inherit;">${sensorData.humidity} %</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">Device Mode:</span>
                        <span class="reading-value" style="font-size: inherit;">${translateMode(sensorData.modesensor)}</span>
                    </div>

                    <div class="reading" style="font-size: 0.85em;">
                        <span class="reading-label">Device Location:</span>
                        <span class="reading-value" style="font-size: inherit;">${translateLocation(sensorData.locationsensor)}</span>
                    </div>
            
                    <div class="reading" style="margin-top: 4px; width: 100%;">
                        <a href="#" class="chart-link" onclick="toggleChartPanel(event, '${feature.properties.name}')">
                            📊 View Historical Data
                        </a>
                    </div>
                </div>

                <div class="contact-links" style="flex-direction: column; align-items: flex-start;">
                    <a href="https://wa.me/${APP_SETTINGS.whatsappNumber}" target="_blank" style="text-decoration: none; width: 100%;">
                        <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px; border: 2px solid #25D366; padding: 8px; border-radius: 8px; background-color: rgba(37, 211, 102, 0.1); cursor: pointer; transition: background-color 0.2s;">
                            <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="#25D366">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span style="font-size: 0.9em; color: #666;">Chat with AIre - Your AirBot Quality Assistant</span>
                        </div>
                    </a>
                    <div style="margin-top: 8px;">
                        <small>Last updated: ${new Date().toLocaleTimeString()}</small>
                        <br>
                        <small><a href="${APP_SETTINGS.brandUrl}" target="_blank" class="brand-text">smability.io</a></small>
                    </div>
                </div>
            </div>
        `;
    }

    return baseContent;
}

/**
 * Create legend HTML
 * @returns {string} - HTML content for legend
 */
function createLegendHTML() {
    return `
        <div class="legend-header">
            <button class="legend-toggle">−</button>
            <div class="legend-title">Air Quality Index (IAS)</div>
        </div>
        <div class="legend-content">
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.good.color}"></div>
                <span>Good (0-50)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.acceptable.color}"></div>
                <span>Acceptable (51-100)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.bad.color}"></div>
                <span>Bad (101-150)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.veryBad.color}"></div>
                <span>Very Bad (151-200)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.extremelyBad.color}"></div>
                <span>Extremely Bad (>201)</span>
            </div>
            <div style="margin: 10px 0;">
                <button id="toggleOffMarkers" style="
                    width: 100%; 
                    padding: 5px; 
                    border: 1px solid #ccc; 
                    border-radius: 4px; 
                    background: #e2e2e2; 
                    color: #333;
                    cursor: pointer; 
                    font-size: 11px; 
                    transition: all 0.3s ease;
                    font-weight: 500;">
                    SIMAT Network
                </button>
            </div>
            <div class="legend-branding">
                <a href="${APP_SETTINGS.brandUrl}" target="_blank" class="brand-text">smability.io</a>
                <span class="copyright"></span>
            </div>
        </div>
    `;
}

/**
 * Sleep function for async delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Make functions available globally
window.getIndicatorColor = getIndicatorColor;
window.getIASEmoji = getIASEmoji;
window.translateMode = translateMode;
window.translateLocation = translateLocation;
window.formatDateForAPI = formatDateForAPI;
window.createMarkerElement = createMarkerElement;
window.createPopupContent = createPopupContent;
window.createLegendHTML = createLegendHTML;
window.sleep = sleep;
