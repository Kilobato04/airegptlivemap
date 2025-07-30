// Chart management functions using Plotly.js

/**
 * Update chart with new data
 * @param {Array} formattedData - Array of data points
 * @param {number} hours - Number of hours for the timeframe
 * @param {string} sensorId - Sensor ID
 */
function updateChart(formattedData, hours, sensorId) {
    const sensorConfig = SENSOR_CONFIG[sensorId];

    if (!formattedData || formattedData.length === 0) {
        Plotly.newPlot('iasChart', [{
            type: 'scatter',
            y: [0],
            name: 'No data available'
        }], {
            title: `No ${sensorConfig.name} data available`
        });
        return;
    }

    formattedData.sort((a, b) => a.timestamp - b.timestamp);

    const trace = {
        x: formattedData.map(item => item.timestamp),
        y: formattedData.map(item => item.value),
        type: 'scatter',
        mode: 'lines+markers',
        line: {
            color: sensorConfig.color,
            width: 2,
            shape: 'linear'
        },
        marker: {
            color: sensorConfig.color,
            size: 1,
            line: {
                color: 'white',
                width: 0
            }
        },
        hovertemplate: `<b>Time</b>: %{x|%H:%M}<br>` +
                       `<b>${sensorConfig.name}</b>: %{y:.1f} ${sensorConfig.units}<br>` +
                       '<extra></extra>'
    };

    const layout = {
        margin: {
            t: 50,
            r: 20,
            l: 50,
            b: 60
        },
        yaxis: {
            title: {
                text: sensorConfig.units,
                standoff: 3,
                font: { size: 10 }
            },
            zeroline: false,
            showgrid: true,
            gridcolor: '#E4E4E4',
            gridwidth: 1,
            tickfont: { size: 8 }
        },
        xaxis: {
            type: 'date',
            tickformat: '%H:%M\n%b %d',
            tickangle: -90,
            showgrid: true,
            gridcolor: '#E4E4E4',
            dtick: hours >= 168 ? 86400000 : // 1 day intervals for 7-day view
                   window.innerWidth < 768 ? 7200000 : 3600000, // Adjust for other timeframes
            tickfont: { size: 8 }
        },
        plot_bgcolor: '#FFFFFF',
        paper_bgcolor: '#FFFFFF',
        title: {
            text: `${sensorConfig.name} Last ${hours >= 24 ? Math.floor(hours/24) + ' Days' : hours + ' Hours'}`,
            font: {
                size: window.innerWidth < 768 ? 10 : 12
            },
            y: 0.95,
            xref: 'paper',
            x: 0
        },
        modebar: {
            orientation: window.innerWidth < 768 ? 'v' : 'h'
        }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToAdd: ['autoScale2d'],
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'drawline'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: `${sensorConfig.name.toLowerCase()}_chart`,
            height: 800,
            width: 1200,
            scale: 2
        }
    };

    Plotly.newPlot('iasChart', [trace], layout, config);
}

/**
 * Toggle chart panel visibility and load data
 * @param {Event} event - Click event
 * @param {string} location - Location name
 */
