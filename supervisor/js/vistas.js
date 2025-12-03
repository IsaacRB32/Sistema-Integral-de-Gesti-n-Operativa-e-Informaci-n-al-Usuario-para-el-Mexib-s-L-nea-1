// Templates HTML de cada vista
const VISTAS = {
    unidades: () => `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            <div class="lg:col-span-1 bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 class="text-xl font-bold mb-4 text-mexibus-dark">Control de Unidades</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">Unidad ID</label>
                        <input type="number" id="input-unidad-id" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mexibus-blue focus:outline-none text-gray-900" placeholder="Ej: 1">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">Ruta</label>
                        <select id="input-ruta" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mexibus-blue focus:outline-none text-gray-900">
                            <option value="1">L1 - Abastos ↔ Azteca</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">Sentido</label>
                        <select id="input-sentido" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mexibus-blue focus:outline-none text-gray-900">
                            <option value="IDA">IDA (Abastos → Azteca)</option>
                            <option value="REGRESO">REGRESO (Azteca → Abastos)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">👨‍✈️ Conductor</label>
                        <select id="input-conductor" class="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-mexibus-blue focus:outline-none text-gray-900">
                            <option value="">Cargando conductores...</option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="moduloUnidades.meterUnidad()" class="flex-1 bg-mexibus-green hover:bg-opacity-90 text-gray-900 font-bold py-3 rounded-lg transition shadow">
                            🚍 Meter
                        </button>
                        <button onclick="moduloUnidades.sacarUnidad()" class="flex-1 bg-red-500 hover:bg-red-600 font-bold py-3 rounded-lg transition shadow text-white">
                            🚫 Sacar
                        </button>
                    </div>
                </div>
                <div id="msg-unidades" class="mt-4 p-3 rounded-lg text-sm font-medium hidden"></div>
            </div>

            <div class="lg:col-span-2 bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 class="text-xl font-bold mb-4 text-gray-900">Estado de Unidades</h2>
                <div class="overflow-x-auto scrollbar-custom">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b-2 border-gray-300">
                                <th class="text-left py-3 px-2 text-gray-700">ID</th>
                                <th class="text-left py-3 px-2 text-gray-700">Sentido</th>
                                <th class="text-left py-3 px-2 text-gray-700">Estado</th>
                                <th class="text-left py-3 px-2 text-gray-700">Ubicación</th>
                                <th class="text-left py-3 px-2 text-gray-700">Conductor</th>
                                <th class="text-left py-3 px-2 text-gray-700">Progreso</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-unidades">
                            <tr><td colspan="6" class="text-center py-8 text-gray-400">Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,

    incidencias: () => `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            <!-- BANDEJA DE ENTRADA (Reemplaza al formulario) -->
            <div class="lg:col-span-1 bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 class="text-xl font-bold mb-4 text-mexibus-dark">📥 Bandeja de Entrada</h2>
                <p class="text-sm text-gray-600 mb-4">Incidencias pendientes de validación</p>
                
                <div id="bandeja-pendientes" class="space-y-3 overflow-y-auto max-h-[500px] scrollbar-custom">
                    <div class="text-center py-8 text-gray-400">Cargando...</div>
                </div>

                <div id="msg-bandeja" class="mt-4 p-3 rounded-lg text-sm font-medium hidden"></div>
            </div>

            <!-- LISTA DE INCIDENCIAS ACTIVAS (Se mantiene igual) -->
            <div class="lg:col-span-2 bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                <h2 class="text-xl font-bold mb-4 text-gray-900">⚠️ Incidencias Activas</h2>
                <div class="space-y-3 overflow-y-auto max-h-[600px] scrollbar-custom" id="lista-incidencias">
                    <div class="text-center py-8 text-gray-400">Cargando...</div>
                </div>
            </div>
        </div>
    `,

    simulacion: () => `
        <div class="bg-white rounded-lg p-6 shadow-lg border border-gray-200 fade-in">
            <h2 class="text-xl font-bold mb-4 text-gray-900">Simulación en Tiempo Real</h2>
            
            <div id="sim-container" class="mb-6">
                <div id="cola-lineal" class="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-300 overflow-x-auto scrollbar-custom"></div>
            </div>

            <div class="flex justify-center mb-6">
                <canvas id="canvasSim" width="600" height="600" class="rounded-lg bg-gray-50 border border-gray-300"></canvas>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 border border-gray-300">
                <h3 class="font-bold mb-3 text-gray-900">Estado en Tiempo Real</h3>
                <div class="overflow-x-auto scrollbar-custom">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b-2 border-gray-300">
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
    `
};