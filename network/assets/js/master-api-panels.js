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
        
        // AGREGAR AQUÍ: Actualizar colores inmediatamente después de insertar en DOM
        const panelData = mapMasterAPIData(stationData);
        updatePanelColors(panelData);
        
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
     * Crear HTML del panel con datos de Master API - ESTRUCTURA IDÉNTICA
     */
    function createPanelHTML(stationData) {
        const panelData = mapMasterAPIData(stationData);
        
        return `
            <div class="master-api-panel">
                <!-- Header -->
                <div class="master-api-header">
                    <div class="master-api-header-left">
                        <h3 class="master-api-panel-title">${stationData.station_name}</h3>
                        <p class="master-api-panel-subtitle">${getDeviceTypeLabel(stationData.device_type)} • ${stationData.city}</p>
                    </div>
                    <div class="master-api-header-right">
                        <button class="master-api-close-btn" onclick="MasterAPIPanels.closePanel()">×</button>
                    </div>
                </div>
    
                <!-- Contenido del panel -->
                <div class="master-api-panel-content">
                    <!-- IAS Principal - ESTRUCTURA IDÉNTICA -->
                    <div class="master-api-ias-section">
                        <span class="master-api-ias-emoji">${panelData.emoji}</span>
                        <div class="master-api-ias-indicator"></div>
                        <div class="master-api-ias-value">${panelData.iasValue}</div>
                        <div class="master-api-ias-status">
                            <div class="master-api-status-row">
                                <span class="master-api-status-label">Status:</span>
                                <span class="master-api-status-value">${panelData.category}</span>
                            </div>
                            <div class="master-api-status-row">
                                <span class="master-api-status-label">Risk:</span>
                                <span class="master-api-status-value">${panelData.risk}</span>
                            </div>
                        </div>
                    </div>
    
                    <!-- Datos principales -->
                    <div class="master-api-data-grid">
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Dominant Pollutant</div>
                            <div class="master-api-data-value">${panelData.dominantPollutant}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Status</div>
                            <div class="master-api-data-value">${getStatusLabel(stationData.reading_status)}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">O3 1hr</div>
                            <div class="master-api-data-value">${formatValue(panelData.o3, 'ppb')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">CO 8hr</div>
                            <div class="master-api-data-value">${formatValue(panelData.co8h, 'ppb')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">PM2.5 12hr</div>
                            <div class="master-api-data-value">${formatValue(panelData.pm25, 'μg/m³')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">PM10 12hr</div>
                            <div class="master-api-data-value">${formatValue(panelData.pm10, 'μg/m³')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Temperature</div>
                            <div class="master-api-data-value">${formatValue(panelData.temperature, '°C')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Humidity</div>
                            <div class="master-api-data-value">${formatValue(panelData.humidity, '%')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Battery</div>
                            <div class="master-api-data-value">${formatValue(panelData.battery, '%')}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Location</div>
                            <div class="master-api-data-value">${panelData.placement}</div>
                        </div>
                        <div class="master-api-data-item">
                            <div class="master-api-data-label">Device Mode</div>
                            <div class="master-api-data-value">${panelData.deviceMode}</div>
                        </div>
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
    
    // NUEVA: Función helper para formatear valores
    function formatValue(value, unit) {
        return value !== 'N/A' ? `${Math.round(value)} ${unit}` : 'N/A';
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
    
    /**
     * Actualizar colores dinámicos del panel según IAS - IDÉNTICO A SMABILITY
     */
    function updatePanelColors(panelData) {
        const color = panelData.color;
        const iasValue = panelData.iasValue;
        
        console.log('🎨 Updating panel colors with:', color, iasValue);
        
        // Convertir hex a RGB
        const colorRgb = hexToRgb(color);
        if (colorRgb) {
            // Actualizar variables CSS dinámicas
            const panel = document.querySelector('.master-api-panel');
            if (panel) {
                console.log('✅ Panel found, applying colors...');
                panel.style.setProperty('--master-api-ias-bg', `rgba(240, 240, 240, 0.65)`);
                panel.style.setProperty('--master-api-header-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.35)`);
                panel.style.setProperty('--master-api-ias-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.40)`);
                panel.style.setProperty('--master-api-footer-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                panel.style.setProperty('--master-api-data-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.08)`);
                panel.style.setProperty('--master-api-data-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                panel.style.setProperty('--master-api-ias-color', color);
                panel.style.borderColor = color;
                
                // Actualizar indicador circular
                const indicator = panel.querySelector('.master-api-ias-indicator');
                if (indicator) {
                    indicator.style.backgroundColor = color;
                    console.log('✅ Indicator color updated');
                }
            } else {
                console.error('❌ Panel not found in DOM');
            }
        } else {
            console.error('❌ Could not convert color to RGB:', color);
        }
    }
    
    // Función helper para convertir hex a rgb
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    // Llamar updatePanelColors en createAndShowPanel después de crear el panel
    function createAndShowPanel(stationData) {
        const panelHTML = createPanelHTML(stationData);
        // ... código existente ...
        
        // AGREGAR después de mostrar el panel:
        const panelData = mapMasterAPIData(stationData);
        updatePanelColors(panelData);
        
        setState(2);
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