function toggleChartPanel(event, location) {
    event.preventDefault();
    
    console.log('toggleChartPanel called for location:', location);
    console.log('API_CONFIG.tokens:', API_CONFIG.tokens);

    if (!API_CONFIG.tokens[location]) {
        console.log('Sensor data not available for this station');
        alert('Historical data not available for this station');
        return;
    }

    const panel = document.getElementById('chartPanel');
    if (!panel) {
        console.error('Chart panel element not found!');
        return;
    }

    const title = panel.querySelector('.chart-panel-title');
    const timeframeSelect = document.getElementById('timeframeSelect');
    const sensorSelect = document.getElementById('sensorSelect');

    console.log('Panel found:', panel);
    console.log('Title element:', title);
    console.log('Timeframe select:', timeframeSelect);
    console.log('Sensor select:', sensorSelect);

    // Remove existing event listeners if they exist
    if (window.timeframeListener && timeframeSelect) {
        timeframeSelect.removeEventListener('change', window.timeframeListener);
    }
    if (window.sensorListener && sensorSelect) {
        sensorSelect.removeEventListener('change', window.sensorListener);
    }

    if (panel.style.display === 'none' || !panel.style.display) {
        console.log('Opening chart panel...');
        panel.style.display = 'flex';
        if (title) {
            title.textContent = `SMAA ${location}`;
        }
        window.currentLocation = location; // Store current location GLOBALLY

        // NUEVO: Crear dropdown de comparación si no existe
        createComparisonDropdown();

        // NUEVO: Actualizar borde del panel con color IAS
        updatePanelBorderWithIAS(location);

        // Show loading state
        Plotly.newPlot('iasChart', [{
            type: 'scatter',
            y: [0],
            name: 'Loading...',
            font: {
                family: 'Arial, sans-serif'
            }
        }], {
            title: {
                text: 'Loading sensor data...',
                font: {
                    family: 'Arial, sans-serif',
                    size: 12
                }
            }
        });

        // Function to update data based on current selections
        const updateData = () => {
            console.log('updateData called for location:', window.currentLocation);
            
            // Only proceed if we're still looking at the same location
            if (location !== window.currentLocation) {
                console.log('Location mismatch, aborting update');
                return;
            }

            const hours = parseInt(timeframeSelect ? timeframeSelect.value : '24');
            const sensorId = sensorSelect ? sensorSelect.value : '12';
            const token = API_CONFIG.tokens[window.currentLocation];

            console.log('Fetching data for:', { hours, sensorId, token, location: window.currentLocation });

            Plotly.newPlot('iasChart', [{
                type: 'scatter',
                y: [0],
                name: 'Loading...',
                font: {
                    family: 'Arial, sans-serif'
                }
            }], {
                title: {
                    text: `Loading ${SENSOR_CONFIG[sensorId].name} data for ${window.currentLocation}...`,
                    font: {
                        family: 'Arial, sans-serif',
                        size: 12
                    }
                }
            });

            if (typeof fetchSensorDataWithProxy === 'function') {
                fetchSensorDataWithProxy(hours, sensorId, token)
                    .then(data => {
                        console.log('Received historical data:', data);
                        // Check again if location hasn't changed before updating
                        if (location === window.currentLocation) {
                            updateChart(data, hours, sensorId);
                        }
                    })
                    .catch(error => {
                        if (location === window.currentLocation) {
                            console.error('Error loading data:', error);
                            Plotly.newPlot('iasChart', [{
                                type: 'scatter',
                                y: [0],
                                name: 'Error',
                                font: {
                                    family: 'Arial, sans-serif'
                                }
                            }], {
                                title: 'Error loading sensor data: ' + error.message,
                                font: {
                                    family: 'Arial, sans-serif',
                                    size: 12
                                }
                            });
                        }
                    });
            } else {
                console.error('fetchSensorDataWithProxy function not available');
                Plotly.newPlot('iasChart', [{
                    type: 'scatter',
                    y: [0],
                    name: 'Error',
                    font: {
                        family: 'Arial, sans-serif'
                    }
                }], {
                    title: 'fetchSensorDataWithProxy function not available',
                    font: {
                        family: 'Arial, sans-serif',
                        size: 12
                    }
                });
            }
        };

        // Create new event listeners and store them GLOBALLY
        window.timeframeListener = () => updateData();
        window.sensorListener = () => {
            updateData();
            // NUEVO: Actualizar título del sensor cuando cambie
            const sensorSelect = document.getElementById('sensorSelect');
            if (sensorSelect) {
                updateCurrentSensorTitle(sensorSelect.value);
            }
        };

        // Add new event listeners
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', window.timeframeListener);
            // Reset to default values when switching locations
            timeframeSelect.value = '24';
        }
        if (sensorSelect) {
            sensorSelect.addEventListener('change', window.sensorListener);
            // CAMBIADO: Ozono como default en lugar de temperatura
            sensorSelect.value = '7';
            // NUEVO: Actualizar título inicial
            updateCurrentSensorTitle('7');
        }

        // Initial data load
        console.log('Starting initial data load...');
        updateData();
    } else {
        if (location === window.currentLocation) {
            closeChartPanel();
        } else {
            // If switching to a different location while panel is open,
            // update the title and load new data
            console.log('Switching to different location while panel open');
            if (title) {
                title.textContent = `SMAA ${location}`;
            }
            window.currentLocation = location;
            
            // NUEVO: Actualizar borde del panel con nuevo color IAS
            updatePanelBorderWithIAS(location);
            
            // Reset select elements
            if (timeframeSelect) timeframeSelect.value = '24';
            if (sensorSelect) sensorSelect.value = '7'; // Ozono como default
            
            // Load new data
            if (window.timeframeListener) {
                window.timeframeListener();
            }
        }
    }
}

/**
 * NUEVO: Crear dropdown de comparación en posición superior izquierda
 */
