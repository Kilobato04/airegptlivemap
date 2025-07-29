// Utility functions for the Smability Network Map

function getIndicatorColor(value) {
    if (value <= 50) return { max: 50, color: '#00ff00', status: 'Good', risk: 'Low' };
    if (value <= 100) return { max: 100, color: '#ffff00', status: 'Acceptable', risk: 'Moderate' };
    if (value <= 150) return { max: 150, color: '#ff8000', status: 'Bad', risk: 'High' };
    if (value <= 200) return { max: 200, color: '#ff0000', status: 'Very Bad', risk: 'Very High' };
    return { color: '#800080', status: 'Extremely Bad', risk: 'Extremely High' };
}

function getIASEmoji(value) {
    if (value <= 50) return '😊';
    if (value <= 100) return '😐';
    if (value <= 150) return '😷';
    if (value <= 200) return '😨';
    return '😱';
}

function translateMode(mode) {
    return mode === 'Fijo' ? 'Fix' : mode;
}

function translateLocation(location) {
    return location === 'Exterior' ? 'Outdoors' : location;
}

function formatDateForAPI(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}

function createMarkerElement(color, text) {
    const el = document.createElement('div');
    el.className = 'marker-pin';
    el.style.backgroundColor = color;
    el.style.width = '37.5px';
    el.style.height = '37.5px';
    el.style.borderRadius = '50%';
    el.style.cursor = 'pointer';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = 'white';
    el.style.fontWeight = 'bold';
    el.style.fontSize = '10px';
    if (text) {
        el.textContent = text;
    }
    return el;
}

function createPopupContent(feature, sensorData) {
    const baseContent = '<h3>Name: ' + feature.properties.name + '</h3><p>Key: ' + feature.properties.key + ' - Entity: ' + feature.properties.entity + '</p><p>Parameter: ' + feature.properties.parameter + '</p>';

    if (APP_SETTINGS.activeStations.includes(feature.properties.name)) {
        if (sensorData === null) {
            return baseContent + '<p class="loading">Loading sensor data...</p>';
        }

        const result = getIndicatorColor(sensorData.dataIAS);
        const color = result.color;
        const status = result.status;
        const risk = result.risk;
        const emoji = getIASEmoji(sensorData.dataIAS);

        return '<div style="background-color: ' + color + '33; padding: 15px; border-radius: 10px;">' + baseContent + '<div class="monitor-readings"><div class="reading ias-reading"><span class="reading-label ias-label">IAS:</span><span class="reading-value" style="display: flex; align-items: center; gap: 2px;"><span style="font-size: 22px; line-height: 1;">' + emoji + '</span><span class="indicator" style="background-color: ' + color + '"></span>' + sensorData.dataIAS + '</span></div><div class="status-container"><p class="status-text">Status: ' + status + '</p><p class="status-text">Risk: ' + risk + '</p></div><div class="reading" style="font-size: 0.9em;"><span class="reading-label">Dominant Pollutant:</span><span class="reading-value" style="font-size: inherit;">' + sensorData.sensorIAS + '</span></div><div class="reading" style="font-size: 0.85em;"><span class="reading-label">Temperature:</span><span class="reading-value" style="font-size: inherit;">' + sensorData.temperature + ' ℃</span></div><div class="reading" style="font-size: 0.85em;"><span class="reading-label">Relative Humidity:</span><span class="reading-value" style="font-size: inherit;">' + sensorData.humidity + ' %</span></div><div class="reading" style="margin-top: 4px; width: 100%;"><a href="#" class="chart-link" onclick="toggleChartPanel(event, \'' + feature.properties.name + '\')">📊 View Historical Data</a></div></div></div>';
    }

    return baseContent;
}

function createLegendHTML() {
    return '<div class="legend-header"><button class="legend-toggle">−</button><div class="legend-title">Air Quality Index (IAS)</div></div><div class="legend-content"><div class="legend-item"><div class="legend-color" style="background-color: #00ff00"></div><span>Good (0-50)</span></div><div class="legend-item"><div class="legend-color" style="background-color: #ffff00"></div><span>Acceptable (51-100)</span></div><div class="legend-item"><div class="legend-color" style="background-color: #ff8000"></div><span>Bad (101-150)</span></div><div class="legend-item"><div class="legend-color" style="background-color: #ff0000"></div><span>Very Bad (151-200)</span></div><div class="legend-item"><div class="legend-color" style="background-color: #800080"></div><span>Extremely Bad (>201)</span></div><div style="margin: 10px 0;"><button id="toggleOffMarkers" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; background: #e2e2e2; color: #333; cursor: pointer; font-size: 11px; transition: all 0.3s ease; font-weight: 500;">SIMAT Network</button></div><div class="legend-branding"><a href="http://www.smability.io" target="_blank" class="brand-text">smability.io</a><span class="copyright"></span></div></div>';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.getIndicatorColor = getIndicatorColor;
window.getIASEmoji = getIASEmoji;
window.translateMode = translateMode;
window.translateLocation = translateLocation;
window.formatDateForAPI = formatDateForAPI;
window.createMarkerElement = createMarkerElement;
window.createPopupContent = createPopupContent;
window.createLegendHTML = createLegendHTML;
window.sleep = sleep;
