function getIndicatorColor(value) {
    if (value <= 50) return { color: '#00ff00', status: 'Good', risk: 'Low' };
    if (value <= 100) return { color: '#ffff00', status: 'Acceptable', risk: 'Moderate' };
    if (value <= 150) return { color: '#ff8000', status: 'Bad', risk: 'High' };
    if (value <= 200) return { color: '#ff0000', status: 'Very Bad', risk: 'Very High' };
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
    if (text) el.textContent = text;
    return el;
}

function createPopupContent(feature, sensorData) {
    const name = feature.properties.name;
    const key = feature.properties.key;
    const entity = feature.properties.entity;
    const parameter = feature.properties.parameter;
    
    let html = '<h3>Name: ' + name + '</h3>';
    html += '<p>Key: ' + key + ' - Entity: ' + entity + '</p>';
    html += '<p>Parameter: ' + parameter + '</p>';

    if (APP_SETTINGS.activeStations.includes(name)) {
        if (sensorData === null) {
            return html + '<p class="loading">Loading sensor data...</p>';
        }

        if (sensorData && sensorData.dataIAS !== 'N/A') {
            const result = getIndicatorColor(sensorData.dataIAS);
            const emoji = getIASEmoji(sensorData.dataIAS);
            
            html += '<div style="background-color: ' + result.color + '33; padding: 15px; border-radius: 10px;">';
            
            // IAS Reading - Main highlight
            html += '<div class="monitor-readings">';
            html += '<div class="reading ias-reading">';
            html += '<span class="reading-label ias-label">IAS:</span>';
            html += '<span class="reading-value" style="display: flex; align-items: center; gap: 2px;">';
            html += '<span style="font-size: 22px; line-height: 1;">' + emoji + '</span>';
            html += '<span class="indicator" style="background-color: ' + result.color + '"></span>';
            html += sensorData.dataIAS;
            html += '</span>';
            html += '</div>';
            
            // Status Information
            html += '<div class="status-container">';
            html += '<p class="status-text">Status: ' + result.status + '</p>';
            html += '<p class="status-text">Risk: ' + result.risk + '</p>';
            html += '</div>';

            // Dominant Pollutant
            if (sensorData.sensorIAS && sensorData.sensorIAS !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.9em;">';
                html += '<span class="reading-label">Dominant Pollutant:</span>';
                html += '<span class="reading-value">' + sensorData.sensorIAS + '</span>';
                html += '</div>';
            }

            // Pollutant Concentrations
            if (sensorData.concentracionIASCO && sensorData.concentracionIASCO !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">CO <small>8hr:</small></span>';
                html += '<span class="reading-value">' + sensorData.concentracionIASCO + ' ppb</span>';
                html += '</div>';
            }

            if (sensorData.concentracionIASO3 && sensorData.concentracionIASO3 !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">O3 <small>1hr:</small></span>';
                html += '<span class="reading-value">' + sensorData.concentracionIASO3 + ' ppb</span>';
                html += '</div>';
            }

            if (sensorData.concentracionIASPM10 && sensorData.concentracionIASPM10 !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">PM10 <small>12hr:</small></span>';
                html += '<span class="reading-value">' + sensorData.concentracionIASPM10 + ' μg/m³</span>';
                html += '</div>';
            }

            if (sensorData.concentracionIASPM2_5 && sensorData.concentracionIASPM2_5 !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">PM2.5 <small>12hr:</small></span>';
                html += '<span class="reading-value">' + sensorData.concentracionIASPM2_5 + ' μg/m³</span>';
                html += '</div>';
            }

            // Environmental Conditions
            if (sensorData.temperature && sensorData.temperature !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Temperature:</span>';
                html += '<span class="reading-value">' + sensorData.temperature + ' ℃</span>';
                html += '</div>';
            }

            if (sensorData.humidity && sensorData.humidity !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Relative Humidity:</span>';
                html += '<span class="reading-value">' + sensorData.humidity + ' %</span>';
                html += '</div>';
            }

            // Device Information
            if (sensorData.modesensor && sensorData.modesensor !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Device Mode:</span>';
                html += '<span class="reading-value">' + translateMode(sensorData.modesensor) + '</span>';
                html += '</div>';
            }

            if (sensorData.locationsensor && sensorData.locationsensor !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Device Location:</span>';
                html += '<span class="reading-value">' + translateLocation(sensorData.locationsensor) + '</span>';
                html += '</div>';
            }

            // Historical Data Link
            html += '<div class="reading" style="margin-top: 4px; width: 100%;">';
            html += '<a href="#" class="chart-link" onclick="toggleChartPanel(event, \'' + feature.properties.name + '\')">';
            html += '📊 View Historical Data';
            html += '</a>';
            html += '</div>';

            html += '</div>'; // End monitor-readings

            // Contact Links
            html += '<div class="contact-links" style="flex-direction: column; align-items: flex-start;">';
            html += '<a href="https://wa.me/' + APP_SETTINGS.whatsappNumber + '" target="_blank" style="text-decoration: none; width: 100%;">';
            html += '<div style="margin-top: 4px; display: flex; align-items: center; gap: 8px; border: 2px solid #25D366; padding: 8px; border-radius: 8px; background-color: rgba(37, 211, 102, 0.1); cursor: pointer;">';
            html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
            html += '<span style="font-size: 0.9em; color: #666;">Chat with AIreGPT your Air Quality Agent</span>';
            html += '</div>';
            html += '</a>';
            
            // Footer info
            html += '<div style="margin-top: 8px;">';
            html += '<small>Last updated: ' + new Date().toLocaleTimeString() + '</small><br>';
            html += '<small><a href="' + APP_SETTINGS.brandUrl + '" target="_blank" class="brand-text">smability.io</a></small>';
            html += '</div>';
            html += '</div>'; // End contact-links

            html += '</div>'; // End colored background div
        } else {
            html += '<p>No sensor data available</p>';
        }
    }

    return html;
}

