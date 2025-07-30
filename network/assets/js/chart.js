// Chart management functions using Plotly.js

// Initialize global variables for chart management
let currentLocation = null;
let timeframeListener = null;
let sensorListener = null;

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
    if (timeframeListener && timeframeSelect) {
        timeframeSelect.removeEventListener('change', timeframeListener);
    }
    if (sensorListener && sensorSelect) {
        sensorSelect.removeEventListener('change', sensorListener);
    }

    if (panel.style.display === 'none' || !panel.style.display) {
        console.log('Opening chart panel...');
        panel.style.display = 'flex';
        if (title) {
            title.textContent = `SMAA ${location}`;
        }
        currentLocation = location; // Store current location

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
            console.log('updateData called for location:', currentLocation);
            
            // Only proceed if we're still looking at the same location
            if (location !== currentLocation) {
                console.log('Location mismatch, aborting update');
                return;
            }

            const hours = parseInt(timeframeSelect ? timeframeSelect.value : '24');
            const sensorId = sensorSelect ? sensorSelect.value : '12';
            const token = API_CONFIG.tokens[currentLocation];

            console.log('Fetching data for:', { hours, sensorId, token, location: currentLocation });

            Plotly.newPlot('iasChart', [{
                type: 'scatter',
                y: [0],
                name: 'Loading...',
                font: {
                    family: 'Arial, sans-serif'
                }
            }], {
                title: {
                    text: `Loading ${SENSOR_CONFIG[sensorId].name} data for ${currentLocation}...`,
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
                        if (location === currentLocation) {
                            updateChart(data, hours, sensorId);
                        }
                    })
                    .catch(error => {
                        if (location === currentLocation) {
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

        // Create new event listeners
        timeframeListener = () => updateData();
        sensorListener = () => updateData();

        // Add new event listeners
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', timeframeListener);
            // Reset to default values when switching locations
            timeframeSelect.value = '24';
        }
        if (sensorSelect) {
            sensorSelect.addEventListener('change', sensorListener);
            // Reset to default values when switching locations
            sensorSelect.value = '12';
        }

        // Initial data load
        console.log('Starting initial data load...');
        updateData();
    } else {
        if (location === currentLocation) {
            closeChartPanel();
        } else {
            // If switching to a different location while panel is open,
            // update the title and load new data
            console.log('Switching to different location while panel open');
            if (title) {
                title.textContent = `SMAA ${location}`;
            }
            currentLocation = location;
            
            // Reset select elements
            if (timeframeSelect) timeframeSelect.value = '24';
            if (sensorSelect) sensorSelect.value = '12';
            
            // Load new data
            if (timeframeListener) {
                timeframeListener();
            }
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
    currentLocation = null;

    // Remove event listeners
    const timeframeSelect = document.getElementById('timeframeSelect');
    const sensorSelect = document.getElementById('sensorSelect');
    
    if (timeframeListener && timeframeSelect) {
        timeframeSelect.removeEventListener('change', timeframeListener);
        timeframeListener = null;
    }
    if (sensorListener && sensorSelect) {
        sensorSelect.removeEventListener('change', sensorListener);
        sensorListener = null;
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

// Also set the global variables for compatibility
window.currentLocation = currentLocation;
window.timeframeListener = timeframeListener;
window.sensorListener = sensorListener;

console.log('Chart.js loaded successfully');
