// Configuration file - Global variables
// Updated with Master API integration - SOLO TULTITLÁN PARA TESTING

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
        'Zacatlan 1',         // MINA
        'Zacatlan 2',         // MINA
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

// ============================================================================
// MASTER API CONFIGURATION - NUEVA CONFIGURACIÓN COMPLETA
// ============================================================================

/**
 * Configuración para la nueva API Master de AWS
 */
window.MASTER_API_CONFIG = {
    baseUrl: 'https://y4zwdmw7vf.execute-api.us-east-1.amazonaws.com/prod/api/air-quality/current',
    params: {
        type: 'reference,smaa'  // Obtener ambos tipos pero filtraremos solo reference
    },
    // Cache para evitar requests múltiples
    cache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
    lastFetch: null,
    maxRetries: 3,
    retryDelay: 2000, // 2 segundos
    
    // NUEVA: Configuración de horarios específicos (15 y 20 min después de cada hora)
    scheduleConfig: {
        // Minutos después de cada hora para hacer las actualizaciones
        updateMinutes: [15, 20],
        
        // Configuración de timeouts
        initialDelay: 3000,        // 3 segundos inicial
        retryDelay: 2000,          // 2 segundos entre reintentos
        fallbackInterval: 30 * 60 * 1000, // 30 minutos como fallback
        
        // Debug y logging
        enableScheduleLogging: true,
        logPrefix: '⏰ Master API Schedule'
    }
};

/**
 * Mapeo de station_id de la API a nombres/IDs en el mapa Mapbox
 * SOLO TULTITLÁN PARA TESTING
 */
window.REFERENCE_STATION_MAPPING = {
    // SOLO UNA ESTACIÓN PARA TESTING
    'TLI': 'Tultitlan',
    
    // COMENTADAS para testing - descomentar después:
    // 'CUA': 'Cuajimalpa', 
    // 'SAG': 'San Agustín',
    // 'PED': 'Pedregal',
    // 'LAG': 'Lagunas',
    // 'MER': 'Merced',
    // 'TAH': 'Tláhuac',
    // 'UIZ': 'UIZ',
    // 'XAL': 'Xalostoc',
    // 'AJU': 'Ajusco',
    // 'ATI': 'Atizapán',
    // 'BJU': 'Benito Juárez',
    // 'CAM': 'Camarones',
    // 'CHO': 'Chalco',
    // 'COY': 'Coyoacán',
    // 'CUT': 'Cuautitlán',
    // 'FAC': 'FES Acatlán',
    // 'HAN': 'Hangares',
    // 'IMP': 'IMP',
    // 'IZT': 'Iztacalco',
    // 'LAP': 'La Presa',
    // 'MON': 'Montecillo',
    // 'NEZ': 'Nezahualcóyotl',
    // 'PLA': 'Plateros',
    // 'SAC': 'Santa Cruz',
    // 'SFE': 'Santa Fe',
    // 'SJA': 'San Juan Aragón',
    // 'TAX': 'Taxqueña',
    // 'TEC': 'Tecnológico',
    // 'TLA': 'Tlalnepantla',
    // 'UAX': 'UAM Xochimilco',
    // 'VIF': 'Villa de las Flores'
};

/**
 * Categorías IAS con colores oficiales
 */
window.IAS_CATEGORIES = {
    'Buena': { color: '#00E400', range: '0-50' },
    'Aceptable': { color: '#FFFF00', range: '51-100' },
    'Mala': { color: '#FF7E00', range: '101-150' },
    'Muy Mala': { color: '#FF0000', range: '151-200' },
    'Extremadamente Mala': { color: '#8F3F97', range: '201+' }
};

// ============================================================================
// FUNCIONES DE SCHEDULING MASTER API
// ============================================================================

/**
 * Calcular milisegundos hasta el próximo minuto objetivo (15 o 20 después de la hora)
 * @returns {Object} - {timeUntilNext: number, targetMinute: number, targetTime: Date}
 */
window.getTimeUntilNextScheduledUpdate = function() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const targetMinutes = window.MASTER_API_CONFIG.scheduleConfig.updateMinutes;
    
    let nextTargetMinute;
    let nextTargetHour = currentHour;
    
    // Encontrar el próximo minuto objetivo
    if (currentMinute < targetMinutes[0]) {
        // Aún no llegamos al primer update (15 min)
        nextTargetMinute = targetMinutes[0];
    } else if (currentMinute < targetMinutes[1]) {
        // Entre el primer y segundo update (entre 15 y 20 min)
        nextTargetMinute = targetMinutes[1];
    } else {
        // Ya pasaron ambos updates, ir a la próxima hora
        nextTargetMinute = targetMinutes[0];
        nextTargetHour = currentHour + 1;
        if (nextTargetHour >= 24) nextTargetHour = 0;
    }
    
    const targetTime = new Date(now);
    targetTime.setHours(nextTargetHour);
    targetTime.setMinutes(nextTargetMinute);
    targetTime.setSeconds(0);
    targetTime.setMilliseconds(0);
    
    // Si la hora objetivo es menor que la actual, debe ser del día siguiente
    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const timeUntilNext = targetTime.getTime() - now.getTime();
    
    return {
        timeUntilNext,
        targetMinute: nextTargetMinute,
        targetTime,
        currentTime: now
    };
};

