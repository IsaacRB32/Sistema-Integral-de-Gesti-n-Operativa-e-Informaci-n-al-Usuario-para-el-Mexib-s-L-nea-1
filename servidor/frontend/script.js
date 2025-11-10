// Conexión con el backend
const socket = io();

// Lienzo
const canvas = document.getElementById("canvasSim");
const ctx = canvas.getContext("2d");
const panel = document.getElementById("panel");

// ==== Estaciones L1 (ORDEN IDA: Abastos -> Azteca) ====
const estacionesIDA = [
  "Central de Abastos", "19 de Septiembre", "Palomas", "Jardines de Morelos",
  "Aquiles Serdán", "Hospital", "1° de Mayo", "Las Américas",
  "Valle Ecatepec", "Vocacional 3", "Adolfo López Mateos", "Zodiaco",
  "Alfredo Torres", "UNITEC", "Industrial", "Josefa Ortiz",
  "Quinto Sol", "Ciudad Azteca"
];
const estacionesREG = [...estacionesIDA].slice().reverse(); // Azteca -> Abastos

// Parámetros visuales
const RADIO_PUNTO = 8;
const N_ESTACIONES = estacionesIDA.length;
const SEPARACION = (2 * Math.PI) / N_ESTACIONES;

// Colores por estado para el punto
const colores = {
  EN_RUTA: "#2ecc71",
  EN_ESTACION: "#f39c12",
  EN_COLA: "#3498db",
  INCIDENCIA: "#e74c3c",
};

// ========== VISUALIZACIÓN LINEAL ==========
function crearVisualizacionLineal() {
  const contenedor = document.getElementById("simulacion-container");
  
  // Crear elemento para la visualización lineal
  let colaLineal = document.getElementById("cola-lineal");
  if (!colaLineal) {
    colaLineal = document.createElement("div");
    colaLineal.id = "cola-lineal";
    colaLineal.className = "cola-lineal";
    contenedor.insertBefore(colaLineal, canvas);
  }
  
  // Limpiar contenido previo
  colaLineal.innerHTML = "";
  
  // Crear estaciones en formato lineal
  estacionesIDA.forEach((estacion, index) => {
    const estacionElem = document.createElement("div");
    estacionElem.className = "estacion";
    
    const punto = document.createElement("div");
    punto.className = "punto-estacion";
    
    const nombre = document.createElement("div");
    nombre.className = "nombre-estacion";
    nombre.textContent = estacion;
    
    estacionElem.appendChild(punto);
    estacionElem.appendChild(nombre);
    colaLineal.appendChild(estacionElem);
  });
}

function actualizarVisualizacionLineal(unidades) {
  // Limpiar unidades anteriores
  document.querySelectorAll('.unidad-cola').forEach(el => el.remove());
  
  // Posicionar cada unidad en la visualización lineal
  unidades.forEach(u => {
    const posicion = calcularPosicionLineal(u);
    const estaciones = document.querySelectorAll('.estacion');
    
    if (estaciones[posicion.estacionIndex]) {
      const unidadElem = document.createElement("div");
      unidadElem.className = "unidad-cola";
      unidadElem.textContent = u.id_unidad;
      unidadElem.style.background = colores[u.estado_unidad] || "#ecf0f1";
      unidadElem.style.color = "#fff";
      unidadElem.style.left = `calc(${(posicion.estacionIndex / (N_ESTACIONES - 1)) * 100}% + ${posicion.offset}px)`;
      
      estaciones[posicion.estacionIndex].appendChild(unidadElem);
    }
  });
}

function calcularPosicionLineal(u) {
  const idx = Number(u.idx_tramo || 0);
  const prog = Number(u.progreso || 0);
  const esRegreso = u.sentido === "REGRESO";
  
  // Para la visualización lineal, invertimos el índice si es regreso
  let estacionIndex = esRegreso ? (N_ESTACIONES - 1 - idx) : idx;
  
  // Ajustar por progreso entre estaciones
  const offset = esRegreso ? -prog * 40 : prog * 40;
  
  return { estacionIndex, offset };
}

