// ============================================================================
// MASTER API CONFIGURATION - Archivo separado
// network/assets/js/master-api-config.js
// ============================================================================

/**
 * Configuración para la API Master de AWS
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
    
    // Configuración de horarios específicos (15 y 20 min después de cada hora)
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
 * Expandir según se necesiten más estaciones
 */
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

/**
 * Mapeo de estaciones SMAA (Smability)
 */
window.SMAA_STATION_MAPPING = {
    'DVL': 'Del Valle', // 40 - Smability
    'HRT': 'Huerto IBERO', // 41 - Smability
    'CN2': 'CENTRUS 2', // 42 - Smability
    'CN4': 'CENTRUS 4' // 43 - Smability
    'INI': 'INIAT' // 44 - Smability
    'CN5': 'CENTRUS 5' // 45 - Smability
    'ITD': 'ITD' // 46 - Smability
    'ANC': 'Anahuac Cancun' // 47 - Smability
};

/**
 * Mapeo combinado de todas las estaciones
 */
window.ALL_STATIONS_MAPPING = {
    ...window.REFERENCE_STATION_MAPPING,
    ...window.SMAA_STATION_MAPPING
};

/**
 * Categorías IAS con colores oficiales
 * Para mapear color_code de la API con categorías conocidas
 */
window.IAS_CATEGORIES = {
    'Buena': { color: '#00E400', range: '0-50' },
    'Aceptable': { color: '#FFFF00', range: '51-100' },
    'Mala': { color: '#FF7E00', range: '101-150' },
    'Muy Mala': { color: '#FF0000', range: '151-200' },
    'Extremadamente Mala': { color: '#8F3F97', range: '201+' }
};

// ============================================================================
// FUNCIONES DE UTILIDAD PARA SCHEDULING
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

// ============================================================================
// FUNCIONES DE VALIDACIÓN Y DEBUG
// ============================================================================

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
    console.log('Active mappings:');
    Object.entries(window.REFERENCE_STATION_MAPPING).forEach(([id, name]) => {
        console.log(`  ${id} → ${name}`);
    });
    console.log('================================');
};

console.log('✅ Master API Configuration loaded');
console.log('📡 Master API Config ready:', !!window.MASTER_API_CONFIG);
console.log('🗺️ Reference station mappings:', Object.keys(window.REFERENCE_STATION_MAPPING || {}).length);
console.log('🎯 Active stations:', Object.keys(window.REFERENCE_STATION_MAPPING).join(', '));
