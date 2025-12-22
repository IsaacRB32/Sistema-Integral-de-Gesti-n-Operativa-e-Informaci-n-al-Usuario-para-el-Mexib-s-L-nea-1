// unidades.js - Módulo de gestión de unidades CON ASIGNACIÓN DE CONDUCTORES

const moduloUnidades = {
    conductoresDisponibles: [],

    async cargarConductores() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/conductores`);
            
            if (!res.ok) {
                console.error('Error cargando conductores:', res.status);
                return;
            }

            this.conductoresDisponibles = await res.json();
            this.renderizarSelectConductores();

        } catch (err) {
            console.error('Error obteniendo conductores:', err);
            const select = document.getElementById('input-conductor');
            if (select) {
                select.innerHTML = '<option value="">❌ Error al cargar conductores</option>';
            }
        }
    },

    renderizarSelectConductores() {
        const select = document.getElementById('input-operador');
        if (!select) return;

        const disponibles = this.conductoresDisponibles.filter(c => c.estado === 'DISPONIBLE');
        const ocupados = this.conductoresDisponibles.filter(c => c.estado === 'OCUPADO');

        if (disponibles.length === 0 && ocupados.length === 0) {
            select.innerHTML = '<option value="">⚠️ No hay conductores registrados</option>';
            return;
        }

        let html = '<option value="">-- Sin asignar --</option>';

        if (disponibles.length > 0) {
            html += '<optgroup label="✅ Disponibles">';
            disponibles.forEach(c => {
                html += `<option value="${c.id_usuario}">${c.nombre_completo}</option>`;
            });
            html += '</optgroup>';
        }

        if (ocupados.length > 0) {
            html += '<optgroup label="🚫 Ocupados" disabled>';
            ocupados.forEach(c => {
                html += `<option value="${c.id_usuario}" disabled>${c.nombre_completo} (Unidad #${c.unidad_asignada})</option>`;
            });
            html += '</optgroup>';
        }

        select.innerHTML = html;
    },

    async meterUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        const ruta = document.getElementById('input-ruta').value;
        const sentido = document.getElementById('input-sentido').value;
        const conductorId = document.getElementById('input-operador').value;

        if (!id) return utils.mostrarMensaje('msg-unidades', 'Ingresa el ID de la unidad', 'error');

        try {
            // 1. Meter unidad al circuito
            const resUnidad = await fetch(`${CONFIG.API_BASE}/sim/entrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_unidad: parseInt(id),
                    id_ruta: parseInt(ruta),
                    sentido,
                    idx_tramo: 0 // Siempre inicia en estación 0
                })
            });

            const dataUnidad = await resUnidad.json();
            
            if (!dataUnidad.ok) {
                return utils.mostrarMensaje('msg-unidades', dataUnidad.error || 'Error al ingresar unidad', 'error');
            }

            // 2. Asignar conductor si se seleccionó uno
            if (conductorId) {
                const resConductor = await fetch(`${CONFIG.API_BASE}/supervisor/asignar-conductor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_usuario: parseInt(conductorId),
                        id_unidad: parseInt(id)
                    })
                });

                const dataConductor = await resConductor.json();

                if (!resConductor.ok) {
                    console.warn('Advertencia al asignar conductor:', dataConductor.error);
                    utils.mostrarMensaje('msg-unidades', `Unidad ${id} ingresada pero no se pudo asignar conductor`, 'warning');
                } else {
                    utils.mostrarMensaje('msg-unidades', `Unidad ${id} ingresada con conductor asignado`, 'success');
                }
            } else {
                utils.mostrarMensaje('msg-unidades', `Unidad ${id} ingresada sin conductor`, 'success');
            }

            // 3. Recargar todo
            setTimeout(() => {
                this.cargar();
                this.cargarConductores();
            }, 500);

        } catch (err) {
            console.error('Error:', err);
            utils.mostrarMensaje('msg-unidades', 'Error de conexión', 'error');
        }
    },

    async sacarUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        if (!id) return utils.mostrarMensaje('msg-unidades', 'Ingresa el ID de la unidad', 'error');

        try {
            // 1. Desasignar conductor primero
            await fetch(`${CONFIG.API_BASE}/supervisor/desasignar-conductor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_unidad: parseInt(id) })
            });

            // 2. Sacar unidad del circuito
            const res = await fetch(`${CONFIG.API_BASE}/sim/salir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_unidad: parseInt(id) })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-unidades', `Unidad ${id} sacada del servicio`, 'success');
                setTimeout(() => {
                    this.cargar();
                    this.cargarConductores();
                }, 500);
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
        
        const baseUrl = window.location.origin;
        const rutaBase = `${baseUrl}/supervisor/mexibusSystemImages/stationsIcons/`;
        
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
            return `<img src="${rutaCompleta}" 
                     alt="${nombreEstacion}" 
                     class="w-5 h-5 inline-block rounded" 
                     title="${nombreEstacion}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
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
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No hay unidades en el sistema</td></tr>';
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

                // Buscar conductor asignado
                const conductor = this.conductoresDisponibles.find(c => c.unidad_asignada === u.id_unidad);
                const nombreConductor = conductor ? conductor.nombre_completo : '👤 Sin asignar';

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
                        <td class="py-3 px-4 text-sm text-gray-700">
                            ${nombreConductor}
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
                        <td colspan="6" class="text-center py-8">
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
        console.log('✅ Módulo de unidades inicializado (con asignación de conductores)');
        this.cargarConductores();
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