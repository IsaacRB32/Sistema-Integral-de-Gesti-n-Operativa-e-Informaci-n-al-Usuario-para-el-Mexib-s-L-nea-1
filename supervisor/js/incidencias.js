// incidencias.js - Con bandeja de entrada para validar/rechazar

const moduloIncidencias = {
    // Cache para ubicaciones de unidades
    cacheUnidades: new Map(),
    
async validar(idInc) {
    utils.mostrarModal(
        '¿Validar incidencia?',
        'Esta acción aprobará la incidencia y se marcará como activa.',
        async () => {
            try {
                const res = await fetch(`${CONFIG.API_BASE}/supervisor/incidencias/${idInc}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id_estado: 1,     // Mantener por si acaso
                        observaciones: 'Validada por supervisor'  // Cambiado de observacion
                    })
                });

                if (res.ok) {
                    utils.mostrarMensaje('msg-bandeja', 'Incidencia validada correctamente', 'success');
                    this.cargar();
                } else {
                    // Mejorar el manejo de errores
                    let errorMsg = 'Error al validar';
                    try {
                        const data = await res.json();
                        errorMsg = data.message || data.error || errorMsg;
                    } catch (e) {
                        errorMsg = `Error ${res.status}: ${res.statusText}`;
                    }
                    utils.mostrarMensaje('msg-bandeja', errorMsg, 'error');
                }
            } catch (err) {
                console.error('Error validando incidencia:', err);
                utils.mostrarMensaje('msg-bandeja', 'Error de conexión', 'error');
            }
        }
    );
},

// Para RECHAZAR (mover de PENDIENTE → RESUELTA)
async rechazar(idInc) {
    utils.mostrarModal(
        ' ¿Rechazar incidencia?',
        'Esta acción marcará la incidencia como rechazada.',
        async () => {
            try {
                const res = await fetch(`${CONFIG.API_BASE}/supervisor/incidencias/${idInc}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id_estado: 2,       // Mantener por si acaso
                        observaciones: 'Rechazada por supervisor'  // Cambiado de observacion
                    })
                });

                if (res.ok) {
                    utils.mostrarMensaje('msg-bandeja', 'Incidencia rechazada', 'success');
                    this.cargar();
                } else {
                    let errorMsg = 'Error al rechazar';
                    try {
                        const data = await res.json();
                        errorMsg = data.message || data.error || errorMsg;
                    } catch (e) {
                        errorMsg = `Error ${res.status}: ${res.statusText}`;
                    }
                    utils.mostrarMensaje('msg-bandeja', errorMsg, 'error');
                }
            } catch (err) {
                console.error('Error rechazando incidencia:', err);
                utils.mostrarMensaje('msg-bandeja', 'Error de conexión', 'error');
            }
        }
    );
},

    // Resolver incidencia activa
    async resolver(idInc, idUnidad) {
        utils.mostrarModal(
            ' ¿Resolver incidencia?',
            'Esta acción marcará la incidencia como resuelta y liberará la unidad.',
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
                        utils.mostrarMensaje('msg-bandeja', 'Incidencia resuelta', 'success');
                        this.cargar();
                    } else {
                        utils.mostrarMensaje('msg-bandeja', data.error || 'Error al resolver', 'error');
                    }
                } catch (err) {
                    console.error('Error resolviendo incidencia:', err);
                    utils.mostrarMensaje('msg-bandeja', 'Error de conexión', 'error');
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

    // Cargar bandeja de pendientes + incidencias activas
    async cargar() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/incidencias`);
            
            if (!res.ok) {
                throw new Error(`API incidencias respondió con status: ${res.status}`);
            }
            
            const incidencias = await res.json();
            
            if (!Array.isArray(incidencias)) {
                console.error('API incidencias no devolvió un array:', incidencias);
                this.mostrarError();
                return;
            }

            // Separar pendientes y activas
            const pendientes = incidencias.filter(i => i.estado_incidencia === 'PENDIENTE' || i.id_estado === 3);
            const activas = incidencias.filter(i => i.estado_incidencia === 'ACTIVA' || i.id_estado === 1);

            await this.renderizarBandeja(pendientes);
            await this.renderizarActivas(activas);

        } catch (err) {
            console.error('Error cargando incidencias:', err);
            this.mostrarError();
        }
    },

    // Renderizar bandeja de entrada
    async renderizarBandeja(pendientes) {
        const bandeja = document.getElementById('bandeja-pendientes');
        if (!bandeja) return;

        if (pendientes.length === 0) {
            bandeja.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                        <span class="text-3xl">✅</span>
                    </div>
                    <p class="text-sm text-gray-600">No hay incidencias pendientes</p>
                </div>
            `;
            return;
        }

        const incidenciasProcesadas = await Promise.all(
            pendientes.map(async (inc) => {
                const procesada = this.procesarIncidencia(inc);
                
                if ((procesada.estacion === '📍 Ubicación no especificada' || 
                     procesada.estacion === '📍 En tránsito') && inc.id_unidad) {
                    procesada.estacion = await this.obtenerUbicacionDetallada(inc.id_unidad);
                }
                
                return { inc, procesada };
            })
        );

        bandeja.innerHTML = incidenciasProcesadas.map(({ inc, procesada }) => {
            const iconoEstacion = this.obtenerIconoEstacion(procesada.estacion);

            const btnSim = inc.id_unidad ? `
                <button onclick="simDock.open({ wide: true, focusId: ${inc.id_unidad} })"
                        class="w-full mb-2 bg-white hover:bg-gray-50 text-gray-800 px-3 py-2 rounded text-xs font-medium transition border flex items-center justify-center gap-2">
                    👁️ Ver en simulación
                </button>
            ` : '';
            
            return `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg shadow p-4 fade-in">
                <div class="flex justify-between items-start mb-3">
                    <span class="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">#${procesada.id}</span>
                    <span class="text-xs text-gray-500">${procesada.fecha}</span>
                </div>
                
                <div class="space-y-2 text-sm mb-3">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-700">Tipo:</span>
                        <span class="text-gray-900">${procesada.tipo}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-700">Ubicación:</span>
                        ${iconoEstacion}
                        <span class="text-gray-900">${procesada.estacion}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-700">Unidad:</span>
                        <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">#${procesada.unidad}</span>
                    </div>
                </div>

                <p class="text-xs text-gray-700 mb-3 p-2 bg-white rounded border">${procesada.descripcion}</p>

                ${btnSim}
                <div class="flex gap-2">
                    <button onclick="moduloIncidencias.validar(${inc.id_incidencia})" 
                            class="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-xs font-medium transition">
                        ✅ Validar
                    </button>
                    <button onclick="moduloIncidencias.rechazar(${inc.id_incidencia})" 
                            class="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs font-medium transition">
                        ❌ Rechazar
                    </button>
                </div>
            </div>
            `;
        }).join('');
    },

    // Renderizar incidencias activas
    async renderizarActivas(activas) {
        const container = document.getElementById('lista-incidencias');
        if (!container) return;

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

            const btnSim = inc.id_unidad ? `
                <button onclick="simDock.open({ wide: true, focusId: ${inc.id_unidad} })"
                        class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-800 font-medium border transition flex items-center gap-2">
                    👁️ Ver en simulación
                </button>
            ` : '';
            
            return `
            <div class="bg-white border-l-4 border-red-500 rounded-r-lg shadow-md p-5 mb-4 fade-in hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">#${procesada.id}</span>
                        <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">${procesada.fecha}</span>
                    </div>
                    <div class="flex gap-2">
                        ${btnSim}
                        <button onclick="moduloIncidencias.resolver(${inc.id_incidencia}, ${inc.id_unidad || 'null'})" 
                                class="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white font-medium shadow transition-colors flex items-center gap-2">
                            <span>✅</span>
                            Resolver
                        </button>
                    </div>
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
    },

    mostrarError() {
        const bandeja = document.getElementById('bandeja-pendientes');
        const container = document.getElementById('lista-incidencias');
        
        const errorHTML = `
            <div class="text-center py-8 text-red-500">
                <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <span class="text-2xl">❌</span>
                </div>
                <h3 class="text-lg font-semibold mb-2">Error al cargar</h3>
                <button onclick="moduloIncidencias.cargar()" 
                        class="mt-4 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white">
                    Reintentar
                </button>
            </div>
        `;
        
        if (bandeja) bandeja.innerHTML = errorHTML;
        if (container) container.innerHTML = errorHTML;
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
        console.log(' Módulo de incidencias inicializado con bandeja de validación');
        this.cargar();
    }
};


function cargarIncidencias() {
    moduloIncidencias.cargar();
}