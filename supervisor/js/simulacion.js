// supervisor/js/simulacion.js
// Visualización lineal avanzada para monitoreo (IDA arriba, estaciones al centro, REGRESO abajo)

const moduloSimulacion = {
  // =========================
  // Configuración visual
  // =========================
  colores: {
    EN_RUTA: "#9BE645",
    EN_ESTACION: "#FFA500",
    EN_COLA: "#0796C2",
    INCIDENCIA: "#FF4444",
  },

  // Escala del track (px por estación)
  CELL_PX: 140,
  MARGIN_PX: 70,

  // =========================
  // Geometría (nuevo layout)
  //   - IDA arriba
  //   - Estaciones al centro
  //   - REGRESO abajo
  // =========================
  TRACK_H: 210,

  Y_LANE_IDA: 26,      // carril superior (IDA)
  Y_LINE: 100,         // línea central (estaciones)
  Y_STATION: 92,       // nodos (estaciones) sobre la línea
  Y_LABEL: 112,        // etiquetas de estaciones
  Y_LANE_REG: 174,     // carril inferior (REGRESO)

  // =========================
  // Estado interno
  // =========================
  _dom: {
    simContainer: null,
    colaLineal: null,
    trackInner: null,
    toolbar: null,
    selUnidad: null,
    btnFollow: null,
    lblUpdated: null,
    lblStats: null,
  },

  _stationX: [],
  _trackWidth: 0,

  _markerMap: new Map(), // id_unidad -> element
  _follow: false,
  _focusId: "",

  // =========================
  // API pública
  // =========================
  iniciar() {
    const simContainer = document.getElementById("sim-container");
    const colaLineal = document.getElementById("cola-lineal");
    if (!simContainer || !colaLineal) return;

    this._removerCanvas();

    this._dom.simContainer = simContainer;
    this._dom.colaLineal = colaLineal;
    this._markerMap.clear();

    this._asegurarUI();
    this._renderBaseTrack();
    this._cargarSnapshot();
  },

  actualizar(unidades) {
    if (!Array.isArray(unidades)) unidades = [];
    if (!this._dom.trackInner) return;

    this._actualizarTrack(unidades);
    this.actualizarTabla(unidades);

    if (this._dom.lblUpdated) {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      this._dom.lblUpdated.textContent = `Actualizado: ${hh}:${mm}:${ss}`;
    }

    if (this._dom.lblStats) {
      const stats = { EN_RUTA: 0, EN_ESTACION: 0, EN_COLA: 0, INCIDENCIA: 0 };
      unidades.forEach((u) => {
        const k = u?.estado_unidad;
        if (stats[k] !== undefined) stats[k]++;
      });
      this._dom.lblStats.textContent =
        `Unidades: ${unidades.length} | Ruta: ${stats.EN_RUTA} | Estación: ${stats.EN_ESTACION} | Cola: ${stats.EN_COLA} | Incidencia: ${stats.INCIDENCIA}`;
    }

    if (this._follow && this._focusId) {
      this._centrarEnUnidad(this._focusId);
    }
  },

  toggleFollow() {
    this._follow = !this._follow;
    if (this._dom.btnFollow) {
      this._dom.btnFollow.textContent = `Seguir: ${this._follow ? "ON" : "OFF"}`;
      this._dom.btnFollow.className = this._follow
        ? "px-4 py-2 rounded-lg bg-mexibus-blue text-white text-sm font-medium hover:opacity-90 transition"
        : "px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition";
    }
    if (this._follow && this._focusId) this._centrarEnUnidad(this._focusId);
  },

  // =========================
  // UI / DOM
  // =========================
  _asegurarUI() {
    const { simContainer, colaLineal } = this._dom;

    let toolbar = document.getElementById("sim-toolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.id = "sim-toolbar";
      toolbar.className =
        "mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between";

      toolbar.innerHTML = `
        <div class="flex flex-col gap-2">
          <div class="text-xs text-gray-600" id="sim-stats">Unidades: 0</div>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="flex items-center gap-2 bg-white border rounded-full px-3 py-1">
              <span class="w-3 h-3 rounded-full" style="background:${this.colores.EN_RUTA}"></span>En ruta
            </span>
            <span class="flex items-center gap-2 bg-white border rounded-full px-3 py-1">
              <span class="w-3 h-3 rounded-full" style="background:${this.colores.EN_ESTACION}"></span>En estación
            </span>
            <span class="flex items-center gap-2 bg-white border rounded-full px-3 py-1">
              <span class="w-3 h-3 rounded-full" style="background:${this.colores.EN_COLA}"></span>En cola
            </span>
            <span class="flex items-center gap-2 bg-white border rounded-full px-3 py-1">
              <span class="w-3 h-3 rounded-full" style="background:${this.colores.INCIDENCIA}"></span>Incidencia
            </span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Enfocar unidad</label>
            <select id="sim-select-unidad" class="border rounded-lg px-3 py-2 text-sm min-w-[200px] bg-white">
              <option value="">Todas</option>
            </select>
          </div>

          <button id="sim-btn-follow"
                  class="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition">
            Seguir: OFF
          </button>

          <div class="text-xs text-gray-600 pb-2 sm:pb-2" id="sim-updated">Actualizado: --:--:--</div>
        </div>
      `;

      simContainer.insertBefore(toolbar, colaLineal);
    }

    this._dom.toolbar = toolbar;
    this._dom.selUnidad = document.getElementById("sim-select-unidad");
    this._dom.btnFollow = document.getElementById("sim-btn-follow");
    this._dom.lblUpdated = document.getElementById("sim-updated");
    this._dom.lblStats = document.getElementById("sim-stats");

    if (this._dom.btnFollow) {
      this._dom.btnFollow.onclick = () => this.toggleFollow();
      this._dom.btnFollow.textContent = `Seguir: ${this._follow ? "ON" : "OFF"}`;
      this._dom.btnFollow.className = this._follow
        ? "px-4 py-2 rounded-lg bg-mexibus-blue text-white text-sm font-medium hover:opacity-90 transition"
        : "px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 transition";
    }

    if (this._dom.selUnidad) {
      this._dom.selUnidad.onchange = (e) => {
        const v = String(e.target.value || "");
        this._focusId = v;
        this._resaltarFocus();
        if (this._follow && this._focusId) this._centrarEnUnidad(this._focusId);
      };
    }

    // Convertir cola-lineal en viewport
    colaLineal.className =
      "relative p-0 bg-white rounded-lg border border-gray-200 overflow-x-auto scrollbar-custom";
    colaLineal.innerHTML = `<div id="sim-track-inner" class="relative"></div>`;
    this._dom.trackInner = document.getElementById("sim-track-inner");
  },

  _renderBaseTrack() {
    const estaciones = this._getEstaciones();
    const n = estaciones.length;
    if (!n || !this._dom.trackInner) return;

    this._trackWidth = this.MARGIN_PX * 2 + this.CELL_PX * (n - 1);
    this._stationX = estaciones.map((_, i) => this.MARGIN_PX + i * this.CELL_PX);

    const t = this._dom.trackInner;
    t.innerHTML = "";
    t.style.width = `${this._trackWidth}px`;
    t.style.height = `${this.TRACK_H}px`;

    // Carril IDA (arriba)
    const laneIda = document.createElement("div");
    laneIda.className = "absolute";
    laneIda.style.left = `${this._stationX[0]}px`;
    laneIda.style.top = `${this.Y_LANE_IDA}px`;
    laneIda.style.width = `${this._stationX[n - 1] - this._stationX[0]}px`;
    laneIda.style.height = "0px";
    laneIda.style.borderTop = "2px dashed rgba(209,213,219,0.9)";
    t.appendChild(laneIda);

    // Etiqueta IDA
    const laneLabelIda = document.createElement("div");
    laneLabelIda.className =
      "absolute text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded px-2 py-1";
    laneLabelIda.style.left = "10px";
    laneLabelIda.style.top = `${this.Y_LANE_IDA - 12}px`;
    laneLabelIda.textContent = "IDA →";
    t.appendChild(laneLabelIda);

    // Línea central (estaciones)
    const baseLine = document.createElement("div");
    baseLine.className = "absolute rounded-full";
    baseLine.style.left = `${this._stationX[0]}px`;
    baseLine.style.top = `${this.Y_LINE}px`;
    baseLine.style.height = "6px";
    baseLine.style.width = `${this._stationX[n - 1] - this._stationX[0]}px`;
    baseLine.style.background =
      "linear-gradient(90deg, rgba(229,231,235,1), rgba(209,213,219,1))";
    t.appendChild(baseLine);

    // Carril REGRESO (abajo)
    const laneReg = document.createElement("div");
    laneReg.className = "absolute";
    laneReg.style.left = `${this._stationX[0]}px`;
    laneReg.style.top = `${this.Y_LANE_REG}px`;
    laneReg.style.width = `${this._stationX[n - 1] - this._stationX[0]}px`;
    laneReg.style.height = "0px";
    laneReg.style.borderTop = "2px dashed rgba(209,213,219,0.9)";
    t.appendChild(laneReg);

    // Etiqueta REGRESO
    const laneLabelReg = document.createElement("div");
    laneLabelReg.className =
      "absolute text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded px-2 py-1";
    laneLabelReg.style.left = "10px";
    laneLabelReg.style.top = `${this.Y_LANE_REG - 12}px`;
    laneLabelReg.textContent = "← REGRESO";
    t.appendChild(laneLabelReg);

    // Estaciones (nodos + etiquetas)
    estaciones.forEach((nombre, i) => {
      const x = this._stationX[i];

      const node = document.createElement("div");
      node.className = "absolute";
      node.style.left = `${x}px`;
      node.style.top = `${this.Y_STATION}px`;
      node.style.transform = "translateX(-50%)";
      node.innerHTML = `
        <div class="w-4 h-4 rounded-full bg-mexibus-dark shadow-sm border border-white"></div>
      `;
      t.appendChild(node);

      const label = document.createElement("div");
      label.className = "absolute text-[11px] text-gray-700 leading-tight text-center";
      label.style.left = `${x}px`;
      label.style.top = `${this.Y_LABEL}px`;
      label.style.width = "120px";
      label.style.transform = "translateX(-50%)";
      label.style.userSelect = "none";
      label.innerHTML = this._wrapStationName(nombre);
      t.appendChild(label);

      // Conector sutil hacia etiquetas (mantiene legibilidad)
      const stem = document.createElement("div");
      stem.className = "absolute";
      stem.style.left = `${x}px`;
      stem.style.top = `${this.Y_LINE}px`;
      stem.style.width = "2px";
      stem.style.height = "10px";
      stem.style.transform = "translateX(-50%)";
      stem.style.background = "rgba(209,213,219,0.9)";
      t.appendChild(stem);
    });
  },

  // =========================
  // Marcadores
  // =========================
  _actualizarTrack(unidades) {
    const estaciones = this._getEstaciones();
    const n = estaciones.length;
    if (!n) return;

    this._actualizarSelectUnidades(unidades);

    const stackMapIda = new Map();
    const stackMapReg = new Map();

    unidades.forEach((u) => {
      const id = String(u?.id_unidad ?? "");
      if (!id) return;

      const sentido = String(u?.sentido || "IDA");
      const estado = String(u?.estado_unidad || "");

      const idx = this._clampInt(u?.idx_tramo, 0, n - 1);
      const prog = this._clampNum(u?.progreso, 0, 0.9999);

      const pos = this._posicionPixel(idx, prog, sentido, n);

      const bucket = Math.round(pos.x / 24);
      const isReg = sentido === "REGRESO";
      const map = isReg ? stackMapReg : stackMapIda;
      const c = (map.get(bucket) || 0);
      map.set(bucket, c + 1);
      const yStack = this._stackOffsetY(c);

      const yBase = isReg ? this.Y_LANE_REG : this.Y_LANE_IDA;
      const y = yBase + yStack;

      let el = this._markerMap.get(id);
      if (!el) {
        el = document.createElement("div");
        el.dataset.idUnidad = id;
        el.className =
          "sim-unit-marker absolute flex items-center justify-center text-[12px] font-bold shadow-lg select-none";
        el.style.width = "34px";
        el.style.height = "26px";
        el.style.borderRadius = "9999px";
        el.style.border = "2px solid rgba(0,0,0,0.10)";
        el.style.transform = "translate(-50%, -50%)";
        el.style.cursor = "pointer";
        el.style.transition =
          "left 600ms ease, top 350ms ease, box-shadow 250ms ease, transform 250ms ease";
        el.style.zIndex = "30";

        el.onclick = () => {
          this._focusId = id;
          if (this._dom.selUnidad) this._dom.selUnidad.value = id;
          this._resaltarFocus();
          if (this._follow) this._centrarEnUnidad(id);
        };

        this._dom.trackInner.appendChild(el);
        this._markerMap.set(id, el);
      }

      const bg = this.colores[estado] || "#6B7280";
      el.style.background = bg;
      el.style.color = (estado === "EN_RUTA") ? "#000" : "#fff";
      el.textContent = id;

      el.style.left = `${pos.x}px`;
      el.style.top = `${y}px`;

      el.title = this._tooltipUnidad(u, estaciones);

      el.style.boxShadow = this._focusId === id
        ? "0 0 0 4px rgba(7,150,194,0.35), 0 10px 20px rgba(0,0,0,0.18)"
        : "0 10px 20px rgba(0,0,0,0.18)";

      el.style.transform = (this._focusId && this._focusId === id)
        ? "translate(-50%, -50%) scale(1.06)"
        : "translate(-50%, -50%) scale(1.0)";

      // Marca visual sutil de sentido (esquina)
      el.style.backgroundImage = sentido === "REGRESO"
        ? "linear-gradient(135deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.0) 40%)"
        : "linear-gradient(225deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.0) 40%)";
    });

    const idsActuales = new Set(
      unidades.map((u) => String(u?.id_unidad ?? "")).filter(Boolean)
    );
    for (const [id, el] of this._markerMap.entries()) {
      if (!idsActuales.has(id)) {
        el.remove();
        this._markerMap.delete(id);
      }
    }

    this._resaltarFocus();
  },

  _posicionPixel(idx, prog, sentido, n) {
    const isReg = sentido === "REGRESO";
    const i0 = isReg ? (n - 1 - idx) : idx;
    const x0 = this._stationX[this._clampInt(i0, 0, n - 1)] || this.MARGIN_PX;

    const delta = prog * this.CELL_PX;
    const x = isReg ? (x0 - delta) : (x0 + delta);

    return { x: this._clampNum(x, this._stationX[0], this._stationX[n - 1]) };
  },

  _stackOffsetY(k) {
    if (k <= 0) return 0;
    const step = 12;
    const m = Math.ceil(k / 2);
    const sign = (k % 2 === 1) ? -1 : 1;
    const off = sign * m * step;
    return Math.max(-24, Math.min(24, off));
  },

  _resaltarFocus() {
    for (const [id, el] of this._markerMap.entries()) {
      if (!el) continue;
      el.style.boxShadow = (this._focusId && this._focusId === id)
        ? "0 0 0 4px rgba(7,150,194,0.35), 0 10px 20px rgba(0,0,0,0.18)"
        : "0 10px 20px rgba(0,0,0,0.18)";
      el.style.zIndex = (this._focusId && this._focusId === id) ? "40" : "30";
    }
  },

  _centrarEnUnidad(id) {
    const el = this._markerMap.get(String(id));
    if (!el || !this._dom.colaLineal) return;

    const viewport = this._dom.colaLineal;
    const left = el.offsetLeft;
    const target = left - viewport.clientWidth / 2;

    viewport.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  },

  _actualizarSelectUnidades(unidades) {
    const sel = this._dom.selUnidad;
    if (!sel) return;

    const current = this._focusId || String(sel.value || "");

    const ids = Array.from(
      new Set(unidades.map((u) => String(u?.id_unidad ?? "")).filter(Boolean))
    ).sort((a, b) => Number(a) - Number(b));

    const existing = Array.from(sel.querySelectorAll("option"))
      .map((o) => String(o.value))
      .filter((v) => v !== "");

    const same =
      existing.length === ids.length &&
      existing.every((v, i) => v === ids[i]);

    if (!same) {
      sel.innerHTML =
        `<option value="">Todas</option>` +
        ids.map((id) => `<option value="${id}">#${id}</option>`).join("");
    }

    if (current) {
      sel.value = current;
      this._focusId = current;
    } else {
      sel.value = "";
      this._focusId = "";
    }
  },

  // =========================
  // Tabla inferior
  // =========================
  actualizarTabla(unidades) {
    const panel = document.getElementById("panel-sim");
    if (!panel) return;

    if (!Array.isArray(unidades) || unidades.length === 0) {
      panel.innerHTML =
        '<tr><td colspan="4" class="text-center py-4 text-gray-400">Sin unidades</td></tr>';
      return;
    }

    const estaciones = this._getEstaciones();
    const n = estaciones.length;

    panel.innerHTML = unidades
      .map((u) => {
        const estado = String(u?.estado_unidad || "");
        const sentido = String(u?.sentido || "IDA");

        const estadoColor =
          {
            EN_RUTA: "bg-green-500 text-white",
            EN_ESTACION: "bg-yellow-500 text-gray-900",
            EN_COLA: "bg-blue-500 text-white",
            INCIDENCIA: "bg-red-500 text-white",
          }[estado] || "bg-gray-500 text-white";

        const idx = this._clampInt(u?.idx_tramo, 0, Math.max(0, n - 1));
        const prog = this._clampNum(u?.progreso, 0, 0.9999);
        const pct = Math.round(prog * 100);

        const ubic = this._ubicacionTexto(idx, pct, estado, sentido, estaciones);

        return `
          <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="py-2 px-2 font-bold text-gray-900">#${u.id_unidad}</td>
            <td class="py-2 px-2">
              <span class="px-2 py-1 rounded text-xs ${sentido === "IDA" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}">
                ${sentido === "IDA" ? "IDA →" : "REG ←"}
              </span>
            </td>
            <td class="py-2 px-2">
              <span class="px-2 py-1 rounded text-xs ${estadoColor}">
                ${estado ? estado.replace("_", " ") : "DESCONOCIDO"}
              </span>
            </td>
            <td class="py-2 px-2 text-sm text-gray-700">${ubic}</td>
          </tr>
        `;
      })
      .join("");
  },

  _ubicacionTexto(idx, pct, estado, sentido, estaciones) {
    const n = estaciones.length;
    const isReg = sentido === "REGRESO";

    const estIdx = isReg ? (n - 1 - idx) : idx;
    const estacion = estaciones[estIdx] || "Desconocida";

    if (estado === "EN_ESTACION") {
      return `En <strong>${estacion}</strong>`;
    }

    let siguienteIdx;
    if (!isReg) siguienteIdx = (estIdx + 1) % n;
    else siguienteIdx = (estIdx - 1 + n) % n;

    const siguiente = estaciones[siguienteIdx] || "Desconocida";
    return `${estacion} → ${siguiente} (${pct}%)`;
  },

  // =========================
  // Snapshot
  // =========================
  async _cargarSnapshot() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/sim/snapshot`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) this.actualizar(data);
    } catch (_e) {}
  },

  // =========================
  // Utilidades
  // =========================
  _getEstaciones() {
    return Array.isArray(CONFIG?.estaciones) ? CONFIG.estaciones : [];
  },

  _wrapStationName(nombre) {
    const s = String(nombre || "");
    if (s.length <= 14) return s;

    const parts = s.split(" ");
    if (parts.length === 1) return s;

    let l1 = "";
    let l2 = "";
    for (const p of parts) {
      if ((l1 + " " + p).trim().length <= 14) l1 = (l1 + " " + p).trim();
      else l2 = (l2 + " " + p).trim();
    }

    if (!l2) return s;
    return `${l1}<br>${l2}`;
  },

  _tooltipUnidad(u, estaciones) {
    const id = String(u?.id_unidad ?? "");
    const sentido = String(u?.sentido || "IDA");
    const estado = String(u?.estado_unidad || "");
    const n = estaciones.length;

    const idx = this._clampInt(u?.idx_tramo, 0, Math.max(0, n - 1));
    const prog = this._clampNum(u?.progreso, 0, 0.9999);
    const pct = Math.round(prog * 100);

    const isReg = sentido === "REGRESO";
    const estIdx = isReg ? (n - 1 - idx) : idx;
    const estacion = estaciones[estIdx] || "Desconocida";

    const ubic = this._ubicacionTexto(idx, pct, estado, sentido, estaciones)
      .replace(/<strong>|<\/strong>/g, "");

    return `Unidad #${id}\nSentido: ${sentido}\nEstado: ${estado}\nBase: ${estacion}\nUbicación: ${ubic}`;
  },

  _clampInt(v, lo, hi) {
    const x = Number(v);
    if (!Number.isFinite(x)) return lo;
    return Math.max(lo, Math.min(hi, Math.trunc(x)));
  },

  _clampNum(v, lo, hi) {
    const x = Number(v);
    if (!Number.isFinite(x)) return lo;
    return Math.max(lo, Math.min(hi, x));
  },

  _removerCanvas() {
    const canvas = document.getElementById("canvasSim");
    if (!canvas) return;

    const wrap = canvas.closest("div");
    if (wrap && wrap.parentElement) wrap.remove();
    else canvas.remove();
  },
};