/**
 * Formatear tiempo para logging legible
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
window.formatTimeForLogging = function(date) {
    return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

/**
 * Log para el sistema de scheduling
 * @param {string} message - Mensaje a loggear
 * @param {Object} data - Datos adicionales (opcional)
 */
window.logSchedule = function(message, data = null) {
    if (window.MASTER_API_CONFIG.scheduleConfig.enableScheduleLogging) {
        const prefix = window.MASTER_API_CONFIG.scheduleConfig.logPrefix;
        if (data) {
            console.log(`${prefix}: ${message}`, data);
        } else {
            console.log(`${prefix}: ${message}`);
        }
    }
};

/**
 * Validar si una estación reference está en el mapeo
 * @param {string} stationId - ID de la estación
 * @returns {boolean} - true si está mapeada
 */
window.isValidReferenceStation = function(stationId) {
    return Object.prototype.hasOwnProperty.call(window.REFERENCE_STATION_MAPPING, stationId);
};

/**
 * Obtener nombre mapeado de estación
 * @param {string} stationId - ID de la estación de la API
 * @returns {string} - Nombre mapeado o el ID original
 */
window.getMappedStationName = function(stationId) {
    return window.REFERENCE_STATION_MAPPING[stationId] || stationId;
};

/**
 * Debug function para el sistema de scheduling
 */
window.debugScheduling = function() {
    const scheduleInfo = window.getTimeUntilNextScheduledUpdate();
    const config = window.MASTER_API_CONFIG.scheduleConfig;
    
    console.log('=== MASTER API SCHEDULING DEBUG ===');
    console.log('Current time:', window.formatTimeForLogging(scheduleInfo.currentTime));
    console.log('Next update at:', window.formatTimeForLogging(scheduleInfo.targetTime));
    console.log('Time until next update:', Math.round(scheduleInfo.timeUntilNext / 1000), 'seconds');
    console.log('Target minute:', scheduleInfo.targetMinute);
    console.log('Update minutes configured:', config.updateMinutes);
    console.log('Schedule logging enabled:', config.enableScheduleLogging);
    console.log('====================================');
};

/**
 * Debug function para listar todas las configuraciones de Master API
 */
window.debugMasterAPIConfig = function() {
    console.log('=== MASTER API DEBUG CONFIG ===');
    console.log('Base URL:', window.MASTER_API_CONFIG.baseUrl);
    console.log('Params:', window.MASTER_API_CONFIG.params);
    console.log('Cache timeout:', window.MASTER_API_CONFIG.cacheTimeout / 1000, 'seconds');
    console.log('Reference mappings:', Object.keys(window.REFERENCE_STATION_MAPPING).length, 'stations');
    console.log('Mapped stations:', Object.keys(window.REFERENCE_STATION_MAPPING));
    console.log('IAS Categories:', Object.keys(window.IAS_CATEGORIES));
    console.log('Scheduling config:', window.MASTER_API_CONFIG.scheduleConfig);
    console.log('================================');
};

// ============================================================================
// CONFIGURACIÓN ORIGINAL MANTENIDA (Smability)
// ============================================================================

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
        'Zacatlan 1': '993a85c50d07d8a3c367f32d1a3d12af',         // MINA
        'La Diana': '3843693a0dc1e3aca614cf3e71976527',
        'Zacatlan 2': 'c0ac14b4df16d24f3e403928412fdc31',         // MINA
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
    'Zacatlan 1': [-98.058182, 19.984287],         // MINA
    'La Diana': [-99.171021, 19.425217],
    'Zacatlan 2': [-98.058884, 19.963730],         // MINA 
    'Hipódromo': [-99.167183, 19.414782],
    'UAM': [-99.209564, 19.388735],
    'INSYC': [-99.169975, 19.406158],
    // 'UNAM-II-SMAA': [-99.176163, 19.326214],      // EN REPARACIÓN
    'Anahuac Cancun': [-86.84543905576808, 21.067920239176036],
    'ITD': [-104.645030, 24.034481],                  // NUEVO
    'Tepeji': [-99.341911, 19.905193],               // NUEVO
    'AlisBio': [-100.290960, 25.675648],             // NUEVO
    'AlisBio2': [-99.995773, 25.382708]             // NUEVO - ACTIVO (coordenadas del JSON) 
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
    'Zacatlan 1': 'SMAA',
    'Zacatlan 2': 'SMAA',
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

console.log('✅ Config loaded successfully with Master API integration');
console.log('📡 Master API Config ready:', !!window.MASTER_API_CONFIG);
console.log('🗺️ Reference station mappings:', Object.keys(window.REFERENCE_STATION_MAPPING || {}).length);
console.log('🎯 Testing with station:', Object.keys(window.REFERENCE_STATION_MAPPING)[0]);
