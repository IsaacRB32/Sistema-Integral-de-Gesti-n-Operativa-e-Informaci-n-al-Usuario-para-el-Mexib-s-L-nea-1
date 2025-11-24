// Módulo de gestión de unidades CON ICONOS
const moduloUnidades = {
    async meterUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        const ruta = document.getElementById('input-ruta').value;
        const sentido = document.getElementById('input-sentido').value;
        const estacion = document.getElementById('input-estacion').value;

        if (!id) return utils.mostrarMensaje('msg-unidades', 'Ingresa el ID', 'error');

        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/entrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_unidad: parseInt(id),
                    id_ruta: parseInt(ruta),
                    sentido,
                    idx_tramo: parseInt(estacion)
                })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-unidades', `Unidad ${id} ingresada`, 'success');
                setTimeout(() => this.cargar(), 500);
            } else {
                utils.mostrarMensaje('msg-unidades', data.error, 'error');
            }
        } catch (err) {
            utils.mostrarMensaje('msg-unidades', 'Error de conexión', 'error');
        }
    },

    async sacarUnidad() {
        const id = document.getElementById('input-unidad-id').value;
        if (!id) return utils.mostrarMensaje('msg-unidades', 'Ingresa el ID', 'error');

        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/salir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_unidad: parseInt(id) })
            });

            const data = await res.json();
            if (data.ok) {
                utils.mostrarMensaje('msg-unidades', `Unidad ${id} sacada`, 'success');
                setTimeout(() => this.cargar(), 500);
            } else {
                utils.mostrarMensaje('msg-unidades', data.error, 'error');
            }
        } catch (err) {
            utils.mostrarMensaje('msg-unidades', 'Error de conexión', 'error');
        }
    },

    // Función para obtener icono de estación
    obtenerIconoEstacion(nombreEstacion) {
        if (!nombreEstacion || nombreEstacion === 'Desconocida') {
            return '<span class="w-5 h-5 inline-block bg-gray-300 rounded-full mr-2 flex items-center justify-center text-xs" title="Ubicación desconocida">📍</span>';
        }
        
        // Ruta corregida: ../ para subir desde /js a /supervisor
        const rutaBase = '../mexibusSystemImages/stationsIcons/';
        
        const iconos = {
            'Adolfo López Mateos': 'adolfoLopezMateosIcon.png',
            '19 de Septiembre': '19deSeptiembreIcon.png',
            'Alfredo Torres': 'alfredoTorresIcon.png',
            'Aquiles Serdán': 'aquilesSerdanIcon.png',
            'Central de Abastos': 'centraldeAbastosIcon.png',
            'Ciudad Azteca': 'ciudadAztecaIcon.png',
            'Cuauhtémoc Norte': 'cuauhtemocNorteIcon.png',
            'Cuauhtémoc Sur': 'cuauhtemocSurIcon.png',
            'Esmeralda': 'esmeraldaIcon.png',
            'Hidalgo': 'hidalgoIcon.png',
            'Hospital': 'hospitalIcon.png',
            'Industrial': 'industrialIcon.png',
            'Insurgentes': 'insurgentesIcon.png',
            'Jardines del Morelos': 'jardinesdeMorelosIcon.png',
            'Josefa Ortiz': 'josefaOrtizIcon.png',
            'Las Américas': 'lasAmericasIcon.png',
            'Las Torres': 'lasTorresIcon.png',
            'Ojo de Agua': 'ojodeAguaIcon.png',
            'Palomas': 'palomasIcon.png',
            'Primero de Mayo': 'primerodeMayo.png',
            'Quinto Sol': 'quintoSolIcon.png',
            'Unitec': 'unitecIcon.png',
            'Valle de Ecatepec': 'valledeEcatepecIcon.png',
            'Vocacional 3': 'vocacional3Icon.png',
            'Zodiaco': 'zodiacoIcon.png'
        };
        
        const icono = iconos[nombreEstacion];
        if (icono) {
            return `<img src="${rutaBase}${icono}" alt="${nombreEstacion}" 
                     class="w-5 h-5 inline-block mr-2 rounded" title="${nombreEstacion}">`;
        }
        
        return `<span class="w-5 h-5 inline-block bg-blue-500 rounded-full mr-2 flex items-center justify-center text-white text-xs" title="${nombreEstacion}">🚉</span>`;
    },

    async cargar() {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/sim/snapshot`);
            const unidades = await res.json();
            
            const tbody = document.getElementById('tabla-unidades');
            if (!tbody) return;

            if (unidades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">No hay unidades</td></tr>';
                return;
            }

            tbody.innerHTML = unidades.map(u => {
                const estadoColor = {
                    'EN_RUTA': 'bg-green-500 text-white',
                    'EN_ESTACION': 'bg-yellow-500 text-gray-900',
                    'EN_COLA': 'bg-blue-500 text-white',
                    'INCIDENCIA': 'bg-red-500 text-white'
                }[u.estado_unidad] || 'bg-gray-500 text-white';

                const estacion = CONFIG.estaciones[u.idx_tramo] || 'Desconocida';
                const progreso = Math.round(u.progreso * 100);
                const iconoEstacion = this.obtenerIconoEstacion(estacion);

                return `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-2 font-bold text-gray-900">#${u.id_unidad}</td>
                        <td class="py-3 px-2">
                            <span class="px-2 py-1 rounded text-xs ${u.sentido === 'IDA' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                ${u.sentido}
                            </span>
                        </td>
                        <td class="py-3 px-2">
                            <span class="px-2 py-1 rounded text-xs ${estadoColor}">
                                ${u.estado_unidad.replace('_', ' ')}
                            </span>
                        </td>
                        <td class="py-3 px-2 text-sm text-gray-700">
                            <div class="flex items-center gap-2">
                                ${iconoEstacion}
                                <span>${estacion}</span>
                            </div>
                        </td>
                        <td class="py-3 px-2">
                            <div class="flex items-center gap-2">
                                <div class="flex-1 bg-gray-200 rounded-full h-2">
                                    <div class="bg-mexibus-green h-2 rounded-full" style="width: ${progreso}%"></div>
                                </div>
                                <span class="text-xs text-gray-600">${progreso}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            console.error('Error cargando unidades:', err);
        }
    }
};