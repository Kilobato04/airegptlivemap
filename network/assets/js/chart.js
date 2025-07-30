// Chart management functions using Plotly.js

/**
 * Update chart with comparison data
 * @param {Array} primaryData - Primary station data
 * @param {Array} comparisonData - Comparison station data  
 * @param {number} hours - Number of hours for the timeframe
 * @param {string} sensorId - Sensor ID
 * @param {string} primaryStation - Primary station name
 * @param {string} comparisonStation - Comparison station name
 */
function updateChartWithComparison(primaryData, comparisonData, hours, sensorId, primaryStation, comparisonStation) {
    const sensorConfig = SENSOR_CONFIG[sensorId];
    const traces = [];

    // Primary station trace
    if (primaryData && primaryData.length > 0) {
        primaryData.sort((a, b) => a.timestamp - b.timestamp);
        
        traces.push({
            x: primaryData.map(item => item.timestamp),
            y: primaryData.map(item => item.value),
            type: 'scatter',
            mode: 'lines', // Changed from 'lines+markers' to 'lines' only
            name: primaryStation,
            line: {
                color: sensorConfig.color,
                width: 2,
                shape: 'linear'
            },
            hovertemplate: `<b>${primaryStation}</b><br>` +
                           `<b>Time</b>: %{x|%H:%M}<br>` +
                           `<b>${sensorConfig.name}</b>: %{y:.1f} ${sensorConfig.units}<br>` +
                           '<extra></extra>'
        });
    }

    // Comparison station trace
    if (comparisonData && comparisonData.length > 0) {
        comparisonData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Generate a complementary color for comparison
        const comparisonColor = getComparisonColor(sensorConfig.color);
        
        traces.push({
            x: comparisonData.map(item => item.timestamp),
            y: comparisonData.map(item => item.value),
            type: 'scatter',
            mode: 'lines', // Changed from 'lines+markers' to 'lines' only
            name: comparisonStation,
            line: {
                color: comparisonColor,
                width: 2,
                shape: 'linear'
                // Removed dash: 'dot' - now solid line
            },
            hovertemplate: `<b>${comparisonStation}</b><br>` +
                           `<b>Time</b>: %{x|%H:%M}<br>` +
                           `<b>${sensorConfig.name}</b>: %{y:.1f} ${sensorConfig.units}<br>` +
                           '<extra></extra>'
        });
    }

    // Handle case where no data is available
    if (traces.length === 0) {
        traces.push({
            type: 'scatter',
            y: [0],
            name: 'No data available',
            line: { color: '#cccccc' }
        });
    }

    const layout = {
        margin: {
            t: 60,
            r: 20,
            l: 50,
            b: 80
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
                   window.innerWidth < 768 ? 7200000 : 3600000,
            tickfont: { size: 8 }
        },
        plot_bgcolor: '#FFFFFF',
        paper_bgcolor: '#FFFFFF',
        title: {
            text: `${sensorConfig.name} Comparison - Last ${hours >= 24 ? Math.floor(hours/24) + ' Days' : hours + ' Hours'}`,
            font: {
                size: window.innerWidth < 768 ? 10 : 12,
                family: 'DIN Pro, Arial, sans-serif'
            },
            y: 0.95,
            xref: 'paper',
            x: 0
        },
        legend: {
            x: 0,
            y: 1.1,
            orientation: 'h',
            font: {
                size: 9,
                family: 'DIN Pro, Arial, sans-serif'
            }
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
            filename: `${sensorConfig.name.toLowerCase()}_comparison`,
            height: 800,
            width: 1200,
            scale: 2
        }
    };

    Plotly.newPlot('iasChart', traces, layout, config);
}

/**
 * Generate complementary color for comparison
 * @param {string} primaryColor - Primary color hex
 * @returns {string} - Complementary color hex
 */
function getComparisonColor(primaryColor) {
    const colorMap = {
        '#4264fb': '#fb4264', // Blue -> Red
        '#ff7043': '#43ff70', // Orange -> Green
        '#4caf50': '#af504c', // Green -> Brown
        '#9c27b0': '#27b09c', // Purple -> Teal
        '#ff9800': '#0098ff'  // Orange -> Blue
    };
    return colorMap[primaryColor] || '#666666';
}

