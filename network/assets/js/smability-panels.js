/**
 * ==============================================
 * ARCHIVO: smability-panels.js
 * DESCRIPCIÓN: Lógica para los nuevos paneles Smability
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

    // Datos de las estaciones (copiados del mockup pero integrados)
    const stationData = {
        'CENTRUS 5': {
            ias: 87,
            color: '#ffff00',
            emoji: '😐',
            pollutant: 'O3',
            status1: 'Acceptable',
            status2: 'Moderate Risk',
            coordinates: [-99.170692, 19.409618]
        },
        'UNAM Norte': {
            ias: 45,
            color: '#00ff00',
            emoji: '😊',
            pollutant: 'PM2.5',
            status1: 'Good',
            status2: 'Low Risk',
            coordinates: [-99.191376, 19.332607]
        },
        'Hipódromo': {
            ias: 125,
            color: '#ff8000',
            emoji: '😟',
            pollutant: 'NO2',
            status1: 'Unhealthy',
            status2: 'High Risk',
            coordinates: [-99.167213, 19.414855]
        }
    };

    /**
     * Inicializar el módulo
     */
    function init() {
        console.log('SmabilityPanels: Initializing...');
        
        // Esperar a que el mapa esté listo
        if (window.map && window.map.loaded()) {
            setupSmabilityMarkers();
        } else {
            // Esperar a que el mapa se cargue
            setTimeout(() => {
                if (window.map) {
                    window.map.on('load', setupSmabilityMarkers);
                }
            }, 1000);
        }
        
        console.log('SmabilityPanels: Initialized');
    }

    /**
     * Crear markers adicionales de Smability (no interfieren con los originales)
     */
    function setupSmabilityMarkers() {
        console.log('SmabilityPanels: Setting up markers...');
        
        Object.keys(stationData).forEach(stationName => {
            const station = stationData[stationName];
            
            // Crear elemento del marker
            const markerElement = document.createElement('div');
            markerElement.className = 'smability-marker';
            markerElement.style.backgroundColor = station.color;
            markerElement.textContent = station.ias;
            
            // Agregar event listener
            markerElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showPanel(stationName);
            });
            
            // Crear marker de Mapbox
            const marker = new mapboxgl.Marker({ 
                element: markerElement,
                offset: [15, -15] // Offset para no interferir con markers originales
            })
            .setLngLat(station.coordinates)
            .addTo(window.map);
            
            smabilityMarkers.set(stationName, marker);
            
            console.log(`SmabilityPanels: Created marker for ${stationName}`);
        });
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

        // Si tienes API real, aquí llamarías a la función para obtener datos reales
        // await updateWithRealData(deviceName);
    }

    /**
     * Función para obtener datos reales de la API (placeholder)
     */
    async function updateWithRealData(deviceName) {
        try {
            // Usar la función existente de la app principal
            if (window.fetchSensorData && window.API_CONFIG && window.API_CONFIG.tokens[deviceName]) {
                const sensorData = await window.fetchSensorData(deviceName);
                
                if (sensorData) {
                    // Actualizar con datos reales
                    updatePanelWithAPIData(sensorData);
                }
            }
        } catch (error) {
            console.error(`SmabilityPanels: Error fetching real data for ${deviceName}:`, error);
        }
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

        // Datos de sensores reales
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
            
            // Aquí podrías integrar con la funcionalidad de gráficos existente
            if (window.toggleChartPanel && currentDevice) {
                // Crear un evento simulado para integrar con la función existente
                const mockEvent = { preventDefault: () => {} };
                // window.toggleChartPanel(mockEvent, currentDevice);
            }
        } else if (currentState === 3) {
            // Ocultar gráfico
            setState(2);
        }
    }

    /**
     * Actualizar datos de todos los markers
     */
    async function updateAllMarkersData() {
        for (const [stationName, marker] of smabilityMarkers) {
            try {
                if (window.fetchSensorData && window.API_CONFIG && window.API_CONFIG.tokens[stationName]) {
                    const sensorData = await window.fetchSensorData(stationName);
                    
                    if (sensorData && sensorData.dataIAS !== 'N/A') {
                        // Actualizar marker visual
                        const element = marker.getElement();
                        const { color } = window.getIndicatorColor ? 
                            window.getIndicatorColor(sensorData.dataIAS) : 
                            { color: '#ffff00' };
                        
                        element.style.backgroundColor = color;
                        element.textContent = Math.round(sensorData.dataIAS);
                        
                        // Actualizar datos en memoria
                        if (stationData[stationName]) {
                            stationData[stationName].ias = sensorData.dataIAS;
                            stationData[stationName].color = color;
                        }
                    }
                }
            } catch (error) {
                console.error(`SmabilityPanels: Error updating marker for ${stationName}:`, error);
            }
        }
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

    /**
     * Toggle de visibilidad de markers Smability
     */
    function toggleMarkersVisibility(visible = true) {
        smabilityMarkers.forEach(marker => {
            const element = marker.getElement();
            element.style.display = visible ? 'flex' : 'none';
        });
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
        
        // Getters
        getCurrentDevice: () => currentDevice,
        getCurrentState: () => currentState,
        getStationData: () => stationData,
        getMarkers: () => smabilityMarkers
    };
})();

/**
 * Auto-inicialización cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para asegurar que los scripts originales se hayan cargado
    setTimeout(() => {
        window.SmabilityPanels.init();
        window.SmabilityPanels.setupAutoRefresh();
    }, 2000);
});

/**
 * Integración con la leyenda existente (opcional)
 */
function addSmabilityToggleToLegend() {
    // Buscar la leyenda existente
    const legend = document.querySelector('.legend-content');
    if (legend) {
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
        });
        
        legend.appendChild(toggleButton);
    }
}

// Agregar toggle a la leyenda cuando esté lista
setTimeout(addSmabilityToggleToLegend, 3000);

console.log('SmabilityPanels module loaded successfully');
