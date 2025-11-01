/**
 * ==============================================
 * ARCHIVO: master-api-panels.js - LÓGICA HOMOLOGADA
 * DESCRIPCIÓN: Panel idéntico a SmabilityPanels
 * ==============================================
 */

window.MasterAPIPanels = (function() {
    'use strict';

    // Variables privadas del módulo
    let currentState = 1; // 1: oculto, 2: panel visible
    let currentStation = null;

    /**
     * Mostrar panel con datos de Master API - LÓGICA IDÉNTICA A SMABILITY
     */
    function showPanel(stationName) {
        console.log(`MasterAPIPanels: Showing panel for ${stationName}`);
        
        currentStation = stationName;
        
        // Mostrar container
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            container.style.display = 'block';
            console.log('✅ Container display set to block');
        }
    
        // CORREGIR: Forzar estilos del panel
        const panel = document.getElementById('masterAPIMainPanel');
        if (panel) {
            // Forzar valores específicos (no usar transform/opacity CSS)
            panel.style.transform = 'translateX(0px)'; // ← Específico en px
            panel.style.opacity = '1';                 // ← Forzar opacidad
            panel.style.visibility = 'visible';        // ← Asegurar visibilidad
            console.log('✅ Panel forced visible');
        }
    
        // Usar datos por defecto mientras cargan los reales
        updatePanelContent(stationName, {
            ias: '...',
            color: '#ffff00',
            emoji: '⏳',
            category: 'Loading...',
            risk: 'Loading...',
            dominantPollutant: 'Loading...',
            status: 'Loading...'
        });
        
        // Actualizar colores por defecto
        updatePanelColors('#ffff00');
        
        setState(2);
        
        // Cargar datos reales inmediatamente
        updateWithRealData(stationName);
    }

    /**
     * Actualizar contenido del panel - IDÉNTICO A SMABILITY
     */
    function updatePanelContent(stationName, data) {
        const title = document.getElementById('masterAPIPanelTitle');
        const subtitle = document.getElementById('masterAPIPanelSubtitle');
        
        if (title) title.textContent = stationName;
        if (subtitle) subtitle.textContent = data.subtitle || '';

        const emoji = document.getElementById('masterAPIIasEmoji');
        const value = document.getElementById('masterAPIIasValue');
        const status1 = document.getElementById('masterAPIStatusText1');
        const status2 = document.getElementById('masterAPIStatusText2');
        
        if (emoji) emoji.textContent = data.emoji;
        if (value) value.textContent = data.ias;
        if (status1) status1.textContent = data.category;
        if (status2) status2.textContent = data.risk;

        const pollutant = document.getElementById('masterAPIDominantPollutant');
        if (pollutant) pollutant.textContent = data.dominantPollutant;
    }

    /**
     * Actualizar con datos reales de Master API
     */
    async function updateWithRealData(stationName) {
        try {
            console.log(`MasterAPIPanels: Fetching real data for ${stationName}`);
            
            const stationData = await findStationDataInMasterAPI(stationName);
            
            if (stationData) {
                console.log('MasterAPIPanels: Station data found:', stationData);
                updatePanelWithAPIData(stationData);
            } else {
                console.log('MasterAPIPanels: No data found for station');
            }
        } catch (error) {
            console.error(`MasterAPIPanels: Error fetching real data for ${stationName}:`, error);
        }
    }

    /**
     * Actualizar panel con datos de Master API
     */
    function updatePanelWithAPIData(stationData) {
        const panelData = mapMasterAPIData(stationData);
        
        // Actualizar contenido
        updatePanelContent(currentStation, {
            ias: panelData.iasValue,
            emoji: panelData.emoji,
            category: panelData.category,
            risk: panelData.risk,
            dominantPollutant: panelData.dominantPollutant,
            subtitle: `${getDeviceTypeLabel(stationData.device_type)} • ${stationData.city}`
        });
        
        // Actualizar colores
        updatePanelColors(panelData.color);
        
        // Actualizar datos detallados
        updateDetailedData(panelData, stationData);
    }

    /**
     * Actualizar datos detallados
     */
    function updateDetailedData(panelData, stationData) {
        // Reading Status
        const readingStatus = document.getElementById('masterAPIReadingStatus');
        if (readingStatus) readingStatus.textContent = getStatusLabel(stationData.reading_status);
        
        // Pollutants
        const o3 = document.getElementById('masterAPIO3');
        const co = document.getElementById('masterAPICO');
        const pm25 = document.getElementById('masterAPIPM25');
        const pm10 = document.getElementById('masterAPIPM10');
        
        if (o3) o3.textContent = formatValue(panelData.o3, 'ppb');
        if (co) co.textContent = formatValue(panelData.co8h, 'ppb');
        if (pm25) pm25.textContent = formatValue(panelData.pm25, 'μg/m³');
        if (pm10) pm10.textContent = formatValue(panelData.pm10, 'μg/m³');
        
        // Environmental
        const temp = document.getElementById('masterAPITemperature');
        const humidity = document.getElementById('masterAPIHumidity');
        const battery = document.getElementById('masterAPIBattery');
        
        if (temp) temp.textContent = formatValue(panelData.temperature, '°C');
        if (humidity) humidity.textContent = formatValue(panelData.humidity, '%');
        if (battery) battery.textContent = formatValue(panelData.battery, '%');
        
        // Info
        const location = document.getElementById('masterAPILocation');
        const deviceMode = document.getElementById('masterAPIDeviceMode');
        
        if (location) location.textContent = panelData.placement;
        if (deviceMode) deviceMode.textContent = panelData.deviceMode;
        
        // Footer
        const lastUpdate = document.getElementById('masterAPILastUpdate');
        if (lastUpdate) lastUpdate.textContent = `Last update: ${panelData.lastUpdate}`;
    }

    /**
     * Actualizar colores dinámicos - IDÉNTICO A SMABILITY
     */
    function updatePanelColors(color) {
        const colorRgb = hexToRgb(color);
        if (colorRgb) {
            const mainPanel = document.getElementById('masterAPIMainPanel');
            if (mainPanel) {
                mainPanel.style.setProperty('--master-api-ias-bg', `rgba(240, 240, 240, 0.65)`);
                mainPanel.style.setProperty('--master-api-header-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.35)`);
                mainPanel.style.setProperty('--master-api-ias-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.40)`);
                mainPanel.style.setProperty('--master-api-footer-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                mainPanel.style.setProperty('--master-api-data-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.08)`);
                mainPanel.style.setProperty('--master-api-data-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                mainPanel.style.setProperty('--master-api-ias-color', color);
                mainPanel.style.setProperty('border-color', color);
            }
        }
        
        // Actualizar indicador circular
        const indicator = document.getElementById('masterAPIIasIndicator');
        if (indicator) {
            indicator.style.backgroundColor = color;
        }
        updateIASBarPosition(panelData.iasValue);
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

    /**
     * Buscar datos de la estación en Master API
     */
    async function findStationDataInMasterAPI(stationName) {
        try {
            const stationId = Object.keys(window.ALL_STATIONS_MAPPING || {}).find(
                id => window.ALL_STATIONS_MAPPING[id] === stationName
            );
            
            if (!stationId) return null;
            
            const response = await fetch("https://y4zwdmw7vf.execute-api.us-east-1.amazonaws.com/prod/api/air-quality/current");
            const data = await response.json();
            const stations = Array.isArray(data) ? data : data.stations;
            
            return stations.find(s => s.station_id === stationId);
        } catch (error) {
            console.error('MasterAPIPanels: Error fetching Master API data:', error);
            return null;
        }
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
            o3: stationData.pollutants?.o3?.avg_1h?.value || 'N/A',
            co8h: stationData.pollutants?.co?.avg_8h?.value || 'N/A',
            pm25: stationData.pollutants?.pm25?.avg_12h?.value || 'N/A',
            pm10: stationData.pollutants?.pm10?.avg_12h?.value || 'N/A',
            temperature: stationData.meteorological?.temperature?.avg_1h?.value || 'N/A',
            humidity: stationData.meteorological?.relative_humidity?.avg_1h?.value || 'N/A',
            battery: stationData.battery?.value || 'N/A',
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

    function formatValue(value, unit) {
        return value !== 'N/A' ? `${Math.round(value)} ${unit}` : 'N/A';
    }

    function setState(state) {
        currentState = state;
    }

    function closePanel() {
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            container.style.display = 'none';
        }
        setState(1);
        currentStation = null;
    }    
    
    function toggleDetails() {
        const expandedContent = document.getElementById('masterAPIExpandedContent');
        
        if (!expandedContent) return;
        
        if (expandedContent.style.display === 'none') {
            expandedContent.style.display = 'block';
        } else {
            expandedContent.style.display = 'none';
        }
    }
    
    function toggleChart() {
        console.log('Master API: Chart functionality not implemented yet');
        // Implementar después si es necesario
    }
    
    // Actualizar barra IAS
    function updateIASBarPosition(iasValue) {
        const iasBar = document.getElementById('masterAPIIasBar');
        if (iasBar && iasValue !== undefined) {
            let position = 0;
            
            if (iasValue <= 50) {
                position = (iasValue / 50) * 25;
            } else if (iasValue <= 100) {
                position = 25 + ((iasValue - 50) / 50) * 25;
            } else if (iasValue <= 150) {
                position = 50 + ((iasValue - 100) / 50) * 25;
            } else if (iasValue <= 200) {
                position = 75 + ((iasValue - 150) / 50) * 12.5;
            } else {
                position = 87.5 + Math.min(((iasValue - 200) / 100) * 12.5, 12.5);
            }
            
            position = Math.max(0, Math.min(100, position));
            iasBar.style.setProperty('--ias-position', `${position}%`);
        }
    }
    
    // Actualizar el return del módulo:
    return {
        showPanel: showPanel,
        closePanel: closePanel,
        toggleDetails: toggleDetails,    // ← AGREGAR
        toggleChart: toggleChart,        // ← AGREGAR
        getCurrentStation: () => currentStation,
        getCurrentState: () => currentState
    };
})();

console.log('MasterAPIPanels: Module loaded successfully - HOMOLOGATED LOGIC');
