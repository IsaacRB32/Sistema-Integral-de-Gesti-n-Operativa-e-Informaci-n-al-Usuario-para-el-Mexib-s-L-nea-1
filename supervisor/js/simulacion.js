// Módulo de visualización (canvas y lineal)
const moduloSimulacion = {
    canvas: null,
    ctx: null,
    RADIO: 220,
    RADIO_PUNTO: 8,
    colores: {
        EN_RUTA: "#9BE645",
        EN_ESTACION: "#FFA500",
        EN_COLA: "#0796C2",
        INCIDENCIA: "#FF4444"
    },

    iniciar() {
        this.canvas = document.getElementById('canvasSim');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.crearVisualizacionLineal();
        this.dibujarCircuito();
    },

    crearVisualizacionLineal() {
        const colaLineal = document.getElementById('cola-lineal');
        if (!colaLineal) return;

        colaLineal.innerHTML = '';
        CONFIG.estaciones.forEach((est, i) => {
            const div = document.createElement('div');
            div.className = 'flex flex-col items-center relative flex-1 min-w-[60px]';
            div.innerHTML = `
                <div class="w-3 h-3 bg-mexibus-dark rounded-full mb-2 z-10"></div>
                <div class="text-xs text-center text-gray-600 max-w-[80px]">${est}</div>
                ${i < CONFIG.estaciones.length - 1 ? '<div class="absolute top-[6px] left-1/2 w-full h-0.5 bg-gray-300"></div>' : ''}
            `;
            colaLineal.appendChild(div);
        });
    },

    dibujarCircuito() {
        if (!this.ctx) return;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fondo
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.RADIO + 10, 0, 2 * Math.PI);
        this.ctx.fillStyle = "rgba(55, 142, 166, 0.1)";
        this.ctx.fill();

        // Circunferencia
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.RADIO, 0, 2 * Math.PI);
        this.ctx.strokeStyle = "#0796C2";
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        // Estaciones
        const sep = (2 * Math.PI) / CONFIG.estaciones.length;
        CONFIG.estaciones.forEach((est, i) => {
            const ang = i * sep;
            const x = cx + Math.cos(ang) * this.RADIO;
            const y = cy + Math.sin(ang) * this.RADIO;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#378EA6";
            this.ctx.fill();
        });
    },

    actualizar(unidades) {
        this.dibujarCircuito();
        this.dibujarUnidades(unidades);
        this.actualizarLineal(unidades);
        this.actualizarTabla(unidades);
    },

    dibujarUnidades(unidades) {
        if (!this.ctx) return;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const sep = (2 * Math.PI) / CONFIG.estaciones.length;

        unidades.forEach(u => {
            const pos = (Number(u.idx_tramo || 0) + Number(u.progreso || 0)) % CONFIG.estaciones.length;
            const posSentido = u.sentido === "REGRESO" ? (CONFIG.estaciones.length - pos) % CONFIG.estaciones.length : pos;
            const ang = posSentido * sep;
            const x = cx + Math.cos(ang) * this.RADIO;
            const y = cy + Math.sin(ang) * this.RADIO;

            // Punto
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.RADIO_PUNTO, 0, 2 * Math.PI);
            this.ctx.fillStyle = this.colores[u.estado_unidad] || "#6B7280";
            this.ctx.fill();

            // Borde
            this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // ID
            this.ctx.fillStyle = u.estado_unidad === 'EN_RUTA' ? "#000" : "#fff";
            this.ctx.font = "bold 11px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(String(u.id_unidad), x, y);
        });
    },

    actualizarLineal(unidades) {
        document.querySelectorAll('.unidad-marker').forEach(el => el.remove());

        unidades.forEach(u => {
            const idx = Number(u.idx_tramo || 0);
            const prog = Number(u.progreso || 0);
            const esReg = u.sentido === "REGRESO";
            const estIdx = esReg ? (CONFIG.estaciones.length - 1 - idx) : idx;

            const estaciones = document.querySelectorAll('#cola-lineal > div');
            if (estaciones[estIdx]) {
                const marker = document.createElement('div');
                marker.className = 'unidad-marker absolute w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-20 shadow-lg';
                marker.textContent = u.id_unidad;
                marker.style.background = this.colores[u.estado_unidad] || "#6B7280";
                marker.style.color = u.estado_unidad === 'EN_RUTA' ? '#000' : '#fff';
                marker.style.top = '-12px';
                marker.style.left = `calc(50% - 12px + ${esReg ? -prog * 40 : prog * 40}px)`;
                estaciones[estIdx].appendChild(marker);
            }
        });
    },

    actualizarTabla(unidades) {
        const panel = document.getElementById('panel-sim');
        if (!panel) return;

        if (unidades.length === 0) {
            panel.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-400">Sin unidades</td></tr>';
            return;
        }

        panel.innerHTML = unidades.map(u => {
            const estadoColor = {
                'EN_RUTA': 'bg-green-500 text-white',
                'EN_ESTACION': 'bg-yellow-500 text-gray-900',
                'EN_COLA': 'bg-blue-500 text-white',
                'INCIDENCIA': 'bg-red-500 text-white'
            }[u.estado_unidad] || 'bg-gray-500 text-white';

            const idx = Number(u.idx_tramo || 0);
            const prog = Number(u.progreso || 0);
            const estacion = CONFIG.estaciones[idx] || 'Desconocida';
            
            let ubicacion;
            if (u.estado_unidad === "EN_ESTACION") {
                ubicacion = `En <strong>${estacion}</strong>`;
            } else {
                const siguiente = CONFIG.estaciones[(idx + 1) % CONFIG.estaciones.length];
                const pct = Math.round(prog * 100);
                ubicacion = `${estacion} → ${siguiente} (${pct}%)`;
            }

            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-2 px-2 font-bold text-gray-900">#${u.id_unidad}</td>
                    <td class="py-2 px-2">
                        <span class="px-2 py-1 rounded text-xs ${u.sentido === 'IDA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                            ${u.sentido === 'IDA' ? 'IDA ↻' : 'REG ↺'}
                        </span>
                    </td>
                    <td class="py-2 px-2">
                        <span class="px-2 py-1 rounded text-xs ${estadoColor}">
                            ${u.estado_unidad.replace('_', ' ')}
                        </span>
                    </td>
                    <td class="py-2 px-2 text-sm text-gray-700">${ubicacion}</td>
                </tr>
            `;
        }).join('');
    }
};