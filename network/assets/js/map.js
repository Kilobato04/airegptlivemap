// Simple map initialization

setTimeout(() => {
    if (typeof MAPBOX_CONFIG === 'undefined') {
        console.error('Config not loaded');
        return;
    }

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    const map = new mapboxgl.Map({
        container: 'map',
        style: MAPBOX_CONFIG.style,
        center: MAPBOX_CONFIG.center,
        zoom: MAPBOX_CONFIG.zoom
    });

    window.map = map;
    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', () => {
        // Simple legend
        const legend = document.createElement('div');
        legend.innerHTML = '<strong>Air Quality Map</strong><br><span style="color:#00ff00">●</span> Good<br><span style="color:#ffff00">●</span> Acceptable<br><span style="color:#ff8000">●</span> Bad<br><span style="color:#ff0000">●</span> Very Bad';
        legend.style.cssText = 'position:absolute;top:10px;left:10px;background:white;padding:10px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-size:12px;';
        document.getElementById('map').appendChild(legend);

        // Add map layers
        map.addSource('sensors', {
            type: 'vector',
            url: MAP_LAYERS.vectorTileUrl
        });

        map.addLayer({
            id: 'sensor-points',
            type: 'circle',
            source: 'sensors',
            'source-layer': MAP_LAYERS.sourceLayer,
            paint: {
                'circle-color': '#4264fb',
                'circle-radius': 9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Click handler
        map.on('click', 'sensor-points', (e) => {
            const feature = e.features[0];
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML('<h3>' + feature.properties.name + '</h3><p>Station: ' + feature.properties.key + '</p>')
                .addTo(map);
        });

        map.on('mouseenter', 'sensor-points', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'sensor-points', () => {
            map.getCanvas().style.cursor = '';
        });
    });

}, 500);
