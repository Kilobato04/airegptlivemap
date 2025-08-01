/**
 * ==============================================
 * ARCHIVO: smability-panels.js - VERSIÓN CORREGIDA
 * DESCRIPCIÓN: Lógica para los nuevos paneles Smability - Solo CENTRUS 3 y 5
 * INTEGRACIÓN: Cargar después de los JS originales
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

    // CORREGIDO: Solo CENTRUS 3 y CENTRUS 5 para pruebas
    const stationData = {
        'CENTRUS 3': {
            ias: 75,
            color: '#ffff00',
            emoji: '😐',
            pollutant: 'PM2.5',
            status1: 'Acceptable',
            status2: 'Moderate Risk',
            coordinates: [-99.171021, 19.425217] // Coordenadas del config original
        },
        'CENTRUS 5': {
            ias: 87,
            color: '#ff8000',
            emoji: '😐',
            pollutant: 'O3',
            status1: 'Acceptable',
            status2: 'Moderate Risk',
            coordinates: [-99.170692, 19.409618] // Coordenadas del config original
        }
    };

    /**
     * Inicializar el módulo - VERSIÓN CORREGIDA
     */
    function init() {
        console.log('SmabilityPanels: Initializing... Attempt:', initializationAttempts + 1);
        
        // Incrementar intentos
        initializationAttempts++;
        
        // Verificar si el mapa está disponible
        if (!window.map) {
            console.log('SmabilityPanels: Map not available yet, retrying...');
            if (initializationAttempts < maxInitAttempts) {
                setTimeout(init, 1000);
            }
            return;
        }

        // Verificar si el mapa está cargado
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
     * CORREGIDO: Crear markers adicionales de Smability
     */
    function setupSmabilityMarkers() {
        console.log('SmabilityPanels: Setting up markers for stations:', Object.keys(stationData));
        
        // Limpiar markers existentes si los hay
        smabilityMarkers.forEach(marker => marker.remove());
        smabilityMarkers.clear();
        
        Object.keys(stationData).forEach(stationName => {
            const station = stationData[stationName];
            
            console.log(`SmabilityPanels: Creating marker for ${stationName} at`, station.coordinates);
            
            // Crear elemento del marker con estilos más visibles
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
            
            // Crear marker de Mapbox con offset para no interferir con originales
            const marker = new mapboxgl.Marker({ 
                element: markerElement,
                offset: [20, -20] // Offset mayor para mejor separación
            })
            .setLngLat(station.coordinates)
            .addTo(window.map);
            
            smabilityMarkers.set(stationName, marker);
            
            console.log(`SmabilityPanels: ✅ Created marker for ${stationName}`);
        });
        
        console.log(`SmabilityPanels: Total markers created: ${smabilityMarkers.size}`);
        
        // Forzar actualización con datos reales después de crear markers
        setTimeout(() => {
            console.log('SmabilityPanels: Starting real data update...');
            updateAllMarkersData();
        }, 2000);
    }

    /**
     * CORREGIDO: Función para obtener datos reales de la API
     */
    async function updateWithRealData(deviceName) {
        try {
            console.log(`SmabilityPanels: Fetching real data for ${deviceName}`);
            
            // Usar las funciones existentes de la app principal
            if (window.fetchSensorData && window.API_CONFIG && window.API_CONFIG.tokens[deviceName]) {
                const sensorData = await window.fetchSensorData(deviceName);
                
                console.log(`SmabilityPanels: Received data for ${deviceName}:`, sensorData);
                
                if (sensorData) {
                    // Actualizar con datos reales
                    updatePanelWithAPIData(sensorData);
                    
                    // Actualizar marker visual
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
     * NUEVO: Actualizar marker visual con datos reales
     */
    function updateMarkerWithRealData(deviceName, sensorData) {
        if (!smabilityMarkers.has(deviceName)) return;
        
        const marker = smabilityMarkers.get(deviceName);
        const element = marker.getElement();
        
        if (sensorData.dataIAS && sensorData.dataIAS !== 'N/A') {
            // Usar función de colores existente si está disponible
            const { color } = window.getIndicatorColor ? 
                window.getIndicatorColor(sensorData.dataIAS) : 
                { color: '#ffff00' };
            
            element.style.backgroundColor = color;
            element.textContent = Math.round(sensorData.dataIAS);
            
            // Actualizar datos en memoria
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
        
        // Actualizar indicador IAS
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

        // Mostrar el contenedor
        const container = document.getElementById('smabilityPanelContainer');
        if (container) {
            container.style.display = 'block';
        }

        // Actualizar contenido del panel
        updatePanelContent(deviceName, data);
        
        // Actualizar colores
        updatePanelColors(data.color);
        
        // Cambiar estado
        setState(2);
        
        // Obtener datos reales
        updateWithRealData(deviceName);
    }

    /**
     * Actualizar contenido del panel con datos de la estación
     */
    function updatePanelContent(deviceName, data) {
        // Títulos
        const title = document.getElementById('smabilityPanelTitle');
        const subtitle = document.getElementById('smabilityPanelSubtitle');
        const chartTitle = document.getElementById('smabilityChartTitle');
        
        if (title) title.textContent = deviceName;
        if (subtitle) subtitle.textContent = `${deviceName} - Smability - Air Quality`;
        if (chartTitle) chartTitle.textContent = `📈 SMAA ${deviceName}`;

        // IAS
        const emoji = document.getElementById('smabilityIasEmoji');
        const value = document.getElementById('smabilityIasValue');
        const status1 = document.getElementById('smabilityStatusText1');
        const status2 = document.getElementById('smabilityStatusText2');
        
        if (emoji) emoji.textContent = data.emoji;
        if (value) value.textContent = data.ias;
        if (status1) status1.textContent = data.status1;
        if (status2) status2.textContent = data.status2;

        // Contaminante dominante
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
            
            // Actualizar colores basados en IAS real
            const { color, status, risk } = window.getIndicatorColor ? 
                window.getIndicatorColor(sensorData.dataIAS) : 
                { color: '#ffff00', status: 'Unknown', risk: 'Unknown' };
            
            updatePanelColors(color);
            
            const status1 = document.getElementById('smabilityStatusText1');
            const status2 = document.getElementById('smabilityStatusText2');
            if (status1) status1.textContent = status;
            if (status2) status2.textContent = risk;
            
            // Emoji basado en IAS real
            const emoji = document.getElementById('smabilityIasEmoji');
            if (emoji && window.getIASEmoji) {
                emoji.textContent = window.getIASEmoji(sensorData.dataIAS);
            }
        }

        // Datos de sensores reales usando los nombres correctos de la API
        if (sensorData.SensorIAS) {
            const pollutant = document.getElementById('smabilityDominantPollutant');
            if (pollutant) pollutant.textContent = sensorData.SensorIAS;
        }

        if (sensorData.ConcentrationIASO3_1hr) {
            const o3 = document.getElementById('smabilityO3');
            if (o3) o3.textContent = `${sensorData.ConcentrationIASO3_1hr} ppb`;
        }

        if (sensorData.ConcentrationIASCO_8hr) {
            const co = document.getElementById('smabilityCO');
            if (co) co.textContent = `${sensorData.ConcentrationIASCO_8hr} ppb`;
        }

        if (sensorData.ConcentrationIASPM2_5_12hr) {
            const pm25 = document.getElementById('smabilityPM25');
            if (pm25) pm25.textContent = `${sensorData.ConcentrationIASPM2_5_12hr} μg/m³`;
        }

        if (sensorData.ConcentrationIASPM10_12hr) {
            const pm10 = document.getElementById('smabilityPM10');
            if (pm10) pm10.textContent = `${sensorData.ConcentrationIASPM10_12hr} μg/m³`;
        }

        if (sensorData.Temperature || sensorData.Temp_1hr) {
            const temp = document.getElementById('smabilityTemperature');
            const tempValue = sensorData.Temp_1hr || sensorData.Temperature;
            if (temp) temp.textContent = `${tempValue} °C`;
        }

        if (sensorData.Humidity || sensorData.HR_1hr) {
            const humidity = document.getElementById('smabilityHumidity');
            const humidityValue = sensorData.HR_1hr || sensorData.Humidity;
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
     * Cambiar estado de los paneles
     */
    function setState(state) {
        currentState = state;
        
        const container = document.getElementById('smabilityPanelContainer');
        const mainPanel = document.getElementById('smabilityMainPanel');
        const chartPanel = document.getElementById('smabilityChartPanel');
        
        if (!container || !mainPanel || !chartPanel) return;
        
        // Remover clases existentes
        container.classList.remove('smability-panels-stacked');
        
        if (state === 1) {
            // Solo mapa - ocultar todo
            container.style.display = 'none';
            mainPanel.style.display = 'none';
            chartPanel.style.display = 'none';
        } else if (state === 2) {
            // Panel principal visible
            container.style.display = 'block';
            mainPanel.style.display = 'block';
            chartPanel.style.display = 'none';
        } else if (state === 3) {
            // Ambos paneles visibles
            container.style.display = 'block';
            mainPanel.style.display = 'block';
            chartPanel.style.display = 'block';
            container.classList.add('smability-panels-stacked');
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
     * Cerrar ambos paneles
     */
    function closeBothPanels() {
        console.log('SmabilityPanels: Closing both panels');
        setState(1);
        currentDevice = null;
    }

    /**
     * Toggle del gráfico
     */
    function toggleChart() {
        if (currentState === 2) {
            // Mostrar gráfico
            setState(3);
        } else if (currentState === 3) {
            // Ocultar gráfico
            setState(2);
        }
    }

    /**
     * CORREGIDO: Actualizar datos de todos los markers
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
     * CORREGIDO: Toggle de visibilidad de markers Smability
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
        // Actualizar cada 5 minutos
        setInterval(() => {
            console.log('SmabilityPanels: Auto-refreshing marker data');
            updateAllMarkersData();
            
            // Si hay un panel abierto, actualizar también
            if (currentDevice && currentState > 1) {
                updateWithRealData(currentDevice);
            }
        }, 5 * 60 * 1000); // 5 minutos
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
        
        // Métodos de datos
        updateAllMarkersData: updateAllMarkersData,
        updateWithRealData: updateWithRealData,
        
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
 * CORREGIDO: Auto-inicialización con múltiples intentos
 */
function initializeSmabilityPanels() {
    console.log('SmabilityPanels: Starting initialization...');
    
    // Intentar inicializar inmediatamente
    window.SmabilityPanels.init();
    
    // Setup auto-refresh
    window.SmabilityPanels.setupAutoRefresh();
    
    // Agregar toggle a la leyenda después de un delay
    setTimeout(() => {
        addSmabilityToggleToLegend();
    }, 3000);
}

/**
 * CORREGIDO: Integración con la leyenda existente
 */
function addSmabilityToggleToLegend() {
    console.log('SmabilityPanels: Adding toggle to legend...');
    
    // Buscar la leyenda existente
    const legend = document.querySelector('.legend-content');
    if (legend) {
        // Verificar si ya existe el botón
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

console.log('SmabilityPanels module loaded successfully - CORRECTED VERSION');
