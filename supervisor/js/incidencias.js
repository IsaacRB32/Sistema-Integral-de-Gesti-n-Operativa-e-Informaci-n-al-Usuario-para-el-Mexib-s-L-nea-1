// Módulo de gestión de incidencias
const moduloIncidencias = {
    async reportar() {
        const unidad = document.getElementById('inc-unidad').value;
        const tipo = document.getElementById('inc-tipo').value;
        const desc = document.getElementById('inc-desc').value.trim();

        if (!unidad) return utils.mostrarMensaje('msg-incidencias', 'Ingresa ID', 'error');

        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/incidencia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_unidad: parseInt(unidad),
                    id_cincidencia: parseInt(tipo),
                    descripcion: desc || null
                })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-incidencias', `Reportada (ID: ${data.id_incidencia})`, 'success');
                document.getElementById('inc-unidad').value = '';
                document.getElementById('inc-desc').value = '';
                setTimeout(() => this.cargar(), 500);
            } else {
                utils.mostrarMensaje('msg-incidencias', data.error, 'error');
            }
        } catch (err) {
            utils.mostrarMensaje('msg-incidencias', 'Error de conexión', 'error');
        }
    },

    async resolver(idInc, idUnidad) {
        utils.mostrarModal(
            '¿Resolver incidencia?',
            'Esta acción marcará la incidencia como resuelta.',
            async () => {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/resolver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_incidencia: idInc, id_unidad: idUnidad })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-incidencias', 'Resuelta', 'success');
                this.cargar();
            }
        } catch (err) {
            console.error('Error:', err);
        }
            }
        );
    },

    async cargar() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/supervisor/incidencias`);
            const incidencias = await res.json();
            
            const container = document.getElementById('lista-incidencias');
            if (!container) return;

            const activas = incidencias.filter(i => i.estado_incidencia === 'ACTIVA');

            if (activas.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-400">Sin incidencias</div>';
                return;
            }

            container.innerHTML = activas.map(inc => `
                <div class="bg-white border-2 border-red-400 rounded-lg p-4 shadow">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-red-600 font-bold">#${inc.id_incidencia}</span>
                            <span class="ml-2 text-sm text-gray-500">${new Date(inc.fecha_inicio).toLocaleString()}</span>
                        </div>
                        <button onclick="moduloIncidencias.resolver(${inc.id_incidencia}, ${inc.id_unidad || 'null'})" class="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm text-white shadow">
                            ✓ Resolver
                        </button>
                    </div>
                    <p class="text-sm mb-2 text-gray-700"><strong>Tipo:</strong> ${inc.nombre_incidencia || 'N/A'}</p>
                    <p class="text-sm mb-2 text-gray-700"><strong>Estación:</strong> ${inc.nombre_estacion || 'N/A'}</p>
                    <p class="text-sm text-gray-600">${inc.descripcion || 'Sin descripción'}</p>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error:', err);
        }
    }
};