// Aplicación principal (controlador)
const app = {
  vistaActual: null,
  root: null,

  init() {
    this.root = document.getElementById('app-root');

    // Socket + auto-refresh
    this.configurarSocket();
    this.iniciarAutoRefresh();

    // Vista inicial
    this.navegarA('unidades');
  },

  navegarA(vista) {
    // Validación básica
    if (!VISTAS || typeof VISTAS[vista] !== 'function') {
      console.error('Vista no encontrada:', vista);
      if (this.root) {
        this.root.innerHTML = `
          <div class="bg-white border rounded-lg p-6 text-center text-gray-600">
            <div class="text-xl font-bold mb-2">Vista no encontrada</div>
            <div class="text-sm">No existe la vista: <span class="font-mono">${String(vista)}</span></div>
          </div>
        `;
      }
      return;
    }

    // Actualizar UI de tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      const isActive = btn.dataset.tab === vista;
      if (isActive) {
        btn.classList.remove('bg-gray-200', 'text-gray-700');
        btn.classList.add('bg-mexibus-blue', 'text-white');
      } else {
        btn.classList.remove('bg-mexibus-blue', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
      }
    });

    // Render
    this.vistaActual = vista;
    this.root.innerHTML = VISTAS[vista]();

    // Inicializar lógica de la vista
    this.inicializarVista(vista);
  },

  inicializarVista(vista) {
    try {
      switch (vista) {
        case 'unidades':
          moduloUnidades?.init?.();
          break;
        case 'incidencias':
          moduloIncidencias?.cargar?.();
          break;
        case 'simulacion':
          moduloSimulacion?.iniciar?.();
          break;
        case 'operadores':
          moduloOperadores?.init?.();
          break;
        default:
          console.warn('Vista sin inicializador:', vista);
      }
    } catch (e) {
      console.error('Error inicializando vista:', vista, e);
    }
  },

  configurarSocket() {
    if (!CONFIG?.socket) return;

    CONFIG.socket.on('actualizar_posiciones', (unidades) => {
      if (this.vistaActual === 'simulacion') {
        moduloSimulacion?.actualizar?.(unidades);
      }
    });
  },

  iniciarAutoRefresh() {
    setInterval(() => {
      try {
        if (this.vistaActual === 'unidades') moduloUnidades?.cargar?.();
        if (this.vistaActual === 'incidencias') moduloIncidencias?.cargar?.();
        if (this.vistaActual === 'operadores') moduloOperadores?.cargar?.();
      } catch (e) {
        console.error('Error en auto-refresh:', e);
      }
    }, 5000);
  },

  cerrarSesion() {
    utils.mostrarModal(
      '¿Cerrar sesión?',
      'Se cerrará tu sesión actual y tendrás que volver a iniciar sesión.',
      () => {
        localStorage.clear();
        window.location.href = '/supervisor/login.html';
      }
    );
  },
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
