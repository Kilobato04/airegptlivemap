/**
 * ==============================================
 * ARCHIVO: master-api-panels.js - VERSIÓN MASTER API
 * DESCRIPCIÓN: Panel específico para estaciones del Master API
 * ==============================================
 */

window.MasterAPIPanels = (function() {
    'use strict';

    // Variables privadas del módulo
    let currentState = 1; // 1: oculto, 2: panel visible
    let currentStation = null;
    let panelData = null;

    /**
     * Mostrar panel con datos de Master API - ESPECÍFICO PARA DEL VALLE TEST
     */
    function showPanel(stationName) {
        console.log(`MasterAPIPanels: Showing panel for ${stationName}`);
        
        // Solo procesar Del Valle por ahora para test
        if (stationName !== 'Del Valle') {
            console.log(`MasterAPIPanels: ${stationName} not supported yet (test mode: Del Valle only)`);
            return;
        }
        
        currentStation = stationName;
        
        // Buscar datos de la estación en la última respuesta de Master API
        findStationDataInMasterAPI(stationName)
            .then(stationData => {
                if (stationData) {
                    console.log('MasterAPIPanels: Station data found:', stationData);
                    createAndShowPanel(stationData);
                } else {
                    console.log('MasterAPIPanels: No data found for station');
                    showErrorPanel(stationName);
                }
            })
            .catch(error => {
                console.error('MasterAPIPanels: Error finding station data:', error);
                showErrorPanel(stationName);
            });
    }

    /**
     * Buscar datos de la estación en Master API
     */
    async function findStationDataInMasterAPI(stationName) {
        try {
            // Mapear nombre a station_id
            const stationId = Object.keys(window.ALL_STATIONS_MAPPING || {}).find(
                id => window.ALL_STATIONS_MAPPING[id] === stationName
            );
            
            if (!stationId) {
                console.log(`MasterAPIPanels: No station_id found for ${stationName}`);
                return null;
            }
            
            console.log(`MasterAPIPanels: Looking for station_id: ${stationId}`);
            
            // Obtener datos frescos de Master API
            const response = await fetch("https://y4zwdmw7vf.execute-api.us-east-1.amazonaws.com/prod/api/air-quality/current");
            const data = await response.json();
            const stations = Array.isArray(data) ? data : data.stations;
            
            // Buscar la estación específica
            const stationData = stations.find(s => s.station_id === stationId);
            
            if (stationData) {
                console.log(`MasterAPIPanels: Found data for ${stationId}:`, stationData);
                return stationData;
            } else {
                console.log(`MasterAPIPanels: Station ${stationId} not found in API response`);
                return null;
            }
            
        } catch (error) {
            console.error('MasterAPIPanels: Error fetching Master API data:', error);
            return null;
        }
    }

    /**
     * Crear y mostrar panel con datos de Master API
     */
    function createAndShowPanel(stationData) {
        // Crear estructura del panel
        const panelHTML = createPanelHTML(stationData);
        
        // Insertar en el DOM
        let container = document.getElementById('masterAPIPanelContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'masterAPIPanelContainer';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                pointer-events: none;
                display: none;
            `;
            document.body.appendChild(container);
        }
        
        container.innerHTML = panelHTML;
        container.style.display = 'block';
        
        // Mostrar panel con animación
        setTimeout(() => {
            const panel = container.querySelector('.master-api-panel');
            if (panel) {
                panel.style.transform = 'translateX(0)';
                panel.style.opacity = '1';
            }
        }, 50);
        
        setState(2);
    }

    /**
     * Crear HTML del panel con datos de Master API
     */
    function createPanelHTML(stationData) {
        const panelData = mapMasterAPIData(stationData);
        
        return `
            <div class="master-api-panel">
                <!-- Header -->
                <div class="master-api-header">
                    <div>
                        <h3 class="master-api-panel-title">${stationData.station_name}</h3>
                        <p class="master-api-panel-subtitle">${getDeviceTypeLabel(stationData.device_type)} • ${stationData.city}</p>
                    </div>
                    <button class="master-api-close-btn" onclick="MasterAPIPanels.closePanel()">×</button>
                </div>
    
                <!-- IAS Principal -->
                <div class="master-api-ias-section">
                    <div class="master-api-ias-display">
                        <span class="master-api-ias-emoji">${panelData.emoji}</span>
                        <div class="master-api-ias-circle" style="background-color: ${panelData.color};">${panelData.iasValue}</div>
                        <div class="master-api-ias-info">
                            <div class="master-api-ias-label">Air Quality:</div>
                            <div class="master-api-ias-category">${panelData.category}</div>
                            <div class="master-api-ias-risk">Risk: ${panelData.risk}</div>
                        </div>
                    </div>
                </div>
    
                <!-- Datos principales -->
                <div class="master-api-data-section">
                    <div class="master-api-data-grid">
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Dominant Pollutant</div>
                            <div class="master-api-data-value">${panelData.dominantPollutant}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Status</div>
                            <div class="master-api-data-value">${getStatusLabel(stationData.reading_status)}</div>
                        </div>
                    </div>
    
                    <!-- Pollutants Grid -->
                    <div class="master-api-data-grid four-cols">
                        ${createPollutantItem('O3 1hr', panelData.o3, 'ppb')}
                        ${createPollutantItem('CO 8hr', panelData.co8h, 'ppb')}
                        ${createPollutantItem('PM2.5 12hr', panelData.pm25, 'μg/m³')}
                        ${createPollutantItem('PM10 12hr', panelData.pm10, 'μg/m³')}
                    </div>
    
                    <!-- Environmental Data -->
                    <div class="master-api-data-grid three-cols">
                        ${createEnvironmentalItem('Temperature', panelData.temperature, '°C')}
                        ${createEnvironmentalItem('Humidity', panelData.humidity, '%')}
                        ${createEnvironmentalItem('Battery', panelData.battery, '%')}
                    </div>
    
                    <!-- Placement Info -->
                    <div class="master-api-data-grid">
                        ${createInfoItem('Location', panelData.placement)}
                        ${createInfoItem('Device Mode', panelData.deviceMode)}
                    </div>
                </div>
    
                <!-- Footer -->
                <div class="master-api-footer">
                    <span class="master-api-last-update">Last update: ${panelData.lastUpdate}</span>
                    <a href="https://smability.io/en/" target="_blank" class="master-api-branding">Master API</a>
                </div>
            </div>
        `;
    }
    
    // Actualizar funciones helper para usar clases CSS
    function createPollutantItem(label, value, unit) {
        const displayValue = value !== 'N/A' ? `${Math.round(value)} ${unit}` : 'N/A';
        return `
            <div class="master-api-data-item small">
                <div class="master-api-data-label small">${label}</div>
                <div class="master-api-data-value small">${displayValue}</div>
            </div>
        `;
    }
    
    function createEnvironmentalItem(label, value, unit) {
        const displayValue = value !== 'N/A' ? `${Math.round(value)}${unit}` : 'N/A';
        return `
            <div class="master-api-data-item small">
                <div class="master-api-data-label small">${label}</div>
                <div class="master-api-data-value small">${displayValue}</div>
            </div>
        `;
    }
    
    function createInfoItem(label, value) {
        return `
            <div class="master-api-data-item small">
                <div class="master-api-data-label small">${label}</div>
                <div class="master-api-data-value small">${value}</div>
            </div>
        `;
    }

    /**
     * Mapear datos de Master API a formato del panel
     */
    function mapMasterAPIData(stationData) {
        return {
            iasValue: Math.round(stationData.ias_numeric_value || 0),
            color: stationData.color_code || '#666666',
            emoji: getIASEmoji(stationData.ias_numeric_value),
            category: stationData.category || 'Unknown',
            risk: stationData.risk_level || 'Unknown',
            dominantPollutant: (stationData.dominant_pollutant || 'N/A').toUpperCase(),
            
            // Pollutants
            o3: stationData.pollutants?.o3?.avg_1h?.value || 'N/A',
            co8h: stationData.pollutants?.co?.avg_8h?.value || 'N/A',
            pm25: stationData.pollutants?.pm25?.avg_12h?.value || 'N/A',
            pm10: stationData.pollutants?.pm10?.avg_12h?.value || 'N/A',
            
            // Environmental
            temperature: stationData.meteorological?.temperature?.avg_1h?.value || 'N/A',
            humidity: stationData.meteorological?.relative_humidity?.avg_1h?.value || 'N/A',
            battery: stationData.battery?.value || 'N/A',
            
            // Info
            placement: translatePlacement(stationData.placement),
            deviceMode: translateDeviceMode(stationData.device_mode?.mode),
            lastUpdate: formatLastUpdate(stationData.reading_time_UTC6)
        };
    }

    // Helper functions
    function getIASEmoji(ias) {
        if (ias <= 50) return '😊';
        if (ias <= 100) return '😐';
        if (ias <= 150) return '😷';
        if (ias <= 200) return '🤢';
        return '☠️';
    }

    function getDeviceTypeLabel(deviceType) {
        const typeMap = {
            'smability-SMAA': 'Smability SMAA',
            'smability-SMAAso2': 'Smability SO2',
            'smability-SMAAmicro': 'Smability Micro',
            'reference': 'Reference Station'
        };
        return typeMap[deviceType] || deviceType;
    }

    function getStatusLabel(status) {
        const statusMap = {
            'current': 'Live',
            'stale': 'Stale',
            'offline': 'Offline'
        };
        return statusMap[status] || status;
    }

    function translatePlacement(placement) {
        return placement === 'outdoor' ? 'Outdoors' : placement || 'Unknown';
    }

    function translateDeviceMode(mode) {
        return mode === 'fix' ? 'Fixed' : mode || 'Unknown';
    }

    function formatLastUpdate(timeStr) {
        if (!timeStr) return 'Unknown';
        const date = new Date(timeStr + ' UTC-6');
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        
        if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else {
            const diffHours = Math.floor(diffMinutes / 60);
            return `${diffHours}h ago`;
        }
    }

    function createPollutantItem(label, value, unit) {
        const displayValue = value !== 'N/A' ? `${Math.round(value)} ${unit}` : 'N/A';
        return `
            <div style="
                background: rgba(0,0,0,0.03);
                padding: 8px;
                border-radius: 6px;
                text-align: center;
            ">
                <div style="font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${label}</div>
                <div style="font-size: 12px; font-weight: bold; color: #1a1a1a;">${displayValue}</div>
            </div>
        `;
    }

    function createEnvironmentalItem(label, value, unit) {
        const displayValue = value !== 'N/A' ? `${Math.round(value)}${unit}` : 'N/A';
        return `
            <div style="
                background: rgba(0,0,0,0.03);
                padding: 8px;
                border-radius: 6px;
                text-align: center;
            ">
                <div style="font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${label}</div>
                <div style="font-size: 12px; font-weight: bold; color: #1a1a1a;">${displayValue}</div>
            </div>
        `;
    }

    function createInfoItem(label, value) {
        return `
            <div style="
                background: rgba(0,0,0,0.03);
                padding: 8px;
                border-radius: 6px;
                text-align: center;
            ">
                <div style="font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${label}</div>
                <div style="font-size: 12px; font-weight: bold; color: #1a1a1a;">${value}</div>
            </div>
        `;
    }

    function showErrorPanel(stationName) {
        console.log(`MasterAPIPanels: Showing error panel for ${stationName}`);
        // Implementar panel de error simple
    }

    function setState(state) {
        currentState = state;
    }

    function closePanel() {
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            const panel = container.querySelector('.master-api-panel');
            if (panel) {
                panel.style.transform = 'translateX(100%)';
                panel.style.opacity = '0';
                setTimeout(() => {
                    container.style.display = 'none';
                }, 300);
            }
        }
        setState(1);
        currentStation = null;
    }

    // API pública
    return {
        showPanel: showPanel,
        closePanel: closePanel,
        getCurrentStation: () => currentStation,
        getCurrentState: () => currentState
    };
})();

console.log('MasterAPIPanels: Module loaded successfully');
