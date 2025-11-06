// Configuration file - Global variables

window.MAPBOX_CONFIG = {
    accessToken: 'pk.eyJ1Ijoia2lsb2JhdG8iLCJhIjoiYTU2YmIyYzZiNjUxOGI5MDQ5YWVmNmRkZDg5ZTQ0NDQifQ.U_W7cH_L3M5l4DZX3fbljA',
    style: 'mapbox://styles/kilobato/clxo1i3qd02th01qm2op9h1a1',
    center: [-99.15, 19.43],
    zoom: 10
};

window.APP_SETTINGS = {
    refreshInterval: 3000,
    maxRetries: 3,
    activeStations: [
        // 'MicroSensor-01',    // EN REPARACIÓN
        // 'MicroSensor-02',    // EN REPARACIÓN 
        // 'MicroSensor-03',    // EN REPARACIÓN
        //  'UNAM-CCA',         // EN REPARACIÓN
        // 'CENTRUS 8',         // EN REPARACIÓN
        // 'CENTRUS 7',         // EN REPARACIÓN
        // 'D.Valle'
        // 'CEN 5' 
        // 'Huerto INIAT',
        // 'INIAT IBERO',
        // 'IBERO A',           // EN REPARACIÓN
        // 'Zacatlan 1',         // MINA
        // 'Zacatlan 2',         // MINA
        // 'La Diana',        // EN REPARACIÓN
        // 'CENTRUS 4',         // EN REPARACIÓN
        // 'Popocatépetl',        // EN REPARACIÓN
        //  'UAM',                // EN REPARACIÓN
        //  'INSYC',            // EN REPARACIÓN
        // 'UNAM-II-SMAA',      // EN REPARACIÓN
        // 'Anahuac-Cancun',       // NUEVO
        // 'ITD-Durango',                  // NUEVO
        // 'Tepeji',            // EN REPARACIÓN
        // 'Alis-Bio',              // NUEVO
        // 'Alis-Bio2'              // NUEVO - ACTIVO
    ],
    whatsappNumber: '525519566483',
    brandUrl: 'http://www.smability.io'
};

// Air Quality Index Thresholds and Colors - OFFICIAL COLORS
window.AQI_THRESHOLDS = {
    good: { max: 50, color: '#00ff00', status: 'Good', risk: 'Low' },
    acceptable: { max: 100, color: '#ffff00', status: 'Acceptable', risk: 'Moderate' },
    bad: { max: 150, color: '#ff8000', status: 'Bad', risk: 'High' },
    veryBad: { max: 200, color: '#ff0000', status: 'Very Bad', risk: 'Very High' },
    extremelyBad: { color: '#800080', status: 'Extremely Bad', risk: 'Extremely High' }
};

window.MAP_LAYERS = {
    source: 'simat_centrus_2024',
    vectorTileUrl: 'mapbox://kilobato.clxnxjdmp10lc1prmk88qghyw-9frgp',
    sourceLayer: 'simat_centrus_2024'
};

