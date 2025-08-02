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

    // Solo CENTRUS 5 para pruebas
    const stationData = {
        'CENTRUS 5': {
            ias: 87,
            color: '#ff8000',
            emoji: '😐',
            pollutant: 'O3',
            status1: 'Acceptable',
            status2: 'Moderate Risk',
            coordinates: [-99.170692, 19.409618]
        }
    };

    /**
     * Inicializar el módulo
     */
    function init() {
        console.log('SmabilityPanels: Initializing... Attempt:', initializationAttempts + 1);
        
        initializationAttempts++;
        
        if (!window.map) {
            console.log('SmabilityPanels: Map not available yet, retrying...');
            if (initializationAttempts < maxInitAttempts) {
                setTimeout(init, 1000);
            }
            return;
        }

        if (!window.map.loaded()) {
            console.log('SmabilityPanels: Map not loaded yet, waiting...');
            window.map.on('load', () => {
                console.log('SmabilityPanels: Map loaded, setting up markers...');
                setupSmabilityMarkers();
            });
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
        console.log('SmabilityPanels: Setting up markers for stations:', Object.keys(stationData));
        
        // Limpiar markers existentes si los hay
        smabilityMarkers.forEach(marker => marker.remove());
        smabilityMarkers.clear();
        
        // Buscar instancia del mapa de forma más robusta
        let mapInstance = window.map || window.mapboxMap || window.myMap;
        
        // Si no encontramos el mapa por variable, buscarlo en el DOM
        if (!mapInstance) {
            const mapContainer = document.getElementById('map');
            if (mapContainer && mapContainer._map) {
                mapInstance = mapContainer._map;
            }
        }
        
        if (!mapInstance) {
            console.log('SmabilityPanels: ❌ Map instance not found, retrying...');
            setTimeout(setupSmabilityMarkers, 2000);
            return;
        }
        
        if (typeof mapboxgl === 'undefined') {
            console.log('SmabilityPanels: ❌ mapboxgl not available');
            return;
        }
        
        console.log('SmabilityPanels: ✅ Map instance found:', mapInstance);
        
        Object.keys(stationData).forEach(stationName => {
            const station = stationData[stationName];
            
            // Crear elemento del marker
            const markerElement = document.createElement('div');
            markerElement.className = 'smability-marker';
            markerElement.style.cssText = `
                cursor: pointer;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                color: #000;
                background-color: ${station.color};
                font-family: 'DIN Pro', Arial, sans-serif;
                transition: transform 0.2s ease;
                z-index: 1000;
            `;
            markerElement.textContent = station.ias;
            markerElement.title = stationName;
            
            // Hover effect
            markerElement.addEventListener('mouseenter', () => {
                markerElement.style.transform = 'scale(1.1)';
                markerElement.style.boxShadow = '0 6px 16px rgba(0,0,0,0.5)';
            });
            
            markerElement.addEventListener('mouseleave', () => {
                markerElement.style.transform = 'scale(1)';
                markerElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });
            
            // Click handler
            markerElement.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`SmabilityPanels: Marker clicked for ${stationName}`);
                showPanel(stationName);
            });
            
            // Crear marker de Mapbox
            try {
                const marker = new mapboxgl.Marker({ 
                    element: markerElement,
                    offset: [0, -17]
                })
                .setLngLat(station.coordinates)
                .addTo(mapInstance);
                
                smabilityMarkers.set(stationName, marker);
                console.log(`SmabilityPanels: ✅ Created marker for ${stationName}`);
                
            } catch (error) {
                console.error(`SmabilityPanels: ❌ Error creating marker for ${stationName}:`, error);
            }
        });
        
        console.log(`SmabilityPanels: Total markers created: ${smabilityMarkers.size}`);
        
        // Actualizar con datos reales
        setTimeout(() => {
            updateAllMarkersData();
        }, 2000);
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
        if (!smabilityMarkers.has(deviceName)) return;
        
        const marker = smabilityMarkers.get(deviceName);
        const element = marker.getElement();
        
        if (sensorData.dataIAS && sensorData.dataIAS !== 'N/A') {
            const { color } = window.getIndicatorColor ? 
                window.getIndicatorColor(sensorData.dataIAS) : 
                { color: '#ffff00' };
            
            element.style.backgroundColor = color;
            element.textContent = Math.round(sensorData.dataIAS);
            
            if (stationData[deviceName]) {
                stationData[deviceName].ias = sensorData.dataIAS;
                stationData[deviceName].color = color;
            }
            
            console.log(`SmabilityPanels: Updated marker ${deviceName} with IAS: ${sensorData.dataIAS}, Color: ${color}`);
        }
    }

        /**
     * Actualizar barra IAS y colores del panel
     */
    function updateIASBarAndColors(iasValue, color) {
        // Actualizar colores del panel
        const mainPanel = document.getElementById('smabilityMainPanel');
        if (mainPanel) {
            mainPanel.style.setProperty('border-color', color);
            mainPanel.style.setProperty('--smability-ias-color', color);
            mainPanel.style.setProperty('--smability-header-bg', `${color}20`);
            mainPanel.style.setProperty('--smability-ias-bg', `${color}20`);
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
        const data = stationData[deviceName];
        
        if (!data) {
            console.error(`SmabilityPanels: No data found for ${deviceName}`);
            return;
        }

        const container = document.getElementById('smabilityPanelContainer');
        if (container) {
            container.style.display = 'block';
        }

        updatePanelContent(deviceName, data);
        updatePanelColors(data.color);
        
        // Setup chart controls cuando se muestra el panel
        setupChartControls();
        
        setState(2);
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
     * Actualizar panel con datos reales de la API - CORREGIDO: Sin unidades duplicadas
     */
    function updatePanelWithAPIData(sensorData) {
        // IAS real
        if (sensorData.dataIAS && sensorData.dataIAS !== 'N/A') {
            const iasValue = document.getElementById('smabilityIasValue');
            if (iasValue) iasValue.textContent = Math.round(sensorData.dataIAS);
            
            const { color, status, risk } = window.getIndicatorColor ? 
                window.getIndicatorColor(sensorData.dataIAS) : 
                { color: '#ffff00', status: 'Unknown', risk: 'Unknown' };
            
            updatePanelColors(color);
            
            // Status y Risk por separado
            const status1 = document.getElementById('smabilityStatusText1');
            const status2 = document.getElementById('smabilityStatusText2');
            if (status1) status1.textContent = status;
            if (status2) status2.textContent = risk.replace(' Risk', ''); // Quitar "Risk" duplicado
            
            const emoji = document.getElementById('smabilityIasEmoji');
            if (emoji && window.getIASEmoji) {
                emoji.textContent = window.getIASEmoji(sensorData.dataIAS);
            }
        }

        // Datos de sensores reales
        if (sensorData.SensorIAS) {
            const pollutant = document.getElementById('smabilityDominantPollutant');
            if (pollutant) pollutant.textContent = sensorData.SensorIAS;
        }

        // Función para evitar unidades duplicadas
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
        const seeMoreBtn = document.getElementById('smabilitySeeMoreBtn');
        
        if (!expandedContent || !seeMoreBtn) return;
        
        if (expandedContent.style.display === 'none') {
            // Mostrar detalles
            expandedContent.style.display = 'block';
            seeMoreBtn.textContent = '🔬 See Less';
            seeMoreBtn.style.background = '#e2e2e2';
            seeMoreBtn.style.color = '#333';
        } else {
            // Ocultar detalles
            expandedContent.style.display = 'none';
            seeMoreBtn.textContent = '🧪 See More';
            seeMoreBtn.style.background = '#4264fb';
            seeMoreBtn.style.color = 'white';
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
        getStationData: () => stationData,
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
    
    setTimeout(() => {
        addSmabilityToggleToLegend();
    }, 3000);
}

/**
 * Integración con la leyenda existente
 */
function addSmabilityToggleToLegend() {
    console.log('SmabilityPanels: Adding toggle to legend...');
    
    const legend = document.querySelector('.legend-content');
    if (legend) {
        if (document.getElementById('toggleSmabilityPanelMarkers')) {
            console.log('SmabilityPanels: Toggle button already exists');
            return;
        }
        
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggleSmabilityPanelMarkers';
        toggleButton.textContent = 'Smability Panels';
        toggleButton.style.cssText = `
            width: 100%; 
            padding: 5px; 
            margin: 8px 0;
            border: 1px solid #ccc; 
            border-radius: 4px; 
            background: #4264fb; 
            color: white; 
            cursor: pointer; 
            font-size: 11px;
            font-family: 'DIN Pro', Arial, sans-serif;
        `;
        
        let visible = true;
        toggleButton.addEventListener('click', () => {
            visible = !visible;
            window.SmabilityPanels.toggleMarkersVisibility(visible);
            
            toggleButton.style.backgroundColor = visible ? '#4264fb' : '#e2e2e2';
            toggleButton.style.color = visible ? '#ffffff' : '#333';
            
            console.log(`SmabilityPanels: Toggled visibility to: ${visible}`);
        });
        
        legend.appendChild(toggleButton);
        console.log('SmabilityPanels: ✅ Added toggle button to legend');
    } else {
        console.log('SmabilityPanels: Legend not found, retrying...');
        setTimeout(addSmabilityToggleToLegend, 2000);
    }
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
