// incidencias.js - Versión con SOLO EMOJIS

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

    // Obtener ubicación detallada de una unidad
    async obtenerUbicacionDetallada(idUnidad) {
        if (this.cacheUnidades.has(idUnidad)) {
            const cacheData = this.cacheUnidades.get(idUnidad);
            if (Date.now() - cacheData.timestamp < 30000) {
                return cacheData.ubicacion;
            }
        }

        try {
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades`);
            
            if (!res.ok) {
                console.warn(`API unidades respondió con status: ${res.status}`);
                return '📍 En tránsito';
            }
            
            const unidades = await res.json();
            
            if (!Array.isArray(unidades)) {
                console.warn('API unidades no devolvió un array:', unidades);
                return '📍 En tránsito';
            }
            
            const unidad = unidades.find(u => u.id_unidad === idUnidad);
            if (!unidad) {
                console.warn(`Unidad ${idUnidad} no encontrada`);
                return '📍 En tránsito';
            }

            let ubicacion = '📍 En tránsito';

            if (unidad.estacion_origen && unidad.estacion_destino) {
                const progresoPorcentaje = Math.round((unidad.progreso || 0) * 100);
                ubicacion = `Entre ${unidad.estacion_origen} → ${unidad.estacion_destino} (${progresoPorcentaje}%)`;
            } else if (unidad.estacion_origen) {
                ubicacion = `Saliendo de ${unidad.estacion_origen}`;
            } else if (unidad.nombre_estacion) {
                ubicacion = unidad.nombre_estacion;
            }

            this.cacheUnidades.set(idUnidad, {
                ubicacion: ubicacion,
                timestamp: Date.now()
            });

            return ubicacion;

        } catch (err) {
            console.error('Error obteniendo ubicación detallada:', err);
            return this.obtenerUbicacionSimulada(idUnidad);
        }
    },

    // Fallback de simulación
    obtenerUbicacionSimulada(idUnidad) {
        const estaciones = [
            'Central de Abastos', '19 de Septiembre', 'Palomas', 'Jardines de Morelos',
            'Aquiles Serdán', 'Hospital', '1° de Mayo', 'Las Américas', 'Valle Ecatepec',
            'Vocacional 3', 'Adolfo López Mateos', 'Zodiaco', 'Alfredo Torres', 'UNITEC',
            'Industrial', 'Josefa Ortiz', 'Quinto Sol', 'Ciudad Azteca'
        ];
        
        const seed = idUnidad % 5;
        const estacionIndex = (idUnidad + seed) % estaciones.length;
        const siguienteIndex = (estacionIndex + 1) % estaciones.length;
        const progreso = [25, 50, 65, 80, 90][seed];
        
        return `Entre ${estaciones[estacionIndex]} → ${estaciones[siguienteIndex]} (${progreso}%)`;
    },

    // Cargar y mostrar incidencias activas
    async cargar() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/incidencias`);
            
            if (!res.ok) {
                throw new Error(`API incidencias respondió con status: ${res.status}`);
            }
            
            const incidencias = await res.json();
            const container = document.getElementById('lista-incidencias');
            
            if (!container) {
                console.error('Contenedor de incidencias no encontrado');
                return;
            }

            if (!Array.isArray(incidencias)) {
                console.error('API incidencias no devolvió un array:', incidencias);
                container.innerHTML = `
                    <div class="text-center py-8 text-red-500">
                        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <span class="text-2xl">❌</span>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Error en formato de datos</h3>
                        <p class="text-sm">La API no devolvió un formato válido</p>
                    </div>
                `;
                return;
            }

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

            const incidenciasProcesadas = await Promise.all(
                activas.map(async (inc) => {
                    const procesada = this.procesarIncidencia(inc);
                    
                    if ((procesada.estacion === '📍 Ubicación no especificada' || 
                         procesada.estacion === '📍 En tránsito') && inc.id_unidad) {
                        procesada.estacion = await this.obtenerUbicacionDetallada(inc.id_unidad);
                    }
                    
                    return { inc, procesada };
                })
            );

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
                                <span class="text-gray-700 font-medium w-20 mt-1">Ubicación:</span>
                                <div class="ml-2 flex items-center gap-2">
                                    <span class="text-2xl">${iconoEstacion}</span>
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
                        <button onclick="moduloIncidencias.cargar()" 
                                class="mt-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
    },

    procesarIncidencia(incidencia) {
        return {
            id: incidencia.id_incidencia || "N/A",
            fecha: this.formatearFecha(incidencia.fecha_inicio),
            tipo: this.obtenerTipoIncidenciaTexto(incidencia),
            estacion: this.obtenerEstacionIncidencia(incidencia),
            descripcion: incidencia.descripcion || "Sin descripción proporcionada",
            estado: incidencia.estado_incidencia,
            unidad: incidencia.id_unidad || "N/A",
            operador: incidencia.operador || "No asignado"
        };
    },

    obtenerTipoIncidenciaTexto(incidencia) {
        const camposPosibles = [
            'nombre_incidencia', 'tipo_incidencia', 'tipo_nombre',
            'categoria', 'tipo', 'incidencia_tipo'
        ];

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

    obtenerEstacionIncidencia(incidencia) {
        const camposEstacion = [
            'nombre_estacion', 'estacion_nombre', 'ubicacion_estacion',
            'estacion', 'location', 'ubicacion'
        ];

        for (const campo of camposEstacion) {
            if (incidencia[campo] && 
                incidencia[campo] !== 'null' && 
                incidencia[campo] !== 'undefined' &&
                incidencia[campo] !== 'N/A' &&
                incidencia[campo] !== '') {
                return incidencia[campo];
            }
        }

        if (incidencia.id_estacion) {
            const estacionMapeada = this.mapearEstacionPorId(incidencia.id_estacion);
            if (estacionMapeada !== 'N/A') {
                return estacionMapeada;
            }
        }

        return "📍 Ubicación no especificada";
    },

    mapearEstacionPorId(idEstacion) {
        const estaciones = {
            1: 'Central de Abastos', 2: '19 de Septiembre', 3: 'Palomas', 
            4: 'Jardines de Morelos', 5: 'Aquiles Serdán', 6: 'Hospital',
            7: '1° de Mayo', 8: 'Las Américas', 9: 'Valle Ecatepec',
            10: 'Vocacional 3', 11: 'Adolfo López Mateos', 12: 'Zodiaco',
            13: 'Alfredo Torres', 14: 'UNITEC', 15: 'Industrial',
            16: 'Josefa Ortiz', 17: 'Quinto Sol', 18: 'Ciudad Azteca'
        };
        return estaciones[idEstacion] || 'N/A';
    },

    formatearFecha(fechaISO) {
        try {
            const fecha = new Date(fechaISO);
            return fecha.toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        } catch (error) {
            console.error("Error formateando fecha:", error);
            return "Fecha inválida";
        }
    },

    // SOLO EMOJIS - SIN IMÁGENES
    obtenerIconoEstacion(nombreEstacion) {
        if (!nombreEstacion || nombreEstacion === 'N/A' || nombreEstacion === '📍 Ubicación no especificada') {
            return '📍';
        }
        
        if (nombreEstacion.includes('Entre') && nombreEstacion.includes('→')) {
            return '🚌';
        }
        
        const emojisEstaciones = {
            'Central de Abastos': '🏪',
            'Ciudad Azteca': '🏛️',
            '19 de Septiembre': '🗓️',
            'Palomas': '🕊️',
            'Jardines de Morelos': '🌳',
            'Aquiles Serdán': '⚔️',
            'Hospital': '🏥',
            '1° de Mayo': '🔧',
            'Las Américas': '🌎',
            'Valle Ecatepec': '🏞️',
            'Vocacional 3': '🎓',
            'Adolfo López Mateos': '👨‍💼',
            'Zodiaco': '♈',
            'Alfredo Torres': '👨‍🔧',
            'UNITEC': '🏫',
            'Industrial': '🏭',
            'Josefa Ortiz': '👩‍⚖️',
            'Quinto Sol': '☀️'
        };
        
        return emojisEstaciones[nombreEstacion] || '🚉';
    },

    init() {
        console.log('✅ Módulo de incidencias inicializado (solo emojis)');
        this.cargar();
    }
};

function reportarIncidencia() {
    moduloIncidencias.reportar();
}

function cargarIncidencias() {
    moduloIncidencias.cargar();
}