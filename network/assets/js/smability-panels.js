/**
 * ==============================================
 * ARCHIVO: smability-panels.js - VERSIÓN COMPLETA
 * DESCRIPCIÓN: Solo CENTRUS 5 con todas las funcionalidades
 * ==============================================
 */

// Namespace para evitar conflictos con funcionalidad existente
window.SmabilityPanels = (function() {
    'use strict';

    // Variables privadas del módulo
    let currentState = 1; // 1: oculto, 2: panel visible, 3: ambos visibles
    let currentDevice = null;
    let smabilityMarkers = new Map();
    let initializationAttempts = 0;
    let maxInitAttempts = 10;


    /**
     * Inicializar el módulo
     */
    function init() {
        console.log('SmabilityPanels: Initializing... Attempt:', initializationAttempts + 1);
        
        initializationAttempts++;
        
        // CRÍTICO: Límite de intentos
        if (initializationAttempts > maxInitAttempts) {
            console.error('❌ SmabilityPanels: Max attempts reached, STOPPING');
            return;
        }
        
        if (!window.map) {
            console.log('SmabilityPanels: Map not available yet, retrying...');
            setTimeout(init, 1000);
            return;
        }
    
        // CRÍTICO: Verificar método antes de usar
        if (typeof window.map.isStyleLoaded !== 'function') {
            console.log('SmabilityPanels: isStyleLoaded method not available yet, retrying...');
            setTimeout(init, 1000);
            return;
        }
    
        if (!window.map.isStyleLoaded()) {
            console.log('SmabilityPanels: Map not loaded yet, waiting...');
            if (typeof window.map.on === 'function') {
                window.map.on('load', () => {
                    console.log('SmabilityPanels: Map loaded via event, setting up markers...');
                    setupSmabilityMarkers();
                });
            } else {
                setTimeout(init, 1000);
            }
        } else {
            console.log('SmabilityPanels: Map already loaded, setting up markers...');
            setupSmabilityMarkers();
        }
        
        console.log('SmabilityPanels: Initialized');
    }

    /**
     * Crear markers - Solo CENTRUS 5
     */
    function setupSmabilityMarkers() {
        console.log('SmabilityPanels: Integrating with existing markers...');
        
        // Limpiar markers existentes si los hay
        smabilityMarkers.forEach(marker => marker.remove());
        smabilityMarkers.clear();
        
        // Buscar instancia del mapa
        let mapInstance = window.map || window.mapboxMap || window.myMap;
        
        if (!mapInstance) {
            console.log('SmabilityPanels: ❌ Map instance not found, retrying...');
            setTimeout(setupSmabilityMarkers, 2000);
            return;
        }
        
        console.log('SmabilityPanels: ✅ Map instance found, integrating with existing markers');
        
        // No crear markers nuevos, solo integrar con los existentes
        console.log('SmabilityPanels: Integration complete - using existing map markers');
    }

    /**
     * Función para obtener datos reales de la API
     */
    async function updateWithRealData(deviceName) {
        try {
            console.log(`SmabilityPanels: Fetching real data for ${deviceName}`);
            
            if (window.fetchSensorData && window.API_CONFIG && window.API_CONFIG.tokens[deviceName]) {
                const sensorData = await window.fetchSensorData(deviceName);
                
                console.log(`SmabilityPanels: Received data for ${deviceName}:`, sensorData);
                
                if (sensorData) {
                    updatePanelWithAPIData(sensorData);
                    updateMarkerWithRealData(deviceName, sensorData);
                }
            } else {
                console.log(`SmabilityPanels: No API config available for ${deviceName}`);
            }
        } catch (error) {
            console.error(`SmabilityPanels: Error fetching real data for ${deviceName}:`, error);
        }
    }

    /**
     * Actualizar marker visual con datos reales
     */
    function updateMarkerWithRealData(deviceName, sensorData) {
        // Ya no actualizamos markers propios, los datos se muestran en el panel
        console.log(`SmabilityPanels: Updated data for ${deviceName}:`, sensorData);
        // Los markers del mapa se actualizan por el sistema principal
    }

    /**
     * Resetear estado del panel al abrirlo
     */
    function resetPanelState() {
        // Contraer contenido expandido
        const expandedContent = document.getElementById('smabilityExpandedContent');
        
        if (expandedContent) {
            expandedContent.style.display = 'none';
        }
                
        // Ocultar gráfico inline
        const chartContainer = document.getElementById('smabilityInlineChartContainer');
        const mainPanel = document.getElementById('smabilityMainPanel');
        
        if (chartContainer && mainPanel) {
            chartContainer.style.display = 'none';
            mainPanel.style.maxHeight = '55vh';
        }
        
        // Resetear controles de comparación
        const comparisonSelect = document.getElementById('smabilityComparisonSelect');
        const timeframeSelect = document.getElementById('smabilityTimeframeSelect');
        const sensorSelect = document.getElementById('smabilitySensorSelect');
        
        if (comparisonSelect) comparisonSelect.value = '';
        if (timeframeSelect) timeframeSelect.value = '12';
        if (sensorSelect) sensorSelect.value = '7';
        
        // Limpiar gráfico
        const chartDiv = document.getElementById('smabilityInlineChart');
        if (chartDiv && window.Plotly) {
            window.Plotly.purge(chartDiv);
            chartDiv.style.display = 'none';
        }
        
        // Mostrar placeholder del gráfico
        const placeholder = document.getElementById('smabilityChartPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.innerHTML = '📊 Plotly.js Chart with Real-time Data<br><small style="margin-top: 8px; display: block;">Optimized for air quality visualization</small>';
        }
        
        console.log('SmabilityPanels: Panel state reset');
    }

        /**
     * Actualizar barra IAS y colores del panel
     */
    function updateIASBarAndColors(iasValue, color) {
        // Actualizar colores del panel basado en el color REAL del IAS
        const mainPanel = document.getElementById('smabilityMainPanel');
        if (mainPanel) {
            // LÓGICA CORRECTA: Convertir el color del IAS a diferentes intensidades translúcidas
            const colorRgb = hexToRgb(color);
            if (colorRgb) {
                // Panel principal - color IAS translúcido (25% opacidad)
                mainPanel.style.setProperty('--smability-ias-bg', `rgba(255, 255, 255, 0.95)`);
                
                // Header - color IAS más intenso (35% opacidad)
                mainPanel.style.setProperty('--smability-header-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.35)`);
                
                // Hover states - color IAS intenso (40% opacidad)
                mainPanel.style.setProperty('--smability-ias-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.40)`);
                
                // Footer - color IAS muy sutil (15% opacidad)
                mainPanel.style.setProperty('--smability-footer-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                
                // Data items - color IAS muy sutil (8% opacidad)
                mainPanel.style.setProperty('--smability-data-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.08)`);
                mainPanel.style.setProperty('--smability-data-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                
                // Bordes - color IAS sólido
                mainPanel.style.setProperty('--smability-ias-color', color);
                mainPanel.style.setProperty('border-color', color);
            }
        }
        
        // Actualizar indicador circular
        const indicator = document.getElementById('smabilityIasIndicator');
        if (indicator) {
            indicator.style.backgroundColor = color;
        }
        
        // Actualizar posición en barra IAS
        const iasBar = document.getElementById('smabilityIasBar');
        if (iasBar && iasValue !== undefined) {
            // Calcular posición en la barra
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
     * Actualizar colores de los paneles según IAS
     */
    function updatePanelColors(color) {
        const iasValue = document.getElementById('smabilityIasValue');
        const currentIAS = iasValue ? parseInt(iasValue.textContent) : 87;
        
        updateIASBarAndColors(currentIAS, color);
    }

    /**
     * Mostrar panel con datos de la estación - ACTUALIZADO
     */
    function showPanel(deviceName) {
        console.log(`SmabilityPanels: Showing panel for ${deviceName}`);
        
        currentDevice = deviceName;
        
        // Verificar si la estación está en las activas
        if (!window.APP_SETTINGS || !window.APP_SETTINGS.activeStations.includes(deviceName)) {
            console.log(`SmabilityPanels: ${deviceName} is not an active station`);
            return;
        }
    
        const container = document.getElementById('smabilityPanelContainer');
        if (container) {
            container.style.display = 'block';
        }
    
        // Usar datos por defecto mientras cargan los reales
        updatePanelContent(deviceName, {
            ias: '...',
            color: '#ffff00',
            emoji: '⏳',
            pollutant: 'Loading...',
            status1: 'Loading...',
            status2: 'Loading...'
        });
        
        // Actualizar colores por defecto
        updatePanelColors('#ffff00');
        
        // Resetear estado del panel y controles
        resetPanelState();
        
        // Setup chart controls cuando se muestra el panel
        setupChartControls();
        
        setState(2);
        
        // Cargar datos reales inmediatamente
        updateWithRealData(deviceName);
    }

    /**
     * Actualizar contenido del panel con datos de la estación
     */
    function updatePanelContent(deviceName, data) {
        const title = document.getElementById('smabilityPanelTitle');
        // Solo el nombre del dispositivo, sin subtítulo
        if (title) title.textContent = deviceName;

        const emoji = document.getElementById('smabilityIasEmoji');
        const value = document.getElementById('smabilityIasValue');
        const status1 = document.getElementById('smabilityStatusText1');
        const status2 = document.getElementById('smabilityStatusText2');
        
        if (emoji) emoji.textContent = data.emoji;
        if (value) value.textContent = data.ias;
        if (status1) status1.textContent = data.status1;
        if (status2) status2.textContent = data.status2.replace(' Risk', ''); // Quitar "Risk" duplicado

        const pollutant = document.getElementById('smabilityDominantPollutant');
        if (pollutant) pollutant.textContent = data.pollutant;
    }  
    /**
     * Función para evitar unidades duplicadas
     */
    function formatWithSingleUnit(value, unit) {
        const valueStr = String(value);
        // Detectar variaciones de unidades
        if (unit === 'μg/m³' && (valueStr.includes('ug/m3') || valueStr.includes('μg/m³'))) {
            return valueStr;
        }
        if (valueStr.includes(unit)) {
            return valueStr;
        }
        return `${value} ${unit}`;
    }
    /**
     * Actualizar panel con datos reales de la API - CORREGIDO: Sin unidades duplicadas
     */
    function updatePanelWithAPIData(sensorData) {
        // NUEVO: Verificar si debemos mostrar IAS basado en freshness
        if (sensorData.displayConfig && sensorData.displayConfig.showIAS && sensorData.displayIAS !== 'N/A') {
            // CASO 1: Datos LIVE/RECENT (≤ 8 horas) - Mostrar IAS normal
            const iasValue = document.getElementById('smabilityIasValue');
            if (iasValue) iasValue.textContent = Math.round(sensorData.displayIAS);
            
            const { color, status, risk } = window.getIndicatorColor ? 
                window.getIndicatorColor(sensorData.displayIAS) : 
                { color: '#ffff00', status: 'Unknown', risk: 'Unknown' };
            
            updatePanelColors(color);
            
            // Status y Risk normales
            const status1 = document.getElementById('smabilityStatusText1');
            const status2 = document.getElementById('smabilityStatusText2');
            if (status1) status1.textContent = status;
            if (status2) status2.textContent = risk.replace(' Risk', '');
            
            const emoji = document.getElementById('smabilityIasEmoji');
            if (emoji && window.getIASEmoji) {
                emoji.textContent = window.getIASEmoji(sensorData.displayIAS);
            }
            
            console.log(`✅ Panel: Showing fresh IAS ${sensorData.displayIAS} (${sensorData.displayConfig.label})`);
            
        } else if (sensorData.displayConfig) {
            // CASO 2: Datos STALE/OFFLINE (> 8 horas) - Mostrar estado de datos
            const iasValue = document.getElementById('smabilityIasValue');
            const status1 = document.getElementById('smabilityStatusText1');
            const status2 = document.getElementById('smabilityStatusText2');
            const emoji = document.getElementById('smabilityIasEmoji');
            
            if (iasValue) iasValue.textContent = sensorData.displayConfig.indicator; // ○ o ×
            if (status1) status1.textContent = sensorData.displayConfig.status.toUpperCase(); // STALE o OFFLINE
            if (status2) status2.textContent = sensorData.displayConfig.label; // "Stale" o "Offline"
            if (emoji) emoji.textContent = '⚠️';
            
            // Color gris para datos no confiables
            updatePanelColors('#888888');
            
            console.log(`⚠️ Panel: Showing ${sensorData.displayConfig.status} state (${sensorData.displayConfig.label})`);
            
        } else {
            // CASO 3: Fallback - usar datos legacy si no hay displayConfig
            if (sensorData.dataIAS && sensorData.dataIAS !== 'N/A') {
                const iasValue = document.getElementById('smabilityIasValue');
                if (iasValue) iasValue.textContent = Math.round(sensorData.dataIAS);
                
                const { color, status, risk } = window.getIndicatorColor ? 
                    window.getIndicatorColor(sensorData.dataIAS) : 
                    { color: '#ffff00', status: 'Unknown', risk: 'Unknown' };
                
                updatePanelColors(color);
                
                const status1 = document.getElementById('smabilityStatusText1');
                const status2 = document.getElementById('smabilityStatusText2');
                if (status1) status1.textContent = status;
                if (status2) status2.textContent = risk.replace(' Risk', '');
                
                const emoji = document.getElementById('smabilityIasEmoji');
                if (emoji && window.getIASEmoji) {
                    emoji.textContent = window.getIASEmoji(sensorData.dataIAS);
                }
                
                console.log(`📊 Panel: Fallback display for IAS ${sensorData.dataIAS}`);
            }
        }
    
        // RESTO DE DATOS: Solo mostrar si tenemos datos frescos O si es información no relacionada con IAS
        const showDetailedData = sensorData.displayConfig ? sensorData.displayConfig.showIAS : true;
        
        if (showDetailedData) {
            // Datos de sensores reales - SOLO si datos son frescos
            if (sensorData.SensorIAS) {
                const pollutant = document.getElementById('smabilityDominantPollutant');
                if (pollutant) pollutant.textContent = sensorData.SensorIAS;
            }
    
            if (sensorData.ConcentrationIASO3_1hr) {
                const o3 = document.getElementById('smabilityO3');
                if (o3) o3.textContent = formatWithSingleUnit(sensorData.ConcentrationIASO3_1hr, 'ppb');
            }
    
            if (sensorData.ConcentrationIASCO_8hr) {
                const co = document.getElementById('smabilityCO');
                if (co) co.textContent = formatWithSingleUnit(sensorData.ConcentrationIASCO_8hr, 'ppb');
            }
    
            if (sensorData.ConcentrationIASPM2_5_12hr) {
                const pm25 = document.getElementById('smabilityPM25');
                if (pm25) pm25.textContent = formatWithSingleUnit(sensorData.ConcentrationIASPM2_5_12hr, 'μg/m³');
            }
    
            if (sensorData.ConcentrationIASPM10_12hr) {
                const pm10 = document.getElementById('smabilityPM10');
                if (pm10) pm10.textContent = formatWithSingleUnit(sensorData.ConcentrationIASPM10_12hr, 'μg/m³');
            }
        } else {
            // Para datos stale/offline, mostrar indicadores de que los datos no son confiables
            const pollutant = document.getElementById('smabilityDominantPollutant');
            const o3 = document.getElementById('smabilityO3');
            const co = document.getElementById('smabilityCO');
            const pm25 = document.getElementById('smabilityPM25');
            const pm10 = document.getElementById('smabilityPM10');
            
            if (pollutant) pollutant.textContent = 'Data too old';
            if (o3) o3.textContent = '-- ppb';
            if (co) co.textContent = '-- ppb';
            if (pm25) pm25.textContent = '-- μg/m³';
            if (pm10) pm10.textContent = '-- μg/m³';
        }
    
        // DATOS AMBIENTALES: Mostrar siempre (no dependen del IAS)
        if (sensorData.Temperature || sensorData.Temp_1hr) {
            const temp = document.getElementById('smabilityTemperature');
            const tempValue = sensorData.Temp_1hr || sensorData.Temperature;
            if (temp) temp.textContent = formatWithSingleUnit(tempValue, '°C');
        }
    
        if (sensorData.Humidity || sensorData.HR_1hr) {
            const humidity = document.getElementById('smabilityHumidity');
            const humidityValue = sensorData.HR_1hr || sensorData.Humidity;
            if (humidity) humidity.textContent = formatWithSingleUnit(humidityValue, '%');
        }
    
        if (sensorData.Battery_Now) {
            const battery = document.getElementById('smabilityBattery');
            if (battery) battery.textContent = formatWithSingleUnit(sensorData.Battery_Now, '%');
        }
    
        if (sensorData.LocationSensor) {
            const location = document.getElementById('smabilityLocation');
            if (location && window.translateLocation) {
                location.textContent = window.translateLocation(sensorData.LocationSensor);
            }
        }
    
        if (sensorData.ModeSensor) {
            const mode = document.getElementById('smabilityDeviceMode');
            if (mode && window.translateMode) {
                mode.textContent = window.translateMode(sensorData.ModeSensor);
            }
        }
        
        // NUEVO: Actualizar footer con información de freshness
        updatePanelFooter(sensorData);
    }
    
    /**
     * Actualizar el footer del panel con información de freshness
     */
    function updatePanelFooter(sensorData) {
        console.log('📅 updatePanelFooter called with:', sensorData);
        console.log('📅 displayConfig:', sensorData.displayConfig);
        console.log('📅 hoursSinceUpdate:', sensorData.hoursSinceUpdate);
        
        const lastUpdateElement = document.querySelector('.smability-last-update');
        console.log('📅 Footer element found:', !!lastUpdateElement);
        
        if (lastUpdateElement && sensorData.displayConfig) {
            const { displayConfig, hoursSinceUpdate } = sensorData;
            
            let footerText = '';
            let footerStyle = '';
            
            if (displayConfig.showIAS) {
                // Para datos LIVE/RECENT (≤ 8 horas)
                if (hoursSinceUpdate <= 1) {
                    footerText = `Last update: ${Math.round(hoursSinceUpdate * 60)} min ago [Live data]`;
                    footerStyle = 'color: #00aa00; font-weight: bold;';
                } else {
                    footerText = `Last update: ${Math.round(hoursSinceUpdate)}h ago [Recent data - IAS valid]`;
                    footerStyle = 'color: #ff8800; font-weight: bold;';
                }
            } else {
                // Para datos STALE/OFFLINE (> 8 horas)
                if (displayConfig.status === 'stale') {
                    const hours = Math.round(hoursSinceUpdate);
                    footerText = `Last update: ${hours}h ago [Stale data - IAS not reliable]`;
                    footerStyle = 'color: #888888; font-weight: bold;';
                } else {
                    // Offline
                    const days = Math.floor(hoursSinceUpdate / 24);
                    const remainingHours = Math.round(hoursSinceUpdate % 24);
                    
                    if (days > 0) {
                        footerText = `Last update: ${days}d ${remainingHours}h ago [Device offline]`;
                    } else {
                        footerText = `Last update: ${remainingHours}h ago [Device offline]`;
                    }
                    footerStyle = 'color: #cc0000; font-weight: bold;';
                }
            }
            
            lastUpdateElement.innerHTML = footerText;
            lastUpdateElement.setAttribute('style', footerStyle);
            
            console.log(`📅 Footer updated: ${footerText}`);
        } else {
            console.log('❌ Footer not updated - missing element or displayConfig');
        }
    }

    /**
     * AJUSTADO: Cambiar estado - Solo panel principal expandible
     */
    function setState(state) {
        currentState = state;
        
        const container = document.getElementById('smabilityPanelContainer');
        const mainPanel = document.getElementById('smabilityMainPanel');
        
        if (!container || !mainPanel) return;
        
        if (state === 1) {
            // Solo mapa - ocultar todo
            container.style.display = 'none';
            mainPanel.style.display = 'none';
            
            // Asegurar que el gráfico inline esté oculto
            const chartContainer = document.getElementById('smabilityInlineChartContainer');
            if (chartContainer) chartContainer.style.display = 'none';
        } else if (state === 2) {
            // Panel principal visible sin gráfico
            container.style.display = 'block';
            mainPanel.style.display = 'block';
            
            // Asegurar que el gráfico inline esté oculto
            const chartContainer = document.getElementById('smabilityInlineChartContainer');
            if (chartContainer) chartContainer.style.display = 'none';
        } else if (state === 3) {
            // Panel principal visible con gráfico inline
            container.style.display = 'block';
            mainPanel.style.display = 'block';
            
            // Mostrar el gráfico inline
            const chartContainer = document.getElementById('smabilityInlineChartContainer');
            if (chartContainer) chartContainer.style.display = 'block';
        }
    }

    /**
     * Cerrar panel principal
     */
    function closeMainPanel() {
        console.log('SmabilityPanels: Closing main panel');
        setState(1);
        currentDevice = null;
    }

    /**
     * Cerrar ambos paneles (compatibilidad)
     */
    function closeBothPanels() {
        console.log('SmabilityPanels: Closing both panels');
        setState(1);
        currentDevice = null;
    }

    /**
     * NUEVO: Toggle del gráfico - Panel único expandible con funcionalidad real
     */
    function toggleChart() {
        if (currentState === 2) {
            // Expandir panel principal para incluir gráfico
            const mainPanel = document.getElementById('smabilityMainPanel');
            const chartContainer = document.getElementById('smabilityInlineChartContainer');
            
            if (mainPanel && chartContainer) {
                // Mostrar área de gráfico dentro del panel principal
                chartContainer.style.display = 'block';
                
                // Ajustar altura del panel principal para incluir el gráfico
                mainPanel.style.maxHeight = '80vh';
                mainPanel.style.height = 'auto';
                
                // Cargar datos del gráfico
                loadChartData();
                
                setState(3); // Cambiar estado pero sin panel separado
            }
        } else if (currentState === 3) {
            // Contraer panel principal
            const mainPanel = document.getElementById('smabilityMainPanel');
            const chartContainer = document.getElementById('smabilityInlineChartContainer');
            
            if (mainPanel && chartContainer) {
                // Ocultar área de gráfico
                chartContainer.style.display = 'none';
                
                // Restaurar altura original del panel
                mainPanel.style.maxHeight = '55vh';
                
                setState(2);
            }
        }
    }
    /**
     * Toggle detalles expandidos
     */
    function toggleDetails() {
        const expandedContent = document.getElementById('smabilityExpandedContent');
        
        if (!expandedContent) return;
        
        if (expandedContent.style.display === 'none') {
            // Mostrar detalles
            expandedContent.style.display = 'block';
        } else {
            // Ocultar detalles
            expandedContent.style.display = 'none';
        }
    }

    /**
     * NUEVO: Cargar datos reales en el gráfico
     */
    async function loadChartData() {
        const chartDiv = document.getElementById('smabilityInlineChart');
        const placeholder = document.getElementById('smabilityChartPlaceholder');
        
        if (!chartDiv || !currentDevice) return;
        
        // Obtener valores de los controles
        const sensorSelect = document.getElementById('smabilitySensorSelect');
        const timeframeSelect = document.getElementById('smabilityTimeframeSelect');
        const comparisonSelect = document.getElementById('smabilityComparisonSelect');
        
        const sensorId = sensorSelect ? sensorSelect.value : '7';
        const hours = timeframeSelect ? parseInt(timeframeSelect.value) : 12;
        const comparisonStation = comparisonSelect ? comparisonSelect.value : '';
        
        // Mostrar loading
        placeholder.style.display = 'flex';
        placeholder.innerHTML = 'Loading chart data...';
        chartDiv.style.display = 'none';
        
        try {
            // Usar las funciones existentes para obtener datos
            if (window.fetchSensorDataWithProxy && window.API_CONFIG && window.API_CONFIG.tokens[currentDevice]) {
                const token = window.API_CONFIG.tokens[currentDevice];
                const primaryData = await window.fetchSensorDataWithProxy(hours, sensorId, token);
                
                let comparisonData = null;
                if (comparisonStation && window.API_CONFIG.tokens[comparisonStation]) {
                    const comparisonToken = window.API_CONFIG.tokens[comparisonStation];
                    comparisonData = await window.fetchSensorDataWithProxy(hours, sensorId, comparisonToken);
                }
                
                // Crear gráfico con Plotly
                if (primaryData && primaryData.length > 0) {
                    createPlotlyChart(chartDiv, primaryData, comparisonData, hours, sensorId, currentDevice, comparisonStation);
                    
                    // Ocultar placeholder y mostrar gráfico
                    placeholder.style.display = 'none';
                    chartDiv.style.display = 'block';
                    chartDiv.classList.add('active');
                } else {
                    throw new Error('No data available');
                }
            } else {
                throw new Error('API functions not available');
            }
        } catch (error) {
            console.error('SmabilityPanels: Error loading chart data:', error);
            placeholder.innerHTML = `
                Error loading chart data<br>
                <small style="margin-top: 8px; display: block;">Please try again later</small>
            `;
        }
    }

    /**
     * NUEVO: Crear gráfico con Plotly.js
     */
    function createPlotlyChart(container, primaryData, comparisonData, hours, sensorId, primaryStation, comparisonStation) {
        if (!window.SENSOR_CONFIG || !window.SENSOR_CONFIG[sensorId]) {
            console.error('SmabilityPanels: Sensor config not available');
            return;
        }
        
        const sensorConfig = window.SENSOR_CONFIG[sensorId];
        const traces = [];
        
        // Datos de la estación principal
        primaryData.sort((a, b) => a.timestamp - b.timestamp);
        traces.push({
            x: primaryData.map(item => item.timestamp),
            y: primaryData.map(item => item.value),
            type: 'scatter',
            mode: 'lines',
            name: primaryStation,
            line: {
                color: sensorConfig.color,
                width: 2
            },
            hovertemplate: `<b>${primaryStation}</b><br>` +
                           `<b>Time</b>: %{x|%H:%M}<br>` +
                           `<b>${sensorConfig.name}</b>: %{y:.1f} ${sensorConfig.units}<br>` +
                           '<extra></extra>'
        });
        
        // Datos de comparación si están disponibles
        if (comparisonData && comparisonData.length > 0 && comparisonStation) {
            comparisonData.sort((a, b) => a.timestamp - b.timestamp);
            traces.push({
                x: comparisonData.map(item => item.timestamp),
                y: comparisonData.map(item => item.value),
                type: 'scatter',
                mode: 'lines',
                name: comparisonStation,
                line: {
                    color: getComparisonColor(sensorConfig.color),
                    width: 2
                },
                hovertemplate: `<b>${comparisonStation}</b><br>` +
                               `<b>Time</b>: %{x|%H:%M}<br>` +
                               `<b>${sensorConfig.name}</b>: %{y:.1f} ${sensorConfig.units}<br>` +
                               '<extra></extra>'
            });
        }
        
        const layout = {
            margin: { t: 20, r: 20, l: 50, b: 60 },
            yaxis: {
                title: { text: sensorConfig.units, font: { size: 10 } },
                zeroline: false,
                showgrid: true,
                gridcolor: '#E4E4E4',
                tickfont: { size: 8 }
            },
            xaxis: {
                type: 'date',
                tickformat: '%H:%M\n%b %d',
                tickangle: -45,
                showgrid: true,
                gridcolor: '#E4E4E4',
                tickfont: { size: 8 }
            },
            plot_bgcolor: '#FFFFFF',
            paper_bgcolor: '#FFFFFF',
            font: { family: 'DIN Pro, Arial, sans-serif' },
            legend: {
                x: 0,
                y: 1.1,
                orientation: 'h',
                font: { size: 9 }
            }
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'drawline'],
            displaylogo: false
        };
        
        // Crear el gráfico
        if (window.Plotly) {
            window.Plotly.newPlot(container, traces, layout, config);
        } else {
            console.error('SmabilityPanels: Plotly.js not available');
        }
    }

    /**
     * NUEVO: Obtener color de comparación
     */
    function getComparisonColor(primaryColor) {
        const colorMap = {
            '#4264fb': '#fb4264',
            '#ff7043': '#43ff70',
            '#4caf50': '#af504c',
            '#9c27b0': '#27b09c',
            '#ff9800': '#0098ff'
        };
        return colorMap[primaryColor] || '#666666';
    }

    /**
     * NUEVO: Setup de event listeners para controles del gráfico
     */
    function setupChartControls() {
        const sensorSelect = document.getElementById('smabilitySensorSelect');
        const timeframeSelect = document.getElementById('smabilityTimeframeSelect');
        const comparisonSelect = document.getElementById('smabilityComparisonSelect');
        
        if (sensorSelect) {
            sensorSelect.addEventListener('change', () => {
                if (currentState === 3) {
                    loadChartData();
                }
            });
        }
        
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => {
                if (currentState === 3) {
                    loadChartData();
                }
            });
        }
        
        if (comparisonSelect) {
            comparisonSelect.addEventListener('change', () => {
                if (currentState === 3) {
                    loadChartData();
                }
            });
        }
    }

    /**
     * Actualizar datos de todos los markers
     */
    async function updateAllMarkersData() {
        console.log('SmabilityPanels: Updating all markers data...');
        
        for (const [stationName, marker] of smabilityMarkers) {
            try {
                if (window.fetchSensorData && window.API_CONFIG && window.API_CONFIG.tokens[stationName]) {
                    console.log(`SmabilityPanels: Fetching data for ${stationName}`);
                    const sensorData = await window.fetchSensorData(stationName);
                    
                    if (sensorData && sensorData.dataIAS !== 'N/A') {
                        updateMarkerWithRealData(stationName, sensorData);
                    }
                } else {
                    console.log(`SmabilityPanels: No API token for ${stationName}`);
                }
            } catch (error) {
                console.error(`SmabilityPanels: Error updating marker for ${stationName}:`, error);
            }
        }
    }

    /**
     * Toggle de visibilidad de markers Smability
     */
    function toggleMarkersVisibility(visible = true) {
        console.log(`SmabilityPanels: Toggle markers visibility: ${visible}`);
        
        smabilityMarkers.forEach((marker, stationName) => {
            const element = marker.getElement();
            element.style.display = visible ? 'flex' : 'none';
            console.log(`SmabilityPanels: Marker ${stationName} visibility: ${visible ? 'visible' : 'hidden'}`);
        });
    }

    /**
     * Setup de refresh automático
     */
    function setupAutoRefresh() {
        setInterval(() => {
            console.log('SmabilityPanels: Auto-refreshing marker data');
            updateAllMarkersData();
            
            if (currentDevice && currentState > 1) {
                updateWithRealData(currentDevice);
            }
        }, 5 * 60 * 1000);
    }

    // API pública del módulo
    return {
        // Métodos de inicialización
        init: init,
        
        // Métodos de control de paneles
        showPanel: showPanel,
        closeMainPanel: closeMainPanel,
        closeBothPanels: closeBothPanels,
        toggleChart: toggleChart,
        toggleDetails: toggleDetails,  // ← NUEVA LÍNEA
        
        // Métodos de datos
        updateAllMarkersData: updateAllMarkersData,
        updateWithRealData: updateWithRealData,
        
        // Métodos de funcionalidad de gráfico
        loadChartData: loadChartData,
        createPlotlyChart: createPlotlyChart,
        setupChartControls: setupChartControls,
        
        // Métodos de configuración
        toggleMarkersVisibility: toggleMarkersVisibility,
        setupAutoRefresh: setupAutoRefresh,
        
        // Getters para debugging
        getCurrentDevice: () => currentDevice,
        getCurrentState: () => currentState,
        getMarkers: () => smabilityMarkers
    };
})();

/**
 * Auto-inicialización
 */
function initializeSmabilityPanels() {
    console.log('SmabilityPanels: Starting initialization...');
    
    window.SmabilityPanels.init();
    window.SmabilityPanels.setupAutoRefresh();
}

// Inicialización con diferentes métodos para asegurar que funcione
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSmabilityPanels);
} else {
    // DOM ya está listo
    setTimeout(initializeSmabilityPanels, 1000);
}

// También intentar cuando la ventana esté completamente cargada
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.SmabilityPanels && window.SmabilityPanels.getMarkers().size === 0) {
            console.log('SmabilityPanels: No markers found, re-initializing...');
            initializeSmabilityPanels();
        }
    }, 2000);
});

console.log('SmabilityPanels module loaded successfully - COMPLETE VERSION');
