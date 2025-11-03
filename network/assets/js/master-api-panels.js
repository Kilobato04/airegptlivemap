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
     * Mostrar panel con datos de Master API - CON RESET DE GRÁFICA
     */
    function showPanel(stationName) {
        console.log(`MasterAPIPanels: Showing panel for ${stationName}`);

        // Cerrar cualquier popup de Mapbox existente
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach(popup => {
            popup.remove();
            console.log('🗑️ Removed existing Mapbox popup');
        });
        
        currentStation = stationName;
        
        // Mostrar container
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            container.style.display = 'block';
            console.log('✅ Container display set to block');
            setupClickOutsideListener(container);
        }
    
        // NUEVO: Reset completo del área de gráfica al cambiar estación
        resetChartArea();
    
        // Forzar estilos del panel
        const panel = document.getElementById('masterAPIMainPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.style.transform = 'translateX(0px)';
            panel.style.opacity = '1';
            panel.style.visibility = 'visible';
            console.log('✅ Panel forced visible');
        }
    
        // ... resto del código existente ...
        
        updatePanelColors('#ffff00', 0);
        setupChartControls();
        setState(2);
        updateWithRealData(stationName);
    }
    
    /**
     * ACTUALIZADO: Reset con panel compacto por defecto
     */
    function resetChartArea() {
        console.log('🔄 Resetting chart area for new station - compact mode');
        
        // 1. Contraer panel principal a versión compacta
        const mainPanel = document.getElementById('masterAPIMainPanel');
        if (mainPanel) {
            mainPanel.style.maxHeight = '55vh'; // Altura compacta
        }
        
        // 2. Ocultar contenedor de gráfica
        const chartContainer = document.getElementById('masterAPIInlineChartContainer');
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
        
        // 3. Ocultar datos expandidos (versión compacta)
        const expandedContent = document.getElementById('masterAPIExpandedContent');
        if (expandedContent) {
            expandedContent.style.display = 'none';
        }
        
        // 4. Limpiar gráfico Plotly
        const chartDiv = document.getElementById('masterAPIInlineChart');
        if (chartDiv && window.Plotly) {
            try {
                Plotly.purge(chartDiv);
                chartDiv.style.display = 'none';
                chartDiv.classList.remove('active');
            } catch (error) {
                console.warn('Warning purging chart:', error);
            }
        }
        
        // 5. Resetear placeholder
        const placeholder = document.getElementById('masterAPIChartPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.innerHTML = `
                📊 Master API Historical Data<br>
                <small style="margin-top: 8px; display: block;">24-hour readings visualization</small>
            `;
        }
        
        // 6. Resetear estado a compacto
        currentState = 2; // Panel visible, versión compacta
        
        console.log('✅ Chart area reset - compact mode ready');
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
         * Cerrar panel con limpieza completa
         */
        function closePanel() {
            const container = document.getElementById('masterAPIPanelContainer');
            if (container) {
                container.style.display = 'none';
            }
            
            // Limpiar gráfico al cerrar
            resetChartArea();
            
            setState(1);
            currentStation = null;
            
            console.log('✅ Master API panel closed and chart reset');
        }

    /**
     * VERIFICAR: Que esta función maneje todos los campos
     */
    function updatePanelContent(stationName, data) {
        const title = document.getElementById('masterAPIPanelTitle');
        const subtitle = document.getElementById('masterAPIPanelSubtitle');
        
        if (title) title.textContent = stationName;
        if (subtitle) subtitle.textContent = data.subtitle || 'Air Quality Monitor'; // ← ASEGURAR subtítulo
    
        const emoji = document.getElementById('masterAPIIasEmoji');
        const value = document.getElementById('masterAPIIasValue');
        const status1 = document.getElementById('masterAPIStatusText1');
        const status2 = document.getElementById('masterAPIStatusText2');
        
        if (emoji) emoji.textContent = data.emoji;
        if (value) value.textContent = data.ias;        // ← DEBE recibir 'ias'
        if (status1) status1.textContent = data.category;
        if (status2) status2.textContent = data.risk;   // ← DEBE recibir 'risk'
    
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
     * CORREGIDO: Con subtítulo dinámico tipo + ubicación
     */
    function updatePanelWithAPIData(stationData) {
        const panelData = mapMasterAPIData(stationData);
        
        // NUEVO: Crear subtítulo dinámico
        const deviceType = getDeviceTypeLabel(stationData.device_type);
        const location = stationData.city || 'Mexico City';
        const subtitle = `${deviceType} - ${location}`;
        
        updatePanelContent(currentStation, {
            subtitle: subtitle,                        // ← DINÁMICO: "Reference - Mexico City"
            emoji: panelData.emoji,
            ias: panelData.iasValue,                   
            color: panelData.color,
            colorName: panelData.colorName,
            category: panelData.category,
            risk: panelData.risk,                      
            dominantPollutant: panelData.dominantPollutant,
            lastUpdate: panelData.lastUpdate
        });
        
        updatePanelColors(panelData.color, panelData.iasValue);
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

    /**
     * MEJORADO: Etiquetas más claras para tipos de dispositivo
     */
    function getDeviceTypeLabel(deviceType) {
        const typeMap = {
            'smability-SMAA': 'Smability',
            'smability-SMAAso2': 'Smability SO2',
            'smability-SMAAmicro': 'Smability Micro',
            'reference': 'Reference',           // ← Simple y claro
            'smaa': 'Smability',               // ← Por si acaso
            'smaamicro': 'Smability Micro',
            'smaaso2': 'Smability SO2'
        };
        return typeMap[deviceType] || 'Monitor';
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
     * ACTUALIZADO: Toggle del gráfico con verificación de estación
     */
    function toggleChart() {
        console.log(`🎯 Toggle chart for station: ${currentStation}`);
        
        if (!currentStation) {
            console.error('❌ No current station set');
            return;
        }
        
        if (currentState === 2) {
            // Expandir panel principal para incluir gráfico
            const mainPanel = document.getElementById('masterAPIMainPanel');
            const chartContainer = document.getElementById('masterAPIInlineChartContainer');
            
            if (mainPanel && chartContainer) {
                console.log('📊 Expanding panel for chart...');
                
                // Mostrar área de gráfico
                chartContainer.style.display = 'block';
                
                // Ajustar altura del panel
                mainPanel.style.maxHeight = '80vh';
                mainPanel.style.height = 'auto';
                
                // Cargar datos del gráfico PARA LA ESTACIÓN ACTUAL
                console.log(`🔄 Loading chart data for: ${currentStation}`);
                loadChartData();
                
                setState(3);
            }
        } else if (currentState === 3) {
            // Contraer panel principal
            const mainPanel = document.getElementById('masterAPIMainPanel');
            const chartContainer = document.getElementById('masterAPIInlineChartContainer');
            
            if (mainPanel && chartContainer) {
                console.log('📉 Collapsing chart...');
                
                // Ocultar área de gráfico
                chartContainer.style.display = 'none';
                
                // Restaurar altura original
                mainPanel.style.maxHeight = '55vh';
                
                setState(2);
            }
        }
    }

    /**
     * ACTUALIZADO: Cargar 36 horas con endpoint optimizado
     */
    async function loadChartData() {
        const chartDiv = document.getElementById('masterAPIInlineChart');
        const placeholder = document.getElementById('masterAPIChartPlaceholder');
        const variableSelect = document.getElementById('masterAPIVariableSelect');
        
        if (!chartDiv || !currentStation) return;
        
        const hours = 36; // ← CAMBIO: De 24 a 36 horas
        const variable = variableSelect ? variableSelect.value : 'ias';
        
        console.log(`📊 Loading ${hours}h ${variable} data for ${currentStation}`);
        
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">⏳</div>
                <div>Loading ${hours}h ${variable} readings...</div>
                <small style="margin-top: 4px; display: block; color: #666;">Optimized endpoint</small>
            </div>
        `;
        chartDiv.style.display = 'none';
        
        try {
            const startTime = performance.now();
            
            // ¡USAR ENDPOINT OPTIMIZADO!
            const historicalData = await fetchMasterAPIHistoricalDataOptimized(currentStation, hours, variable);
            
            const endTime = performance.now();
            console.log(`⚡ ${variable} data loaded in ${Math.round(endTime - startTime)}ms`);
            
            if (historicalData && historicalData.length > 0) {
                createMasterAPIChart(chartDiv, historicalData, hours, currentStation, variable);
                
                placeholder.style.display = 'none';
                chartDiv.style.display = 'block';
                chartDiv.classList.add('active');
                
                console.log(`✅ ${variable} chart created with ${historicalData.length} readings`);
            } else {
                throw new Error('No historical data available');
            }
        } catch (error) {
            console.error(`MasterAPIPanels: Error loading ${variable} data:`, error);
            placeholder.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <div style="font-size: 20px; margin-bottom: 8px;">❌</div>
                    <div>No ${variable} data available</div>
                    <small style="margin-top: 4px; display: block;">36-hour readings not found</small>
                </div>
            `;
            placeholder.style.display = 'flex';
            chartDiv.style.display = 'none';
        }
    }

    /**
     * NUEVO: Fetch optimizado con endpoint dedicado (súper rápido)
     */
    async function fetchMasterAPIHistoricalDataOptimized(stationName, requestedHours = 36, variable = 'ias') {
        try {
            const stationId = Object.keys(window.ALL_STATIONS_MAPPING || {}).find(
                id => window.ALL_STATIONS_MAPPING[id] === stationName
            );
            
            if (!stationId) {
                throw new Error(`No station_id found for ${stationName}`);
            }
            
            // Mapear variables al formato API
            const apiVariable = mapVariableToAPI(variable);
            
            console.log(`🚀 OPTIMIZED fetch: ${requestedHours}h ${apiVariable} data for ${stationId} (${stationName})`);
            
            const startTime = performance.now();
            
            // ¡UNA SOLA REQUEST!
            const response = await fetch(
                `https://y4zwdmw7vf.execute-api.us-east-1.amazonaws.com/prod/api/air-quality/satation/${stationId}/historical/${requestedHours}h?variable=${apiVariable}`
            );
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            const endTime = performance.now();
            
            console.log(`⚡ SUPER FAST fetch completed in ${Math.round(endTime - startTime)}ms`);
            
            if (!data.readings || !Array.isArray(data.readings)) {
                throw new Error('Invalid response format');
            }
            
            // Procesar datos del endpoint optimizado
            const historicalData = data.readings
                .filter(reading => reading.value !== null && reading.value !== undefined)
                .map(reading => {
                    const timestamp = new Date(reading.timestamp || reading.hour);
                    
                    return {
                        timestamp: timestamp,
                        value: reading.value,
                        unit: getVariableUnit(variable),
                        color: getVariableColor(variable, reading.value),
                        variable: variable,
                        status: reading.status || 'current',
                        hour: timestamp.getHours(),
                        sortKey: timestamp.getTime()
                    };
                })
                .sort((a, b) => a.sortKey - b.sortKey); // Ordenar cronológicamente
            
            console.log(`✅ Optimized fetch: ${historicalData.length}/${requestedHours} readings in ${Math.round(endTime - startTime)}ms`);
            console.log(`📊 Data range: ${historicalData[0]?.timestamp} to ${historicalData[historicalData.length - 1]?.timestamp}`);
            
            return historicalData;
            
        } catch (error) {
            console.error(`Error fetching optimized ${variable} data for ${stationName}:`, error);
            throw error;
        }
    }
    
    /**
     * NUEVO: Mapear variables del frontend al formato API
     */
    function mapVariableToAPI(variable) {
        const variableMap = {
            'ias': 'ias',
            'ozone': 'o3',
            'pm25': 'pm25',
            'temperature': 'temperature',
            'humidity': 'relative_humidity'
        };
        return variableMap[variable] || 'ias';
    }
    
    /**
     * NUEVO: Obtener unidad por variable
     */
    function getVariableUnit(variable) {
        const units = {
            'ias': 'IAS',
            'ozone': 'ppb', 
            'pm25': 'μg/m³',
            'temperature': '°C',
            'humidity': '%'
        };
        return units[variable] || 'IAS';
    }
    
    /**
     * NUEVO: Obtener color por variable y valor
     */
    function getVariableColor(variable, value) {
        if (variable === 'ias') {
            return getIASColor(value);
        }
        
        const colors = {
            'ozone': '#9c27b0',
            'pm25': '#ff9800', 
            'temperature': '#4264fb',
            'humidity': '#4caf50'
        };
        return colors[variable] || '#4264fb';
    }
    
    /**
     * EXISTENTE: Función para color IAS
     */
    function getIASColor(value) {
        if (value <= 50) return '#00ff00';
        if (value <= 100) return '#ffff00';
        if (value <= 150) return '#ff8000';
        if (value <= 200) return '#ff0000';
        return '#800080';
    }


    /**
     * NUEVO: Gráfico adaptable según variable seleccionada
     */
    function createMasterAPIChart(container, historicalData, requestedHours, stationName, variable = 'ias') {
        if (!window.Plotly) {
            console.error('MasterAPIPanels: Plotly.js not available');
            return;
        }
        
        console.log(`📊 Creating ${variable} chart with ${historicalData.length} data points`);
        
        const isIAS = variable === 'ias';
        
        const trace = {
            x: historicalData.map(item => {
                const date = new Date(item.timestamp);
                return `${String(date.getHours()).padStart(2, '0')}:00`;
            }),
            y: historicalData.map(item => item.value),
            type: isIAS ? 'bar' : 'scatter',
            mode: isIAS ? undefined : 'lines+markers',
            name: `${stationName} ${variable.toUpperCase()}`,
            marker: isIAS ? {
                color: historicalData.map(item => item.color),
                line: { color: '#ffffff', width: 1 },
                opacity: 0.8
            } : {
                color: historicalData[0]?.color || '#4264fb',
                size: 6,
                line: { color: '#ffffff', width: 1 }
            },
            line: isIAS ? undefined : {
                color: historicalData[0]?.color || '#4264fb',
                width: 3
            },
            hovertemplate: `<b>${stationName}</b><br>` +
                           `<b>Time</b>: %{customdata.fullTime}<br>` +
                           `<b>${variable.toUpperCase()}</b>: %{y} ${historicalData[0]?.unit || ''}<br>` +
                           '<extra></extra>',
            customdata: historicalData.map(item => ({
                fullTime: new Date(item.timestamp).toLocaleString('en-US', {
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }))
        };
        
        const layout = {
            margin: { t: 15, r: 15, l: 45, b: 25 },
            yaxis: {
                title: { 
                    text: `${variable.toUpperCase()} ${historicalData[0]?.unit || ''}`, 
                    font: { size: 10 }
                },
                zeroline: false,
                showgrid: true,
                gridcolor: '#E4E4E4',
                tickfont: { size: 8 },
                autorange: true
            },
            xaxis: {
                showgrid: false,
                tickfont: { size: 7 },
                tickangle: 0,
                autorange: true,
                fixedrange: false,
                type: 'category'
            },
            plot_bgcolor: '#FFFFFF',
            paper_bgcolor: '#FFFFFF',
            font: { family: 'DIN Pro, Arial, sans-serif' },
            title: {
                text: `${stationName} - 24h ${variable.toUpperCase()} History`,
                font: { size: 10, family: 'DIN Pro, Arial, sans-serif' },
                y: 0.97,
                x: 0.05,
                xanchor: 'left'
            },
            showlegend: false,
            bargap: isIAS ? 0 : undefined,
            bargroupgap: 0,
            hovermode: 'closest',
            autosize: true
        };
        
        const config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'drawline'],
            displaylogo: false,
            scrollZoom: false,
            doubleClick: 'reset'
        };
        
        Plotly.purge(container);
        
        window.Plotly.newPlot(container, [trace], layout, config)
            .then(() => {
                console.log(`✅ ${variable} chart created successfully`);
                setTimeout(() => {
                    if (window.Plotly) {
                        Plotly.Plots.resize(container);
                    }
                }, 100);
            })
            .catch(error => {
                console.error(`Error creating ${variable} chart:`, error);
            });
    }
    

    /**
     * ACTUALIZADO: Setup con dropdown de variables
     */
    function setupChartControls() {
        const variableSelect = document.getElementById('masterAPIVariableSelect');
        
        if (variableSelect) {
            const changeHandler = function() {
                const variable = variableSelect.value;
                console.log(`🔄 Variable changed to: ${variable}`);
                
                if (currentState === 3) {
                    console.log('Reloading chart with new variable...');
                    
                    const chartDiv = document.getElementById('masterAPIInlineChart');
                    const placeholder = document.getElementById('masterAPIChartPlaceholder');
                    
                    if (chartDiv && placeholder) {
                        chartDiv.style.display = 'none';
                        chartDiv.classList.remove('active');
                        placeholder.style.display = 'flex';
                        placeholder.innerHTML = `
                            <div style="text-align: center;">
                                <div style="font-size: 20px; margin-bottom: 8px;">🔄</div>
                                <div>Loading ${variable} data...</div>
                                <small style="margin-top: 4px; display: block; color: #666;">Fetching 24-hour readings</small>
                            </div>
                        `;
                        
                        if (window.Plotly) {
                            try {
                                Plotly.purge(chartDiv);
                            } catch (error) {
                                console.warn('Error purging chart:', error);
                            }
                        }
                    }
                    
                    setTimeout(() => {
                        loadChartData();
                    }, 200);
                }
            };
            
            if (variableSelect._changeHandler) {
                variableSelect.removeEventListener('change', variableSelect._changeHandler);
            }
            
            variableSelect._changeHandler = changeHandler;
            variableSelect.addEventListener('change', changeHandler);
            variableSelect.setAttribute('data-listener-added', 'true');
            
            console.log('✅ Variable selector set up');
        } else {
            console.error('❌ Variable select not found');
        }
    }

    // Event listener para resize del gráfico
    window.addEventListener('resize', () => {
        const chartDiv = document.getElementById('masterAPIInlineChart');
        if (chartDiv && chartDiv.style.display !== 'none') {
            try {
                Plotly.Plots.resize(chartDiv);
                console.log('📏 Chart resized');
            } catch (error) {
                console.warn('Chart resize error:', error);
            }
        }
    });
    
    // Actualizar el return del módulo:
    return {
        showPanel: showPanel,
        closePanel: closePanel,
        toggleDetails: toggleDetails,    // ← AGREGAR
        toggleChart: toggleChart,        // ← AGREGAR
        resetChartArea: resetChartArea,
        getCurrentStation: () => currentStation,
        getCurrentState: () => currentState
    };
})();

console.log('MasterAPIPanels: Module loaded successfully - HOMOLOGATED LOGIC');
