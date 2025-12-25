// ===== CONFIGURACIÓN =====
const socket = io();

// Elementos DOM
const elements = {
  stationsContainer: document.getElementById('stationsContainer'),
  unitsContainer: document.getElementById('unitsContainer'),
  unitsStatus: document.getElementById('unitsStatus'),
  unitInfo: document.getElementById('unitInfo'),
  unitCount: document.getElementById('unitCount'),
  
  // Controles
  toggleSim: document.getElementById('toggleSim'),
  playIcon: document.getElementById('playIcon'),
  speedUp: document.getElementById('speedUp'),
  speedDown: document.getElementById('speedDown'),
  currentSpeed: document.getElementById('currentSpeed'),
  
  // Tiempo
  currentTime: document.getElementById('currentTime'),
  lastUpdate: document.getElementById('lastUpdate'),
  
  // Estadísticas
  statEnRuta: document.getElementById('statEnRuta'),
  statEnEstacion: document.getElementById('statEnEstacion'),
  statIncidencia: document.getElementById('statIncidencia')
};

// Estado
const state = {
  units: [],
  selectedUnit: null,
  simulationSpeed: 1,
  simulationActive: true,
  lastUpdateTime: null
};

// Datos de estaciones (Mexibús L1)
const estacionesData = [
  { id: 1, nombre: "Central de Abastos", km: 0, major: true, pasajeros: 1250 },
  { id: 2, nombre: "19 de Septiembre", km: 2.5, pasajeros: 450 },
  { id: 3, nombre: "Palomas", km: 5, pasajeros: 380 },
  { id: 4, nombre: "Jardines de Morelos", km: 7.5, pasajeros: 520 },
  { id: 5, nombre: "Aquiles Serdán", km: 10, major: true, pasajeros: 980 },
  { id: 6, nombre: "Hospital", km: 12.5, pasajeros: 620 },
  { id: 7, nombre: "1° de Mayo", km: 15, pasajeros: 710 },
  { id: 8, nombre: "Las Américas", km: 17.5, pasajeros: 590 },
  { id: 9, nombre: "Valle Ecatepec", km: 20, major: true, pasajeros: 1150 },
  { id: 10, nombre: "Vocacional 3", km: 22.5, pasajeros: 420 },
  { id: 11, nombre: "Adolfo López Mateos", km: 25, pasajeros: 680 },
  { id: 12, nombre: "Zodiaco", km: 27.5, pasajeros: 390 },
  { id: 13, nombre: "Alfredo Torres", km: 30, pasajeros: 510 },
  { id: 14, nombre: "UNITEC", km: 32.5, major: true, pasajeros: 1450 },
  { id: 15, nombre: "Industrial", km: 35, pasajeros: 730 },
  { id: 16, nombre: "Josefa Ortiz", km: 37.5, pasajeros: 480 },
  { id: 17, nombre: "Quinto Sol", km: 40, pasajeros: 410 },
  { id: 18, nombre: "Ciudad Azteca", km: 42.5, major: true, pasajeros: 1650 }
];

// ===== INICIALIZACIÓN =====
function init() {
  createStations();
  setupEventListeners();
  startClock();
  loadInitialData();
}

// ===== CREACIÓN DE ESTACIONES =====
function createStations() {
  elements.stationsContainer.innerHTML = '';
  
  estacionesData.forEach(estacion => {
    const percentage = (estacion.km / 42.5) * 100;
    
    const stationEl = document.createElement('div');
    stationEl.className = `station ${estacion.major ? 'major' : ''}`;
    stationEl.style.left = `${percentage}%`;
    stationEl.dataset.id = estacion.id;
    stationEl.dataset.nombre = estacion.nombre;
    stationEl.dataset.km = estacion.km;
    
    // Marcador
    const marker = document.createElement('div');
    marker.className = 'station-marker';
    
    // Etiqueta
    const label = document.createElement('div');
    label.className = 'station-label';
    label.textContent = estacion.nombre;
    
    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'station-tooltip';
    tooltip.innerHTML = `
      <h4>${estacion.nombre}</h4>
      <p><strong>Kilómetro:</strong> ${estacion.km} km</p>
      <p><strong>Pasajeros/hora:</strong> ${estacion.pasajeros}</p>
      ${estacion.major ? '<p><strong>Estación Principal</strong></p>' : ''}
    `;
    
    stationEl.appendChild(marker);
    stationEl.appendChild(label);
    stationEl.appendChild(tooltip);
    elements.stationsContainer.appendChild(stationEl);
    
    // Eventos
    stationEl.addEventListener('mouseenter', () => highlightStation(stationEl));
    stationEl.addEventListener('mouseleave', () => unhighlightStations());
    stationEl.addEventListener('click', () => showStationInfo(estacion));
  });
}