window.API_CONFIG = {
    baseUrl: 'http://smability.sidtecmx.com/SmabilityAPI/BioBox',
    dataUrl: 'http://smability.sidtecmx.com/SmabilityAPI/GetData',
    tokens: {
        // 'MicroSensor-01': 'b9f56c2a86c59c27e23b93126c508abe',    // EN REPARACIÓN
        // 'MicroSensor-02': '941952e3aaee033b7d4a126ef7194a45',    // EN REPARACIÓN
        // 'MicroSensor-03': 'e25b9d53259785daf60e520834d3f39f',    // EN REPARACIÓN
        // 'UNAM-CCA': '349b1230277f1c67577e4f5bee6ba486',
        // 'CENTRUS 8': 'a2a9a62b622014c64426c6484334e577',         // EN REPARACIÓN
        // 'CENTRUS 7': '510a41e183a90482275b1bc8a79dfc14',         // EN REPARACIÓN
        //'D.Valle': '1ae5a53b7b315c48206ffa95fdef32d8'
        // 'CEN 5': 'c7dd6160528b3335d4f366e28a04ac80'
        // 'Huerto INIAT': 'b8c1bac206b358bde62cb25c374339c3',
        // 'INIAT IBERO': '211b4d2dd56a0ba2eb269f2eeb0945ea',
        // 'IBERO A': '1ce05f7c4d1e7a2f048bf5256285a276',           // EN REPARACIÓN
        // 'CENTRUS 1': '60374b0d5f818b9f7703cc1a27aeab48',         // EN REPARACIÓN
        // 'Zacatlan 1': '993a85c50d07d8a3c367f32d1a3d12af',         // MINA
        // 'La Diana': '3843693a0dc1e3aca614cf3e71976527',
        // 'Zacatlan 2': 'c0ac14b4df16d24f3e403928412fdc31',         // MINA
        //'Popocatépetl': '1c5e12e8f00c9f2cbb4c7c8f07c9d398',
        // 'UAM': 'b031aca25a4746368da8e718631e06e7',
        // 'INSYC': '3d820ec8b5149f835f6c5cc338d247e2',
        // 'UNAM-II-SMAA': '03e85a1e71f0b9ffaf041862303b250b',       // EN REPARACIÓN
        // 'Anahuac-Cancun': 'b1a3d78281c7e0cd6cd56dad7d83353c',       // NUEVO
        // 'ITD-Durango': '005cdaeb7b1392ad59a4335f4a832043',                   // NUEVO
        // 'Tepeji': 'b44eebc1879479e4534abddccef2d0fc',               // NUEVO
        // 'Alis-Bio': '2a53e9174dcf7ee42b9c8bbda7990571',              // NUEVO
        // 'Alis-Bio2': '3f3b878fdb02f61d5ed43168c075cec8'              // NUEVO - ACTIVO
    }
};

// ADDED: Device coordinates for programmatic marker creation
window.DEVICE_COORDINATES = {
    // 'MicroSensor-01': [-99.262583, 19.370218],    // EN REPARACIÓN
    // 'MicroSensor-02': [-99.262952, 19.370842],    // EN REPARACIÓN
    // 'MicroSensor-03': [-99.263291, 19.371326],    // EN REPARACIÓN
    // 'UNAM-CCA': [-99.176186, 19.326172],
    // 'CENTRUS 8': [-99.173172, 19.392838],         // EN REPARACIÓN
    // 'CENTRUS 7': [-99.172752, 19.392725],         // EN REPARACIÓN
    // 'D.Valle': [-99.167000, 19.388391]
    // 'CEN 5': [-99.200109, 19.365869]
    // 'Huerto INIAT': [-99.263649, 19.372347],
    // 'INIAT IBERO': [-99.263580, 19.368851],
    // 'IBERO A': [-99.263649, 19.372355],           // EN REPARACIÓN
    // 'CENTRUS 1': [-99.263489, 19.368654],         // EN REPARACIÓN
    // 'Zacatlan 1': [-98.058182, 19.984287],         // MINA
    // 'La Diana': [-99.171021, 19.425217],
    // 'Zacatlan 2': [-98.058884, 19.963730],         // MINA 
    // 'Popocatépetl': [-99.167183, 19.414782],
    // 'UAM': [-99.209564, 19.388735],
    // 'INSYC': [-99.169975, 19.406158],
    // 'UNAM-II-SMAA': [-99.176163, 19.326214],      // EN REPARACIÓN
    // 'Anahuac-Cancun': [-86.84543905576808, 21.067920239176036],
    // 'ITD-Durango': [-104.645030, 24.034481],                  // NUEVO
    // 'Tepeji': [-99.341911, 19.905193],               // NUEVO
    // 'Alis-Bio': [-100.290960, 25.675648],             // NUEVO
    // 'Alis-Bio2': [-99.995773, 25.382708]             // NUEVO - ACTIVO (coordenadas del JSON) 
};

