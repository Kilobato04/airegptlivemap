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
            // Debug log to see what data we're receiving
            console.log('=== POPUP DEBUG START ===');
            console.log('Full sensor data object:');
            console.log(sensorData);
            console.log('All available keys:', Object.keys(sensorData));
            console.log('=== POPUP DEBUG END ===');
            
            const result = getIndicatorColor(sensorData.dataIAS);
            const emoji = getIASEmoji(sensorData.dataIAS);
            
            // CAMBIO: Aplicar fondo y borde a TODO el contenido del popup
            html = '<div style="background-color: ' + result.color + '33; padding: 15px; border-radius: 10px; border: 3px solid ' + result.color + ';">';
            
            // Información básica con fondo del color IAS
            html += '<h3 style="margin: 0 0 10px 0; color: #000;">Name: ' + name + '</h3>';
            html += '<p style="margin: 0 0 5px 0; color: #000;">Key: ' + key + ' - Entity: ' + entity + '</p>';
            html += '<p style="margin: 0 0 15px 0; color: #000;">Parameter: ' + parameter + '</p>';
            
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

            // Dominant Pollutant - Check multiple possible fields
            const dominantPollutant = sensorData.SensorIAS || sensorData.sensorIAS;
            console.log('Dominant pollutant found:', dominantPollutant);
            if (dominantPollutant && dominantPollutant !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.9em;">';
                html += '<span class="reading-label">Dominant Pollutant:</span>';
                html += '<span class="reading-value">' + dominantPollutant + '</span>';
                html += '</div>';
            }

            // Pollutant Concentrations - Check what's actually available
            console.log('Checking CO field:', sensorData.ConcentrationIASCO_8hr);
            console.log('Checking O3 field:', sensorData.ConcentrationIASO3_1hr);
            console.log('Checking PM10 field:', sensorData.PM10_1hr);
            console.log('Checking PM2.5 field:', sensorData.PM2_5_1hr);
            console.log('Checking Battery field:', sensorData.Battery_Now);

            // Pollutant Concentrations - Using correct API field names
            const co8hr = sensorData.ConcentrationIASCO_8hr;
            html += '<div class="reading" style="font-size: 0.85em;">';
            html += '<span class="reading-label">CO 8hr:</span>';
            html += '<span class="reading-value">' + (co8hr ? co8hr : 'N/A ppb') + '</span>';
            html += '</div>';

            const o31hr = sensorData.ConcentrationIASO3_1hr;
            html += '<div class="reading" style="font-size: 0.85em;">';
            html += '<span class="reading-label">O3 1hr:</span>';
            html += '<span class="reading-value">' + (o31hr ? o31hr : 'N/A ppb') + '</span>';
            html += '</div>';

            const pm10_12hr = sensorData.ConcentrationIASPM10_12hr;
            html += '<div class="reading" style="font-size: 0.85em;">';
            html += '<span class="reading-label">PM10 12hr:</span>';
            html += '<span class="reading-value">' + (pm10_12hr ? pm10_12hr : 'N/A μg/m³') + '</span>';
            html += '</div>';

            const pm25_12hr = sensorData.ConcentrationIASPM2_5_12hr;
            html += '<div class="reading" style="font-size: 0.85em;">';
            html += '<span class="reading-label">PM2.5 12hr:</span>';
            html += '<span class="reading-value">' + (pm25_12hr ? pm25_12hr : 'N/A μg/m³') + '</span>';
            html += '</div>';

            // Environmental Conditions - Using correct API field names with fallback
            const temperature = sensorData.Temp_1hr || sensorData.Temperature || sensorData.temperature;
            if (temperature && temperature !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Temperature:</span>';
                html += '<span class="reading-value">' + temperature + (String(temperature).includes('°') ? '' : ' ℃') + '</span>';
                html += '</div>';
            }

            const humidity = sensorData.HR_1hr || sensorData.Humidity || sensorData.humidity;
            if (humidity && humidity !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Relative Humidity:</span>';
                html += '<span class="reading-value">' + humidity + (String(humidity).includes('%') ? '' : ' %') + '</span>';
                html += '</div>';
            }

            // Device Information - Using correct API field names with fallback
            const deviceMode = sensorData.ModeSensor || sensorData.modesensor;
            if (deviceMode && deviceMode !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Device Mode:</span>';
                html += '<span class="reading-value">' + translateMode(deviceMode) + '</span>';
                html += '</div>';
            }

            const deviceLocation = sensorData.LocationSensor || sensorData.locationsensor;
            if (deviceLocation && deviceLocation !== 'N/A') {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Device Location:</span>';
                html += '<span class="reading-value">' + translateLocation(deviceLocation) + '</span>';
                html += '</div>';
            }

            // Battery Status - From new API
            if (sensorData.Battery_Now) {
                html += '<div class="reading" style="font-size: 0.85em;">';
                html += '<span class="reading-label">Battery:</span>';
                html += '<span class="reading-value">' + sensorData.Battery_Now + '</span>';
                html += '</div>';
            }

            // Historical Data Link - BORDE MÁS SUAVE
            html += '<div class="reading" style="margin-top: 4px; width: 100%;">';
            html += '<a href="#" class="chart-link" onclick="toggleChartPanel(event, \'' + feature.properties.name + '\')" style="background-color: transparent; color: #000; border: 1px solid #000; font-size: 14px; transition: all 0.3s ease;" onmouseover="this.style.backgroundColor=\'rgba(0,0,0,0.1)\'" onmouseout="this.style.backgroundColor=\'transparent\'">';
            html += '📊 View Historical Data';
            html += '</a>';
            html += '</div>';

            html += '</div>'; // End monitor-readings

            // Contact Links - BORDE MÁS SUAVE
            html += '<div class="contact-links" style="flex-direction: column; align-items: flex-start;">';
            html += '<a href="https://wa.me/' + APP_SETTINGS.whatsappNumber + '" target="_blank" style="text-decoration: none; width: 100%;">';
            html += '<div style="margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #25D366; padding: 8px; border-radius: 8px; background-color: transparent; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.backgroundColor=\'rgba(37,211,102,0.2)\'" onmouseout="this.style.backgroundColor=\'transparent\'">';
            html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
            html += '<span style="font-size: 14px; color: #000;">Chat with AIreGPT</span>';
            html += '</div>';
            html += '</a>';
            
            // Footer info - GRIS SUAVE, SIN NEGRITAS
            html += '<div style="margin-top: 8px; background-color: transparent; padding: 5px;">';
            html += '<small style="color: #888; font-size: 11px; font-weight: normal;">Last updated: ' + new Date().toLocaleTimeString() + '</small><br>';
            html += '<small><a href="' + APP_SETTINGS.brandUrl + '" target="_blank" class="brand-text" style="color: #888; font-size: 11px; text-decoration: none; font-weight: normal;">smability.io</a></small>';
            html += '</div>';
            html += '</div>'; // End contact-links

            html += '</div>'; // End colored background div - CERRAR el div principal
            
        } else {
            html += '<p>No sensor data available</p>';
        }
    }

    return html;
}