function highlightStation(stationEl) {
  // Quitar highlight de todas las estaciones
  document.querySelectorAll('.station').forEach(s => {
    s.style.zIndex = '30';
  });
  
  // Destacar esta estación
  stationEl.style.zIndex = '100';
}

function unhighlightStations() {
  document.querySelectorAll('.station').forEach(s => {
    s.style.zIndex = '30';
  });
}

function showStationInfo(estacion) {
  console.log(`Estación: ${estacion.nombre}, KM: ${estacion.km}`);
}

// ===== VISUALIZACIÓN DE UNIDADES =====
function updateUnitsVisualization(units) {
  state.units = units;
  
  // Limpiar contenedores
  elements.unitsContainer.innerHTML = '';
  elements.unitsStatus.innerHTML = '';
  
  // Estadísticas
  const stats = {
    enRuta: 0,
    enEstacion: 0,
    enCola: 0,
    incidencia: 0
  };
  
  // Ordenar unidades por posición
  const sortedUnits = [...units].sort((a, b) => {
    const posA = calculateUnitPosition(a).percentage;
    const posB = calculateUnitPosition(b).percentage;
    return posA - posB;
  });
  
  // Crear elementos visuales
  sortedUnits.forEach((unit, index) => {
    // Contar estadísticas
    stats[unit.estado_unidad.toLowerCase().replace('en_', '')]++;
    
    // Calcular posición
    const position = calculateUnitPosition(unit);
    
    // Crear autobús visual
    const busEl = createBusElement(unit, position, index);
    elements.unitsContainer.appendChild(busEl);
    
    // Crear elemento en panel lateral
    const statusEl = createUnitStatusElement(unit, position);
    elements.unitsStatus.appendChild(statusEl);
  });
  
  // Actualizar estadísticas
  updateStatistics(stats);
  updateUnitCount(units.length);
}

function calculateUnitPosition(unit) {
  const idx = Number(unit.idx_tramo || 0);
  const prog = Number(unit.progreso || 0);
  const isRegreso = unit.sentido === "REGRESO";
  
  // Obtener estaciones
  let currentStation, nextStation;
  
  if (isRegreso) {
    // Para regreso, invertir el orden
    currentStation = estacionesData[estacionesData.length - 1 - idx];
    nextStation = idx > 0 ? estacionesData[estacionesData.length - idx] : estacionesData[0];
  } else {
    currentStation = estacionesData[idx];
    nextStation = estacionesData[(idx + 1) % estacionesData.length];
  }
  
  // Calcular kilómetros
  const kmRange = Math.abs(nextStation.km - currentStation.km);
  const currentKm = currentStation.km + (prog * kmRange);
  
  // Calcular porcentaje
  let percentage;
  if (isRegreso) {
    percentage = 100 - ((currentKm / 42.5) * 100);
  } else {
    percentage = (currentKm / 42.5) * 100;
  }
  
  // Asegurar que esté dentro de los límites
  percentage = Math.max(0, Math.min(100, percentage));
  
  return {
    percentage: percentage,
    km: currentKm,
    station: currentStation,
    nextStation: nextStation,
    progress: (prog * 100).toFixed(1)
  };
}

