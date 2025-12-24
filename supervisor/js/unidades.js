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

        if (!id) {
            return utils.mostrarMensaje(
                'msg-unidades',
                'Selecciona una unidad del catálogo',
                'error'
            );
        }

        const sel = document.getElementById('input-unidad-id');
        const opt = sel?.selectedOptions?.[0];
        const enCircuito = opt?.dataset?.enCircuito === '1';

        if (enCircuito) {
            return utils.mostrarMensaje('msg-unidades', 'Esa unidad ya está en circuito. Selecciona una “Fuera de circuito”.', 'error');
        }


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
                this.renderizarSelectUnidades(); // 👈
            }, 500);

        } catch (err) {
            console.error('Error:', err);
            utils.mostrarMensaje('msg-unidades', 'Error de conexión', 'error');
        }
    },

    async sacarUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        if (!id) {
            return utils.mostrarMensaje(
                'msg-unidades',
                'Selecciona una unidad del catálogo',
                'error'
            );
        }

        const sel = document.getElementById('input-unidad-id');
        const opt = sel?.selectedOptions?.[0];
        const enCircuito = opt?.dataset?.enCircuito === '1';

        if (!enCircuito) {
            return utils.mostrarMensaje('msg-unidades', 'Esa unidad NO está en circuito. Selecciona una “En circuito”.', 'error');
        }

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
                    this.renderizarSelectUnidades(); // 👈
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

            this.renderizarSimulacion(unidades);
            
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
    mostrarFormularioNuevoUnidad() {
        this.unidadEditandoId = null;

        const titulo = document.getElementById("form-unidad-titulo");
        if (titulo) titulo.textContent = "Agregar unidad";

        const ruta = document.getElementById("cat-ruta");
        const sentido = document.getElementById("cat-sentido");
        const activoSel = document.getElementById("cat-activo");
        const inputId = document.getElementById("cat-id-unidad");

        if (ruta) ruta.value = "1";
        if (sentido) sentido.value = "IDA";
        if (activoSel) activoSel.value = "true";
        if (inputId) {
            inputId.value = "";
            inputId.disabled = false;
        }

        this.mostrarFormUnidad(true);
    },

    mostrarFormUnidad(show) {
    const form = document.getElementById("form-unidad-catalogo");
    if (!form) return;
    form.classList.toggle("hidden", !show);
    },

    async cargarCatalogoUnidades(opts = {}) {
        try {
            const params = new URLSearchParams();
            if (opts.activo !== undefined && opts.activo !== null) {
            params.set("activo", String(opts.activo));
            }

            const qs = params.toString() ? `?${params.toString()}` : "";
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades/catalogo${qs}`);

            if (!res.ok) {
            console.error("Error cargando catálogo de unidades");
            return [];
            }
            return await res.json();
        } catch (err) {
            console.error("Error obteniendo catálogo de unidades:", err);
            return [];
        }
    },


    async renderizarSelectUnidades() {
        const select = document.getElementById('input-unidad-id');
        if (!select) return;

        select.innerHTML = '<option value="">-- Selecciona una unidad --</option>';

        const unidades = await this.cargarCatalogoUnidades({ activo: "true" });

        if (!unidades || unidades.length === 0) {
            select.innerHTML = '<option value="">⚠️ No hay unidades registradas</option>';
            return;
        }

        const fuera = document.createElement('optgroup');
        fuera.label = '🟢 Fuera de circuito (se puede METER)';

        const dentro = document.createElement('optgroup');
        dentro.label = '🔵 En circuito (se puede SACAR)';

        unidades.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id_unidad;

            // guardamos flag para validaciones
            opt.dataset.enCircuito = u.en_circuito ? '1' : '0';

            // texto visible
            opt.textContent = `#${u.id_unidad} - ${u.estado_unidad}${u.en_circuito ? ' (EN CIRCUITO)' : ''}`;

            if (u.en_circuito) dentro.appendChild(opt);
            else fuera.appendChild(opt);
        });

        if (fuera.children.length > 0) select.appendChild(fuera);
        if (dentro.children.length > 0) select.appendChild(dentro);
    },

    seccionActual: 'catalogo',
    filtroActivoCatalogo: "ALL",     // ALL | true | false
    filtroCircuitoCatalogo: "ALL",   // ALL | true | false
    unidadEditandoId: null,

    setFiltroActivoCatalogo(valor) {
    this.filtroActivoCatalogo = String(valor || "ALL");
    this.renderizarTablaCatalogo();
    },

    setFiltroCircuitoCatalogo(valor) {
    this.filtroCircuitoCatalogo = String(valor || "ALL");
    this.renderizarTablaCatalogo();
    },

    aplicarFiltrosCatalogo() {
    this.renderizarTablaCatalogo();
    },

    getFiltroTextoCatalogo() {
    const el = document.getElementById("unidades-search");
    return String(el?.value ?? "").trim().toLowerCase();
    },

    badgeActivo(activo) {
    return activo
        ? `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">ACTIVA</span>`
        : `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">INACTIVA</span>`;
    },

    badgeCircuito(enCircuito) {
    return enCircuito
        ? `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">EN CIRCUITO</span>`
        : `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">FUERA</span>`;
    },


    async mostrarSeccion(seccion) {
        this.seccionActual = seccion;

        const cat = document.getElementById('seccion-unidades-catalogo');
        const op  = document.getElementById('seccion-unidades-operaciones');

        if (cat) cat.classList.toggle('hidden', seccion !== 'catalogo');
        if (op)  op.classList.toggle('hidden', seccion !== 'operaciones');

        const btnCat = document.getElementById('tab-cat-unidades');
        const btnOp  = document.getElementById('tab-op-unidades');

        if (btnCat) {
            btnCat.classList.toggle('bg-mexibus-blue', seccion === 'catalogo');
            btnCat.classList.toggle('text-white', seccion === 'catalogo');
            btnCat.classList.toggle('bg-gray-200', seccion !== 'catalogo');
        }

        if (btnOp) {
            btnOp.classList.toggle('bg-mexibus-blue', seccion === 'operaciones');
            btnOp.classList.toggle('text-white', seccion === 'operaciones');
            btnOp.classList.toggle('bg-gray-200', seccion !== 'operaciones');
        }

        if (seccion === 'catalogo') {
            await this.cargarTablaCatalogo();
        }

        if (seccion === 'operaciones') {
            await this.renderizarSelectUnidades();
            await this.cargar();
        }
    },

    catalogoUnidades: [],

    async cargarTablaCatalogo() {
    const tbody = document.getElementById('tbody-catalogo-unidades');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-gray-400 text-center">Cargando...</td></tr>';

    this.catalogoUnidades = await this.cargarCatalogoUnidades({ activo: "all" });

    this.renderizarTablaCatalogo();
    },

    renderizarTablaCatalogo() {
        const tbody = document.getElementById("tbody-catalogo-unidades");
        if (!tbody) return;

        const q = this.getFiltroTextoCatalogo();
        let data = Array.isArray(this.catalogoUnidades) ? [...this.catalogoUnidades] : [];

        // Filtro activo
        if (this.filtroActivoCatalogo !== "ALL") {
            const want = this.filtroActivoCatalogo === "true";
            data = data.filter(u => Boolean(u.activo) === want);
        }

        // Filtro circuito
        if (this.filtroCircuitoCatalogo !== "ALL") {
            const want = this.filtroCircuitoCatalogo === "true";
            data = data.filter(u => Boolean(u.en_circuito) === want);
        }

        // Búsqueda
        if (q) {
            data = data.filter(u => {
            const txt = [
                u.id_unidad,
                u.id_ruta,
                u.sentido,
                u.estado_unidad,
                u.operador_nombre,
                u.activo ? "activa" : "inactiva",
                u.en_circuito ? "circuito" : "fuera",
            ].join(" ").toLowerCase();
            return txt.includes(q);
            });
        }

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-gray-400 text-center">Sin unidades</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(u => {
            const enCircuito = Boolean(u.en_circuito);
            const activa = Boolean(u.activo);
            const tieneOperador = Boolean(u.tiene_operador || u.operador_id);

            const disableEditar = enCircuito;
            const disableBaja = enCircuito || tieneOperador || !activa;

            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-2 font-semibold">#${u.numero_unidad ?? u.id_unidad}</td>
                <td class="p-2">${u.id_ruta ?? "-"}</td>
                <td class="p-2">${u.sentido ?? "-"}</td>
                <td class="p-2">${this.badgeCircuito(enCircuito)}</td>
                <td class="p-2">${u.estado_unidad ?? "-"}</td>
                <td class="p-2">${u.operador_nombre ?? "-"}</td>
                <td class="p-2">${this.badgeActivo(activa)}</td>
                <td class="p-2">
                <div class="flex gap-2">
                    <button
                    class="bg-yellow-500 text-white px-3 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    ${disableEditar ? "disabled" : ""}
                    onclick="moduloUnidades.editarUnidadCatalogo(${u.id_unidad})"
                    title="${disableEditar ? "No editable: en circuito" : "Editar"}"
                    >Editar</button>

                    ${
                    activa
                        ? `<button
                            class="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                            ${disableBaja ? "disabled" : ""}
                            onclick="${disableBaja ? "" : `moduloUnidades.darBajaUnidadCatalogo(${u.id_unidad})`}"
                            title="${disableBaja ? "No permitido: en circuito o con operador" : "Dar de baja"}"
                        >Dar de baja</button>`
                        : `
                        <button
                            class="bg-green-600 text-white px-3 py-1 rounded hover:opacity-90"
                            onclick="moduloUnidades.reingresarUnidadCatalogo(${u.id_unidad})"
                        >Reingresar</button>

                        <button
                            class="bg-gray-800 text-white px-3 py-1 rounded hover:opacity-90"
                            onclick="moduloUnidades.eliminarUnidadCatalogoPermanente(${u.id_unidad})"
                            title="Eliminar definitivamente"
                        >Eliminar definitivo</button>
                        `
                    }
                </div>
                </td>
            </tr>
            `;
        }).join("");
    },
    cerrarFormUnidadCatalogo() {
        // Oculta el formulario
        const form = document.getElementById("form-unidad-catalogo");
        if (form) form.classList.add("hidden");

        // Limpia estado de edición
        this.unidadEditandoId = null;

        // (Opcional) limpia campos para que no queden valores pegados
        const inputId = document.getElementById("cat-id-unidad");
        if (inputId) {
            inputId.value = "";
            inputId.disabled = false;
        }
    },

    editarUnidadCatalogo(id_unidad) {
        const u = this.catalogoUnidades.find(x => x.id_unidad === id_unidad);

        if (!u) return;

        // regla: no editar en circuito (si tu backend ya lo bloquea, esto es UX)
        if (u.en_circuito) {
            return utils.mostrarMensaje('msg-catalogo-unidades', 'No se puede editar: la unidad está en circuito', 'error');
        }

        this.unidadEditandoId = id_unidad;
        const ruta = document.getElementById('cat-ruta');
        const sentido = document.getElementById('cat-sentido');
        const activoSel = document.getElementById("cat-activo");
        const inputId = document.getElementById("cat-id-unidad");
        if (ruta) ruta.value = String(u.id_ruta);
        if (sentido) sentido.value = u.sentido;
        if (activoSel) activoSel.value = String(Boolean(u.activo)); // NUEVO
        if (inputId) {
            inputId.value = u.id_unidad;
            inputId.disabled = true;
        }
        this.mostrarFormUnidad(true); // NUEVO

        utils.mostrarMensaje('msg-catalogo-unidades', `Editando unidad #${id_unidad}`, 'warning');
        },

    cancelarEdicionUnidad() {
        this.unidadEditandoId = null;
        const ruta = document.getElementById('cat-ruta');
        const sentido = document.getElementById('cat-sentido');
        const activoSel = document.getElementById("cat-activo");
        if (ruta) ruta.value = '1';
        if (sentido) sentido.value = 'IDA';
        if (activoSel) activoSel.value = "true";
        utils.mostrarMensaje('msg-catalogo-unidades', 'Edición cancelada', 'success');
        },

    async guardarUnidadCatalogo() {
    try {
        const ruta = document.getElementById("cat-ruta")?.value;
        const sentido = document.getElementById("cat-sentido")?.value;
        const activoStr = document.getElementById("cat-activo")?.value ?? "true";
        const activo = (String(activoStr) === "true");

        // ESTE ES EL INPUT CORRECTO (según tu vistas.js)
        const num = document.getElementById("cat-id-unidad")?.value;
        const id_unidad = (num !== undefined && String(num).trim() !== "") ? parseInt(num) : null;

        if (!ruta || !sentido) {
        return utils.mostrarMensaje("msg-catalogo-unidades", "Ruta y sentido son obligatorios", "error");
        }

        const esEdicion = this.unidadEditandoId !== null;

        const payload = {
        id_ruta: parseInt(ruta),
        sentido,
        activo
        };

        // SOLO al crear: exigir número y mandarlo al backend
        if (!esEdicion) {
        if (id_unidad === null || Number.isNaN(id_unidad) || id_unidad <= 0) {
            return utils.mostrarMensaje(
            "msg-catalogo-unidades",
            "Número de unidad inválido (entero positivo)",
            "error"
            );
        }
        payload.id_unidad = id_unidad;
        }

        const url = esEdicion
        ? `${CONFIG.API_BASE}/supervisor/unidades/catalogo/${this.unidadEditandoId}`
        : `${CONFIG.API_BASE}/supervisor/unidades/catalogo`;

        const method = esEdicion ? "PUT" : "POST";

        const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
        return utils.mostrarMensaje("msg-catalogo-unidades", data.error || "Error al guardar", "error");
        }

        utils.mostrarMensaje(
        "msg-catalogo-unidades",
        esEdicion ? "Unidad actualizada" : `Unidad #${data.id_unidad} creada`,
        "success"
        );

        this.unidadEditandoId = null;
        this.mostrarFormUnidad(false);

        await this.cargarTablaCatalogo();
        await this.renderizarSelectUnidades();

    } catch (e) {
        console.error(e);
        utils.mostrarMensaje("msg-catalogo-unidades", "Error inesperado al guardar", "error");
    }
    },


    darBajaUnidadCatalogo(id_unidad) {
    utils.mostrarModal(
        "¿Dar de baja unidad?",
        "La unidad quedará INACTIVA (baja lógica). No se permite si está en circuito o con operador asignado.",
        async () => {
        await this.eliminarUnidadCatalogo(id_unidad);
        }
    );
    },

    async reingresarUnidadCatalogo(id_unidad) {
    try {
        const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades/catalogo/${id_unidad}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
        return utils.mostrarMensaje("msg-catalogo-unidades", data.error || "No se pudo reingresar", "error");
        }

        utils.mostrarMensaje("msg-catalogo-unidades", `Unidad #${id_unidad} reingresada`, "success");
        await this.cargarTablaCatalogo();
        await this.renderizarSelectUnidades();
    } catch (e) {
        console.error(e);
        utils.mostrarMensaje("msg-catalogo-unidades", "Error de conexión", "error");
    }
    },

    async eliminarUnidadCatalogo(id_unidad) {
        const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades/catalogo/${id_unidad}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return utils.mostrarMensaje('msg-catalogo-unidades', data.error || 'No se pudo eliminar', 'error');
        }

        utils.mostrarMensaje('msg-catalogo-unidades', `Unidad #${id_unidad} eliminada`, 'success');

        await this.cargarTablaCatalogo();
        await this.renderizarSelectUnidades();
    },
    eliminarUnidadCatalogoPermanente(id_unidad) {
        utils.mostrarModal(
            `¿Eliminar permanentemente la unidad #${id_unidad}?`,
            "Esta acción borra la unidad y su historial relacionado (asignaciones, incidencias, eventos). No se puede deshacer.",
            async () => {
            try {
                const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades/catalogo/${id_unidad}/permanente`, {
                method: "DELETE"
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                return utils.mostrarMensaje("msg-catalogo-unidades", data.error || "No se pudo eliminar permanentemente", "error");
                }

                utils.mostrarMensaje("msg-catalogo-unidades", `Unidad #${id_unidad} eliminada permanentemente`, "success");
                await this.cargarTablaCatalogo();
                await this.renderizarSelectUnidades();
            } catch (e) {
                console.error(e);
                utils.mostrarMensaje("msg-catalogo-unidades", "Error de conexión", "error");
            }
            }
        );
    },


    renderizarSimulacion(unidades) {
        const cont = document.getElementById('simulacion-viva');
        if (!cont) return;

        if (!unidades || unidades.length === 0) {
            cont.innerHTML = `
                <div class="text-center text-gray-400 py-6">
                    🚍 No hay unidades en circulación
                </div>
            `;
            return;
        }

        cont.innerHTML = unidades.map(u => {
            const estacion = CONFIG.estaciones[u.idx_tramo] || 'Desconocida';
            const progreso = Math.round(u.progreso * 100);

            const estadoColor = {
                'EN_RUTA': 'bg-green-100 text-green-800',
                'EN_ESTACION': 'bg-yellow-100 text-yellow-800',
                'EN_COLA': 'bg-blue-100 text-blue-800',
                'INCIDENCIA': 'bg-red-100 text-red-800',
                'FUERA_DE_SERVICIO': 'bg-gray-200 text-gray-800'
            }[u.estado_unidad] || 'bg-gray-200 text-gray-800';

            const conductor = this.conductoresDisponibles
                .find(c => c.unidad_asignada === u.id_unidad);

            return `
                <div class="border rounded-lg p-4 mb-3 shadow-sm bg-white">
                    
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-2">
                        <div class="font-bold text-lg">
                            🚍 Unidad #${u.id_unidad}
                        </div>

                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${estadoColor}">
                            ${u.estado_unidad.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <!-- Datos -->
                    <div class="text-sm text-gray-700 space-y-1">
                        <div>
                            <strong>Sentido:</strong>
                            ${u.sentido === 'IDA' ? '→ IDA' : '← VUELTA'}
                        </div>

                        <div class="flex items-center gap-2">
                            ${this.obtenerIconoEstacion(estacion)}
                            <span><strong>Estación:</strong> ${estacion}</span>
                        </div>

                        <div>
                            <strong>Operador:</strong>
                            ${conductor ? conductor.nombre_completo : '👤 Sin asignar'}
                        </div>
                    </div>

                    <!-- Progreso -->
                    <div class="mt-3">
                        <div class="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progreso</span>
                            <span>${progreso}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div class="bg-gradient-to-r from-mexibus-blue to-mexibus-green h-2"
                                style="width:${progreso}%"></div>
                        </div>
                    </div>

                </div>
            `;
        }).join('');
    },
    iniciarAutoRefresh() {
        setInterval(() => {
            if (this.seccionActual === 'operaciones') {
                this.cargar();
            }
        }, 3000); // cada 3 segundos
    },


    async init() {
        await this.cargarConductores();
        await this.renderizarSelectUnidades();
        await this.cargar();
        await this.mostrarSeccion('catalogo');
        this.iniciarAutoRefresh();
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