function createLegendHTML() {
    let html = '<div class="legend-header">';
    html += '<button class="legend-toggle">+</button>';
    html += '<div class="legend-title">Air Quality Index (IAS)</div>';
    html += '</div>';
    html += '<div class="legend-content" style="display: none;">';
    
    // AQI Colors
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #00ff00"></div><span>Good (0-50)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #ffff00"></div><span>Acceptable (51-100)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #ff8000"></div><span>Bad (101-150)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #ff0000"></div><span>Very Bad (151-200)</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background-color: #800080"></div><span>Extremely Bad (>201)</span></div>';
    
    // ESPACIO DIVISORIO entre secciones
    html += '<div class="legend-divider"></div>';
    
    // NUEVOS: Iconos de referencia y Smability - ambos negro
    html += '<div class="legend-item"><div class="legend-icon legend-square" style="background-color: #000000"></div><span>Reference</span></div>';
    html += '<div class="legend-item"><div class="legend-icon legend-circle" style="background-color: #000000"></div><span>Smability</span></div>';
    
    // LAYERS section - DOS BOTONES SEPARADOS
    html += '<div style="margin: 15px 0; border-top: 1px solid #ddd; padding-top: 10px;">';
    html += '<div style="font-weight: bold; margin-bottom: 8px; font-size: 10px;">LAYERS</div>';
    
    // PRIMER BOTÓN: AQ Network AWS (Master API)
    html += '<div style="margin: 4px 0;"><button id="toggleAWSNetwork" class="toggle-button active" style="width: 100%; padding: 5px; border: 1px solid #4264fb; border-radius: 4px; background: #4264fb; color: white; cursor: pointer; font-size: 11px;">AQ Network AWS</button></div>';
    
    // SEGUNDO BOTÓN: AQ Network SMAA (Smability API)
    html += '<div style="margin: 4px 0;"><button id="toggleSMAANetwork" class="toggle-button active" style="width: 100%; padding: 5px; border: 1px solid #4264fb; border-radius: 4px; background: #4264fb; color: white; cursor: pointer; font-size: 11px;">AQ Network SMAA</button></div>';
    
    html += '</div>';
    
    // Branding
    html += '<div class="legend-branding"><a href="' + APP_SETTINGS.brandUrl + '" target="_blank" class="brand-text">smability.io</a></div>';
    html += '</div>';
    return html;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


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