function createBusElement(unit, position, index) {
  const busEl = document.createElement('div');
  busEl.className = `bus-unit ${unit.sentido.toLowerCase()} ${unit.estado_unidad.toLowerCase().replace('_', '-')}`;
  busEl.style.left = `${position.percentage}%`;
  busEl.dataset.id = unit.id_unidad;
  busEl.dataset.index = index;
  
  // Ajustar color según estado
  const statusColors = {
    'EN_RUTA': '#2ecc71',
    'EN_ESTACION': '#f39c12',
    'EN_COLA': '#3498db',
    'INCIDENCIA': '#e74c3c'
  };
  
  busEl.style.background = `linear-gradient(135deg, ${statusColors[unit.estado_unidad]}, ${darkenColor(statusColors[unit.estado_unidad], 20)})`;
  
  // Número de unidad
  const busId = document.createElement('div');
  busId.className = 'bus-id';
  busId.textContent = unit.id_unidad;
  busEl.appendChild(busId);
  
  // Tooltip
  busEl.title = `Unidad ${unit.id_unidad}\n${unit.sentido} - ${unit.estado_unidad.replace('_', ' ')}\n${position.station.nombre} → ${position.nextStation.nombre}\n${position.progress}% recorrido`;
  
  // Eventos
  busEl.addEventListener('click', (e) => {
    e.stopPropagation();
    selectUnit(unit);
  });
  
  return busEl;
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return "#" + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

function createUnitStatusElement(unit, position) {
  const statusEl = document.createElement('div');
  statusEl.className = `unit-status-item ${state.selectedUnit === unit.id_unidad ? 'active' : ''}`;
  statusEl.dataset.id = unit.id_unidad;
  
  // Colores por estado
  const statusColors = {
    'EN_RUTA': '#2ecc71',
    'EN_ESTACION': '#f39c12',
    'EN_COLA': '#3498db',
    'INCIDENCIA': '#e74c3c'
  };
  
  statusEl.innerHTML = `
    <div class="unit-status-icon" style="background: ${statusColors[unit.estado_unidad]}">
      ${unit.id_unidad}
    </div>
    <div class="unit-status-info">
      <div class="unit-status-id">Unidad ${unit.id_unidad}</div>
      <div class="unit-status-details">
        <span class="unit-status-direction ${unit.sentido.toLowerCase()}">
          ${unit.sentido}
        </span>
        <span>${unit.estado_unidad.replace('_', ' ')}</span>
      </div>
    </div>
  `;
  
  // Evento
  statusEl.addEventListener('click', () => selectUnit(unit));
  
  return statusEl;
}

// ===== SELECCIÓN DE UNIDAD =====
function selectUnit(unit) {
  state.selectedUnit = unit.id_unidad;
  
  // Actualizar selección visual
  document.querySelectorAll('.unit-status-item').forEach(el => {
    el.classList.remove('active');
  });
  
  const selectedEl = document.querySelector(`.unit-status-item[data-id="${unit.id_unidad}"]`);
  if (selectedEl) {
    selectedEl.classList.add('active');
  }
  
  // Mostrar información detallada
  showUnitInfo(unit);
}

function showUnitInfo(unit) {
  const position = calculateUnitPosition(unit);
  
  const infoHTML = `
    <div class="unit-details">
      <div class="detail-header">
        <div class="unit-icon-large" style="background: linear-gradient(135deg, ${unit.sentido === 'IDA' ? '#0066cc' : '#ff3366'}, ${unit.sentido === 'IDA' ? '#0088ff' : '#ff6699'})">
          ${unit.id_unidad}
        </div>
        <div>
          <h4>Unidad ${unit.id_unidad}</h4>
          <div class="unit-badges">
            <span class="badge" style="background: ${unit.sentido === 'IDA' ? '#0066cc' : '#ff3366'}">
              ${unit.sentido}
            </span>
            <span class="badge" style="background: ${
              unit.estado_unidad === 'EN_RUTA' ? '#2ecc71' :
              unit.estado_unidad === 'EN_ESTACION' ? '#f39c12' :
              unit.estado_unidad === 'EN_COLA' ? '#3498db' : '#e74c3c'
            }">
              ${unit.estado_unidad.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h5>Ubicación Actual</h5>
        <div class="location-card">
          <div class="location-text">
            ${position.station.nombre} → ${position.nextStation.nombre}
          </div>
          <div class="location-stats">
            <span>${position.km.toFixed(1)} km</span>
            <span>${position.progress}% recorrido</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${position.progress}%; background: ${
              unit.estado_unidad === 'EN_RUTA' ? '#2ecc71' :
              unit.estado_unidad === 'EN_ESTACION' ? '#f39c12' :
              unit.estado_unidad === 'EN_COLA' ? '#3498db' : '#e74c3c'
            }"></div>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h5>Información Técnica</h5>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Velocidad</div>
            <div class="info-value">${unit.velocidad || 1.0}x</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tramo</div>
            <div class="info-value">${unit.idx_tramo + 1}/17</div>
          </div>
          <div class="info-item">
            <div class="info-label">Progreso</div>
            <div class="info-value">${(unit.progreso * 100).toFixed(1)}%</div>
          </div>
          <div class="info-item">
            <div class="info-label">Circuito</div>
            <div class="info-value" style="color: ${unit.en_circuito ? '#2ecc71' : '#e74c3c'}">
              ${unit.en_circuito ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h5>Última Actualización</h5>
        <div class="timestamp">
          ${new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </div>
  `;
  
  elements.unitInfo.innerHTML = infoHTML;
  
  // Añadir estilos inline para los detalles
  const style = `
    <style>
      .unit-details {
        display: block;
      }
      .detail-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 25px;
      }
      .unit-icon-large {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        color: white;
        flex-shrink: 0;
      }
      .detail-header h4 {
        font-size: 18px;
        margin-bottom: 5px;
      }
      .unit-badges {
        display: flex;
        gap: 8px;
      }
      .detail-section {
        margin-bottom: 20px;
      }
      .detail-section h5 {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 10px;
        font-weight: 600;
      }
      .location-card {
        background: rgba(255, 255, 255, 0.03);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .location-text {
        font-weight: 600;
        margin-bottom: 10px;
        color: white;
      }
      .location-stats {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 10px;
      }
      .progress-container {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-bar {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .info-item {
        background: rgba(255, 255, 255, 0.03);
        padding: 10px;
        border-radius: 8px;
      }
      .info-label {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 5px;
      }
      .info-value {
        font-size: 16px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        color: white;
      }
      .timestamp {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        color: #94a3b8;
        text-align: center;
        padding: 10px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
      }
    </style>
  `;
  
  // Inyectar estilos
  const styleEl = document.createElement('style');
  styleEl.textContent = style;
  elements.unitInfo.appendChild(styleEl);
}

// ===== ACTUALIZACIÓN DE ESTADÍSTICAS =====
function updateStatistics(stats) {
  elements.statEnRuta.textContent = stats.enRuta;
  elements.statEnEstacion.textContent = stats.enEstacion;
  elements.statIncidencia.textContent = stats.incidencia;
}

function updateUnitCount(count) {
  elements.unitCount.textContent = count;
}

// ===== CONTROLES =====
function setupEventListeners() {
  // Control de velocidad
  elements.speedUp.addEventListener('click', () => {
    state.simulationSpeed = Math.min(5, state.simulationSpeed + 0.5);
    updateSpeedDisplay();
  });
  
  elements.speedDown.addEventListener('click', () => {
    state.simulationSpeed = Math.max(0.5, state.simulationSpeed - 0.5);
    updateSpeedDisplay();
  });
  
  // Control de simulación
  elements.toggleSim.addEventListener('click', () => {
    state.simulationActive = !state.simulationActive;
    
    if (state.simulationActive) {
      elements.playIcon.className = 'fas fa-pause';
      document.querySelector('.sim-status .status-indicator').classList.add('active');
    } else {
      elements.playIcon.className = 'fas fa-play';
      document.querySelector('.sim-status .status-indicator').classList.remove('active');
    }
  });
}

function updateSpeedDisplay() {
  elements.currentSpeed.textContent = `${state.simulationSpeed.toFixed(1)}x`;
}

// ===== RELOJ Y TIEMPO =====
function startClock() {
  setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    elements.currentTime.textContent = timeStr;
    
    // Actualizar tiempo desde última actualización
    if (state.lastUpdateTime) {
      const diff = Math.floor((now - state.lastUpdateTime) / 1000);
      elements.lastUpdate.textContent = `Última actualización: Hace ${diff} segundos`;
    }
  }, 1000);
}

