// Aplicación principal (controlador)
const app = {
    vistaActual: null,
    root: null,

    init() {
        this.root = document.getElementById('app-root');
        this.navegarA('unidades');
        this.configurarSocket();
        this.iniciarAutoRefresh();
    },

    navegarA(vista) {
        // Actualizar UI de tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === vista) {
                btn.classList.remove('bg-gray-200', 'text-gray-700');
                btn.classList.add('bg-mexibus-blue', 'text-white');
            } else {
                btn.classList.remove('bg-mexibus-blue', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });

        this.vistaActual = vista;
        this.root.innerHTML = VISTAS[vista]();
        this.inicializarVista(vista);
    },

    inicializarVista(vista) {
        switch(vista) {
            case 'unidades':
                moduloUnidades.cargar();
                break;
            case 'incidencias':
                moduloIncidencias.cargar();
                break;
            case 'simulacion':
                moduloSimulacion.iniciar();
                break;
        }
    },

    configurarSocket() {
        CONFIG.socket.on('actualizar_posiciones', (unidades) => {
            if (this.vistaActual === 'simulacion') {
                moduloSimulacion.actualizar(unidades);
            }
        });
    },

    iniciarAutoRefresh() {
        setInterval(() => {
            if (this.vistaActual === 'unidades') moduloUnidades.cargar();
            if (this.vistaActual === 'incidencias') moduloIncidencias.cargar();
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
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
   