function createComparisonDropdown() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    // Verificar si ya existe el dropdown
    if (document.getElementById('comparisonSelect')) return;
    
    // Crear container para información del sensor y comparación
    const infoContainer = document.createElement('div');
    infoContainer.id = 'sensorInfoContainer';
    infoContainer.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 10;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-size: 12px;
        min-width: 200px;
    `;
    
    // Título del sensor actual
    const sensorTitle = document.createElement('div');
    sensorTitle.id = 'currentSensorTitle';
    sensorTitle.style.cssText = `
        font-weight: bold;
        color: #333;
        margin-bottom: 6px;
        font-size: 13px;
    `;
    sensorTitle.textContent = 'Ozone (ppb)'; // Default
    
    // Container para el dropdown de comparación
    const dropdownContainer = document.createElement('div');
    dropdownContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
    `;
    
    // Label
    const label = document.createElement('span');
    label.textContent = 'Compare with:';
    label.style.cssText = `
        color: #666;
        font-size: 11px;
        white-space: nowrap;
    `;
    
    // Dropdown
    const select = document.createElement('select');
    select.id = 'comparisonSelect';
    select.style.cssText = `
        font-size: 10px;
        padding: 2px 4px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: white;
        min-width: 120px;
    `;
    
    // Opciones del dropdown
    const options = [
        { value: '', text: 'None' },
        { value: 'Hipódromo', text: 'Hipódromo' },
        { value: 'UNAM', text: 'UNAM' },
        { value: 'CENTRUS 3', text: 'CENTRUS 3' },
        { value: 'INSYC-Smability', text: 'INSYC-Smability' }
    ];
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        select.appendChild(optionElement);
    });
    
    // Event listener para comparación
    select.addEventListener('change', () => {
        if (window.timeframeListener) {
            console.log('Comparison station changed to:', select.value);
            window.timeframeListener(); // Trigger data reload with comparison
        }
    });
    
    // Ensamblar elementos
    dropdownContainer.appendChild(label);
    dropdownContainer.appendChild(select);
    infoContainer.appendChild(sensorTitle);
    infoContainer.appendChild(dropdownContainer);
    
    // Insertar en el chart container
    chartContainer.style.position = 'relative';
    chartContainer.appendChild(infoContainer);
}

/**
 * NUEVO: Actualizar título del sensor actual
 * @param {string} sensorId - ID del sensor
 */
function updateCurrentSensorTitle(sensorId) {
    const titleElement = document.getElementById('currentSensorTitle');
    if (titleElement && SENSOR_CONFIG[sensorId]) {
        titleElement.textContent = `${SENSOR_CONFIG[sensorId].name} (${SENSOR_CONFIG[sensorId].units})`;
    }
}

/**
 * NUEVO: Actualizar borde del panel con color IAS
 * @param {string} location - Nombre de la ubicación
 */
async function updatePanelBorderWithIAS(location) {
    try {
        const sensorData = await fetchSensorData(location);
        if (sensorData && sensorData.dataIAS !== 'N/A') {
            const { color } = getIndicatorColor(sensorData.dataIAS);
            const panel = document.getElementById('chartPanel');
            if (panel) {
                panel.style.borderColor = color;
                console.log(`Updated panel border color to: ${color} for IAS: ${sensorData.dataIAS}`);
            }
        }
    } catch (error) {
        console.error('Error updating panel border color:', error);
        // Fallback to default blue if error
        const panel = document.getElementById('chartPanel');
        if (panel) {
            panel.style.borderColor = '#4264fb';
        }
    }
}

/**
 * Close chart panel and cleanup
 */
function closeChartPanel() {
    console.log('Closing chart panel...');
    const panel = document.getElementById('chartPanel');
    if (panel) {
        panel.style.display = 'none';
    }
    window.currentLocation = null;

    // Remove event listeners
    const timeframeSelect = document.getElementById('timeframeSelect');
    const sensorSelect = document.getElementById('sensorSelect');
    
    if (window.timeframeListener && timeframeSelect) {
        timeframeSelect.removeEventListener('change', window.timeframeListener);
        window.timeframeListener = null;
    }
    if (window.sensorListener && sensorSelect) {
        sensorSelect.removeEventListener('change', window.sensorListener);
        window.sensorListener = null;
    }
    
    console.log('Chart panel closed and cleaned up');
}

// Handle window resize
window.addEventListener('resize', () => {
    const panel = document.getElementById('chartPanel');
    if (panel && panel.style.display !== 'none') {
        try {
            Plotly.Plots.resize('iasChart');
        } catch (error) {
            console.error('Error resizing chart:', error);
        }
    }
});

// Make functions globally available
window.toggleChartPanel = toggleChartPanel;
window.closeChartPanel = closeChartPanel;
window.updateChart = updateChart;

console.log('Chart.js loaded successfully');