/**
 * Update chart with new data (enhanced for comparison)
 * @param {Array} formattedData - Array of data points
 * @param {number} hours - Number of hours for the timeframe
 * @param {string} sensorId - Sensor ID
 * @param {Array} comparisonData - Optional comparison data
 * @param {string} comparisonStation - Optional comparison station name
 */
function updateChart(formattedData, hours, sensorId, comparisonData = null, comparisonStation = null) {
    const sensorConfig = SENSOR_CONFIG[sensorId];

    // If comparison data is provided, use comparison function
    if (comparisonData && comparisonStation && window.currentLocation) {
        updateChartWithComparison(formattedData, comparisonData, hours, sensorId, window.currentLocation, comparisonStation);
        return;
    }

    // Original single-station chart logic
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
        mode: 'lines', // Changed from 'lines+markers' to 'lines' only
        line: {
            color: sensorConfig.color,
            width: 2,
            shape: 'linear'
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
            b: 80 // More bottom margin for Plotly controls
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

    const timeframeSelect = document.getElementById('timeframeSelect');
    const sensorSelect = document.getElementById('sensorSelect');
    const comparisonSelect = document.getElementById('comparisonSelect');

    console.log('Panel found:', panel);
    console.log('Timeframe select:', timeframeSelect);
    console.log('Sensor select:', sensorSelect);
    console.log('Comparison select:', comparisonSelect);

    // Remove existing event listeners if they exist
    if (window.timeframeListener && timeframeSelect) {
        timeframeSelect.removeEventListener('change', window.timeframeListener);
    }
    if (window.sensorListener && sensorSelect) {
        sensorSelect.removeEventListener('change', window.sensorListener);
    }
    if (window.comparisonListener && comparisonSelect) {
        comparisonSelect.removeEventListener('change', window.comparisonListener);
    }

    if (panel.style.display === 'none' || !panel.style.display) {
        console.log('Opening chart panel...');
        panel.style.display = 'flex';
        window.currentLocation = location; // Store current location GLOBALLY

        // Create device info container if it doesn't exist
        createDeviceInfoContainer();
        
        // Update títulos del dispositivo y sensor
        updateCurrentDeviceTitle(location);
        updateCurrentSensorTitle('7'); // Default to Ozone

        // Update panel border with IAS color
        updatePanelBorderWithIAS(location);

        // Show loading state
        Plotly.newPlot('iasChart', [{
            type: 'scatter',
            y: [0],
            name: 'Loading...',
            font: {
                family: 'DIN Pro, Arial, sans-serif'
            }
        }], {
            title: {
                text: 'Loading sensor data...',
                font: {
                    family: 'DIN Pro, Arial, sans-serif',
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

            // Get values from the NEW dynamic selects first, fallback to legacy
            const newTimeframeSelect = document.querySelector('#deviceInfoContainer #timeframeSelect');
            const newSensorSelect = document.querySelector('#deviceInfoContainer #sensorSelect');
            const newComparisonSelect = document.querySelector('#deviceInfoContainer #comparisonSelect');
            
            const hours = parseInt(
                (newTimeframeSelect && newTimeframeSelect.value) || 
                (timeframeSelect && timeframeSelect.value) || 
                '12'
            );
            const sensorId = 
                (newSensorSelect && newSensorSelect.value) || 
                (sensorSelect && sensorSelect.value) || 
                '7';
            const comparisonStation = 
                (newComparisonSelect && newComparisonSelect.value) || 
                (comparisonSelect && comparisonSelect.value) || 
                '';
            const token = API_CONFIG.tokens[window.currentLocation];

            console.log('Fetching data for:', { 
                hours, 
                sensorId, 
                token, 
                location: window.currentLocation,
                comparison: comparisonStation 
            });

            // Show loading state
            const loadingTitle = comparisonStation ? 
                `Loading ${SENSOR_CONFIG[sensorId].name} comparison: ${window.currentLocation} vs ${comparisonStation}...` :
                `Loading ${SENSOR_CONFIG[sensorId].name} data for ${window.currentLocation}...`;

            Plotly.newPlot('iasChart', [{
                type: 'scatter',
                y: [0],
                name: 'Loading...',
                font: {
                    family: 'DIN Pro, Arial, sans-serif'
                }
            }], {
                title: {
                    text: loadingTitle,
                    font: {
                        family: 'DIN Pro, Arial, sans-serif',
                        size: 12
                    }
                }
            });

            if (typeof fetchSensorDataWithProxy === 'function') {
                // Fetch primary station data
                const primaryDataPromise = fetchSensorDataWithProxy(hours, sensorId, token);
                
                // Fetch comparison data if selected
                let comparisonDataPromise = Promise.resolve(null);
                if (comparisonStation && API_CONFIG.tokens[comparisonStation]) {
                    const comparisonToken = API_CONFIG.tokens[comparisonStation];
                    comparisonDataPromise = fetchSensorDataWithProxy(hours, sensorId, comparisonToken);
                }

                // Wait for both data sets
                Promise.all([primaryDataPromise, comparisonDataPromise])
                    .then(([primaryData, comparisonData]) => {
                        console.log('Received primary data:', primaryData);
                        console.log('Received comparison data:', comparisonData);
                        
                        // Check again if location hasn't changed before updating
                        if (location === window.currentLocation) {
                            if (comparisonStation && comparisonData) {
                                // Use comparison chart
                                updateChart(primaryData, hours, sensorId, comparisonData, comparisonStation);
                            } else {
                                // Use single station chart
                                updateChart(primaryData, hours, sensorId);
                            }
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
                                    family: 'DIN Pro, Arial, sans-serif'
                                }
                            }], {
                                title: 'Error loading sensor data: ' + error.message,
                                font: {
                                    family: 'DIN Pro, Arial, sans-serif',
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
                        family: 'DIN Pro, Arial, sans-serif'
                    }
                }], {
                    title: 'fetchSensorDataWithProxy function not available',
                    font: {
                        family: 'DIN Pro, Arial, sans-serif',
                        size: 12
                    }
                });
            }
        };

        // Create new event listeners and store them GLOBALLY
        window.timeframeListener = () => updateData();
        window.sensorListener = () => {
            updateData();
            // Update sensor title when changed - check both new and legacy selects
            const newSensorSelect = document.querySelector('#deviceInfoContainer #sensorSelect');
            const currentSensorSelect = newSensorSelect || sensorSelect;
            if (currentSensorSelect) {
                updateCurrentSensorTitle(currentSensorSelect.value);
            }
        };
        window.comparisonListener = () => {
            console.log('Comparison station changed');
            updateData(); // This could be enhanced for comparison functionality
        };

        // Add new event listeners - FIXED: Get the NEW dynamically created selects
        const newTimeframeSelect = document.querySelector('#deviceInfoContainer #timeframeSelect');
        const newSensorSelect = document.querySelector('#deviceInfoContainer #sensorSelect');
        const newComparisonSelect = document.querySelector('#deviceInfoContainer #comparisonSelect');
        
        if (newTimeframeSelect) {
            newTimeframeSelect.addEventListener('change', window.timeframeListener);
            newTimeframeSelect.value = '12'; // Default to 12 hours
        }
        if (newSensorSelect) {
            newSensorSelect.addEventListener('change', window.sensorListener);
            newSensorSelect.value = '7'; // Default to Ozone
        }
        if (newComparisonSelect) {
            newComparisonSelect.addEventListener('change', window.comparisonListener);
            newComparisonSelect.value = ''; // Reset comparison
        }
        
        // Also handle legacy selects if they exist
        if (timeframeSelect && timeframeSelect !== newTimeframeSelect) {
            timeframeSelect.addEventListener('change', window.timeframeListener);
            timeframeSelect.value = '12';
        }
        if (sensorSelect && sensorSelect !== newSensorSelect) {
            sensorSelect.addEventListener('change', window.sensorListener);
            sensorSelect.value = '7';
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
            window.currentLocation = location;
            
            // Update device title
            updateCurrentDeviceTitle(location);
            
            // Update panel border with new IAS color
            updatePanelBorderWithIAS(location);
            
            // Reset select elements to defaults
            const newTimeframeSelect = document.querySelector('#deviceInfoContainer #timeframeSelect');
            const newSensorSelect = document.querySelector('#deviceInfoContainer #sensorSelect');
            const newComparisonSelect = document.querySelector('#deviceInfoContainer #comparisonSelect');
            
            if (newTimeframeSelect) newTimeframeSelect.value = '12';
            if (newSensorSelect) newSensorSelect.value = '7';
            if (newComparisonSelect) newComparisonSelect.value = '';
            
            // Also reset legacy selects if they exist
            if (timeframeSelect) timeframeSelect.value = '12';
            if (sensorSelect) sensorSelect.value = '7';
            if (comparisonSelect) comparisonSelect.value = '';
            
            // Update sensor title to default
            updateCurrentSensorTitle('7');
            
            // Load new data
            if (window.timeframeListener) {
                window.timeframeListener();
            }
        }
    }
}

/**
 * Create device info container with all controls
 */
function createDeviceInfoContainer() {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    // Check if device info container already exists
    if (document.getElementById('deviceInfoContainer')) return;
    
    // Create the device info container
    const infoContainer = document.createElement('div');
    infoContainer.id = 'deviceInfoContainer';
    
    // Device title
    const deviceTitle = document.createElement('div');
    deviceTitle.id = 'currentDeviceTitle';
    deviceTitle.textContent = 'SMAA Device';
    
    // Sensor title
    const sensorTitle = document.createElement('div');
    sensorTitle.id = 'currentSensorTitle';
    // Default to 12 hours instead of 24
    sensorTitle.textContent = 'Ozone (ppb) - Last 12 Hours';
    
    // Controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    
    // Comparison control
    const comparisonLabel = document.createElement('label');
    comparisonLabel.textContent = 'Compare with:';
    const comparisonSelect = document.createElement('select');
    comparisonSelect.id = 'comparisonSelect';
    
    const comparisonOptions = [
        { value: '', text: 'None' },
        { value: 'Hipódromo', text: 'Hipódromo' },
        { value: 'UNAM', text: 'UNAM' },
        { value: 'CENTRUS 3', text: 'CENTRUS 3' },
        { value: 'INSYC-Smability', text: 'INSYC-Smability' },
        { value: 'CENTRUS 5', text: 'CENTRUS 5' } // ADDED CENTRUS 5
    ];
    
    comparisonOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        comparisonSelect.appendChild(optionElement);
    });
    
    // Sensor control (move existing select or create new one)
    const sensorLabel = document.createElement('label');
    sensorLabel.textContent = 'Sensor:';
    const existingSensorSelect = document.getElementById('sensorSelect');
    let sensorSelect;
    
    if (existingSensorSelect) {
        sensorSelect = existingSensorSelect.cloneNode(true);
        existingSensorSelect.style.display = 'none'; // Hide original
    } else {
        sensorSelect = document.createElement('select');
        sensorSelect.id = 'sensorSelect';
        const sensorOptions = [
            { value: '7', text: 'Ozone (ppb)' },
            { value: '2', text: 'Carbon Monoxide (ppb)' },
            { value: '9', text: 'PM2.5 (μg/m³)' },
            { value: '12', text: 'Temperature (°C)' },
            { value: '3', text: 'Relative Humidity (%)' }
        ];
        
        sensorOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            sensorSelect.appendChild(optionElement);
        });
    }
    
    // Timeframe control (move existing select or create new one)
    const timeframeLabel = document.createElement('label');
    timeframeLabel.textContent = 'Timeframe:';
    const existingTimeframeSelect = document.getElementById('timeframeSelect');
    let timeframeSelect;
    
    if (existingTimeframeSelect) {
        timeframeSelect = existingTimeframeSelect.cloneNode(true);
        existingTimeframeSelect.style.display = 'none'; // Hide original
    } else {
        timeframeSelect = document.createElement('select');
        timeframeSelect.id = 'timeframeSelect';
        const         timeframeOptions = [
            { value: '168', text: 'Last 7 days' },
            { value: '24', text: 'Last 24 hours' },
            { value: '12', text: 'Last 12 hours' },
            { value: '8', text: 'Last 8 hours' },
            { value: '4', text: 'Last 4 hours' }
        ];
        
        timeframeOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            timeframeSelect.appendChild(optionElement);
        });
    }
    
    // Assemble controls
    controlsContainer.appendChild(comparisonLabel);
    controlsContainer.appendChild(comparisonSelect);
    controlsContainer.appendChild(sensorLabel);
    controlsContainer.appendChild(sensorSelect);
    controlsContainer.appendChild(timeframeLabel);
    controlsContainer.appendChild(timeframeSelect);
    
    // Assemble info container
    infoContainer.appendChild(deviceTitle);
    infoContainer.appendChild(sensorTitle);
    infoContainer.appendChild(controlsContainer);
    
    // Insert into chart panel header
    const chartHeader = document.querySelector('.chart-panel-header');
    if (chartHeader) {
        chartHeader.appendChild(infoContainer);
    }
}

