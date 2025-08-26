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
    activeStations: ['Hipódromo', 'UNAM', 'INSYC-Smability', 'CENTRUS 5', 'La Diana'], // ADDED La Diana
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
        'Hipódromo': '1c5e12e8f00c9f2cbb4c7c8f07c9d398',
        'UNAM': '349b1230277f1c67577e4f5bee6ba486',
        'INSYC-Smability': '3d820ec8b5149f835f6c5cc338d247e2',
        'CENTRUS 5': 'c7dd6160528b3335d4f366e28a04ac80', // ADDED CENTRUS 5 with correct token
        'La Diana': '3843693a0dc1e3aca614cf3e71976527' // ADDED La Diana
    }
};

// ADDED: Device coordinates for programmatic marker creation
window.DEVICE_COORDINATES = {
    'Hipódromo': [-99.167213, 19.414855], // Approximate - update with real coordinates
    'UNAM': [-99.191376, 19.332607], // Approximate - update with real coordinates  
    'INSYC-Smability': [-99.133208, 19.432608], // Approximate - update with real coordinates
    'CENTRUS 5': [-99.170692, 19.409618], // ADDED CENTRUS 5 with provided coordinates
    'La Diana': [-99.171021, 19.425217] // ADDED La Diana igual a CENTRUS 3 
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
    { name: 'cors.sh', url: 'https://cors.sh/' },
    { name: 'thingproxy', url: 'https://thingproxy.freeboard.io/fetch/' },
    { name: 'proxy.cors.sh', url: 'https://proxy.cors.sh/' }
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
