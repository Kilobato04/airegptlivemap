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

            // AGREGAR: Event listener para click fuera del panel
            setupClickOutsideListener(container);
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
        updatePanelColors('#ffff00', 0);
        
        setState(2);
        
        // Cargar datos reales inmediatamente
        updateWithRealData(stationName);
    }

        /**
         * NUEVA: Configurar click fuera para cerrar panel
         */
        function setupClickOutsideListener(container) {
            // Remover listener previo si existe
            if (container._clickOutsideHandler) {
                container.removeEventListener('click', container._clickOutsideHandler);
            }
            
            // Función para manejar click fuera
            const clickOutsideHandler = function(event) {
                const panel = document.getElementById('masterAPIMainPanel');
                
                // Si el click fue fuera del panel (pero dentro del container)
                if (panel && !panel.contains(event.target)) {
                    console.log('🖱️ Click outside panel detected, closing...');
                    closePanel();
                }
            };
            
            // Guardar referencia y agregar listener
            container._clickOutsideHandler = clickOutsideHandler;
            container.addEventListener('click', clickOutsideHandler);
        }
        
        /**
         * Cerrar panel - LIMPIAR EVENT LISTENERS
         */
        function closePanel() {
            const container = document.getElementById('masterAPIPanelContainer');
            if (container) {
                // Remover event listener de click fuera
                if (container._clickOutsideHandler) {
                    container.removeEventListener('click', container._clickOutsideHandler);
                    container._clickOutsideHandler = null;
                }
                
                container.style.display = 'none';
            }
            setState(1);
            currentStation = null;
            
            console.log('✅ Master API panel closed');
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
        updatePanelColors(panelData.color, panelData.iasValue);
        
        // Actualizar datos detallados
        updateDetailedData(panelData, stationData);
        updatePanelFooter(stationData);
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
         * Actualizar footer con información de tiempo - IDÉNTICO A SMABILITY
         */
        function updatePanelFooter(stationData) {
            const lastUpdateElement = document.getElementById('masterAPILastUpdate');
            
            if (lastUpdateElement && stationData.reading_time_UTC6) {
                const date = new Date(stationData.reading_time_UTC6 + ' UTC-6');
                const now = new Date();
                const diffMs = now - date;
                const diffMinutes = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMinutes / 60);
                
                let footerText = '';
                let footerStyle = '';
                
                if (diffMinutes < 60) {
                    footerText = `Updated ${diffMinutes}m ago • Live`;
                    footerStyle = 'color: #00aa00; font-weight: bold;';
                } else if (diffHours <= 8) {
                    footerText = `Updated ${diffHours}h ago • Fresh`;
                    footerStyle = 'color: #ff8800; font-weight: bold;';
                } else if (diffHours <= 24) {
                    footerText = `Updated ${diffHours}h ago • Stale`;
                    footerStyle = 'color: #888888; font-weight: bold;';
                } else {
                    const days = Math.floor(diffHours / 24);
                    if (days > 0) {
                        footerText = `Updated ${days}d ago • Offline`;
                    } else {
                        footerText = `Updated ${diffHours}h ago • Offline`;
                    }
                    footerStyle = 'color: #cc0000; font-weight: bold;';
                }
                
                lastUpdateElement.innerHTML = footerText;
                lastUpdateElement.setAttribute('style', footerStyle);
                
                console.log(`📅 Footer updated: ${footerText}`);
            }
        }

    /**
     * Actualizar colores dinámicos - CORREGIDO
     */
    function updatePanelColors(color, iasValue) {  // ← CAMBIO: Agregar parámetro iasValue
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
        
        // CORREGIDO: Usar parámetro en lugar de variable no definida
        if (iasValue !== undefined) {
            updateIASBarPosition(iasValue);
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
        const diffHours = Math.floor(diffMinutes / 60);
        
        let timeText = '';
        let statusText = '';
        
        if (diffMinutes < 60) {
            timeText = `Updated ${diffMinutes}m ago`;
        } else {
            timeText = `Updated ${diffHours}h ago`;
        }
        
        // Determinar estado basado en tiempo (igual que SmabilityPanels)
        if (diffHours <= 1) {
            statusText = 'Live';
        } else if (diffHours <= 8) {
            statusText = 'Fresh';
        } else if (diffHours <= 24) {
            statusText = 'Stale';
        } else {
            statusText = 'Offline';
        }
        
        return `${timeText} • ${statusText}`;
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

    /**
 * NUEVO: Toggle del gráfico para Master API - Panel único expandible
 */
function toggleChart() {
    if (currentState === 2) {
        // Expandir panel principal para incluir gráfico
        const mainPanel = document.getElementById('masterAPIMainPanel');
        const chartContainer = document.getElementById('masterAPIInlineChartContainer');
        
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
        const mainPanel = document.getElementById('masterAPIMainPanel');
        const chartContainer = document.getElementById('masterAPIInlineChartContainer');
        
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
 * NUEVO: Cargar datos de Master API para gráfico
 */
async function loadChartData() {
    const chartDiv = document.getElementById('masterAPIInlineChart');
    const placeholder = document.getElementById('masterAPIChartPlaceholder');
    
    if (!chartDiv || !currentStation) return;
    
    // Obtener período seleccionado
    const timeframeSelect = document.getElementById('masterAPITimeframeSelect');
    const hours = timeframeSelect ? parseInt(timeframeSelect.value) : 12;
    
    // Mostrar loading
    placeholder.style.display = 'flex';
    placeholder.innerHTML = 'Loading IAS historical data...';
    chartDiv.style.display = 'none';
    
    try {
        // Obtener datos históricos de Master API
        const historicalData = await fetchMasterAPIHistoricalData(currentStation, hours);
        
        if (historicalData && historicalData.length > 0) {
            createMasterAPIChart(chartDiv, historicalData, hours, currentStation);
            
            // Ocultar placeholder y mostrar gráfico
            placeholder.style.display = 'none';
            chartDiv.style.display = 'block';
            chartDiv.classList.add('active');
        } else {
            throw new Error('No historical data available');
        }
    } catch (error) {
        console.error('MasterAPIPanels: Error loading chart data:', error);
        placeholder.innerHTML = `
            Error loading historical data<br>
            <small style="margin-top: 8px; display: block;">Please try again later</small>
        `;
    }
}

/**
 * NUEVO: Obtener datos históricos de Master API
 */
async function fetchMasterAPIHistoricalData(stationName, hours) {
    try {
        // Mapear nombre a station_id
        const stationId = Object.keys(window.ALL_STATIONS_MAPPING || {}).find(
            id => window.ALL_STATIONS_MAPPING[id] === stationName
        );
        
        if (!stationId) {
            throw new Error(`No station_id found for ${stationName}`);
        }
        
        const historicalData = [];
        const now = new Date();
        
        // Obtener datos para cada hora en el rango solicitado
        for (let i = 0; i < hours; i++) {
            const date = new Date(now.getTime() - (i * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            const hour = date.getHours();
            
            try {
                const response = await fetch(
                    `https://y4zwdmw7vf.execute-api.us-east-1.amazonaws.com/prod/api/air-quality/date/${dateStr}/hour/${hour}`
                );
                const data = await response.json();
                
                // Buscar la estación específica en la respuesta
                const stations = Array.isArray(data) ? data : data.stations || [];
                const stationData = stations.find(s => s.station_id === stationId);
                
                if (stationData && stationData.ias_numeric_value !== undefined) {
                    historicalData.push({
                        timestamp: date,
                        value: stationData.ias_numeric_value,
                        status: stationData.reading_status,
                        category: stationData.category
                    });
                }
            } catch (error) {
                console.warn(`Error fetching data for ${dateStr} hour ${hour}:`, error);
                // Continuar con la siguiente hora en caso de error
            }
        }
        
        // Ordenar por timestamp (más antiguo primero)
        historicalData.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`Fetched ${historicalData.length} data points for ${stationName}:`, historicalData);
        return historicalData;
        
    } catch (error) {
        console.error('Error fetching Master API historical data:', error);
        return [];
    }
}

    /**
     * NUEVO: Crear gráfico con datos de Master API
     */
    function createMasterAPIChart(container, historicalData, hours, stationName) {
        if (!window.Plotly) {
            console.error('MasterAPIPanels: Plotly.js not available');
            return;
        }
        
        const trace = {
            x: historicalData.map(item => item.timestamp),
            y: historicalData.map(item => item.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: `${stationName} IAS`,
            line: {
                color: '#4264fb',
                width: 3
            },
            marker: {
                color: historicalData.map(item => {
                    // Colorear puntos según el valor IAS
                    if (item.value <= 50) return '#00ff00';
                    if (item.value <= 100) return '#ffff00';
                    if (item.value <= 150) return '#ff8000';
                    if (item.value <= 200) return '#ff0000';
                    return '#800080';
                }),
                size: 8,
                line: {
                    color: '#ffffff',
                    width: 1
                }
            },
            hovertemplate: `<b>${stationName}</b><br>` +
                           `<b>Time</b>: %{x|%H:%M - %b %d}<br>` +
                           `<b>IAS</b>: %{y}<br>` +
                           `<b>Status</b>: %{customdata}<br>` +
                           '<extra></extra>',
            customdata: historicalData.map(item => item.category || 'Unknown')
        };
        
        const layout = {
            margin: { t: 20, r: 20, l: 50, b: 60 },
            yaxis: {
                title: { text: 'IAS Value', font: { size: 10 } },
                zeroline: false,
                showgrid: true,
                gridcolor: '#E4E4E4',
                tickfont: { size: 8 },
                range: [0, Math.max(250, Math.max(...historicalData.map(item => item.value)) + 20)]
            },
            xaxis: {
                type: 'date',
                tickformat: '%H:%M\n%b %d',
                tickangle: -45,
                showgrid: true,
                gridcolor: '#E4E4E4',
                tickfont: { size: 8 },
                autorange: true,
                fixedrange: false
            },
            plot_bgcolor: '#FFFFFF',
            paper_bgcolor: '#FFFFFF',
            font: { family: 'DIN Pro, Arial, sans-serif' },
            title: {
                text: `${stationName} - IAS Historical Data (${hours}h)`,
                font: { size: 12, family: 'DIN Pro, Arial, sans-serif' },
                y: 0.95
            },
            showlegend: false
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'drawline'],
            displaylogo: false
        };
        
        // Crear el gráfico
        window.Plotly.newPlot(container, [trace], layout, config);
    }
    
    /**
     * NUEVO: Setup de event listeners para controles del gráfico
     */
    function setupChartControls() {
        const timeframeSelect = document.getElementById('masterAPITimeframeSelect');
        
        if (timeframeSelect && !timeframeSelect.hasAttribute('data-listener-added')) {
            timeframeSelect.addEventListener('change', () => {
                if (currentState === 3) {
                    loadChartData();
                }
            });
            timeframeSelect.setAttribute('data-listener-added', 'true');
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
