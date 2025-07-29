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

    if (!API_CONFIG.tokens[location]) {
        console.log('Sensor data not available for this station');
        return;
    }

    const panel = document.getElementById('chartPanel');
    const title = panel.querySelector('.chart-panel-title');
    const timeframeSelect = document.getElementById('timeframeSelect');
    const sensorSelect = document.getElementById('sensorSelect');

    // Remove existing event listeners if they exist
    if (timeframeListener) {
        timeframeSelect.removeEventListener('change', timeframeListener);
    }
    if (sensorListener) {
        sensorSelect.removeEventListener('change', sensorListener);
    }

    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'flex';
        title.textContent = `SMAA ${location}`;
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
            // Only proceed if we're still looking at the same location
            if (location !== currentLocation) {
                return;
            }

            const hours = parseInt(timeframeSelect.value);
            const sensorId = sensorSelect.value;
            const token = API_CONFIG.tokens[currentLocation];

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

            fetchSensorDataWithProxy(hours, sensorId, token)
                .then(data => {
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
        };

        // Create new event listeners
        timeframeListener = () => updateData();
        sensorListener = () => updateData();

        // Add new event listeners
        timeframeSelect.addEventListener('change', timeframeListener);
        sensorSelect.addEventListener('change', sensorListener);

        // Reset select elements to default values when switching locations
        timeframeSelect.value = '24';
        sensorSelect.value = '12';

        // Initial data load
        updateData();
    } else {
        if (location === currentLocation) {
            closeChartPanel();
        } else {
            // If switching to a different location while panel is open,
            // update the title and load new data
            title.textContent = `SMAA ${location}`;
            currentLocation = location;
            
            // Reset select elements
            timeframeSelect.value = '24';
            sensorSelect.value = '12';
            
            // Load new data
            timeframeListener();
        }
    }
}

/**
 * Close chart panel and cleanup
 */
function closeChartPanel() {
    const panel = document.getElementById('chartPanel');
    panel.style.display = 'none';
    currentLocation = null;

    // Remove event listeners
    const timeframeSelect = document.getElementById('timeframeSelect');
    const sensorSelect = document.getElementById('sensorSelect');
    
    if (timeframeListener) {
        timeframeSelect.removeEventListener('change', timeframeListener);
        timeframeListener = null;
    }
    if (sensorListener) {
        sensorSelect.removeEventListener('change', sensorListener);
        sensorListener = null;
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (document.getElementById('chartPanel').style.display !== 'none') {
        Plotly.Plots.resize('iasChart');
    }
});

// Make functions globally available
window.toggleChartPanel = toggleChartPanel;
window.closeChartPanel = closeChartPanel;