// ========== DIBUJO CIRCULAR (se mantiene como respaldo) ==========
function dibujarCircuito() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 120;

  // Fondo del circuito
  ctx.beginPath();
  ctx.arc(cx, cy, r + 10, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(44, 62, 80, 0.5)";
  ctx.fill();
  
  // Circunferencia exterior
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, 2 * Math.PI);
  ctx.strokeStyle = "#34495e";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Circunferencia principal
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = "#3498db";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Efecto de brillo en el circuito
  const gradient = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 5);
  gradient.addColorStop(0, "rgba(52, 152, 219, 0.1)");
  gradient.addColorStop(1, "rgba(52, 152, 219, 0)");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Estaciones marcadas
  for (let i = 0; i < N_ESTACIONES; i++) {
    const ang = i * SEPARACION;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    
    // Punto de estación
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#ecf0f1";
    ctx.fill();
    
    // Efecto de brillo
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(236, 240, 241, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function anguloDeUnidad(u) {
  const total = N_ESTACIONES;
  const pos = (Number(u.idx_tramo || 0) + Number(u.progreso || 0)) % total;
  // Invertir si REGRESO para verse en sentido contrario
  const posSentido = u.sentido === "REGRESO" ? (total - pos) % total : pos;
  return posSentido * SEPARACION;
}

function dibujarUnidades(unidades) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 120;

  for (const u of unidades) {
    const ang = anguloDeUnidad(u);
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;

    // Sombra del punto
    ctx.beginPath();
    ctx.arc(x, y, RADIO_PUNTO + 2, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fill();

    // Punto principal
    ctx.beginPath();
    ctx.arc(x, y, RADIO_PUNTO, 0, 2 * Math.PI);
    ctx.fillStyle = colores[u.estado_unidad] || "#ecf0f1";
    ctx.fill();

    // Efecto de brillo
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, RADIO_PUNTO);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Borde del punto
    ctx.beginPath();
    ctx.arc(x, y, RADIO_PUNTO, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Etiqueta con id
    ctx.fillStyle = "#ecf0f1";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(u.id_unidad), x, y);
    
    // Sombra del texto
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(String(u.id_unidad), x+1, y+1);
  }
}

// ========== PANEL ==========
function textoTramo(u) {
  const idx = Number(u.idx_tramo || 0);
  const prog = Number(u.progreso || 0);
  const esRegreso = u.sentido === "REGRESO";
  const lista = esRegreso ? estacionesREG : estacionesIDA;

  if (u.estado_unidad === "EN_ESTACION") {
    return `En <b>${lista[idx]}</b>`;
  }
  const desde = lista[idx];
  const hacia = lista[(idx + 1) % lista.length];
  // Si quieres, puedes usar prog para poner %:
  const pct = Math.round(prog * 100);
  return `Entre <b>${desde}</b> → <b>${hacia}</b> (${pct}%)`;
}

function badgeSentido(u) {
  return u.sentido === "REGRESO"
    ? `<span class="badge badge-reg">REGRESO ↺</span>`
    : `<span class="badge badge-ida">IDA ↻</span>`;
}

function claseEstado(u) {
  switch (u.estado_unidad) {
    case "EN_RUTA": return "state state-ruta";
    case "EN_ESTACION": return "state state-est";
    case "EN_COLA": return "state state-cola";
    case "INCIDENCIA": return "state state-inc";
    default: return "state";
  }
}

function renderPanel(unidades) {
  if (!unidades || unidades.length === 0) {
    panel.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #95a5a6;">
        <p>No hay unidades en circuito.</p>
      </div>
    `;
    return;
  }

  const rows = unidades.map(u => `
    <tr>
      <td><strong>#${u.id_unidad}</strong></td>
      <td>${badgeSentido(u)}</td>
      <td><span class="${claseEstado(u)}">${u.estado_unidad.replace("_"," ")}</span></td>
      <td>${textoTramo(u)}</td>
    </tr>
  `).join("");

  panel.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Unidad</th>
          <th>Sentido</th>
          <th>Estado</th>
          <th>Tramo / Estación</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// ========== SOCKET ==========
socket.on("actualizar_posiciones", (unidades) => {
  // Actualizar ambas visualizaciones
  dibujarCircuito();
  dibujarUnidades(unidades);
  actualizarVisualizacionLineal(unidades);
  renderPanel(unidades);
});

// Inicializar visualización lineal al cargar
document.addEventListener('DOMContentLoaded', () => {
  crearVisualizacionLineal();
});