// Configuration file - Global variables

window.MAPBOX_CONFIG = {
    accessToken: 'pk.eyJ1Ijoia2lsb2JhdG8iLCJhIjoiYTU2YmIyYzZiNjUxOGI5MDQ5YWVmNmRkZDg5ZTQ0NDQifQ.U_W7cH_L3M5l4DZX3fbljA',
    style: 'mapbox://styles/kilobato/clxo1i3qd02th01qm2op9h1a1',
    center: [-99.167213, 19.414855],
    zoom: 12.5
};

// NUEVO: Función para cargar configuración desde JSON
window.loadDevicesFromJSON = async function() {
    try {
        const response = await fetch('./assets/js/smaadevices.json');
        const devicesData = await response.json();
        
        // Limpiar configuraciones existentes
        window.APP_SETTINGS.activeStations = [];
        window.API_CONFIG.tokens = {};
        window.DEVICE_COORDINATES = {};
        
        // Cargar solo dispositivos activos de Mexico City
        devicesData.devices
            .filter(device => device.active && device.location.city === 'Mexico City')
            .forEach(device => {
                const stationName = device.station_name;
                
                // Agregar a estaciones activas
                window.APP_SETTINGS.activeStations.push(stationName);
                
                // Agregar token
                window.API_CONFIG.tokens[stationName] = device.token;
                
                // Agregar coordenadas
                window.DEVICE_COORDINATES[stationName] = [device.location.longitude, device.location.latitude];
            });
            
        console.log('Devices loaded from JSON:', window.APP_SETTINGS.activeStations.length);
        return true;
        
    } catch (error) {
        console.error('Error loading devices from JSON:', error);
        // Fallback a configuración manual si falla
        return false;
    }
};

window.APP_SETTINGS = {
    refreshInterval: 3000,
    maxRetries: 3,
    activeStations: [], // ADDED La Diana
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
    tokens: {}
};

// ADDED: Device coordinates for programmatic marker creation
window.DEVICE_COORDINATES = {};

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

// NUEVO: Inicializar configuración al cargar
window.addEventListener('DOMContentLoaded', async () => {
   const jsonLoaded = await window.loadDevicesFromJSON();
   
   if (!jsonLoaded) {
       console.warn('Fallback to manual configuration');
       
       window.APP_SETTINGS.activeStations = [
           'Hipódromo', 'UNAM', 'INSYC', 'CENTRUS 5', 'La Diana', 
           'Huerto IBERO', 'INIAT', 'Del Valle'
       ];
       
       window.API_CONFIG.tokens = {
           'Hipódromo': '1c5e12e8f00c9f2cbb4c7c8f07c9d398',
           'UNAM': '349b1230277f1c67577e4f5bee6ba486',
           'INSYC': '3d820ec8b5149f835f6c5cc338d247e2',
           'CENTRUS 5': 'c7dd6160528b3335d4f366e28a04ac80',
           'La Diana': '3843693a0dc1e3aca614cf3e71976527',
           'Huerto IBERO': 'b8c1bac206b358bde62cb25c374339c3',
           'INIAT': '211b4d2dd56a0ba2eb269f2eeb0945ea',
           'Del Valle': '1ae5a53b7b315c48206ffa95fdef32d8'
       };
       
       window.DEVICE_COORDINATES = {
           'Hipódromo': [-99.167213, 19.414855],
           'UNAM': [-99.176137, 19.326450],
           'INSYC': [-99.169991, 19.406170],
           'CENTRUS 5': [-99.200109, 19.365869],
           'La Diana': [-99.17122087577197, 19.42396506697864],
           'Huerto IBERO': [-99.263649, 19.372347],
           'INIAT': [-99.263580, 19.368851],
           'Del Valle': [-99.167000, 19.388391]
       };
   }
   
   console.log('Config loaded successfully');
});
