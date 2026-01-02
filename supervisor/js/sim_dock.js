// supervisor/js/sim_dock.js
// Panel acoplable (dock) para ver la simulación en cualquier vista.

const simDock = {
  _dock: null,
  _overlay: null,
  _body: null,
  _isOpen: false,
  _isWide: false,
  _pendingFocusId: null,

  init() {
    this._dock = document.getElementById('sim-dock');
    this._overlay = document.getElementById('sim-dock-overlay');
    this._body = document.getElementById('sim-dock-body');

    // Por si el HTML no está incluido, no romper.
    if (!this._dock || !this._overlay || !this._body) return;

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    });
  },

  get isOpen() {
    return Boolean(this._isOpen);
  },

  toggle(opts = {}) {
    if (this._isOpen) this.close();
    else this.open(opts);
  },

  open(opts = {}) {
    if (!this._dock || !this._overlay || !this._body) this.init();
    if (!this._dock || !this._overlay || !this._body) return;

    // Si ya estás en la vista completa, mejor no duplicar.
    if (typeof app !== 'undefined' && app?.vistaActual === 'simulacion') {
      // En pantalla completa ya está visible.
      return;
    }

    // En "Operaciones" el panel ya está embebido (no duplicar IDs). Solo enfocar si se solicita.
    if (typeof app !== 'undefined' && app?.vistaActual === 'operaciones') {
      if (opts?.focusId) this.focusUnidad(opts.focusId);
      return;
    }


    const { wide = false, focusId = null } = opts || {};
    this._isWide = Boolean(wide);
    this._pendingFocusId = (focusId !== null && focusId !== undefined) ? String(focusId) : null;

    // Render del contenido (usa los mismos IDs que la vista de simulación; por eso vive sólo aquí).
    this._body.innerHTML = this._template();
    this._aplicarAncho();

    this._overlay.classList.remove('hidden');
    this._dock.classList.remove('translate-x-full');
    this._isOpen = true;

    // Arrancar módulo
    try {
      moduloSimulacion?.iniciar?.();
    } catch (e) {
      console.error('Error iniciando simulación en dock:', e);
    }

    // Intento de focus (primero), luego reforzado tras snapshot/updates.
    if (this._pendingFocusId) {
      this.focusUnidad(this._pendingFocusId);
      setTimeout(() => this.focusUnidad(this._pendingFocusId), 400);
      setTimeout(() => this.focusUnidad(this._pendingFocusId), 900);
    }
  },

  close() {
    if (!this._dock || !this._overlay || !this._body) return;

    // Importante: remover DOM para evitar IDs duplicados al ir a la vista completa.
    this._body.innerHTML = '';
    this._overlay.classList.add('hidden');
    this._dock.classList.add('translate-x-full');

    this._isOpen = false;
    this._pendingFocusId = null;
  },

  toggleWide() {
    this._isWide = !this._isWide;
    this._aplicarAncho();
  },

  goFull() {
    // Ir a la vista completa de simulación.
    try {
      this.close();
      app?.navegarA?.('simulacion');
    } catch (e) {
      console.error(e);
    }
  },

  focusUnidad(id) {
    const v = (id === null || id === undefined) ? '' : String(id);
    if (!v) return;

    // Guardar por si todavía no existe el select
    this._pendingFocusId = v;

    try {
      // Preferir vía select si ya existe
      const sel = document.getElementById('sim-select-unidad');
      if (sel) {
        sel.value = v;
        sel.dispatchEvent(new Event('change'));
        return;
      }

      // Fallback directo (si la UI aún no está lista)
      if (moduloSimulacion) {
        moduloSimulacion._focusId = v;
        moduloSimulacion._follow = true;
      }
    } catch (e) {
      console.error(e);
    }
  },

  _aplicarAncho() {
    if (!this._dock) return;

    // 420px normal / 820px wide (con máximo en viewport)
    if (this._isWide) {
      this._dock.style.width = '820px';
      this._dock.style.maxWidth = '95vw';
    } else {
      this._dock.style.width = '440px';
      this._dock.style.maxWidth = '92vw';
    }
  },

  _template() {
    return `
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="p-3 border-b bg-gray-50">
          <div class="text-sm font-semibold text-gray-900">Simulación en tiempo real</div>
          <div class="text-xs text-gray-500">Se actualiza vía Socket.IO / snapshot</div>
        </div>

        <div class="p-3">
          <div id="sim-container" class="mb-4">
            <div id="cola-lineal" class="p-3 bg-gray-50 rounded-lg border border-gray-300 overflow-x-auto scrollbar-custom">
              <div class="text-center py-4 text-gray-400 text-sm">Cargando estaciones...</div>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div class="font-semibold text-sm text-gray-900 mb-2">Estado</div>
            <div class="overflow-x-auto scrollbar-custom">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 px-2 text-gray-700">Unidad</th>
                    <th class="text-left py-2 px-2 text-gray-700">Sentido</th>
                    <th class="text-left py-2 px-2 text-gray-700">Estado</th>
                    <th class="text-left py-2 px-2 text-gray-700">Ubicación</th>
                  </tr>
                </thead>
                <tbody id="panel-sim">
                  <tr><td colspan="4" class="text-center py-4 text-gray-400">Sin unidades</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  simDock.init();
});