// ===== CARGA DE DATOS =====
function loadInitialData() {
  // Cargar datos iniciales
  fetch('/sim/snapshot')
    .then(res => res.json())
    .then(data => {
      updateUnitsVisualization(data);
      state.lastUpdateTime = new Date();
    })
    .catch(err => {
      console.error('Error cargando datos:', err);
      // Datos de ejemplo
      const sampleData = [
        {
          id_unidad: 'MB-101',
          id_ruta: 1,
          sentido: 'IDA',
          en_circuito: true,
          idx_tramo: 3,
          progreso: 0.4,
          estado_unidad: 'EN_RUTA',
          velocidad: 1.2
        },
        {
          id_unidad: 'MB-102',
          id_ruta: 1,
          sentido: 'REGRESO',
          en_circuito: true,
          idx_tramo: 12,
          progreso: 0.8,
          estado_unidad: 'EN_ESTACION',
          velocidad: 1.0
        },
        {
          id_unidad: 'MB-103',
          id_ruta: 1,
          sentido: 'IDA',
          en_circuito: true,
          idx_tramo: 8,
          progreso: 0.6,
          estado_unidad: 'EN_COLA',
          velocidad: 0.8
        },
        {
          id_unidad: 'MB-104',
          id_ruta: 1,
          sentido: 'REGRESO',
          en_circuito: true,
          idx_tramo: 5,
          progreso: 0.2,
          estado_unidad: 'INCIDENCIA',
          velocidad: 0
        }
      ];
      updateUnitsVisualization(sampleData);
    });
}

// ===== WEBSOCKET =====
socket.on("actualizar_posiciones", (data) => {
  updateUnitsVisualization(data);
  state.lastUpdateTime = new Date();
});

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', init);