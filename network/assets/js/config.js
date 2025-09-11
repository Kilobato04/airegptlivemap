// Configuration file - Global variables

window.MAPBOX_CONFIG = {
    accessToken: 'pk.eyJ1Ijoia2lsb2JhdG8iLCJhIjoiYTU2YmIyYzZiNjUxOGI5MDQ5YWVmNmRkZDg5ZTQ0NDQifQ.U_W7cH_L3M5l4DZX3fbljA',
    style: 'mapbox://styles/kilobato/clxo1i3qd02th01qm2op9h1a1',
    center: [-99.167213, 19.414855],
    zoom: 12.5
};

window.APP_SETTINGS = {
    refreshInterval: 3000,
    maxRetries: 3,
    activeStations: [
        // 'MicroSensor-01',    // EN REPARACIÓN
        // 'MicroSensor-02',    // EN REPARACIÓN 
        // 'MicroSensor-03',    // EN REPARACIÓN
        'UNAM',
        // 'CENTRUS 8',         // EN REPARACIÓN
        // 'CENTRUS 7',         // EN REPARACIÓN
        'Del Valle',
        'CENTRUS 5', 
        'Huerto IBERO',
        'INIAT',
        // 'IBERO A',           // EN REPARACIÓN
        // 'CENTRUS 1',         // EN REPARACIÓN
        // 'CENTRUS 2',         // EN REPARACIÓN
        'La Diana',
        // 'CENTRUS 4',         // EN REPARACIÓN
        'Hipódromo',
        'UAM',
        'INSYC',
        // 'UNAM-II-SMAA',      // EN REPARACIÓN
        'Anahuac Cancun',       // NUEVO
        'ITD',                  // NUEVO
        'Tepeji',               // NUEVO
        'AlisBio',              // NUEVO
        'AlisBio2'              // NUEVO - ACTIVO
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
        'UNAM': '349b1230277f1c67577e4f5bee6ba486',
        // 'CENTRUS 8': 'a2a9a62b622014c64426c6484334e577',         // EN REPARACIÓN
        // 'CENTRUS 7': '510a41e183a90482275b1bc8a79dfc14',         // EN REPARACIÓN
        'Del Valle': '1ae5a53b7b315c48206ffa95fdef32d8',
        'CENTRUS 5': 'c7dd6160528b3335d4f366e28a04ac80',
        'Huerto IBERO': 'b8c1bac206b358bde62cb25c374339c3',
        'INIAT': '211b4d2dd56a0ba2eb269f2eeb0945ea',
        // 'IBERO A': '1ce05f7c4d1e7a2f048bf5256285a276',           // EN REPARACIÓN
        // 'CENTRUS 1': '60374b0d5f818b9f7703cc1a27aeab48',         // EN REPARACIÓN
        // 'CENTRUS 2': '993a85c50d07d8a3c367f32d1a3d12af',         // EN REPARACIÓN
        'La Diana': '3843693a0dc1e3aca614cf3e71976527',
        // 'CENTRUS 4': 'c0ac14b4df16d24f3e403928412fdc31',         // EN REPARACIÓN
        'Hipódromo': '1c5e12e8f00c9f2cbb4c7c8f07c9d398',
        'UAM': 'b031aca25a4746368da8e718631e06e7',
        'INSYC': '3d820ec8b5149f835f6c5cc338d247e2',
        // 'UNAM-II-SMAA': '03e85a1e71f0b9ffaf041862303b250b',       // EN REPARACIÓN
        'Anahuac Cancun': 'b1a3d78281c7e0cd6cd56dad7d83353c',       // NUEVO
        'ITD': '005cdaeb7b1392ad59a4335f4a832043',                   // NUEVO
        'Tepeji': 'b44eebc1879479e4534abddccef2d0fc',               // NUEVO
        'AlisBio': '2a53e9174dcf7ee42b9c8bbda7990571',              // NUEVO
        'AlisBio2': '3f3b878fdb02f61d5ed43168c075cec8'              // NUEVO - ACTIVO
    }
};

// ADDED: Device coordinates for programmatic marker creation
window.DEVICE_COORDINATES = {
    // 'MicroSensor-01': [-99.262583, 19.370218],    // EN REPARACIÓN
    // 'MicroSensor-02': [-99.262952, 19.370842],    // EN REPARACIÓN
    // 'MicroSensor-03': [-99.263291, 19.371326],    // EN REPARACIÓN
    'UNAM': [-99.176186, 19.326172],
    // 'CENTRUS 8': [-99.173172, 19.392838],         // EN REPARACIÓN
    // 'CENTRUS 7': [-99.172752, 19.392725],         // EN REPARACIÓN
    'Del Valle': [-99.167000, 19.388391],
    'CENTRUS 5': [-99.200109, 19.365869],
    'Huerto IBERO': [-99.263649, 19.372347],
    'INIAT': [-99.263580, 19.368851],
    // 'IBERO A': [-99.263649, 19.372355],           // EN REPARACIÓN
    // 'CENTRUS 1': [-99.263489, 19.368654],         // EN REPARACIÓN
    // 'CENTRUS 2': [-99.263626, 19.368771],         // EN REPARACIÓN
    'La Diana': [-99.171021, 19.425217],
    // 'CENTRUS 4': [-99.262962, 19.371620],         // EN REPARACIÓN
    'Hipódromo': [-99.167183, 19.414782],
    'UAM': [-99.209564, 19.388735],
    'INSYC': [-99.169975, 19.406158],
    // 'UNAM-II-SMAA': [-99.176163, 19.326214],      // EN REPARACIÓN
    'Anahuac Cancun': [-86.84543905576808, 21.067920239176036],
    'ITD': [-104.645030, 24.034481],                  // NUEVO
    'Tepeji': [-99.341911, 19.905193],               // NUEVO
    'AlisBio': [-100.290960, 25.675648],             // NUEVO
    'AlisBio2': [-100.309264, 25.667362]             // NUEVO - ACTIVO (coordenadas del JSON)
};

// AGREGADO: Mapeo de modelos de dispositivos
window.DEVICE_MODELS = {
    'MicroSensor-01': 'SMAAmicro',
    'MicroSensor-02': 'SMAAmicro', 
    'MicroSensor-03': 'SMAAmicro',
    'UNAM': 'SMAA',
    'CENTRUS 8': 'SMAA',
    'CENTRUS 7': 'SMAA',
    'Del Valle': 'SMAA',
    'CENTRUS 5': 'SMAA',
    'Huerto IBERO': 'SMAA',
    'INIAT': 'SMAA',
    'IBERO A': 'SMAA',
    'CENTRUS 1': 'SMAA',
    'CENTRUS 2': 'SMAA',
    'La Diana': 'SMAA',
    'CENTRUS 4': 'SMAA',
    'Hipódromo': 'SMAA',
    'UAM': 'SMAA',
    'INSYC': 'SMAA',
    'UNAM-II-SMAA': 'SMAA',
    'Anahuac Cancun': 'SMAA',
    'ITD': 'SMAA',
    'Tepeji': 'SMAA',
    'ALISBio': 'SMAAso2',
    'ALISBio-02': 'SMAAso2'
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
