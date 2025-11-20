/**
 * ==============================================
 * ARCHIVO: master-api-panels.js - LÓGICA HOMOLOGADA
 * DESCRIPCIÓN: Panel idéntico a SmabilityPanels
 * ==============================================
 */

window.MasterAPIPanels = (function() {
    'use strict';

    // Variables privadas del módulo
    let currentState = 1; // 1: oculto, 2: panel visible
    let currentStation = null;

    /**
     * Mostrar panel con datos de Master API - CON RESET DE GRÁFICA
     */
    function showPanel(stationName) {
        console.log(`MasterAPIPanels: Showing panel for ${stationName} in DEFAULT state`);
        
        // REFORZADO: Limpieza agresiva de popups
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach(popup => {
            popup.remove();
            console.log('🗑️ Removed existing Mapbox popup');
        });
        
        // Limpiar después de un delay también
        setTimeout(() => {
            const laterPopups = document.querySelectorAll('.mapboxgl-popup');
            laterPopups.forEach(popup => popup.remove());
        }, 50);
        
        currentStation = stationName;
        
        // CLAVE: SIEMPRE resetear a estado default ANTES de mostrar
        resetChartArea();
        
        // Mostrar container
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            container.style.display = 'block';
            console.log('✅ Container display set to block');
            setupClickOutsideListener(container);
        }
    
        // Forzar estilos del panel en modo DEFAULT
        const panel = document.getElementById('masterAPIMainPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.style.transform = 'translateX(0px)';
            panel.style.opacity = '1';
            panel.style.visibility = 'visible';
            panel.style.maxHeight = '55vh'; // FORZAR altura default
            console.log('✅ Panel forced visible in DEFAULT state');
        }
    
        // NUEVO: Reset preventivo de colores antes de actualizar datos
        const allElements = [
            'masterAPIO3', 'masterAPICO', 'masterAPIPM25', 'masterAPIPM10',
            'masterAPITemperature', 'masterAPIHumidity', 'masterAPIBattery',
            'masterAPILocation', 'masterAPIDeviceMode', 'masterAPIReadingStatus',
            'masterAPIDominantPollutant'
        ];
        
        allElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.color = '#000000'; // Reset a negro por defecto
            }
        });
    
        // Configuración default
        updatePanelColors('#ffff00', 0);
        setupChartControls();
        setState(2); // FORZAR estado default/compacto
        updateWithRealData(stationName); // ← SOLO UNA VEZ
        
        console.log('✅ Panel opened with color reset and DEFAULT/COMPACT state');
    }
    
    /**
     * ACTUALIZADO: Forzar estado default/compacto SIEMPRE
     */
    function resetChartArea() {
        console.log('🔄 Resetting to DEFAULT state for new station');
        
        // 1. Contraer panel a altura default
        const mainPanel = document.getElementById('masterAPIMainPanel');
        if (mainPanel) {
            mainPanel.style.maxHeight = '55vh'; // Altura default
        }
        
        // 2. Ocultar contenedor de gráfica
        const chartContainer = document.getElementById('masterAPIInlineChartContainer');
        if (chartContainer) {
            chartContainer.style.display = 'none';
        }
        
        // 3. NUEVO: Forzar datos expandidos a estado colapsado
        const expandedContent = document.getElementById('masterAPIExpandedContent');
        if (expandedContent) {
            expandedContent.style.display = 'none';
        }
        
        // 4. Limpiar gráfico Plotly
        const chartDiv = document.getElementById('masterAPIInlineChart');
        if (chartDiv && window.Plotly) {
            try {
                Plotly.purge(chartDiv);
                chartDiv.style.display = 'none';
                chartDiv.classList.remove('active');
            } catch (error) {
                console.warn('Warning purging chart:', error);
            }
        }
        
        // 5. Resetear placeholder
        const placeholder = document.getElementById('masterAPIChartPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.innerHTML = `
                📊 Master API Historical Data<br>
                <small style="margin-top: 8px; display: block;">36-hour readings visualization</small>
            `;
        }
        
        // 6. Resetear dropdown a IAS por defecto
        const variableSelect = document.getElementById('masterAPIVariableSelect');
        if (variableSelect) {
            variableSelect.value = 'ias';
        }
        
        // 7. CLAVE: Resetear estado interno a DEFAULT
        currentState = 2; // Panel visible en modo compacto/default
        
        console.log('✅ Reset complete - DEFAULT/COMPACT state enforced');
    }

        /**
         * NUEVA: Configurar click fuera para cerrar panel
         */
        function setupClickOutsideListener(container) {
            // Remover listener previo si existe
            if (container._clickOutsideHandler) {
                container.removeEventListener('click', container._clickOutsideHandler);
            }
            
            // Función para manejar click fuera
            const clickOutsideHandler = function(event) {
                const panel = document.getElementById('masterAPIMainPanel');
                
                // Si el click fue fuera del panel (pero dentro del container)
                if (panel && !panel.contains(event.target)) {
                    console.log('🖱️ Click outside panel detected, closing...');
                    closePanel();
                }
            };
            
            // Guardar referencia y agregar listener
            container._clickOutsideHandler = clickOutsideHandler;
            container.addEventListener('click', clickOutsideHandler);
        }
        
    /**
     * ACTUALIZADO: Cerrar y preparar para próxima apertura default
     */
    function closePanel() {
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            container.style.display = 'none';
        }
        
        // IMPORTANTE: Reset completo para próxima apertura
        resetChartArea();
        
        setState(1); // Cerrado
        currentStation = null;
        
        console.log('✅ Panel closed - ready for next DEFAULT opening');
    }

    /**
     * VERIFICAR: Que esta función maneje todos los campos
     */
    function updatePanelContent(stationName, data) {
        const title = document.getElementById('masterAPIPanelTitle');
        const subtitle = document.getElementById('masterAPIPanelSubtitle');
        
        if (title) title.textContent = stationName;
        if (subtitle) subtitle.textContent = data.subtitle || 'Air Quality Monitor'; // ← ASEGURAR subtítulo
    
        const emoji = document.getElementById('masterAPIIasEmoji');
        const value = document.getElementById('masterAPIIasValue');
        const status1 = document.getElementById('masterAPIStatusText1');
        const status2 = document.getElementById('masterAPIStatusText2');
        
        if (emoji) emoji.textContent = data.emoji;
        if (value) value.textContent = data.ias;        // ← DEBE recibir 'ias'
        if (status1) status1.textContent = data.category;
        if (status2) status2.textContent = data.risk;   // ← DEBE recibir 'risk'
    
        const pollutant = document.getElementById('masterAPIDominantPollutant');
        if (pollutant) pollutant.textContent = data.dominantPollutant;
    }

    /**
     * ACTUALIZADO: Con manejo de estado offline
     */
    async function updateWithRealData(stationName) {
        try {
            console.log(`MasterAPIPanels: Fetching real data for ${stationName}`);
            
            const stationData = await findStationDataInMasterAPI(stationName);
            
            if (stationData && stationData.reading_status === 'current') {
                console.log('MasterAPIPanels: Current data found for station:', stationName);
                updatePanelWithAPIData(stationData);
            } else {
                console.log(`MasterAPIPanels: No current data for ${stationName} - setting offline state`);
                setOfflineState(stationData, stationName);  // ← AGREGAR ESTA LÍNEA
            }
        } catch (error) {
            console.error(`MasterAPIPanels: Error fetching data for ${stationName}:`, error);
            setOfflineState(null, stationName);  // ← AGREGAR ESTA LÍNEA
        }
    }

        /**
     * NUEVO: Manejar estado offline para estación específica
     */
    function setOfflineState(stationData, stationName) {
        console.log(`❌ Setting offline state for ${stationName}`);
        
        // SOLUCIÓN ELEGANTE: N/A cuando no hay datos del API
        let deviceType = 'N/A';
        let location = 'N/A';
        
        if (stationData) {
            // Solo usar datos reales del API cuando estén disponibles
            deviceType = getDeviceTypeLabel(stationData.device_type);
            location = stationData.city || 'N/A';
        }
        // NO hardcodear nada - dejar N/A hasta que el API proporcione datos
        
        const subtitle = `${deviceType} - ${location}`;
        
        // Panel en estado offline
        updatePanelContent(stationName, {
            subtitle: subtitle,
            emoji: '😴',
            ias: 'N/A',
            color: '#cccccc',
            colorName: 'Gris',
            category: 'No Data',
            risk: 'Unknown',
            dominantPollutant: 'N/A',
            lastUpdate: 'Offline'
        });
        
        // Colores grises
        updatePanelColors('#cccccc', null);
        
        // Datos detallados en N/A
        setOfflineDetailedData();
        
        // FOOTER OFFLINE FORZADO con botón compartir completo
        const footer = document.querySelector('.master-api-footer');
        if (footer) {
            footer.innerHTML = `
                <span class="master-api-last-update" style="color: #cc0000; font-weight: bold;">Status: Offline</span>
                <span style="display: flex; align-items: center;">
                    <a href="https://smability.io/en/" target="_blank" class="master-api-branding">smability.io</a>
                    <button class="master-api-share-btn" onclick="MasterAPIPanels.toggleShareModal()" title="Compartir lectura">
                    </button>
                    <div class="master-api-share-modal" id="masterAPIShareModal">
                        <div class="master-api-share-options">
                            <a href="#" class="master-api-share-option whatsapp" onclick="MasterAPIPanels.shareVia('whatsapp')">
                                <span class="master-api-share-option-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.555" fill="#25D366"/>
                                    </svg>
                                </span>
                                WhatsApp
                            </a>
                            <a href="#" class="master-api-share-option telegram" onclick="MasterAPIPanels.shareVia('telegram')">
                                <span class="master-api-share-option-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#0088CC"/>
                                    </svg>
                                </span>
                                Telegram
                            </a>
                            <a href="#" class="master-api-share-option twitter" onclick="MasterAPIPanels.shareVia('twitter')">
                                <span class="master-api-share-option-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000"/>
                                    </svg>
                                </span>
                                Twitter/X
                            </a>
                            <a href="#" class="master-api-share-option copy" onclick="MasterAPIPanels.shareVia('copy')">
                                <span class="master-api-share-option-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#6c757d"/>
                                    </svg>
                                </span>
                                Copiar enlace
                            </a>
                        </div>
                    </div>
                </span>
            `;
            
            console.log(`🔴 Footer set to offline with share button for ${stationName}`);
        }
        
        console.log(`⚪ ${stationName} panel set to offline state`);
    }

    /**
     * CORREGIDO: Datos detallados en estado offline - TODOS en gris
     */
    function setOfflineDetailedData() {
        const elements = [
            'masterAPIO3', 'masterAPICO', 'masterAPIPM25', 'masterAPIPM10',
            'masterAPITemperature', 'masterAPIHumidity', 'masterAPIBattery',
            'masterAPILocation', 'masterAPIDeviceMode', 'masterAPIReadingStatus',
            'masterAPIDominantPollutant'  // ← AGREGAR: El campo problemático
        ];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = 'N/A';
                element.style.color = '#999999'; // ← FORZAR: Gris claro para todos
                console.log(`🔘 Set ${elementId} to offline state (gray)`);
            }
        });
        
        console.log('✅ All detailed data fields set to offline gray state');
    }

    /**
     * NUEVO: Footer para estado offline con última actividad
     */


    /**
     * CORREGIDO: Con subtítulo dinámico tipo + ubicación
     */
    function updatePanelWithAPIData(stationData) {
        const panelData = mapMasterAPIData(stationData);
        
        // NUEVO: Crear subtítulo dinámico
        const deviceType = getDeviceTypeLabel(stationData.device_type);
        const location = stationData.city || 'Mexico City';
        const subtitle = `${deviceType} - ${location}`;
        
        updatePanelContent(currentStation, {
            subtitle: subtitle,                        // ← DINÁMICO: "Reference - Mexico City"
            emoji: panelData.emoji,
            ias: panelData.iasValue,                   
            color: panelData.color,
            colorName: panelData.colorName,
            category: panelData.category,
            risk: panelData.risk,                      
            dominantPollutant: panelData.dominantPollutant,
            lastUpdate: panelData.lastUpdate
        });
        
        updatePanelColors(panelData.color, panelData.iasValue);
        updateDetailedData(panelData, stationData);
        // AGREGAR LOG TEMPORAL:
        console.log('🔄 About to call updatePanelFooter for:', currentStation);
        console.log('📊 Footer data check - reading_status:', stationData.reading_status);
        console.log('📊 Footer data check - reading_time_UTC6:', stationData.reading_time_UTC6);
        updatePanelFooter(stationData);
        console.log('✅ updatePanelFooter completed for:', currentStation);
    }

    /**
     * CORREGIDO: Actualizar datos detallados con reset de colores
     */
    function updateDetailedData(panelData, stationData) {
        console.log('🔄 Updating detailed data with color reset');
        
        // NUEVO: Reset de colores a negro para todos los elementos
        const allDataElements = [
            'masterAPIReadingStatus', 'masterAPIO3', 'masterAPICO', 'masterAPIPM25', 'masterAPIPM10',
            'masterAPITemperature', 'masterAPIHumidity', 'masterAPIBattery',
            'masterAPILocation', 'masterAPIDeviceMode', 'masterAPIDominantPollutant'
        ];
        
        allDataElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.style.color = '#000000'; // ← RESETEAR: A negro original
            }
        });
        
        // Reading Status
        const readingStatus = document.getElementById('masterAPIReadingStatus');
        if (readingStatus) readingStatus.textContent = getStatusLabel(stationData.reading_status);
        
        // Pollutants
        const o3 = document.getElementById('masterAPIO3');
        const co = document.getElementById('masterAPICO');
        const pm25 = document.getElementById('masterAPIPM25');
        const pm10 = document.getElementById('masterAPIPM10');
        
        if (o3) o3.textContent = formatValue(panelData.o3, 'ppb');
        if (co) co.textContent = formatValue(panelData.co8h, 'ppb');
        if (pm25) pm25.textContent = formatValue(panelData.pm25, 'μg/m³');
        if (pm10) pm10.textContent = formatValue(panelData.pm10, 'μg/m³');
        
        // Environmental
        const temp = document.getElementById('masterAPITemperature');
        const humidity = document.getElementById('masterAPIHumidity');
        const battery = document.getElementById('masterAPIBattery');
        
        if (temp) temp.textContent = formatValue(panelData.temperature, '°C');
        if (humidity) humidity.textContent = formatValue(panelData.humidity, '%');
        if (battery) battery.textContent = formatValue(panelData.battery, '%');
        
        // Info
        const location = document.getElementById('masterAPILocation');
        const deviceMode = document.getElementById('masterAPIDeviceMode');
        
        if (location) location.textContent = panelData.placement;
        if (deviceMode) deviceMode.textContent = panelData.deviceMode;
        
        // NUEVO: Asegurar que Dominant Pollutant también se resetee
        const dominantPollutant = document.getElementById('masterAPIDominantPollutant');
        if (dominantPollutant) {
            dominantPollutant.style.color = '#000000'; // ← FORZAR negro
            dominantPollutant.textContent = panelData.dominantPollutant || 'N/A';
        }
        
        // Footer
        const lastUpdate = document.getElementById('masterAPILastUpdate');
        if (lastUpdate) lastUpdate.textContent = `Last update: ${panelData.lastUpdate}`;
        
        console.log('✅ All colors reset to black for online station');
    }

        /**
         * MOBILE-COMPATIBLE: Footer simplificado
         */
        function updatePanelFooter(stationData) {
            console.log('🚀 updatePanelFooter STARTED for station data:', stationData?.station_name || 'unknown');
            
            const lastUpdateElement = document.getElementById('masterAPILastUpdate');
            
            if (!lastUpdateElement) {
                console.log('❌ lastUpdateElement not found');
                return;
            }
            
            // AGREGAR: Logs detallados de verificación
            console.log('🔍 Verification check:');
            console.log('  - stationData exists:', !!stationData);
            console.log('  - reading_time_UTC6:', stationData?.reading_time_UTC6);
            console.log('  - reading_status:', stationData?.reading_status);
            
            // NUEVO: PRIMERO detectar si el footer está offline
            const currentFooter = document.getElementById('masterAPILastUpdate');
            const isCurrentlyOffline = currentFooter && currentFooter.textContent.includes('Offline');
            
            console.log('🔍 Current footer state:');
            console.log('  - isCurrentlyOffline:', isCurrentlyOffline);
            console.log('  - currentFooter text:', currentFooter?.textContent);
        
            // VERIFICACIÓN MEJORADA: Solo salir si NO hay datos Y NO había footer offline
            if (!stationData || !stationData.reading_time_UTC6 || stationData.reading_status !== 'current') {
                console.log('❌ EARLY RETURN: Verification failed');
                if (!isCurrentlyOffline) {
                    console.log('📅 Station has no current data, maintaining offline footer state');
                    return;
                } else {
                    console.log('⚠️ Station has no current data but footer was offline - this should not happen');
                    return;
                }
            }
        
            console.log('✅ Verification passed, continuing with footer update');
            
            if (isCurrentlyOffline) {
                console.log('🔄 Footer was offline, forcing update to live state for valid station data');
            }
            
            try {
                let timeText = 'Recently updated'; // Valor por defecto
                let footerColor = '#00aa00'; 
                
                if (stationData.reading_time_UTC6) {
                    // MOBILE FIX: Parsing más simple
                    const timeStr = stationData.reading_time_UTC6;
                    const now = new Date();
                    
                    // Parsing simplificado para móvil
                    let updateTime;
                    try {
                        updateTime = new Date(timeStr.replace(' ', 'T') + '-06:00');
                    } catch (e) {
                        updateTime = new Date(timeStr + ' UTC-6');
                    }
                    
                    if (!isNaN(updateTime.getTime())) {
                        const diffMs = now - updateTime;
                        const diffMinutes = Math.floor(diffMs / (1000 * 60));
                        const diffHours = Math.floor(diffMinutes / 60);
                        
                        let status = 'Live';
                        
                        // NUEVA LÓGICA: Live solo ≤ 1 hora
                        if (diffHours > 24) {
                            status = 'Offline';
                            footerColor = '#cc0000';
                        } else if (diffHours > 8) {
                            status = 'Stale';
                            footerColor = '#888888';
                        } else if (diffHours > 1) {
                            status = 'Recent';
                            footerColor = '#ff8800';
                        } else {
                            status = 'Live';
                            footerColor = '#00aa00';
                        }
                        
                        const timeAgo = diffMinutes < 60 ? `${diffMinutes}m` : `${diffHours}h`;
                        timeText = `Updated ${timeAgo} ago • ${status}`;
                    }
                }
                
                // CREAR HTML del footer con el texto calculado
                const footerHTML = `
                    <span class="master-api-last-update" style="color: ${footerColor}; font-weight: bold;">${timeText}</span>
                    <span style="display: flex; align-items: center;">
                        <a href="https://smability.io/en/" target="_blank" class="master-api-branding">smability.io</a>
                        <button class="master-api-share-btn" onclick="MasterAPIPanels.toggleShareModal()" title="Compartir lectura">
                        </button>
                            <div class="master-api-share-modal" id="masterAPIShareModal">
                                <div class="master-api-share-options">
                                    <a href="#" class="master-api-share-option whatsapp" onclick="MasterAPIPanels.shareVia('whatsapp')">
                                        <span class="master-api-share-option-icon">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.555" fill="#25D366"/>
                                            </svg>
                                        </span>
                                        WhatsApp
                                    </a>
                                    <a href="#" class="master-api-share-option telegram" onclick="MasterAPIPanels.shareVia('telegram')">
                                        <span class="master-api-share-option-icon">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#0088CC"/>
                                            </svg>
                                        </span>
                                        Telegram
                                    </a>
                                    <a href="#" class="master-api-share-option twitter" onclick="MasterAPIPanels.shareVia('twitter')">
                                        <span class="master-api-share-option-icon">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000"/>
                                            </svg>
                                        </span>
                                        Twitter/X
                                    </a>
                                    <a href="#" class="master-api-share-option copy" onclick="MasterAPIPanels.shareVia('copy')">
                                        <span class="master-api-share-option-icon">
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#6c757d"/>
                                            </svg>
                                        </span>
                                        Copiar enlace
                                    </a>
                                </div>
                            </div>
                    </span>
                `;
                
                // Aplicar el HTML al footer
                const footer = document.querySelector('.master-api-footer');
                if (footer) {
                    footer.innerHTML = footerHTML;
                    console.log(`✅ Footer updated: ${timeText} (was offline: ${isCurrentlyOffline || false})`);
                }
                
            } catch (error) {
                console.warn('Footer update error (using fallback):', error);
                const footer = document.querySelector('.master-api-footer');
                if (footer) {
                    footer.innerHTML = `
                        <span class="master-api-last-update" style="color: #666; font-weight: bold;">Recently updated</span>
                        <span style="display: flex; align-items: center;">
                            <a href="https://smability.io/en/" target="_blank" class="master-api-branding">smability.io</a>
                            <button class="master-api-share-btn" onclick="MasterAPIPanels.toggleShareModal()" title="Compartir lectura">
                            </button>
                            <!-- Modal compartir aquí también -->
                        </span>
                    `;
                }
            }
        }

    /**
     * Actualizar colores dinámicos - CORREGIDO
     */
    function updatePanelColors(color, iasValue) {  // ← CAMBIO: Agregar parámetro iasValue
        const colorRgb = hexToRgb(color);
        if (colorRgb) {
            const mainPanel = document.getElementById('masterAPIMainPanel');
            if (mainPanel) {
                mainPanel.style.setProperty('--master-api-ias-bg', `rgba(240, 240, 240, 0.65)`);
                mainPanel.style.setProperty('--master-api-header-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.35)`);
                mainPanel.style.setProperty('--master-api-ias-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.40)`);
                mainPanel.style.setProperty('--master-api-footer-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                mainPanel.style.setProperty('--master-api-data-bg', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.08)`);
                mainPanel.style.setProperty('--master-api-data-bg-hover', `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`);
                mainPanel.style.setProperty('--master-api-ias-color', color);
                mainPanel.style.setProperty('border-color', color);
            }
        }
        
        // Actualizar indicador circular
        const indicator = document.getElementById('masterAPIIasIndicator');
        if (indicator) {
            indicator.style.backgroundColor = color;
        }
        
        // CORREGIDO: Usar parámetro en lugar de variable no definida
        if (iasValue !== undefined) {
            updateIASBarPosition(iasValue);
        }
    }

    // Función helper para convertir hex a rgb
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Buscar datos de la estación en Master API
     */
    async function findStationDataInMasterAPI(stationName) {
        try {
            const stationId = Object.keys(window.ALL_STATIONS_MAPPING || {}).find(
                id => window.ALL_STATIONS_MAPPING[id] === stationName
            );
            
            if (!stationId) return null;
            
            const data = await window.APIProtection.call('current');
            const stations = Array.isArray(data) ? data : data.stations;
            
            return stations.find(s => s.station_id === stationId);
        } catch (error) {
            console.error('MasterAPIPanels: Error fetching Master API data:', error);
            return null;
        }
    }

    /**
     * Mapear datos de Master API a formato del panel
     */
    function mapMasterAPIData(stationData) {
        return {
            iasValue: Math.round(stationData.ias_numeric_value || 0),
            color: stationData.color_code || '#666666',
            emoji: getIASEmoji(stationData.ias_numeric_value),
            category: stationData.category || 'Unknown',
            risk: stationData.risk_level || 'Unknown',
            dominantPollutant: (stationData.dominant_pollutant || 'N/A').toUpperCase(),
            o3: stationData.pollutants?.o3?.avg_1h?.value || 'N/A',
            co8h: stationData.pollutants?.co?.avg_8h?.value || 'N/A',
            pm25: stationData.pollutants?.pm25?.avg_12h?.value || 'N/A',
            pm10: stationData.pollutants?.pm10?.avg_12h?.value || 'N/A',
            temperature: stationData.meteorological?.temperature?.avg_1h?.value || 'N/A',
            humidity: stationData.meteorological?.relative_humidity?.avg_1h?.value || 'N/A',
            battery: stationData.battery?.value || 'N/A',
            placement: translatePlacement(stationData.placement),
            deviceMode: translateDeviceMode(stationData.device_mode?.mode),
            lastUpdate: formatLastUpdate(stationData.reading_time_UTC6)
        };
    }

    // Helper functions
    function getIASEmoji(ias) {
        if (ias <= 50) return '😊';
        if (ias <= 100) return '😐';
        if (ias <= 150) return '😷';
        if (ias <= 200) return '🤢';
        return '☠️';
    }

    /**
     * MEJORADO: Etiquetas más claras para tipos de dispositivo
     */
    function getDeviceTypeLabel(deviceType) {
        const typeMap = {
            'smability-SMAA': 'Smability',
            'smability-SMAAso2': 'Smability SO2',
            'smability-SMAAmicro': 'Smability Micro',
            'reference': 'Reference',           // ← Simple y claro
            'smaa': 'Smability',               // ← Por si acaso
            'smaamicro': 'Smability Micro',
            'smaaso2': 'Smability SO2'
        };
        return typeMap[deviceType] || 'Monitor';
    }

    function getStatusLabel(status) {
        const statusMap = {
            'current': 'Live',
            'stale': 'Stale',
            'offline': 'Offline'
        };
        return statusMap[status] || status;
    }

    function translatePlacement(placement) {
        return placement === 'outdoor' ? 'Outdoors' : placement || 'Unknown';
    }

    function translateDeviceMode(mode) {
        return mode === 'fix' ? 'Fixed' : mode || 'Unknown';
    }

    function formatLastUpdate(timeStr) {
        if (!timeStr) return 'Unknown';
        
        const date = new Date(timeStr + ' UTC-6');
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        
        let timeText = '';
        let statusText = '';
        
        if (diffMinutes < 60) {
            timeText = `Updated ${diffMinutes}m ago`;
        } else {
            timeText = `Updated ${diffHours}h ago`;
        }
        
        // Determinar estado basado en tiempo (igual que SmabilityPanels)
        if (diffHours <= 1) {
            statusText = 'Live';
        } else if (diffHours <= 8) {
            statusText = 'Fresh';
        } else if (diffHours <= 24) {
            statusText = 'Stale';
        } else {
            statusText = 'Offline';
        }
        
        return `${timeText} • ${statusText}`;
    }

    function formatValue(value, unit) {
        return value !== 'N/A' ? `${Math.round(value)} ${unit}` : 'N/A';
    }

    function setState(state) {
        currentState = state;
    }

    function closePanel() {
        const container = document.getElementById('masterAPIPanelContainer');
        if (container) {
            container.style.display = 'none';
        }
        setState(1);
        currentStation = null;
    }    
    
    function toggleDetails() {
        const expandedContent = document.getElementById('masterAPIExpandedContent');
        
        if (!expandedContent) return;
        
        if (expandedContent.style.display === 'none') {
            expandedContent.style.display = 'block';
        } else {
            expandedContent.style.display = 'none';
        }
    }

    
    // Actualizar barra IAS
    function updateIASBarPosition(iasValue) {
        const iasBar = document.getElementById('masterAPIIasBar');
        if (iasBar && iasValue !== undefined) {
            let position = 0;
            
            if (iasValue <= 50) {
                position = (iasValue / 50) * 25;
            } else if (iasValue <= 100) {
                position = 25 + ((iasValue - 50) / 50) * 25;
            } else if (iasValue <= 150) {
                position = 50 + ((iasValue - 100) / 50) * 25;
            } else if (iasValue <= 200) {
                position = 75 + ((iasValue - 150) / 50) * 12.5;
            } else {
                position = 87.5 + Math.min(((iasValue - 200) / 100) * 12.5, 12.5);
            }
            
            position = Math.max(0, Math.min(100, position));
            iasBar.style.setProperty('--ias-position', `${position}%`);
        }
    }

    /**
     * ACTUALIZADO: Toggle del gráfico con verificación de estación
     */
    function toggleChart() {
        console.log(`🎯 Toggle chart for station: ${currentStation}`);
        
        if (!currentStation) {
            console.error('❌ No current station set');
            return;
        }
        
        if (currentState === 2) {
            // Expandir panel principal para incluir gráfico
            const mainPanel = document.getElementById('masterAPIMainPanel');
            const chartContainer = document.getElementById('masterAPIInlineChartContainer');
            
            if (mainPanel && chartContainer) {
                console.log('📊 Expanding panel for chart...');
                
                // Mostrar área de gráfico
                chartContainer.style.display = 'block';
                
                // Ajustar altura del panel
                mainPanel.style.maxHeight = '80vh';
                mainPanel.style.height = 'auto';
                
                // Cargar datos del gráfico PARA LA ESTACIÓN ACTUAL
                console.log(`🔄 Loading chart data for: ${currentStation}`);
                loadChartData();
                
                setState(3);
            }
        } else if (currentState === 3) {
            // Contraer panel principal
            const mainPanel = document.getElementById('masterAPIMainPanel');
            const chartContainer = document.getElementById('masterAPIInlineChartContainer');
            
            if (mainPanel && chartContainer) {
                console.log('📉 Collapsing chart...');
                
                // Ocultar área de gráfico
                chartContainer.style.display = 'none';
                
                // Restaurar altura original
                mainPanel.style.maxHeight = '55vh';
                
                setState(2);
            }
        }
    }

    /**
     * CORREGIDO: Usar el nombre correcto de la función
     */
    async function loadChartData() {
        const chartDiv = document.getElementById('masterAPIInlineChart');
        const placeholder = document.getElementById('masterAPIChartPlaceholder');
        const variableSelect = document.getElementById('masterAPIVariableSelect');
        
        if (!chartDiv || !currentStation) return;
        
        const hours = 36;
        const variable = variableSelect ? variableSelect.value : 'ias';
        
        console.log(`📊 Loading ${hours}h ${variable} data for ${currentStation}`);
        
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">⏳</div>
                <div>Loading ${hours}h ${variable} readings...</div>
                <small style="margin-top: 4px; display: block; color: #666;">Optimized endpoint</small>
            </div>
        `;
        chartDiv.style.display = 'none';
        
        try {
            const startTime = performance.now();
            
            // CORREGIR: Usar el nombre correcto de la función
            const historicalData = await fetchMasterAPIHistoricalData(currentStation, hours, variable);
            
            const endTime = performance.now();
            console.log(`⚡ ${variable} data loaded in ${Math.round(endTime - startTime)}ms`);
            
            if (historicalData && historicalData.length > 0) {
                createMasterAPIChart(chartDiv, historicalData, hours, currentStation, variable);
                
                placeholder.style.display = 'none';
                chartDiv.style.display = 'block';
                chartDiv.classList.add('active');
                
                console.log(`✅ ${variable} chart created with ${historicalData.length} readings`);
            } else {
                throw new Error('No historical data available');
            }
        } catch (error) {
            console.error(`MasterAPIPanels: Error loading ${variable} data:`, error);
            placeholder.innerHTML = `
                <div style="text-align: center; color: #666;">
                    <div style="font-size: 20px; margin-bottom: 8px;">❌</div>
                    <div>No ${variable} data available</div>
                    <small style="margin-top: 4px; display: block;">36-hour readings not found</small>
                </div>
            `;
            placeholder.style.display = 'flex';
            chartDiv.style.display = 'none';
        }
    }

    /**
     * CORREGIDO: Timestamp parsing compatible móvil/desktop
     */
    async function fetchMasterAPIHistoricalData(stationName, requestedHours = 36, variable = 'ias') {
        try {
            const stationId = Object.keys(window.ALL_STATIONS_MAPPING || {}).find(
                id => window.ALL_STATIONS_MAPPING[id] === stationName
            );
            
            if (!stationId) {
                throw new Error(`No station_id found for ${stationName}`);
            }
            
            const apiVariable = mapVariableToAPI(variable);
            console.log(`🔐 Historical: ${requestedHours}h ${apiVariable} for ${stationName}`);
            
            const apiResponse = await window.APIProtection.call('historical', 
                `/${stationId}/historical/${requestedHours}h?variable=${apiVariable}`);
            
            if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
                throw new Error('Invalid response format: missing data array');
            }
            
            // MOBILE-COMPATIBLE: Parsing de timestamp más robusto
            const historicalData = apiResponse.data
                .filter(reading => reading.value !== null && reading.value !== undefined)
                .map((reading, index) => {
                    let timestamp;
                    
                    if (reading.timestamp) {
                        try {
                            // MOBILE FIX: Parsing más compatible
                            const timestampStr = reading.timestamp;
                            
                            // Método 1: Intentar formato ISO estricto
                            const parts = timestampStr.split(' ');
                            if (parts.length === 2) {
                                const [datePart, timePart] = parts;
                                const isoString = `${datePart}T${timePart}:00-06:00`; // UTC-6 explícito
                                timestamp = new Date(isoString);
                            }
                            
                            // Método 2: Fallback manual si falla
                            if (!timestamp || isNaN(timestamp.getTime())) {
                                const [datePart, timePart] = timestampStr.split(' ');
                                const [year, month, day] = datePart.split('-').map(Number);
                                const [hour, minute] = timePart.split(':').map(Number);
                                
                                // Crear fecha manualmente (más compatible)
                                timestamp = new Date(year, month - 1, day, hour, minute || 0);
                            }
                            
                        } catch (error) {
                            console.warn(`Mobile timestamp parsing error for index ${index}:`, error);
                            timestamp = null;
                        }
                    }
                    
                    // Fallback: timestamp secuencial si falla el parsing
                    if (!timestamp || isNaN(timestamp.getTime())) {
                        const now = new Date();
                        timestamp = new Date(now.getTime() - ((apiResponse.data.length - 1 - index) * 60 * 60 * 1000));
                        console.warn(`Using fallback timestamp for index ${index}`);
                    }
                    
                    return {
                        timestamp: timestamp,
                        value: reading.value,
                        unit: reading.unit,
                        color: getVariableColor(variable, reading.value),
                        variable: variable,
                        status: 'current',
                        hour: timestamp.getHours(),
                        sortKey: timestamp.getTime()
                    };
                })
                .sort((a, b) => a.sortKey - b.sortKey);
            
            console.log(`✅ Mobile-compatible processing: ${historicalData.length} readings`);
            return historicalData;
            
        } catch (error) {
            console.error(`Mobile fetch error for ${variable}:`, error);
            throw error;
        }
    }
    
    /**
     * NUEVO: Mapear variables del frontend al formato API
     */
    function mapVariableToAPI(variable) {
        const variableMap = {
            'ias': 'ias',
            'ozone': 'o3',
            'pm25': 'pm25',
            'pm10': 'pm10',              // ← NUEVA
            'so2': 'so2',                // ← NUEVA  
            'no2': 'no2',                // ← NUEVA
            'co': 'co',                  // ← NUEVA
            'temperature': 'temperature',
            'humidity': 'relative_humidity'
        };
        return variableMap[variable] || 'ias';
    }
    
    /**
     * NUEVO: Obtener unidad por variable
     */
    function getVariableUnit(variable) {
        const units = {
            'ias': 'IAS',
            'ozone': 'ppb', 
            'pm25': 'μg/m³',
            'pm10': 'μg/m³',             // ← NUEVA
            'so2': 'ppb',                // ← NUEVA
            'no2': 'ppb',                // ← NUEVA
            'co': 'ppm',                 // ← NUEVA
            'temperature': '°C',
            'humidity': '%'
        };
        return units[variable] || 'IAS';
    }
    
    /**
     * NUEVO: Obtener color por variable y valor
     */
    function getVariableColor(variable, value) {
        if (variable === 'ias') {
            return getIASColor(value);
        }
        
        const colors = {
            'ozone': '#9c27b0',
            'pm25': '#ff9800',
            'pm10': '#ff5722',           // ← NUEVA: Rojo-naranja
            'so2': '#795548',            // ← NUEVA: Marrón
            'no2': '#e91e63',            // ← NUEVA: Rosa
            'co': '#607d8b',             // ← NUEVA: Azul gris
            'temperature': '#4264fb',
            'humidity': '#4caf50'
        };
        return colors[variable] || '#4264fb';
    }
    
    /**
     * EXISTENTE: Función para color IAS
     */
    function getIASColor(value) {
        if (value <= 50) return '#00ff00';
        if (value <= 100) return '#ffff00';
        if (value <= 150) return '#ff8000';
        if (value <= 200) return '#ff0000';
        return '#800080';
    }

    /**
     * CORREGIDO: Gráfico con formato de timestamp mejorado para móvil
     */
    function createMasterAPIChart(container, historicalData, requestedHours, stationName, variable = 'ias') {
        if (!window.Plotly) {
            console.error('MasterAPIPanels: Plotly.js not available');
            return;
        }
        
        console.log(`📊 Creating ${variable} chart with ${historicalData.length} data points`);
        
        const isIAS = variable === 'ias';
        
        const variableNames = {
            'ias': 'IAS',
            'ozone': 'Ozone',
            'pm25': 'PM2.5',
            'pm10': 'PM10',              // ← NUEVA
            'so2': 'SO2',                // ← NUEVA
            'no2': 'NO2',                // ← NUEVA
            'co': 'CO',                  // ← NUEVA
            'temperature': 'Temperature',
            'humidity': 'Humidity'
        };
        
        const trace = {
            x: historicalData.map(item => {
                // CORREGIDO: Validar timestamp antes de usar
                let date;
                try {
                    date = new Date(item.timestamp);
                    // Verificar que sea una fecha válida
                    if (isNaN(date.getTime())) {
                        console.warn('Invalid timestamp:', item.timestamp);
                        return 'N/A';
                    }
                } catch (error) {
                    console.warn('Error parsing timestamp:', item.timestamp, error);
                    return 'N/A';
                }
                
                const day = String(date.getDate()).padStart(2, '0');
                const hour = String(date.getHours()).padStart(2, '0');
                return `${day}/${hour}:00`;
            }),
            y: historicalData.map(item => item.value),
            type: isIAS ? 'bar' : 'scatter',
            mode: isIAS ? undefined : 'lines+markers',
            name: `${stationName} ${variable.toUpperCase()}`,
            marker: isIAS ? {
                color: historicalData.map(item => item.color),
                line: { 
                    color: '#999999',
                    width: 1.5
                },
                opacity: 0.9
            } : {
                color: historicalData[0]?.color || '#4264fb',
                size: 4,
                line: { color: '#ffffff', width: 1 }
            },
            line: isIAS ? undefined : {
                color: historicalData[0]?.color || '#4264fb',
                width: 2
            },
            hovertemplate: `<b>${stationName}</b><br>` +
                           `<b>Time</b>: %{customdata.fullTime}<br>` +
                           `<b>${variable.toUpperCase()}</b>: %{y} ${historicalData[0]?.unit || ''}<br>` +
                           '<extra></extra>',
            customdata: historicalData.map(item => {
                // CORREGIDO: Validar timestamp en customdata
                let fullTime = 'Unknown time';
                try {
                    const date = new Date(item.timestamp);
                    if (!isNaN(date.getTime())) {
                        fullTime = date.toLocaleString('en-US', {
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        });
                    }
                } catch (error) {
                    console.warn('Error formatting custom date:', item.timestamp);
                }
                
                return { fullTime: fullTime };
            })
        };
        
        const layout = {
            margin: { t: 45, r: 15, l: 45, b: 35 },
            yaxis: {
                title: { 
                    text: historicalData[0]?.unit || '',
                    font: { size: 10, color: '#333333' }
                },
                zeroline: false,
                showgrid: true,
                gridcolor: 'rgba(200, 200, 200, 0.3)',
                tickfont: { size: 8, color: '#666666' },
                autorange: true
            },
            xaxis: {
                showgrid: false,
                tickfont: { size: 6, color: '#666666' },
                tickangle: -45,
                autorange: true,
                fixedrange: false,
                type: 'category',
                nticks: Math.min(12, Math.ceil(historicalData.length / 3)),
                tickmode: 'auto'
            },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            font: { 
                family: 'DIN Pro, Arial, sans-serif',
                color: '#333333'
            },
            title: {
                text: `${stationName} - ${variableNames[variable] || variable.toUpperCase()}`,
                font: { 
                    size: 12,
                    family: 'DIN Pro, Arial, sans-serif',
                    color: '#333333',
                    weight: 'bold'
                },
                y: 0.95,
                x: 0.5,
                xanchor: 'center',
                yanchor: 'top',
                pad: { b: 20 }
            },
            showlegend: false,
            bargap: isIAS ? 0.15 : undefined,
            bargroupgap: 0,
            hovermode: 'closest',
            autosize: true
        };
        
        const config = {
            responsive: true,
            displayModeBar: false,
            displaylogo: false,
            scrollZoom: false,
            doubleClick: false
        };
        
        Plotly.purge(container);
        
        window.Plotly.newPlot(container, [trace], layout, config)
            .then(() => {
                setTimeout(() => {
                    const plotlyDiv = container.querySelector('.plotly-graph-div');
                    if (plotlyDiv) {
                        plotlyDiv.style.backgroundColor = 'transparent';
                    }
                    
                    const svgs = container.querySelectorAll('svg');
                    svgs.forEach(svg => {
                        svg.style.backgroundColor = 'transparent';
                    });
                    
                    console.log(`✅ ${variable} chart created with mobile-friendly timestamps`);
                    
                    if (window.Plotly) {
                        Plotly.Plots.resize(container);
                    }
                }, 100);
            })
            .catch(error => {
                console.error(`Error creating ${variable} chart:`, error);
            });
    }
    

    /**
     * ACTUALIZADO: Setup con IAS por defecto garantizado
     */
    function setupChartControls() {
        const variableSelect = document.getElementById('masterAPIVariableSelect');
        
        if (variableSelect) {
            // ASEGURAR: Valor inicial siempre IAS
            variableSelect.value = 'ias';
            
            const changeHandler = function() {
                const variable = variableSelect.value;
                console.log(`🔄 Variable changed to: ${variable}`);
                
                if (currentState === 3) {
                    console.log('Reloading chart with new variable...');
                    
                    const chartDiv = document.getElementById('masterAPIInlineChart');
                    const placeholder = document.getElementById('masterAPIChartPlaceholder');
                    
                    if (chartDiv && placeholder) {
                        chartDiv.style.display = 'none';
                        chartDiv.classList.remove('active');
                        placeholder.style.display = 'flex';
                        placeholder.innerHTML = `
                            <div style="text-align: center;">
                                <div style="font-size: 20px; margin-bottom: 8px;">🔄</div>
                                <div>Loading ${variable} data...</div>
                                <small style="margin-top: 4px; display: block; color: #666;">Fetching 36-hour readings</small>
                            </div>
                        `;
                        
                        if (window.Plotly) {
                            try {
                                Plotly.purge(chartDiv);
                            } catch (error) {
                                console.warn('Error purging chart:', error);
                            }
                        }
                    }
                    
                    setTimeout(() => {
                        loadChartData();
                    }, 200);
                }
            };
            
            if (variableSelect._changeHandler) {
                variableSelect.removeEventListener('change', variableSelect._changeHandler);
            }
            
            variableSelect._changeHandler = changeHandler;
            variableSelect.addEventListener('change', changeHandler);
            variableSelect.setAttribute('data-listener-added', 'true');
            
            console.log('✅ Variable selector set up with IAS default');
        } else {
            console.error('❌ Variable select not found');
        }
    }

    // Event listener para resize del gráfico
    window.addEventListener('resize', () => {
        const chartDiv = document.getElementById('masterAPIInlineChart');
        if (chartDiv && chartDiv.style.display !== 'none') {
            try {
                Plotly.Plots.resize(chartDiv);
                console.log('📏 Chart resized');
            } catch (error) {
                console.warn('Chart resize error:', error);
            }
        }
    });

    /**
 * Toggle del modal de compartir
 */
function toggleShareModal() {
    const modal = document.getElementById('masterAPIShareModal');
    if (modal) {
        const isVisible = modal.classList.contains('show');
        if (isVisible) {
            modal.classList.remove('show');
        } else {
            modal.classList.add('show');
            
            // Cerrar al hacer click fuera
            setTimeout(() => {
                document.addEventListener('click', closeShareModal, true);
            }, 100);
        }
    }
}

/**
 * Cerrar modal de compartir
 */
function closeShareModal(event) {
    const modal = document.getElementById('masterAPIShareModal');
    const shareBtn = event.target.closest('.master-api-share-btn');
    
    if (modal && !modal.contains(event.target) && !shareBtn) {
        modal.classList.remove('show');
        document.removeEventListener('click', closeShareModal, true);
    }
}

    /**
     * Compartir vía diferentes plataformas
     */
    function shareVia(platform) {
        if (!currentStation) return;
        
        // Obtener datos del panel actual
        const iasValue = document.getElementById('masterAPIIasValue')?.textContent || 'N/A';
        const category = document.getElementById('masterAPIStatusText1')?.textContent || 'Unknown';
        
        // Crear URL compartible
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?station=${encodeURIComponent(currentStation)}&autoOpen=true&ias=${iasValue}&time=${new Date().toISOString()}`;
        
        // Textos para compartir
        const texts = {
            whatsapp: `🌬️ Calidad del aire en ${currentStation}: IAS ${iasValue} (${category})\nMonitoreado en tiempo real con AIreGPT\n${shareUrl}`,
            telegram: `🌬️ Calidad del aire en ${currentStation}: IAS ${iasValue} (${category})\nMonitoreado en tiempo real con AIreGPT\n${shareUrl}`,
            twitter: `🌬️ #CalidadDelAire en ${currentStation}: IAS ${iasValue} (${category})\nDatos en tiempo real 📊\nVía @SmabilityAire\n${shareUrl}\n#CDMX #AirQuality`,
            copy: shareUrl
        };
        
        const urls = {
            whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(texts.whatsapp)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(texts.telegram)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texts.twitter)}`
        };
        
        // Ejecutar acción
        switch(platform) {
            case 'whatsapp':
            case 'telegram':
            case 'twitter':
                window.open(urls[platform], '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(texts.copy).then(() => {
                    // Feedback visual mejorado
                    const copyBtn = document.querySelector('.master-api-share-option.copy');
                    if (copyBtn) {
                        const iconSpan = copyBtn.querySelector('.master-api-share-option-icon');
                        const originalIcon = iconSpan.innerHTML;
                        
                        // Icono de éxito
                        iconSpan.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#28a745"/>
                            </svg>
                        `;
                        
                        // Cambiar texto
                        const textNode = copyBtn.childNodes[copyBtn.childNodes.length - 1];
                        const originalText = textNode.textContent.trim();
                        textNode.textContent = ' ¡Copiado!';
                        
                        setTimeout(() => {
                            iconSpan.innerHTML = originalIcon;
                            textNode.textContent = ' ' + originalText;
                        }, 1500);
                    }
                });
                break;
        }
        
        // Cerrar modal
        const modal = document.getElementById('masterAPIShareModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        console.log(`🔗 Shared ${currentStation} via ${platform}`);
    }
    
    // Actualizar el return del módulo:
    return {
        showPanel: showPanel,
        closePanel: closePanel,
        toggleDetails: toggleDetails,    // ← AGREGAR
        toggleChart: toggleChart,        // ← AGREGAR
        resetChartArea: resetChartArea,
        getCurrentStation: () => currentStation,
        getCurrentState: () => currentState,
        toggleShareModal: toggleShareModal,
        shareVia: shareVia
    };
})();

console.log('MasterAPIPanels: Module loaded successfully - HOMOLOGATED LOGIC');
