// Lógica del dashboard del supervisor

let autoRefreshInterval = null;

/**
 * Inicializar dashboard
 */
function initDashboard() {
  requireAuth();
  
  const user = getCurrentUser();
  if (user) {
    document.getElementById('userName').textContent = 
      `${user.nombre} ${user.primer_apellido}`;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userRole').textContent = user.rol;
  }
  
  cargarDatos();
  iniciarActualizacionAutomatica();
}

/**
 * Cargar todos los datos
 */
async function cargarDatos() {
  await Promise.all([
    cargarUnidades(),
    cargarIncidencias()
  ]);
}

/**
 * Cargar unidades en circuito
 */
async function cargarUnidades() {
  const response = await fetchAPI(API_CONFIG.ENDPOINTS.SNAPSHOT);
  
  if (!response || !response.ok) {
    console.error('Error al cargar unidades');
    return;
  }
  
  const unidades = response.data;
  
  // Actualizar estadísticas
  document.getElementById('statTotal').textContent = unidades.length;
  document.getElementById('statActivas').textContent = 
    unidades.filter(u => u.estado_unidad === 'EN_RUTA').length;
  document.getElementById('statEstacion').textContent = 
    unidades.filter(u => u.estado_unidad === 'EN_ESTACION').length;
  
  // Actualizar tabla
  const tbody = document.getElementById('tbodyUnidades');
  
  if (unidades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-icon">🚌</div>
          <p>No hay unidades en circuito</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = unidades.map(u => {
    const estadoClass = u.estado_unidad.toLowerCase().replace('_', '');
    const estadoText = u.estado_unidad.replace('_', ' ');
    const sentidoIcon = u.sentido === 'IDA' ? '🔵' : '🟢';
    
    return `
      <tr>
        <td><strong>#${u.id_unidad}</strong></td>
        <td>${sentidoIcon} ${u.sentido}</td>
        <td><span class="status-badge status-${estadoClass}">${estadoText}</span></td>
        <td>Tramo ${u.idx_tramo}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.round(u.progreso * 100)}%"></div>
            <span class="progress-text">${Math.round(u.progreso * 100)}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Cargar incidencias
 */
async function cargarIncidencias() {
  const response = await fetchAPI(API_CONFIG.ENDPOINTS.INCIDENCIAS);
  
  if (!response || !response.ok) {
    console.error('Error al cargar incidencias');
    return;
  }
  
  const incidencias = response.data;
  const activas = incidencias.filter(i => i.estado_incidencia === 'ACTIVA');
  
  document.getElementById('statIncidencias').textContent = activas.length;
  
  const tbody = document.getElementById('tbodyIncidencias');
  
  if (activas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">✅</div>
          <p>No hay incidencias activas</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = activas.map(i => {
    const fecha = new Date(i.fecha_inicio);
    const fechaStr = fecha.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `
      <tr>
        <td><strong>#${i.id_incidencia}</strong></td>
        <td>${i.id_unidad || 'N/A'}</td>
        <td>${i.descripcion || 'Sin descripción'}</td>
        <td>${i.nombre_incidencia || 'N/A'}</td>
        <td>${fechaStr}</td>
        <td><span class="status-badge status-activa">ACTIVA</span></td>
        <td>
          <button class="btn-action btn-resolver" onclick="resolverIncidencia(${i.id_incidencia})">
            ✓ Resolver
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Resolver incidencia
 */
async function resolverIncidencia(id) {
  if (!confirm('¿Resolver esta incidencia?')) return;
  
  const response = await fetchAPI(API_CONFIG.ENDPOINTS.RESOLVER, {
    method: 'POST',
    body: JSON.stringify({ id_incidencia: id })
  });
  
  if (response && response.ok) {
    mostrarNotificacion('✅ Incidencia resuelta correctamente', 'success');
    await cargarDatos();
  } else {
    mostrarNotificacion('❌ Error al resolver incidencia', 'error');
  }
}

/**
 * Mostrar notificación
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification notification-${tipo}`;
  notif.textContent = mensaje;
  document.body.appendChild(notif);
  
  setTimeout(() => notif.classList.add('show'), 100);
  
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

/**
 * Iniciar actualización automática
 */
function iniciarActualizacionAutomatica() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setInterval(() => {
    cargarDatos();
  }, 5000); // Cada 5 segundos
}

/**
 * Detener actualización automática
 */
function detenerActualizacionAutomatica() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Inicializar al cargar la página
window.addEventListener('load', initDashboard);

// Limpiar al salir
window.addEventListener('beforeunload', detenerActualizacionAutomatica);