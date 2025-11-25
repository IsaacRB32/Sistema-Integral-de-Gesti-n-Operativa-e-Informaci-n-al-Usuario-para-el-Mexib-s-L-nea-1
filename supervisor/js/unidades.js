// unidades.js - Módulo de gestión de unidades CON ICONOS

const moduloUnidades = {
    async meterUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        const ruta = document.getElementById('input-ruta').value;
        const sentido = document.getElementById('input-sentido').value;
        const estacion = document.getElementById('input-estacion').value;

        if (!id) return utils.mostrarMensaje('msg-unidades', 'Ingresa el ID', 'error');

        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/entrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_unidad: parseInt(id),
                    id_ruta: parseInt(ruta),
                    sentido,
                    idx_tramo: parseInt(estacion)
                })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-unidades', `Unidad ${id} ingresada`, 'success');
                setTimeout(() => this.cargar(), 500);
            } else {
                utils.mostrarMensaje('msg-unidades', data.error, 'error');
            }
        } catch (err) {
            utils.mostrarMensaje('msg-unidades', 'Error de conexión', 'error');
        }
    },

    async sacarUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        if (!id) return utils.mostrarMensaje('msg-unidades', 'Ingresa el ID', 'error');

        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/salir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_unidad: parseInt(id) })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-unidades', `Unidad ${id} sacada`, 'success');
                setTimeout(() => this.cargar(), 500);
            } else {
                utils.mostrarMensaje('msg-unidades', data.error, 'error');
            }
        } catch (err) {
            utils.mostrarMensaje('msg-unidades', 'Error de conexión', 'error');
        }
    },

    // Función para obtener icono de estación (CON IMÁGENES PNG)
    obtenerIconoEstacion(nombreEstacion) {
        if (!nombreEstacion || nombreEstacion === 'Desconocida') {
            return '<span class="text-xl">📍</span>';
        }
        
        // Construir ruta absoluta con window.location.origin
        const baseUrl = window.location.origin; // http://localhost:3000
        const rutaBase = `${baseUrl}/supervisor/mexibusSystemImages/stationsIcons/`;
        
        // Mapeo de nombres de estaciones a archivos de iconos
        const iconos = {
            'Central de Abastos': 'centraldeAbastosIcon.png',
            'Ciudad Azteca': 'ciudadAztecaIcon.png',
            '19 de Septiembre': 'diecinueveSeptiembreIcon.png',
            'Palomas': 'palomasIcon.png',
            'Jardines de Morelos': 'jardinesdeMorelosIcon.png',
            'Jardines del Morelos': 'jardinesdeMorelosIcon.png',
            'Aquiles Serdán': 'aquilesSerdanIcon.png',
            'Hospital': 'hospitalIcon.png',
            '1° de Mayo': 'primerodeMayo.png',
            'Primero de Mayo': 'primerodeMayo.png',
            'Las Américas': 'lasAmericasIcon.png',
            'Valle Ecatepec': 'valledeEcatepecIcon.png',
            'Valle de Ecatepec': 'valleEcatepecIcon.png',
            'Vocacional 3': 'vocacionalTresIcon.png',
            'Adolfo López Mateos': 'adolfoLopezMateosIcon.png',
            'Zodiaco': 'zodiacoIcon.png',
            'Alfredo Torres': 'alfredoTorresIcon.png',
            'UNITEC': 'unitecIcon.png',
            'Unitec': 'unitecIcon.png',
            'Industrial': 'industrialIcon.png',
            'Josefa Ortiz': 'josefaOrtizIcon.png',
            'Quinto Sol': 'quintoSolIcon.png'
        };
        
        // Emojis como fallback
        const emojisEstaciones = {
            'Central de Abastos': '🏪',
            'Ciudad Azteca': '🏛️',
            '19 de Septiembre': '🗓️',
            'Palomas': '🕊️',
            'Jardines de Morelos': '🌳',
            'Jardines del Morelos': '🌳',
            'Aquiles Serdán': '⚔️',
            'Hospital': '🏥',
            '1° de Mayo': '🔧',
            'Primero de Mayo': '🔧',
            'Las Américas': '🌎',
            'Valle Ecatepec': '🏞️',
            'Valle de Ecatepec': '🏞️',
            'Vocacional 3': '🎓',
            'Adolfo López Mateos': '👨‍💼',
            'Zodiaco': '♈',
            'Alfredo Torres': '👨‍🔧',
            'UNITEC': '🏫',
            'Unitec': '🏫',
            'Industrial': '🏭',
            'Josefa Ortiz': '👩‍⚖️',
            'Quinto Sol': '☀️'
        };
        
        const icono = iconos[nombreEstacion];
        const emoji = emojisEstaciones[nombreEstacion] || '🚉';
        
        if (icono) {
            const rutaCompleta = `${rutaBase}${icono}`;
            console.log(`🖼️ Cargando icono: ${rutaCompleta}`);
            return `<img src="${rutaCompleta}" 
                     alt="${nombreEstacion}" 
                     class="w-5 h-5 inline-block rounded" 
                     title="${nombreEstacion}"
                     onerror="console.error('❌ Error cargando:', this.src); this.style.display='none'; this.nextElementSibling.style.display='inline';">
                    <span class="text-xl" style="display: none;">${emoji}</span>`;
        }
        
        return `<span class="text-xl">${emoji}</span>`;
    },

    async cargar() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/snapshot`);
            const unidades = await res.json();
            
            const tbody = document.getElementById('tabla-unidades');
            if (!tbody) return;

            if (unidades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">No hay unidades en el sistema</td></tr>';
                return;
            }

            tbody.innerHTML = unidades.map(u => {
                const estadoColor = {
                    'EN_RUTA': 'bg-green-500 text-white',
                    'EN_ESTACION': 'bg-yellow-500 text-gray-900',
                    'EN_COLA': 'bg-blue-500 text-white',
                    'INCIDENCIA': 'bg-red-500 text-white',
                    'FUERA_DE_SERVICIO': 'bg-gray-500 text-white'
                }[u.estado_unidad] || 'bg-gray-500 text-white';

                const estacion = CONFIG.estaciones[u.idx_tramo] || 'Desconocida';
                const progreso = Math.round(u.progreso * 100);
                const iconoEstacion = this.obtenerIconoEstacion(estacion);

                return `
                    <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td class="py-3 px-4 font-bold text-gray-900">#${u.id_unidad}</td>
                        <td class="py-3 px-4">
                            <span class="px-3 py-1 rounded-full text-xs font-medium ${u.sentido === 'IDA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                ${u.sentido === 'IDA' ? '→ IDA' : '← VUELTA'}
                            </span>
                        </td>
                        <td class="py-3 px-4">
                            <span class="px-3 py-1 rounded-full text-xs font-medium ${estadoColor}">
                                ${u.estado_unidad.replace(/_/g, ' ')}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-700">
                            <div class="flex items-center gap-2">
                                ${iconoEstacion}
                                <span>${estacion}</span>
                            </div>
                        </td>
                        <td class="py-3 px-4">
                            <div class="flex items-center gap-2">
                                <div class="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div class="bg-gradient-to-r from-mexibus-blue to-mexibus-green h-2 rounded-full transition-all duration-300" 
                                         style="width: ${progreso}%"></div>
                                </div>
                                <span class="text-xs text-gray-600 font-medium w-10 text-right">${progreso}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            console.error('Error cargando unidades:', err);
            const tbody = document.getElementById('tabla-unidades');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-8">
                            <div class="text-red-500">
                                <div class="text-4xl mb-2">❌</div>
                                <p class="font-semibold">Error al cargar unidades</p>
                                <button onclick="moduloUnidades.cargar()" 
                                        class="mt-3 bg-mexibus-blue hover:bg-mexibus-dark text-white px-4 py-2 rounded-lg text-sm transition">
                                    Reintentar
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    },

    init() {
        console.log('✅ Módulo de unidades inicializado (con iconos PNG)');
        this.cargar();
    }
};

// Funciones globales para usar desde el HTML
function meterUnidad() {
    moduloUnidades.meterUnidad();
}

function sacarUnidad() {
    moduloUnidades.sacarUnidad();
}

function cargarUnidades() {
    moduloUnidades.cargar();
}