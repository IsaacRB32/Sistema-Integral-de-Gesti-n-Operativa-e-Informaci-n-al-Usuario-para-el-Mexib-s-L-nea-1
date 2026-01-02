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
            const select = document.getElementById('input-operador');
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
        const sel = document.getElementById("input-unidad-id"); // METER
        const id = sel?.value;

        const ruta = document.getElementById("input-ruta")?.value;
        const sentido = document.getElementById("input-sentido")?.value;
        const conductorId = document.getElementById("input-operador")?.value;

        if (!id) {
            return utils.mostrarMensaje("msg-unidades", "Selecciona una unidad (FUERA de circuito)", "error");
        }

        const opt = sel?.selectedOptions?.[0];
        const enCircuito = opt?.dataset?.enCircuito === "1";
        if (enCircuito) {
            return utils.mostrarMensaje("msg-unidades", "Esa unidad ya está en circuito.", "error");
        }

        // velocidad: input -> dataset
        const velocidadStr = document.getElementById("input-velocidad")?.value;
        let velocidad = Number(velocidadStr);
        if (!Number.isFinite(velocidad)) velocidad = Number(opt?.dataset?.velocidad);

        if (!Number.isFinite(velocidad) || velocidad < 0) {
            return utils.mostrarMensaje("msg-unidades", "Velocidad inválida (>= 0)", "error");
        }

        const label = opt?.dataset?.label ?? `#${id}`;

        try {
            const resUnidad = await fetch(`${CONFIG.API_BASE}/sim/entrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_unidad: parseInt(id, 10),
                id_ruta: parseInt(ruta, 10),
                sentido,
                idx_tramo: 0,
                velocidad
            })
            });

            const dataUnidad = await resUnidad.json().catch(() => ({}));
            if (!resUnidad.ok || !dataUnidad.ok) {
            return utils.mostrarMensaje("msg-unidades", dataUnidad.error || "Error al ingresar unidad", "error");
            }

            if (conductorId) {
            const resConductor = await fetch(`${CONFIG.API_BASE}/supervisor/asignar-conductor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                id_usuario: parseInt(conductorId, 10),
                id_unidad: parseInt(id, 10)
                })
            });

            if (!resConductor.ok) {
                utils.mostrarMensaje("msg-unidades", `${label} ingresada pero no se pudo asignar conductor`, "warning");
            } else {
                utils.mostrarMensaje("msg-unidades", `${label} ingresada con conductor asignado`, "success");
            }
            } else {
            utils.mostrarMensaje("msg-unidades", `${label} ingresada sin conductor`, "success");
            }

            // Abrir simulación acoplable para dar contexto visual al supervisor.
            try { simDock?.open?.({ wide: true, focusId: id }); } catch (e) { /* noop */ }

            setTimeout(() => {
            this.cargar();
            this.cargarConductores();
            this.renderizarSelectUnidades();
            }, 500);

        } catch (err) {
            console.error(err);
            utils.mostrarMensaje("msg-unidades", "Error de conexión", "error");
        }
    },

    async sacarUnidad() {
        const sel = document.getElementById("input-unidad-id-sacar"); // SACAR
        const id = sel?.value;

        if (!id) {
            return utils.mostrarMensaje("msg-unidades", "Selecciona una unidad EN circuito", "error");
        }

        const opt = sel?.selectedOptions?.[0];
        const enCircuito = opt?.dataset?.enCircuito === "1";
        const label = opt?.dataset?.label ?? `#${id}`;

        if (!enCircuito) {
            return utils.mostrarMensaje("msg-unidades", "Esa unidad NO está en circuito.", "error");
        }

        try {
            await fetch(`${CONFIG.API_BASE}/supervisor/desasignar-conductor`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_unidad: parseInt(id, 10) })
            });

            const res = await fetch(`${CONFIG.API_BASE}/sim/salir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_unidad: parseInt(id, 10) })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
            return utils.mostrarMensaje("msg-unidades", data.error || "Error al sacar unidad", "error");
            }

            utils.mostrarMensaje("msg-unidades", `${label} sacada del servicio`, "success");

            // Abrir simulación acoplable para confirmar visualmente la salida.
            try { simDock?.open?.({ wide: true, focusId: id }); } catch (e) { /* noop */ }

            setTimeout(() => {
            this.cargar();
            this.cargarConductores();
            this.renderizarSelectUnidades();
            }, 500);

        } catch (err) {
            console.error(err);
            utils.mostrarMensaje("msg-unidades", "Error de conexión", "error");
        }
    },

    // Función para obtener icono de estación (CON IMÁGENES PNG)
    obtenerIconoEstacion(nombreEstacion) {
        if (!nombreEstacion || nombreEstacion === 'Desconocida') {
            return '<span class="inline-block w-3 h-3 rounded-full bg-gray-400"></span>';
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

        // 1) Ocultar campos avanzados (ruta/sentido/activo) en modo "Agregar"
        const adv = document.getElementById("cat-campos-avanzados");
        if (adv) adv.classList.add("hidden");

        // 2) Reset de defaults internos (aunque no se muestren)
        const ruta = document.getElementById("cat-ruta");
        const sentido = document.getElementById("cat-sentido");
        const activoSel = document.getElementById("cat-activo");

        if (ruta) ruta.value = "1";
        if (sentido) sentido.value = "IDA";
        if (activoSel) activoSel.value = "true";

        // 3) Limpiar y habilitar número de unidad
        const inputId = document.getElementById("cat-id-unidad");
        if (inputId) {
            inputId.value = "";
            inputId.disabled = false;
        }

        // 4) Limpiar Marca/Modelo (estos IDs deben existir en tu vistas.js)
        const marca = document.getElementById("cat-marca");
        const modelo = document.getElementById("cat-modelo");
        if (marca) marca.value = "";
        if (modelo) modelo.value = "";

        // 5) Mostrar formulario
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
        const selectMeter = document.getElementById("input-unidad-id");         // METER
        const selectSacar = document.getElementById("input-unidad-id-sacar");   // SACAR (pon este id en el HTML)

        if (!selectMeter && !selectSacar) {
            console.warn("No se encontraron selects de unidades (input-unidad-id / input-unidad-id-sacar).");
            return;
        }

        if (selectMeter) selectMeter.innerHTML = `<option value="">Cargando unidades...</option>`;
        if (selectSacar) selectSacar.innerHTML = `<option value="">Cargando unidades en circuito...</option>`;

        let unidades = [];
        try {
            unidades = await this.cargarCatalogoUnidades({ activo: "true" });
        } catch (e) {
            console.error("Error cargando catálogo:", e);
        }

        if (!Array.isArray(unidades) || unidades.length === 0) {
            if (selectMeter) selectMeter.innerHTML = `<option value="">⚠️ No hay unidades registradas</option>`;
            if (selectSacar) selectSacar.innerHTML = `<option value="">⚠️ No hay unidades en circuito</option>`;
            return;
        }

        const fuera = unidades.filter(u => !u.en_circuito);
        const dentro = unidades.filter(u => !!u.en_circuito);

        const crearOption = (u) => {
            const opt = document.createElement("option");
            opt.value = u.id_unidad;

            opt.dataset.enCircuito = u.en_circuito ? "1" : "0";
            opt.dataset.velocidad = String(u.velocidad ?? 0.8);

            const labelNum = (u.numero_unidad ?? u.id_unidad);
            opt.dataset.label = `#${labelNum}`;

            const estado = (u.estado_unidad ?? "-");
            opt.textContent = `#${labelNum} - ${estado}`;

            return opt;
        };

        // ----- SELECT METER: SOLO FUERA DE CIRCUITO -----
        if (selectMeter) {
            selectMeter.innerHTML = `<option value="">-- Selecciona una unidad (FUERA) --</option>`;

            if (fuera.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "⚠️ No hay unidades FUERA de circuito";
            selectMeter.appendChild(opt);
            } else {
            fuera.forEach(u => selectMeter.appendChild(crearOption(u)));
            }

            // Sincroniza velocidad al cambiar unidad (solo en METER)
            const syncVel = () => {
            const opt = selectMeter.selectedOptions?.[0];
            const v = opt?.dataset?.velocidad;
            const inputVel = document.getElementById("input-velocidad");
            if (inputVel && v !== undefined) inputVel.value = Number(v);
            };

            selectMeter.onchange = syncVel;
            setTimeout(syncVel, 0);
        }

        // ----- SELECT SACAR: SOLO EN CIRCUITO -----
        if (selectSacar) {
            selectSacar.innerHTML = `<option value="">-- Selecciona una unidad (EN CIRCUITO) --</option>`;

            if (dentro.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "⚠️ No hay unidades EN circuito";
            selectSacar.appendChild(opt);
            } else {
            dentro.forEach(u => selectSacar.appendChild(crearOption(u)));
            }
        }
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
            await this.cargarConductores();
            await this.renderizarSelectUnidades();
            await this.cargar();
        }
    },

    catalogoUnidades: [],
    getUnidadLabelById(id_unidad) {
        const u = Array.isArray(this.catalogoUnidades)
            ? this.catalogoUnidades.find(x => x.id_unidad === id_unidad)
            : null;

        return `#${u?.numero_unidad ?? id_unidad}`;
    },
    // ✅ NUEVO: si ya tienes el objeto unidad (u), úsalo directo
    unidadLabel(u) {
        return `#${u?.numero_unidad ?? u?.id_unidad ?? ""}`.trim();
    },


    async cargarTablaCatalogo() {
    const tbody = document.getElementById('tbody-catalogo-unidades');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="11" class="p-4 text-gray-400 text-center">Cargando...</td></tr>';

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

        // Búsqueda (sin idx_tramo/estacion/progreso/dwell)
        if (q) {
            data = data.filter(u => {
            const txt = [
                u.id_unidad,
                u.numero_unidad,
                u.marca,
                u.modelo,
                u.id_ruta,
                u.sentido,
                u.estado_unidad,
                u.operador_nombre,
                u.operador_id,
                u.velocidad,
                u.activo ? "activa" : "inactiva",
                u.en_circuito ? "circuito" : "fuera",
            ].join(" ").toLowerCase();

            return txt.includes(q);
            });
        }

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="11" class="p-4 text-gray-400 text-center">Sin unidades</td></tr>`;
            return;
        }

        const fmtVel = (v) => {
            if (v === null || v === undefined || v === "") return "-";
            const n = Number(v);
            return Number.isFinite(n) ? n.toFixed(1) : "-";
        };

        tbody.innerHTML = data.map(u => {
            const enCircuito = Boolean(u.en_circuito);
            const activa = Boolean(u.activo);
            const tieneOperador = Boolean(u.tiene_operador || u.operador_id);

            const disableEditar = enCircuito;
            const disableBaja = enCircuito || tieneOperador || !activa;

            const unidadLabel = `#${u.numero_unidad ?? u.id_unidad}`;
            const velocidad = fmtVel(u.velocidad);

            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-2 font-semibold">${unidadLabel}</td>
                <td class="p-2">${u.marca ?? "-"}</td>
                <td class="p-2">${u.modelo ?? "-"}</td>
                <td class="p-2">${u.id_ruta ?? "-"}</td>
                <td class="p-2">${u.sentido ?? "-"}</td>
                <td class="p-2">${this.badgeCircuito(enCircuito)}</td>
                <td class="p-2">${u.estado_unidad ?? "-"}</td>
                <td class="p-2">${velocidad}</td>
                <td class="p-2">${u.operador_nombre ?? "-"}${u.operador_id ? ` (ID:${u.operador_id})` : ""}</td>
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

        // Ocultar avanzados por defecto (para que al abrir "Agregar" no se vean)
        const adv = document.getElementById("cat-campos-avanzados");
        if (adv) adv.classList.add("hidden");

        // Limpieza de campos
        const inputId = document.getElementById("cat-id-unidad");
        if (inputId) {
            inputId.value = "";
            inputId.disabled = false;
        }

        const inputMarca = document.getElementById("cat-marca");
        const inputModelo = document.getElementById("cat-modelo");
        if (inputMarca) inputMarca.value = "";
        if (inputModelo) inputModelo.value = "";
    },

    editarUnidadCatalogo(id_unidad) {
        const u = this.catalogoUnidades.find(x => x.id_unidad === id_unidad);
        if (!u) return;

        // regla: no editar en circuito (si tu backend ya lo bloquea, esto es UX)
        if (u.en_circuito) {
            return utils.mostrarMensaje(
            'msg-catalogo-unidades',
            'No se puede editar: la unidad está en circuito',
            'error'
            );
        }

        this.unidadEditandoId = id_unidad;

        // Título
        const titulo = document.getElementById("form-unidad-titulo");
        if (titulo) titulo.textContent = `Editar unidad #${u.numero_unidad ?? u.id_unidad}`;

        // En edición SOLO dejamos: número, marca, modelo.
        // Ruta / Sentido / Estatus (reingreso) no se editan aquí.
        const adv = document.getElementById("cat-campos-avanzados");
        if (adv) adv.classList.add("hidden");

        // Número visible (numero_unidad). El ID interno se mantiene en this.unidadEditandoId.
        const inputNum = document.getElementById("cat-id-unidad");
        if (inputNum) {
            inputNum.value = (u.numero_unidad ?? u.id_unidad);
            inputNum.disabled = false;
        }

        // Marca / modelo
        const inputMarca = document.getElementById("cat-marca");
        const inputModelo = document.getElementById("cat-modelo");
        if (inputMarca) inputMarca.value = u.marca ?? "";
        if (inputModelo) inputModelo.value = u.modelo ?? "";

        this.mostrarFormUnidad(true);
        utils.mostrarMensaje(
            'msg-catalogo-unidades',
            `Editando unidad #${u.numero_unidad ?? u.id_unidad}`,
            'warning'
        );
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
            const esEdicion = this.unidadEditandoId !== null;

            // Campos principales (SIEMPRE)
            const num = document.getElementById("cat-id-unidad")?.value;
            const numero = (num !== undefined && String(num).trim() !== "") ? parseInt(num) : null;

            const marca = document.getElementById("cat-marca")?.value?.trim() ?? "";
            const modelo = document.getElementById("cat-modelo")?.value?.trim() ?? "";

            // Nota: Ruta / Sentido / Estatus (reingreso) NO se editan desde este formulario.
            // En alta, asignamos defaults seguros para no romper simulación.

            // Validaciones
            if (!marca || !modelo) {
            return utils.mostrarMensaje("msg-catalogo-unidades", "Marca y modelo son obligatorios", "error");
            }

            // Número: obligatorio y válido en alta y edición
            if (numero === null || Number.isNaN(numero) || numero <= 0) {
            return utils.mostrarMensaje(
                "msg-catalogo-unidades",
                "Número de unidad inválido (entero positivo)",
                "error"
            );
            }

            // Payload
            const payload = { marca, modelo };

            if (esEdicion) {
            // Se edita el "número visible" (numero_unidad), NO el id_unidad interno.
            payload.numero_unidad = numero;
            } else {
            // Alta: mantenemos compatibilidad con backend que usa id_unidad como número.
            payload.id_unidad = numero;
            payload.numero_unidad = numero;

            // Defaults de simulación
            payload.id_ruta = 1;
            payload.sentido = "IDA";
            payload.activo = true;
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
            esEdicion ? "Unidad actualizada" : `Unidad #${data.id_unidad ?? numero} creada`,
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
        const label = this.getUnidadLabelById(id_unidad);

        utils.mostrarModal(
            `¿Dar de baja la unidad ${label}?`,
            "La unidad quedará INACTIVA (baja lógica). No se permite si está en circuito o con operador asignado.",
            async () => {
            await this.eliminarUnidadCatalogo(id_unidad);
            }
        );
    },


    async reingresarUnidadCatalogo(id_unidad) {
        const labelAntes = this.getUnidadLabelById(id_unidad);

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

            // Si el backend regresa numero_unidad, úsalo; si no, usa el labelAntes
            const labelFinal = `#${data?.numero_unidad ?? labelAntes.replace("#", "")}`;

            utils.mostrarMensaje("msg-catalogo-unidades", `Unidad ${labelFinal} reingresada`, "success");
            await this.cargarTablaCatalogo();
            await this.renderizarSelectUnidades();
        } catch (e) {
            console.error(e);
            utils.mostrarMensaje("msg-catalogo-unidades", "Error de conexión", "error");
        }
    },

    async eliminarUnidadCatalogo(id_unidad) {
        const label = this.getUnidadLabelById(id_unidad);

        const res = await fetch(`${CONFIG.API_BASE}/supervisor/unidades/catalogo/${id_unidad}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return utils.mostrarMensaje("msg-catalogo-unidades", data.error || "No se pudo eliminar", "error");
        }

        utils.mostrarMensaje("msg-catalogo-unidades", `Unidad ${label} eliminada`, "success");
        await this.cargarTablaCatalogo();
        await this.renderizarSelectUnidades();
    },

    
    eliminarUnidadCatalogoPermanente(id_unidad) {
        const label = this.getUnidadLabelById(id_unidad);

        utils.mostrarModal(
            `¿Eliminar permanentemente la unidad ${label}?`,
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

                utils.mostrarMensaje("msg-catalogo-unidades", `Unidad ${label} eliminada permanentemente`, "success");
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
                <div class="text-center text-gray-400 py-10">
                    <div class="text-sm font-semibold text-gray-500">No hay unidades en circulación</div>
                    <div class="text-xs text-gray-400 mt-1">Cuando metas una unidad, aparecerá aquí en tiempo real.</div>
                </div>
            `;
            return;
        }

        cont.innerHTML = unidades.map(u => {
            const estacion = CONFIG.estaciones[u.idx_tramo] || 'Desconocida';
            const progreso = Math.round((Number(u.progreso) || 0) * 100);

            const conductor = this.obtenerConductorAsignado?.(u.id_unidad) || null;
            const nombreOperador = conductor ? conductor.nombre_completo : 'Sin asignar';

            const estado = (u.estado_unidad || '—').toUpperCase();
            const sentido = (u.sentido || '—').toUpperCase();

            const badge =
                estado === 'INCIDENCIA' ? 'bg-red-50 text-red-700 border-red-200' :
                estado === 'EN_COLA' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                estado === 'EN_ESTACION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-green-50 text-green-700 border-green-200';

            return `
                <div class="border rounded-xl p-4 mb-3 bg-white shadow-sm hover:border-gray-300 transition">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="text-sm font-bold text-gray-900">Unidad #${u.id_unidad}</div>
                            <div class="text-xs text-gray-500 mt-0.5">Sentido: <span class="font-semibold text-gray-700">${sentido}</span></div>
                        </div>

                        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold border ${badge}">
                            ${estado}
                        </span>
                    </div>

                    <div class="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-700">
                        <div class="flex items-center gap-2">
                            ${this.obtenerIconoEstacion(estacion)}
                            <span><span class="font-semibold text-gray-900">Estación:</span> ${estacion}</span>
                        </div>

                        <div class="flex items-center justify-between gap-3">
                            <span class="text-gray-600">Operador</span>
                            <span class="font-semibold text-gray-900 text-right">${nombreOperador}</span>
                        </div>
                    </div>

                    <div class="mt-3">
                        <div class="flex justify-between text-[11px] text-gray-500 mb-1">
                            <span>Progreso</span>
                            <span class="font-semibold text-gray-700">${progreso}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div class="bg-mexibus-blue h-2" style="width:${progreso}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    iniciarAutoRefresh() {
        if (this._autoRefreshId) return; // ya está corriendo
        this._autoRefreshId = setInterval(() => {
            if (this.seccionActual === "operaciones") this.cargar();
        }, 3000);
    },


    async init(modo = 'catalogo') {
        // modo:
        //  - 'catalogo'    => Vista "Unidades" (solo catálogo)
        //  - 'operaciones' => Vista "Operaciones" (control + monitoreo)

        const tieneCatalogo = Boolean(document.getElementById('seccion-unidades-catalogo'));
        const tieneOperaciones = Boolean(
            document.getElementById('input-unidad-id') ||
            document.getElementById('input-unidad-id-sacar') ||
            document.getElementById('simulacion-viva')
        );

        if (modo === 'operaciones') {
            this.seccionActual = 'operaciones';

            // Datos requeridos por el flujo de operaciones
            await this.cargarConductores();
            await this.renderizarSelectUnidades();
            await this.cargar();

            this.iniciarAutoRefresh();
            return;
        }

        // Default: catálogo
        this.seccionActual = 'catalogo';

        if (tieneCatalogo) {
            await this.cargarTablaCatalogo();
        }

        // Si por alguna razón la vista incluye Operaciones también, no las activamos aquí.
        // (Operaciones se inicializa desde su propia pestaña)
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