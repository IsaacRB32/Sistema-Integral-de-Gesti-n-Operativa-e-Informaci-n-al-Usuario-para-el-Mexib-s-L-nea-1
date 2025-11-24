// incidencias.js - Versión sin recarga automática

const moduloIncidencias = {
    // Cache para ubicaciones de unidades
    cacheUnidades: new Map(),
    
    // Reportar nueva incidencia
    async reportar() {
        const unidad = document.getElementById('inc-unidad').value;
        const tipo = document.getElementById('inc-tipo').value;
        const desc = document.getElementById('inc-desc').value.trim();

        if (!unidad) {
            utils.mostrarMensaje('msg-incidencias', 'Ingresa ID de unidad', 'error');
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/incidencia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_unidad: parseInt(unidad),
                    id_cincidencia: parseInt(tipo),
                    descripcion: desc || null
                })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-incidencias', `Incidencia reportada (ID: ${data.id_incidencia})`, 'success');
                document.getElementById('inc-unidad').value = '';
                document.getElementById('inc-desc').value = '';
                // Recargar después de reportar
                this.cargar();
            } else {
                utils.mostrarMensaje('msg-incidencias', data.error || 'Error al reportar incidencia', 'error');
            }
        } catch (err) {
            console.error('Error reportando incidencia:', err);
            utils.mostrarMensaje('msg-incidencias', 'Error de conexión', 'error');
        }
    },

    // Resolver incidencia
    async resolver(idInc, idUnidad) {
        utils.mostrarModal(
            '¿Resolver incidencia?',
            'Esta acción marcará la incidencia como resuelta.',
            async () => {
                try {
                    const res = await fetch(`${CONFIG.API_BASE}/sim/resolver`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            id_incidencia: idInc, 
                            id_unidad: idUnidad 
                        })
                    });

                    const data = await res.json();
                    if (data.ok) {
                        utils.mostrarMensaje('msg-incidencias', 'Incidencia resuelta', 'success');
                        // Recargar después de resolver
                        moduloIncidencias.cargar();
                    } else {
                        utils.mostrarMensaje('msg-incidencias', data.error || 'Error al resolver', 'error');
                    }
                } catch (err) {
                    console.error('Error resolviendo incidencia:', err);
                    utils.mostrarMensaje('msg-incidencias', 'Error de conexión', 'error');
                }
            }
        );
    },

    // Obtener ubicación actual de una unidad
    async obtenerUbicacionUnidad(idUnidad) {
        // Verificar cache primero
        if (this.cacheUnidades.has(idUnidad)) {
            const cacheData = this.cacheUnidades.get(idUnidad);
            if (Date.now() - cacheData.timestamp < 30000) { // Cache de 30 segundos
                return cacheData.ubicacion;
            }
        }

        try {
            // Intentar obtener datos de la unidad
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades`);
            const unidades = await res.json();
            
            const unidad = unidades.find(u => u.id_unidad === idUnidad);
            if (unidad) {
                let ubicacion = '📍 En tránsito';
                
                // Buscar información de ubicación en la unidad
                if (unidad.nombre_estacion && unidad.nombre_estacion !== 'null') {
                    ubicacion = unidad.nombre_estacion;
                } else if (unidad.estacion_actual) {
                    ubicacion = unidad.estacion_actual;
                } else if (unidad.ubicacion_actual) {
                    ubicacion = unidad.ubicacion_actual;
                } else if (unidad.estado_operacional === 'EN_ESTACION' && unidad.id_estacion_actual) {
                    ubicacion = this.mapearEstacionPorId(unidad.id_estacion_actual);
                }

                // Guardar en cache
                this.cacheUnidades.set(idUnidad, {
                    ubicacion: ubicacion,
                    timestamp: Date.now()
                });

                return ubicacion;
            }
        } catch (err) {
            console.error('Error obteniendo ubicación de unidad:', err);
        }

        return '📍 En tránsito';
    },

    // Cargar y mostrar incidencias activas
    async cargar() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/incidencias`);
            const incidencias = await res.json();
            
            const container = document.getElementById('lista-incidencias');
            if (!container) {
                console.error('Contenedor de incidencias no encontrado');
                return;
            }

            // Filtrar solo incidencias activas
            const activas = incidencias.filter(i => i.estado_incidencia === 'ACTIVA');

            if (activas.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-24 h-24 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                            <span class="text-4xl">✅</span>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-700 mb-2">Sin incidencias activas</h3>
                        <p class="text-gray-500">No hay incidencias reportadas en este momento</p>
                    </div>
                `;
                return;
            }

            // Procesar incidencias en paralelo
            const incidenciasProcesadas = await Promise.all(
                activas.map(async (inc) => {
                    const procesada = this.procesarIncidencia(inc);
                    
                    // Si no hay estación específica, intentar obtener ubicación de la unidad
                    if (procesada.estacion === '📍 Ubicación no especificada' && inc.id_unidad) {
                        procesada.estacion = await this.obtenerUbicacionUnidad(inc.id_unidad);
                    }
                    
                    return { inc, procesada };
                })
            );

            // Mostrar incidencias procesadas
            container.innerHTML = incidenciasProcesadas.map(({ inc, procesada }) => {
                const iconoEstacion = this.obtenerIconoEstacion(procesada.estacion);
                
                return `
                <div class="bg-white border-l-4 border-red-500 rounded-r-lg shadow-md p-5 mb-4 fade-in hover:shadow-lg transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">#${procesada.id}</span>
                            <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">${procesada.fecha}</span>
                        </div>
                        <button onclick="moduloIncidencias.resolver(${inc.id_incidencia}, ${inc.id_unidad || 'null'})" 
                                class="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white font-medium shadow transition-colors flex items-center gap-2">
                            <span>✅</span>
                            Resolver
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div class="space-y-3">
                            <div class="flex items-start">
                                <span class="text-gray-700 font-medium w-20 mt-1">Tipo:</span>
                                <span class="ml-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                    ${procesada.tipo}
                                </span>
                            </div>
                            <div class="flex items-start">
                                <span class="text-gray-700 font-medium w-20 mt-1">Estación:</span>
                                <div class="ml-2 flex items-center gap-2">
                                    ${iconoEstacion}
                                    <span class="text-gray-600">${procesada.estacion}</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex items-center">
                                <span class="text-gray-700 font-medium w-20">Unidad:</span>
                                <span class="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    #${procesada.unidad}
                                </span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-700 font-medium w-20">Operador:</span>
                                <span class="ml-2 text-gray-600">${procesada.operador}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <span class="text-gray-700 font-medium block mb-2">Descripción:</span>
                        <p class="text-gray-700 p-3 bg-gray-50 rounded-lg border text-sm">
                            ${procesada.descripcion}
                        </p>
                    </div>
                    
                    <!-- Información de debug -->
                    <details class="mt-3 text-xs">
                        <summary class="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">Información técnica</summary>
                        <div class="mt-2 p-3 bg-gray-100 rounded-lg text-gray-600 font-mono text-xs">
                            <div class="grid grid-cols-2 gap-2">
                                <span><strong>id_cincidencia:</strong> ${this.formatDebugValue(procesada.debugInfo.id_cincidencia)}</span>
                                <span><strong>id_tipo:</strong> ${this.formatDebugValue(procesada.debugInfo.id_tipo)}</span>
                                <span><strong>tipo:</strong> ${this.formatDebugValue(procesada.debugInfo.tipo)}</span>
                                <span><strong>cincidencia_id:</strong> ${this.formatDebugValue(procesada.debugInfo.cincidencia_id)}</span>
                                <span><strong>nombre_estacion:</strong> ${this.formatDebugValue(inc.nombre_estacion)}</span>
                                <span><strong>id_estacion:</strong> ${this.formatDebugValue(inc.id_estacion)}</span>
                            </div>
                        </div>
                    </details>
                </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Error cargando incidencias:', err);
            const container = document.getElementById('lista-incidencias');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8 text-red-500">
                        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <span class="text-2xl">❌</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Error al cargar incidencias</h3>
                        <p class="text-sm">No se pudo conectar con el servidor</p>
                    </div>
                `;
            }
        }
    },

    // Procesar datos de incidencia para formato consistente
    procesarIncidencia(incidencia) {
        const tipo = this.obtenerTipoIncidenciaTexto(incidencia);
        const id = incidencia.id_incidencia || "N/A";
        const estacion = this.obtenerEstacionIncidencia(incidencia);
        const descripcion = incidencia.descripcion || "Sin descripción proporcionada";
        const fecha = this.formatearFecha(incidencia.fecha_inicio);

        return {
            id: id,
            fecha: fecha,
            tipo: tipo,
            estacion: estacion,
            descripcion: descripcion,
            estado: incidencia.estado_incidencia,
            unidad: incidencia.id_unidad || "N/A",
            operador: incidencia.operador || "No asignado",
            debugInfo: {
                id_cincidencia: incidencia.id_cincidencia,
                tipo: incidencia.tipo,
                id_tipo: incidencia.id_tipo,
                cincidencia_id: incidencia.cincidencia_id,
                nombre_estacion: incidencia.nombre_estacion,
                id_estacion: incidencia.id_estacion
            }
        };
    },

    // Obtener texto descriptivo del tipo de incidencia
    obtenerTipoIncidenciaTexto(incidencia) {
        // Lista de campos posibles donde puede estar el tipo
        const camposPosibles = [
            'nombre_incidencia',
            'tipo_incidencia', 
            'tipo_nombre',
            'categoria',
            'tipo',
            'incidencia_tipo'
        ];

        // Buscar en todos los campos posibles
        for (const campo of camposPosibles) {
            if (incidencia[campo] && 
                incidencia[campo] !== 'null' && 
                incidencia[campo] !== 'undefined' &&
                incidencia[campo] !== '') {
                return incidencia[campo];
            }
        }

        return "❓ Tipo de incidencia";
    },

    // Obtener información de la estación
    obtenerEstacionIncidencia(incidencia) {
        // Campos posibles donde puede estar la estación
        const camposEstacion = [
            'nombre_estacion',
            'estacion_nombre', 
            'ubicacion_estacion',
            'estacion',
            'location',
            'ubicacion'
        ];

        // Buscar en campos directos
        for (const campo of camposEstacion) {
            if (incidencia[campo] && 
                incidencia[campo] !== 'null' && 
                incidencia[campo] !== 'undefined' &&
                incidencia[campo] !== 'N/A' &&
                incidencia[campo] !== '') {
                return incidencia[campo];
            }
        }

        // Si tenemos id_estacion, intentar mapear a nombre
        if (incidencia.id_estacion) {
            const estacionMapeada = this.mapearEstacionPorId(incidencia.id_estacion);
            if (estacionMapeada !== 'N/A') {
                return estacionMapeada;
            }
        }

        return "📍 Ubicación no especificada";
    },

    // Mapear ID de estación a nombre
    mapearEstacionPorId(idEstacion) {
        const estaciones = {
            1: 'Central de Abastos',
            2: 'Cuauhtémoc Sur',
            3: 'Cuauhtémoc Norte', 
            4: 'Jardines del Morelos',
            5: 'Las Américas',
            6: 'San Ángel',
            7: 'Vía Morelos',
            8: 'Impulsora',
            9: 'Nuevo León',
            10: 'Vía López Portillo',
            11: 'Rio de los Remedios',
            12: 'México-Tacuba',
            13: 'Tacuba',
            14: 'Cuitláhuac',
            15: 'Panteones',
            16: 'Poder Judicial',
            17: 'Santiago Atocan',
            18: 'Eduardo Molina',
            19: 'Aragón',
            20: 'Oceanía',
            21: 'Terminal 1',
            22: 'Terminal 2',
            23: 'Hangares',
            24: 'Pantitlán',
            25: 'Ciudad Azteca'
        };
        return estaciones[idEstacion] || 'N/A';
    },

    // Formatear fecha
    formatearFecha(fechaISO) {
        try {
            const fecha = new Date(fechaISO);
            return fecha.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error("Error formateando fecha:", error);
            return "Fecha inválida";
        }
    },

    // Formatear valores de debug
    formatDebugValue(value) {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (value === '') return '""';
        if (value === 'N/A') return '"N/A"';
        return value;
    },

    // Obtener icono de estación
    obtenerIconoEstacion(nombreEstacion) {
        if (!nombreEstacion || nombreEstacion === 'N/A' || nombreEstacion === '📍 Ubicación no especificada') {
            return '<span class="w-6 h-6 inline-block bg-gray-300 rounded-full mr-2 flex items-center justify-center text-xs" title="Estación no especificada">📍</span>';
        }
        
        if (nombreEstacion === '📍 En tránsito') {
            return '<span class="w-6 h-6 inline-block bg-yellow-100 rounded-full mr-2 flex items-center justify-center text-xs" title="En tránsito">🚌</span>';
        }
        
        const iconos = {
            'Central de Abastos': 'centraldeAbastosIcon.png',
            'Ciudad Azteca': 'ciudadAztecaIcon.png',
            'Cuauhtémoc Norte': 'cuauhtemocNorteIcon.png',
            'Cuauhtémoc Sur': 'cuauhtemocSurIcon.png',
            'Jardines del Morelos': 'jardinesdeMorelosIcon.png',
            'Las Américas': 'lasAmericasIcon.png',
            // Agrega más estaciones según necesites
        };
        
        const icono = iconos[nombreEstacion];
        if (icono) {
            return `<img src="../mexibusSystemImages/stationsIcons/${icono}" alt="${nombreEstacion}" 
                     class="w-6 h-6 inline-block mr-2 rounded" title="${nombreEstacion}">`;
        }
        
        return `<span class="w-6 h-6 inline-block bg-blue-500 rounded-full mr-2 flex items-center justify-center text-white text-xs" title="${nombreEstacion}">🚉</span>`;
    },

    // Inicializar el módulo (SIN recarga automática)
    init() {
        console.log('Módulo de incidencias inicializado');
        this.cargar();
        
        // NO hay setInterval - sin recarga automática
    }
};

// Inicializar cuando se navega a la vista de incidencias
document.addEventListener('DOMContentLoaded', function() {
    // Se inicializará cuando se cargue la vista de incidencias
});

// Función global para reportar desde HTML
function reportarIncidencia() {
    moduloIncidencias.reportar();
}

// Función global para cargar incidencias manualmente
function cargarIncidencias() {
    moduloIncidencias.cargar();
}