/**
 * Update device title
 * @param {string} deviceName - Name of the device
 */
function updateCurrentDeviceTitle(deviceName) {
    const titleElement = document.getElementById('currentDeviceTitle');
    if (titleElement) {
        titleElement.textContent = `SMAA ${deviceName}`;
    }
}

/**
 * Update sensor title
 * @param {string} sensorId - ID of the sensor
 */
function updateCurrentSensorTitle(sensorId) {
    const titleElement = document.getElementById('currentSensorTitle');
    if (titleElement && SENSOR_CONFIG[sensorId]) {
        titleElement.textContent = `${SENSOR_CONFIG[sensorId].name} (${SENSOR_CONFIG[sensorId].units})`;
    }
}

/**
 * Update panel border with IAS color
 * @param {string} location - Location name
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

    // Remove event listeners - UPDATED to handle both new and legacy selects
    const newTimeframeSelect = document.querySelector('#deviceInfoContainer #timeframeSelect');
    const newSensorSelect = document.querySelector('#deviceInfoContainer #sensorSelect');
    const newComparisonSelect = document.querySelector('#deviceInfoContainer #comparisonSelect');
    const legacyTimeframeSelect = document.getElementById('timeframeSelect');
    const legacySensorSelect = document.getElementById('sensorSelect');
    const legacyComparisonSelect = document.getElementById('comparisonSelect');
    
    // Remove listeners from new selects
    if (window.timeframeListener) {
        if (newTimeframeSelect) newTimeframeSelect.removeEventListener('change', window.timeframeListener);
        if (legacyTimeframeSelect) legacyTimeframeSelect.removeEventListener('change', window.timeframeListener);
        window.timeframeListener = null;
    }
    if (window.sensorListener) {
        if (newSensorSelect) newSensorSelect.removeEventListener('change', window.sensorListener);
        if (legacySensorSelect) legacySensorSelect.removeEventListener('change', window.sensorListener);
        window.sensorListener = null;
    }
    if (window.comparisonListener) {
        if (newComparisonSelect) newComparisonSelect.removeEventListener('change', window.comparisonListener);
        if (legacyComparisonSelect) legacyComparisonSelect.removeEventListener('change', window.comparisonListener);
        window.comparisonListener = null;
    }
    
    // Clean up device info container
    const deviceInfoContainer = document.getElementById('deviceInfoContainer');
    if (deviceInfoContainer) {
        deviceInfoContainer.remove();
    }
    
    // Show original selects if they were hidden
    const originalSensorSelect = document.querySelector('.select-container #sensorSelect');
    const originalTimeframeSelect = document.querySelector('.select-container #timeframeSelect');
    if (originalSensorSelect) originalSensorSelect.style.display = '';
    if (originalTimeframeSelect) originalTimeframeSelect.style.display = '';
    
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
window.updateChartWithComparison = updateChartWithComparison;
window.getComparisonColor = getComparisonColor;
window.createDeviceInfoContainer = createDeviceInfoContainer;
window.updateCurrentDeviceTitle = updateCurrentDeviceTitle;
window.updateCurrentSensorTitle = updateCurrentSensorTitle;
window.updatePanelBorderWithIAS = updatePanelBorderWithIAS;

console.log('Chart.js loaded successfully');
