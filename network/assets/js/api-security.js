/**
 * Sistema de protección API - Sencillo pero robusto
 * Mantiene logs para debugging, previene extracción automática
 */

window.APIProtection = (function() {
    'use strict';
    
    // Ofuscación multi-capa del endpoint
    const obfuscatedParts = [
        'aHR0cHM6Ly95NHp3ZG13N3Zm', // https://y4zwdmw7vf
        'LmV4ZWN1dGUtYXBpLnVzLWVhc3QtMS5hbWF6b25hd3MuY29t', // .execute-api.us-east-1.amazonaws.com
        'L3Byb2QvYXBpL2Fpci1xdWFsaXR5', // /prod/api/air-quality
        'L2N1cnJlbnQ=', // /current
        'L3NhdGF0aW9u' // /satation
    ];
    
    // Verificaciones anti-bot/scraping
    function isLegitimateUser() {
        // Verificar que hay interacción humana
        const hasUserInteraction = window.performance.timing.loadEventEnd > 0;
        const hasValidReferrer = document.referrer.includes('smability') || document.referrer === '';
        const notHeadless = window.navigator.webdriver !== true;
        const hasValidTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        return hasUserInteraction && hasValidReferrer && notHeadless && hasValidTimezone;
    }
    
    // Construir URL solo si pasa verificaciones
    function buildSecureURL(endpoint) {
        if (!isLegitimateUser()) {
            throw new Error('Access denied: Invalid session');
        }
        
        // Decodificar y reconstruir
        const baseUrl = atob(obfuscatedParts[0]) + atob(obfuscatedParts[1]);
        const apiPath = atob(obfuscatedParts[2]);
        
        switch(endpoint) {
            case 'current':
                return baseUrl + apiPath + atob(obfuscatedParts[3]);
            case 'historical':
                return baseUrl + apiPath + atob(obfuscatedParts[4]);
            default:
                throw new Error('Invalid endpoint');
        }
    }
    
    // Llamada segura MINIMALISTA - Sin headers CORS problemáticos
    async function secureCall(endpoint, params = '', options = {}) {
        try {
            const url = buildSecureURL(endpoint) + params;
            
            const logId = Math.random().toString(36).substring(7);
            const endpointHash = btoa(endpoint).substring(0, 6);
            
            console.log(`🔐 APISecCall[${logId}] ${endpointHash} -> Checking...`);
            
            // FETCH MINIMALISTA - Sin headers que causen CORS preflight
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log(`✅ APISecCall[${logId}] Success: ${data?.length || data?.stations?.length || 'data'} items`);
            
            return data;
            
        } catch (error) {
            console.error(`❌ APISecCall error: ${error.message}`);
            throw new Error('API communication failed');
        }
    }
    
    // Detector de intentos de extracción
    let callCount = 0;
    const startTime = Date.now();
    
    function detectExtractionAttempt() {
        callCount++;
        const elapsed = Date.now() - startTime;
        const callsPerMinute = (callCount / elapsed) * 60000;
        
        // Más de 10 llamadas por minuto = posible bot
        if (callsPerMinute > 10 && callCount > 5) {
            console.warn('🚨 High API usage detected - throttling');
            return new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay
        }
        
        return Promise.resolve();
    }
    
    return {
        call: async function(endpoint, params = '') {
            await detectExtractionAttempt();
            return secureCall(endpoint, params);
        },
        
        // Para debugging - muestra estado sin exponer URLs
        getDebugInfo: function() {
            return {
                callCount: callCount,
                avgCallsPerMin: Math.round((callCount / (Date.now() - startTime)) * 60000 * 100) / 100,
                legitimateUser: isLegitimateUser(),
                sessionAge: Math.round((Date.now() - startTime) / 1000) + 's'
            };
        }
    };
})();