function createLegendHTML() {
    let html = '<div class="legend-header">';
    html += '<button class="legend-toggle">−</button>';
    html += '<div class="legend-title">Air Quality Index (IAS)</div>';
    html += '</div>';
    html += '<div class="legend-content">';
    
    // AQI Colors (igual que antes)
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #00ff00"></div><span>Good (0-50)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #ffff00"></div><span>Acceptable (51-100)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #ff8000"></div><span>Bad (101-150)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #ff0000"></div><span>Very Bad (151-200)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #800080"></div><span>Extremely Bad (>201)</span></div>';

    // LAYERS section
    html += '<div style="margin: 15px 0; border-top: 1px solid #ddd; padding-top: 10px;">';
    html += '<div style="font-weight: bold; margin-bottom: 8px; font-size: 10px;">LAYERS</div>';
    
    // SIMAT Network toggle
    html += '<div style="margin: 8px 0;"><button id="toggleOffMarkers" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; background: #4264fb; color: white; cursor: pointer; font-size: 11px;">SIMAT Network</button></div>';
    
    // Smability Network toggle (NUEVO)
    html += '<div style="margin: 8px 0;"><button id="toggleSmabilityMarkers" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; background: #4264fb; color: white; cursor: pointer; font-size: 11px;">Smability Network</button></div>';
    
    html += '</div>';

    // Branding
    html += '<div class="legend-branding"><a href="' + APP_SETTINGS.brandUrl + '" target="_blank" class="brand-text">smability.io</a></div>';
    html += '</div>';
    return html;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Agregar al final de utils.js, después de las otras funciones globales:

/**
 * Toggle chart panel (simplified version)
 * @param {Event} event - Click event
 * @param {string} location - Location name
 */
function toggleChartPanel(event, location) {
    event.preventDefault();
    
    if (!API_CONFIG.tokens[location]) {
        alert('Historical data not available for this station');
        return;
    }
    
    // For now, just show an alert with the location
    // Later we can implement the full chart panel
    alert('Historical data for ' + location + ' - Feature coming soon!');
    
    // TODO: Implement full chart panel functionality
    // This would include:
    // - Creating chart panel HTML
    // - Fetching historical data
    // - Displaying Plotly charts
    // - Adding time range selectors
}

// Make function available globally
window.toggleChartPanel = toggleChartPanel;

// Make function available globally
window.toggleChartPanel = toggleChartPanel;


// Make functions globally available
window.getIndicatorColor = getIndicatorColor;
window.getIASEmoji = getIASEmoji;
window.translateMode = translateMode;
window.translateLocation = translateLocation;
window.createMarkerElement = createMarkerElement;
window.createPopupContent = createPopupContent;
window.createLegendHTML = createLegendHTML;
window.sleep = sleep;

console.log('Utils loaded successfully');