// AGREGADO: Mapeo de modelos de dispositivos
window.DEVICE_MODELS = {
    'MicroSensor-01': 'SMAAmicro',
    'MicroSensor-02': 'SMAAmicro', 
    'MicroSensor-03': 'SMAAmicro',
    'UNAM-CCA': 'SMAA',
    'CENTRUS 8': 'SMAA',
    'CENTRUS 7': 'SMAA',
    'D.Valle': 'SMAA',
    'CEN 5': 'SMAA',
    'Huerto INIAT': 'SMAA',
    'INIAT IBERO': 'SMAA',
    'IBERO A': 'SMAA',
    'Zacatlan 1': 'SMAA',
    'Zacatlan 2': 'SMAA',
    'La Diana': 'SMAA',
    'CENTRUS 4': 'SMAA',
    'Popocatépetl': 'SMAA',
    'UAM': 'SMAA',
    'INSYC': 'SMAA',
    'UNAM-II-SMAA': 'SMAA',
    'Anahuac-Cancun': 'SMAA',
    'ITD-Durango': 'SMAA',
    'Tepeji': 'SMAA',
    'Alis-Bio': 'SMAAso2',
    'Alis-Bio2': 'SMAAso2'
};

// AGREGADO: Configuración de sensores para charts
window.SENSOR_CONFIG = {
    '12': { name: 'Temperature', units: '°C', color: '#4264fb' },
    '2': { name: 'Carbon Monoxide', units: 'ppb', color: '#ff7043' },
    '3': { name: 'Relative Humidity', units: '%', color: '#4caf50' },
    '7': { name: 'Ozone', units: 'ppb', color: '#9c27b0' },
    '9': { name: 'PM2.5', units: 'μg/m³', color: '#ff9800' }
};

window.CORS_PROXIES = [
    { name: 'allOrigins', url: 'https://api.allorigins.win/raw?url=' },
    { name: 'corsproxy.io', url: 'https://corsproxy.io/?' },
    { name: 'cors-anywhere-heroku', url: 'https://cors-anywhere.herokuapp.com/' },
    { name: 'thingproxy', url: 'https://thingproxy.freeboard.io/fetch/' },
    { name: 'corsfix', url: 'https://corsfix.com/proxy?url=' }
];

window.currentProxyIndex = 0;
window.retryCount = 0;
window.markers = new Map();

// AGREGADO: Variables globales para charts
window.currentLocation = null;
window.timeframeListener = null;
window.sensorListener = null;

