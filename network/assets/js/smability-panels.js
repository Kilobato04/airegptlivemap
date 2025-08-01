/**
 * ==============================================
 * ARCHIVO: smability-panels.js - VERSIÓN FINAL
 * DESCRIPCIÓN: Solo CENTRUS 5 con ajustes finales
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

    // AJUSTADO: Solo CENTRUS 5 para pruebas
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
        
        Object.keys(stationData).forEach(stationName => {
            const station = stationData[stationName];
            
            console.log(`SmabilityPanels: Creating marker for ${stationName} at`, station.coordinates);
            
            // AJUSTADO: Crear elemento del marker con tipografía DIN Pro
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
            
            // Crear marker de Mapbox con offset
            const marker = new mapboxgl.Marker({ 
                element: markerElement,
                offset: [20, -20]
            })
            .setLngLat(station.coordinates)
            .addTo(window.map);
            
            smabilityMarkers.set(stationName, marker);
            
            console.log(`SmabilityPanels: ✅ Created marker for ${stationName}`);
        });
        
        console.log(`SmabilityPanels: Total markers created: ${smabilityMarkers.size}`);
        
        // Actualizar con datos reales
        setTimeout(() => {
            console.log('SmabilityPanels: Starting real data update...');
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
     * Actualizar colores de los paneles según IAS
     */
    function updatePanelColors(color) {
        const mainPanel = document.getElementById('smabilityMainPanel');
        const chartPanel = document.getElementById('smabilityChartPanel');
        
        if (mainPanel) {
            mainPanel.style.setProperty('border-color', color);
            mainPanel.style.setProperty('--smability-ias-color', color);
        }
        
        if (chartPanel) {
            chartPanel.style.setProperty('border-color', color);
            chartPanel.style.setProperty('--smability-ias-color', color);
        }
        
        const indicator = document.getElementById('smabilityIasIndicator');
        if (indicator) {
            indicator.style.backgroundColor = color;
        }
    }

    /**
     * Mostrar panel con datos de la estación
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
        setState(2);
        updateWithRealData(deviceName);
    }

    /**
     * Actualizar contenido del panel con datos de la estación
     */
    function updatePanelContent(deviceName, data) {
        const title = document.getElementById('smabilityPanelTitle');
        // AJUSTADO: Solo el nombre del dispositivo, sin subtítulo
        if (title) title.textContent = deviceName;

        const emoji = document.getElementById('smabilityIasEmoji');
        const value = document.getElementById('smabilityIasValue');
        const status1 = document.getElementById('smabilityStatusText1');
        const status2 = document.getElementById('smabilityStatusText2');
        
        if (emoji) emoji.textContent = data.emoji;
        if (value) value.textContent = data.ias;
        if (status1) status1.textContent = data.status1;
        if (status2) status2.textContent = data.status2;

        const pollutant = document.getElementById('smabilityDominantPollutant');
        if (pollutant) pollutant.textContent = data.pollutant;
    }

    /**
     * Actualizar panel con datos reales de la API
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
            
            const status1 = document.getElementById('smabilityStatusText1');
            const status2 = document.getElementById('smabilityStatusText2');
            if (status1) status1.textContent = status;
            if (status2) status2.textContent = risk;
            
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

        if (sensorData.ConcentrationIASO3_1hr) {
            const o3 = document.getElementById('smabilityO3');
            // AJUSTADO: Evitar unidades duplicadas
            if (o3) o3.textContent = `${sensorData.ConcentrationIASO3_1hr} ppb`;
        }

        if (sensorData.ConcentrationIASCO_8hr) {
            const co = document.getElementById('smabilityCO');
            // AJUSTADO: Evitar unidades duplicadas
            if (co) co.textContent = `${sensorData.ConcentrationIASCO_8hr} ppb`;
        }

        if (sensorData.ConcentrationIASPM2_5_12hr) {
            const pm25 = document.getElementById('smabilityPM25');
            // AJUSTADO: Evitar unidades duplicadas
            if (pm25) pm25.textContent = `${sensorData.ConcentrationIASPM2_5_12hr} μg/m³`;
        }

        if (sensorData.ConcentrationIASPM10_12hr) {
            const pm10 = document.getElementById('smabilityPM10');
            // AJUSTADO: Evitar unidades duplicadas
            if (pm10) pm10.textContent = `${sensorData.ConcentrationIASPM10_12hr} μg/m³`;
        }

        if (sensorData.Temperature || sensorData.Temp_1hr) {
            const temp = document.getElementById('smabilityTemperature');
            const tempValue = sensorData.Temp_1hr || sensorData.Temperature;
            // AJUSTADO: Evitar unidades duplicadas
            if (temp) temp.textContent = `${tempValue} °C`;
        }

        if (sensorData.Humidity || sensorData.HR_1hr) {
            const humidity = document.getElementById('smabilityHumidity');
            const humidityValue = sensorData.HR_1hr || sensorData.Humidity;
            // AJUSTADO: Evitar unidades duplicadas
            if (humidity) humidity.textContent = `${humidityValue} %`;
        }

        if (sensorData.Battery_Now) {
            const battery = document.getElementById('smabilityBattery');
            if (battery) battery.textContent = sensorData.Battery_Now;
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
        const chartPanel = document.getElementById('smabilityChartPanel'); // Ya no se usa
        
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
        
        // El panel separado ya no se usa
        if (chartPanel) chartPanel.style.display = 'none';
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
     * Cerrar ambos paneles
     */
    function closeBothPanels() {
        console.log('SmabilityPanels: Closing both panels');
        setState(1);
        currentDevice = null;
    }

    /**
     * NUEVO: Toggle del gráfico - Panel único expandible
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
        init: init,
        showPanel: showPanel,
        closeMainPanel: closeMainPanel,
        closeBothPanels: closeBothPanels,
        toggleChart: toggleChart,
        updateAllMarkersData: updateAllMarkersData,
        updateWithRealData: updateWithRealData,
        toggleMarkersVisibility: toggleMarkersVisibility,
        setupAutoRefresh: setupAutoRefresh,
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

// Inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSmabilityPanels);
} else {
    setTimeout(initializeSmabilityPanels, 1000);
}

window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.SmabilityPanels && window.SmabilityPanels.getMarkers().size === 0) {
            console.log('SmabilityPanels: No markers found, re-initializing...');
            initializeSmabilityPanels();
        }
    }, 2000);
});

console.log('SmabilityPanels module loaded successfully - FINAL VERSION');
