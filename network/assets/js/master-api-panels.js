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
        // Mapear datos de Master API a formato del panel
        const panelData = mapMasterAPIData(stationData);
        
        return `
            <div class="master-api-panel" style="
                position: fixed;
                top: 20px;
                right: 20px;
                width: 360px;
                max-height: 80vh;
                background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
                border-radius: 16px;
                border: 2px solid ${panelData.color};
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                pointer-events: all;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                overflow: hidden;
                backdrop-filter: blur(10px);
            ">
                <!-- Header -->
                <div class="master-api-header" style="
                    background: linear-gradient(135deg, ${panelData.color}20 0%, ${panelData.color}10 100%);
                    border-bottom: 1px solid ${panelData.color}30;
                    padding: 16px;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">
                                ${stationData.station_name}
                            </h3>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${getDeviceTypeLabel(stationData.device_type)} • ${stationData.city}
                            </p>
                        </div>
                        <button onclick="MasterAPIPanels.closePanel()" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            color: #666;
                            cursor: pointer;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.backgroundColor='rgba(0,0,0,0.1)'" onmouseout="this.style.backgroundColor='transparent'">×</button>
                    </div>
                </div>

                <!-- IAS Principal -->
                <div class="master-api-ias-section" style="
                    padding: 20px 16px;
                    text-align: center;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                ">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
                        <span style="font-size: 36px;">${panelData.emoji}</span>
                        <div style="
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            background: ${panelData.color};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            font-weight: bold;
                            color: #000;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        ">${panelData.iasValue}</div>
                        <div style="text-align: left;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Air Quality:</div>
                            <div style="font-size: 16px; font-weight: bold; color: #1a1a1a;">${panelData.category}</div>
                            <div style="font-size: 14px; color: #666; margin-top: 2px;">Risk: ${panelData.risk}</div>
                        </div>
                    </div>
                </div>

                <!-- Datos principales -->
                <div style="padding: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div class="data-item" style="
                            background: rgba(0,0,0,0.03);
                            padding: 12px;
                            border-radius: 8px;
                            text-align: center;
                        ">
                            <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Dominant Pollutant</div>
                            <div style="font-size: 16px; font-weight: bold; color: #1a1a1a;">${panelData.dominantPollutant}</div>
                        </div>
                        <div class="data-item" style="
                            background: rgba(0,0,0,0.03);
                            padding: 12px;
                            border-radius: 8px;
                            text-align: center;
                        ">
                            <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Status</div>
                            <div style="font-size: 16px; font-weight: bold; color: #1a1a1a;">${getStatusLabel(stationData.reading_status)}</div>
                        </div>
                    </div>

                    <!-- Pollutants Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;">
                        ${createPollutantItem('O3 1hr', panelData.o3, 'ppb')}
                        ${createPollutantItem('CO 8hr', panelData.co8h, 'ppb')}
                        ${createPollutantItem('PM2.5 12hr', panelData.pm25, 'μg/m³')}
                        ${createPollutantItem('PM10 12hr', panelData.pm10, 'μg/m³')}
                    </div>

                    <!-- Environmental Data -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px;">
                        ${createEnvironmentalItem('Temperature', panelData.temperature, '°C')}
                        ${createEnvironmentalItem('Humidity', panelData.humidity, '%')}
                        ${createEnvironmentalItem('Battery', panelData.battery, '%')}
                    </div>

                    <!-- Placement Info -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        ${createInfoItem('Location', panelData.placement)}
                        ${createInfoItem('Device Mode', panelData.deviceMode)}
                    </div>
                </div>

                <!-- Footer -->
                <div style="
                    padding: 12px 16px;
                    border-top: 1px solid rgba(0,0,0,0.1);
                    background: rgba(0,0,0,0.02);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 11px;
                    color: #666;
                ">
                    <span>Last update: ${panelData.lastUpdate}</span>
                    <a href="https://smability.io/en/" target="_blank" style="color: #4264fb; text-decoration: none;">Master API</a>
                </div>
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