// AGREGADO: Función para formatear fechas para API
window.formatDateForAPI = function(date) {
    const pad = (num) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

console.log('Config loaded successfully');

// AGREGAR al final de config.js - Funciones faltantes requeridas por map.js

/**
 * Create HTML for the map legend
 * @returns {string} HTML content for legend
 */
window.createLegendHTML = function() {
    return `
        <div class="legend-header">
            <button class="legend-toggle">−</button>
            <h4>Air Quality Index</h4>
        </div>
        <div class="legend-content">
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.good.color}"></div>
                <span>Good (0-50)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.acceptable.color}"></div>
                <span>Acceptable (51-100)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.bad.color}"></div>
                <span>Bad (101-150)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.veryBad.color}"></div>
                <span>Very Bad (151-200)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${AQI_THRESHOLDS.extremelyBad.color}"></div>
                <span>Extremely Bad (201+)</span>
            </div>
            <div class="legend-controls">
                <button id="toggleAQNetwork" class="toggle-button">AQ Network</button>
            </div>
        </div>
    `;
};

/**
 * Create popup content for map markers
 * @param {Object} feature - Map feature
 * @param {Object} sensorData - Sensor data (optional)
 * @returns {string} HTML content for popup
 */
window.createPopupContent = function(feature, sensorData = null) {
    const stationName = feature.properties.name;
    const isActiveStation = APP_SETTINGS.activeStations.includes(stationName);
    
    if (isActiveStation && sensorData) {
        // Smability station with data
        const iasValue = sensorData.displayIAS || sensorData.dataIAS || 'N/A';
        const { color, status, risk } = getIndicatorColor(iasValue);
        const lastUpdate = sensorData.displayConfig?.label || 'Unknown';
        
        return `
            <div class="popup-header">
                <h3>${stationName}</h3>
                <span class="station-type">Smability Station</span>
            </div>
            <div class="popup-content">
                <div class="ias-display">
                    <div class="ias-value" style="background-color: ${color}">
                        ${iasValue !== 'N/A' ? Math.round(iasValue) : 'N/A'}
                    </div>
                    <div class="ias-info">
                        <div class="ias-status">${status}</div>
                        <div class="ias-risk">Risk: ${risk}</div>
                    </div>
                </div>
                <div class="popup-data">
                    <div class="data-item">
                        <span>Temperature:</span>
                        <span>${sensorData.dataTemperature || 'N/A'}°C</span>
                    </div>
                    <div class="data-item">
                        <span>Humidity:</span>
                        <span>${sensorData.dataHumidity || 'N/A'}%</span>
                    </div>
                    <div class="data-item">
                        <span>Last Update:</span>
                        <span>${lastUpdate}</span>
                    </div>
                </div>
                <div class="popup-actions">
                    <button onclick="SmabilityPanels?.showPanel('${stationName}')" class="popup-btn">
                        📊 View Details
                    </button>
                </div>
            </div>
        `;
    } else {
        // SIMAT/Master API station or no data
        return `
            <div class="popup-header">
                <h3>${stationName}</h3>
                <span class="station-type">SIMAT Station</span>
            </div>
            <div class="popup-content">
                <div class="popup-info">
                    <p>Government air quality monitoring station</p>
                    <div class="data-item">
                        <span>Network:</span>
                        <span>SIMAT (Mexico City)</span>
                    </div>
                    <div class="data-item">
                        <span>Status:</span>
                        <span>Reference Station</span>
                    </div>
                </div>
                <div class="popup-links">
                    <a href="http://www.aire.cdmx.gob.mx/" target="_blank" class="popup-link">
                        🌐 Official SIMAT Portal
                    </a>
                </div>
            </div>
        `;
    }
};

/**
 * Get indicator color based on IAS value
 * @param {number|string} iasValue - IAS value
 * @returns {Object} Color, status and risk information
 */
window.getIndicatorColor = function(iasValue) {
    if (iasValue === 'N/A' || iasValue === null || iasValue === undefined) {
        return { color: '#cccccc', status: 'No Data', risk: 'Unknown' };
    }
    
    const ias = Number(iasValue);
    
    if (ias <= AQI_THRESHOLDS.good.max) {
        return { 
            color: AQI_THRESHOLDS.good.color, 
            status: AQI_THRESHOLDS.good.status,
            risk: AQI_THRESHOLDS.good.risk
        };
    } else if (ias <= AQI_THRESHOLDS.acceptable.max) {
        return { 
            color: AQI_THRESHOLDS.acceptable.color, 
            status: AQI_THRESHOLDS.acceptable.status,
            risk: AQI_THRESHOLDS.acceptable.risk
        };
    } else if (ias <= AQI_THRESHOLDS.bad.max) {
        return { 
            color: AQI_THRESHOLDS.bad.color, 
            status: AQI_THRESHOLDS.bad.status,
            risk: AQI_THRESHOLDS.bad.risk
        };
    } else if (ias <= AQI_THRESHOLDS.veryBad.max) {
        return { 
            color: AQI_THRESHOLDS.veryBad.color, 
            status: AQI_THRESHOLDS.veryBad.status,
            risk: AQI_THRESHOLDS.veryBad.risk
        };
    } else {
        return { 
            color: AQI_THRESHOLDS.extremelyBad.color, 
            status: AQI_THRESHOLDS.extremelyBad.status,
            risk: AQI_THRESHOLDS.extremelyBad.risk
        };
    }
};

console.log('✅ Config functions loaded: createLegendHTML, createPopupContent, getIndicatorColor');

// ACTUALIZADO: Mapeo completo - Estaciones Smability + Reference activas - (18 estaciones)
window.ALL_STATIONS_MAPPING = {
    // === ESTACIONES SMABILITY EXISTENTES ===
    'DVL': 'Del Valle',
    'CN2': 'CENTRUS 2',
    'CN4': 'CENTRUS 4', 
    'CN5': 'CENTRUS 5',
    'HI': 'Huerto IBERO',
    'INIAT': 'INIAT',
    'ITD': 'ITD',
    'ALISBio-02': 'ALISBio-02',
    'ALISBio': 'ALISBio',
    'MicroSensor-03': 'MicroSensor-03',
    'ANC': 'Anahuac Cancun',
    'MicroSensor-02': 'MicroSensor-02',
    'DIA': 'La Diana',              // ← NUEVA
    'UNAM': 'UNAM - ICAYCC',      // ← NUEVA - OK
    'UAM': 'UAM SF IMSS',      // ← NUEVA - OK
    'TPJ': 'Tepeji HGO',      // ← NUEVA - OK
    'INSMAA': 'INSYC-Smability',    // ← NUEVA - OK
    'HIP': 'Hipódromo',  // ← NUEVA  -OK
    
    // === ESTACIONES REFERENCE ACTIVAS (23 estaciones) ===
    'CUT': 'Cuautitlan',
    'MER': 'Merced',
    'UAX': 'UAM Xochimilco',
    'ATI': 'Atizapan',
    'TLA': 'Tlalnepantla',
    'SAC': 'Santiago Acahualtepec',
    'HGM': 'Hospital General de Mexico',
    'AJM': 'Ajusco Medio',
    'CCA': 'Centro de Ciencias de la Atmosfera',
    'FAC': 'FES Acatlan',
    'CAM': 'Camarones',
    'CUA': 'Cuajimalpa',
    'PED': 'Pedregal',
    'MGH': 'Miguel Hidalgo',
    'TLI': 'Tultitlan',
    'SAG': 'San Agustin',
    'INN': 'Investigaciones Nucleares',
    'LLA': 'Los Laureles',
    'LPR': 'La Presa',
    'VIF': 'Villa de las Flores',
    'ACO': 'Acolman', 
    'UIZ': 'UAM Iztapalapa', // ← NUEVA
    'NEZ': 'Nezahualcoyotl'
};

// NUEVO: Mapping completo de estaciones Reference (para referencia)
window.REFERENCE_STATION_MAPPING = {
    'TLI': 'Tultitlan',  // 1
    'CUA': 'Cuajimalpa', // 2
    'MGH': 'Miguel Hidalgo', // 3
    'HGM': 'Hospital General de Mexico', // 4
    'GAM': 'Gustavo A. Madero', // 5
    'SAG': 'San Agustin', // 6
    'PED': 'Pedregal', // 7
    'LAG': 'Lagunas', // 8
    'MER': 'Merced', // 9
    'TAH': 'Tlahuac', // 10
    'UIZ': 'UAM Iztapalapa', // 11
    'XAL': 'Xalostoc', // 12
    'AJM': 'Ajusco Medio', // 13
    'AJU': 'Ajusco', // 14
    'ATI': 'Atizapan', // 15
    'BJU': 'Benito Juarez', // 16
    'CAM': 'Camarones', // 17
    'CHO': 'Chalco', // 18
    'COY': 'Coyoacan', // 19
    'CUT': 'Cuautitlan', // 20
    'FAC': 'FES Acatlan', // 21
    'HAN': 'Hangares', // 22
    'IMP': 'IMP', // 23
    'IZT': 'Iztacalco', // 24
    'LPR': 'La Presa', // 25
    'MON': 'Montecillo', // 26
    'NEZ': 'Nezahualcoyotl', // 27
    'PLA': 'Plateros', // 28
    'SAC': 'Santiago Acahualtepec', // 29
    'SJA': 'San Juan Aragon', // 30
    'TAX': 'Taxqueña', // 31
    'TEC': 'Tecnologico', // 32
    'TLA': 'Tlalnepantla', // 33
    'UAX': 'UAM Xochimilco', // 34
    'LLA': 'Los Laureles', // 35
    'INN': 'Investigaciones Nucleares', // 36
    'CCA': 'Centro de Ciencias de la Atmosfera', // 37
    'ACO': 'Acolman', // 38
    'VIF': 'Villa de las Flores' // 39
};
