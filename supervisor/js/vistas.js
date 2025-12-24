// Templates HTML de cada vista
const VISTAS = {
    unidades: () => `
        <!-- Sub-tabs internos -->
        <div class="flex gap-2 mb-4">
            <button id="tab-cat-unidades"
                    class="px-4 py-2 rounded bg-mexibus-blue text-white"
                    onclick="moduloUnidades.mostrarSeccion('catalogo')">
                Todas las unidades
            </button>
            <button id="tab-op-unidades"
                    class="px-4 py-2 rounded bg-gray-200"
                    onclick="moduloUnidades.mostrarSeccion('operaciones')">
                Operaciones
            </button>   

            </div>

            <!-- 1) Catálogo -->
                <div id="seccion-unidades-catalogo">
                    <div class="flex items-center justify-between mb-3">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">Catálogo de unidades</h2>
                        <p class="text-sm text-gray-500">Administra altas, bajas y reingresos de unidades. No se permite modificar si está en circuito.</p>
                    </div>

                    <button
                        class="bg-mexibus-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                        onclick="moduloUnidades.mostrarFormularioNuevoUnidad()"
                    >
                        Agregar
                    </button>
                    </div>
                <div id="msg-catalogo-unidades" class="hidden border p-3 rounded mb-3"></div>

                <!-- Filtros -->
                <div class="bg-white rounded shadow border p-4 mb-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Buscar</label>
                        <input id="unidades-search"
                            class="border rounded px-3 py-2 w-full"
                            placeholder="Ej: 12, IDA, FUERA_DE_SERVICIO..."
                            oninput="moduloUnidades.aplicarFiltrosCatalogo()">
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">Estatus (activo)</label>
                        <select id="unidades-filtro-activo"
                                class="border rounded px-3 py-2 w-full"
                                onchange="moduloUnidades.setFiltroActivoCatalogo(this.value)">
                        <option value="ALL">Todas</option>
                        <option value="true">Activas</option>
                        <option value="false">Inactivas</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-1">Circuito</label>
                        <select id="unidades-filtro-circuito"
                                class="border rounded px-3 py-2 w-full"
                                onchange="moduloUnidades.setFiltroCircuitoCatalogo(this.value)">
                        <option value="ALL">Todas</option>
                        <option value="true">En circuito</option>
                        <option value="false">Fuera de circuito</option>
                        </select>
                    </div>
                    </div>
                </div>

                <!-- Form (crear/editar) - OCULTO por defecto -->
                <div id="form-unidad-catalogo" class="hidden bg-white rounded shadow border p-4 mb-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 id="form-unidad-titulo" class="font-bold text-gray-900">Agregar unidad</h3>
                    <button class="text-gray-600 hover:text-gray-900"
                            onclick="moduloUnidades.cerrarFormUnidadCatalogo()">✕</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                    <label class="block text-sm font-medium mb-1">Número de unidad</label>
                    <input id="cat-id-unidad"
                            type="number"
                            min="1"
                            class="border rounded px-3 py-2 w-full"
                            placeholder="Ej: 25">
                    </div>

                    <div>
                    <label class="block text-sm font-medium mb-1">Marca</label>
                    <input id="cat-marca"
                            type="text"
                            class="border rounded px-3 py-2 w-full"
                            placeholder="Ej: Volvo">
                    </div>

                    <div>
                    <label class="block text-sm font-medium mb-1">Modelo</label>
                    <input id="cat-modelo"
                            type="text"
                            class="border rounded px-3 py-2 w-full"
                            placeholder="Ej: 7900 Electric">
                    </div>
                </div>

                <div class="flex gap-2 items-end mt-3">
                    <button class="bg-green-600 text-white px-4 py-2 rounded w-full hover:opacity-90"
                            onclick="moduloUnidades.guardarUnidadCatalogo()">
                    Guardar
                    </button>

                    <button type="button"
                            class="bg-gray-300 px-6 py-2 rounded"
                            onclick="moduloUnidades.cerrarFormUnidadCatalogo()">
                    Cancelar
                    </button>
                </div>
                </div>


                <!-- Tabla catálogo -->
                <div class="bg-white rounded shadow border overflow-x-auto">
                    <table class="w-full">
                    <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="text-left p-2">Unidad</th>
                        <th class="text-left p-2">Marca</th>
                        <th class="text-left p-2">Modelo</th>
                        <th class="text-left p-2">Ruta</th>
                        <th class="text-left p-2">Sentido</th>
                        <th class="text-left p-2">Circuito</th>
                        <th class="text-left p-2">Estado</th>
                        <th class="text-left p-2">Velocidad</th>
                        <th class="text-left p-2">Operador</th>
                        <th class="text-left p-2">Estatus</th>
                        <th class="text-left p-2">Acciones</th>
                    </tr>
                    </thead>

                    <tbody id="tbody-catalogo-unidades">
                    <tr><td colspan="11" class="p-4 text-gray-400 text-center">Cargando...</td></tr>
                    </tbody>
                    </table>
                </div>
                </div>


            <!-- 2) Operaciones -->
            <div id="seccion-unidades-operaciones" class="hidden">

            <!-- Contenedor en 2 columnas (en desktop) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                <!-- IZQUIERDA: Control de Unidades -->
                <div class="bg-white rounded shadow border p-4">
                    <h3 class="font-semibold mb-4">Control de Unidades</h3>

                    <div id="msg-unidades" class="hidden border p-3 rounded mb-3"></div>

                    <!-- ====== METER UNIDAD ====== -->
                    <div class="mb-6">
                    <h4 class="font-semibold mb-3">Meter unidad</h4>

                    <label class="block text-sm font-medium mb-1">Unidad</label>
                    <select id="input-unidad-id" class="border rounded px-3 py-2 w-full mb-4">
                        <option value="">Cargando unidades...</option>
                    </select>

                    <!-- Como tu JS manda id_ruta, agrega un input oculto fijo -->
                    <input type="hidden" id="input-ruta" value="1" />

                    <label class="block text-sm font-medium mb-1">Sentido</label>
                    <select id="input-sentido" class="border rounded px-3 py-2 w-full mb-4">
                        <option value="IDA">IDA (Abastos → Azteca)</option>
                        <option value="REGRESO">REGRESO (Azteca → Abastos)</option>
                    </select>

                    <label class="block text-sm font-medium mb-1">Operador</label>
                    <select id="input-operador" class="border rounded px-3 py-2 w-full mb-4">
                        <option value="">-- Sin asignar --</option>
                    </select>

                    <label class="block text-sm font-medium mb-1">Velocidad</label>
                    <input id="input-velocidad"
                            type="number"
                            min="0"
                            step="0.1"
                            value="0.8"
                            class="border rounded px-3 py-2 w-full mb-4"
                            placeholder="Ej: 0.8">

                    <button class="bg-green-500 text-white px-4 py-2 rounded w-full"
                            onclick="meterUnidad()">
                        🚌 Meter
                    </button>
                    </div>

                    <hr class="my-4">

                    <!-- ====== SACAR UNIDAD ====== -->
                    <div>
                    <h4 class="font-semibold mb-3">Sacar unidad</h4>

                    <label class="block text-sm font-medium mb-1">Unidad (en circuito)</label>
                    <select id="input-unidad-id-sacar" class="border rounded px-3 py-2 w-full mb-4">
                        <option value="">Cargando unidades en circuito...</option>
                    </select>

                    <button class="bg-red-500 text-white px-4 py-2 rounded w-full"
                            onclick="sacarUnidad()">
                        ⛔ Sacar
                    </button>
                    </div>
                <!-- DERECHA: Simulación en vivo dentro de Operaciones -->
                <div class="bg-white rounded shadow border p-4">
                <h3 class="font-semibold mb-2">Simulación en vivo</h3>
                <div id="simulacion-viva" class="border rounded bg-white shadow p-4 h-96 overflow-auto">
                    Cargando simulación...
                </div>
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
    `,

   operadores: () => `
    <div class="fade-in">
        <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-mexibus-dark">Gestión de Usuarios</h2>
                <p class="text-sm text-gray-600">Operadores y Supervisores (CRUD completo)</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div class="flex gap-2">
                    <button id="filtro-rol-todos" onclick="moduloOperadores.setFiltroRol('ALL')"
                        class="px-3 py-2 rounded-lg text-sm font-medium border bg-mexibus-blue text-white hover:opacity-90 transition">
                        Todos
                    </button>
                    <button id="filtro-rol-operador" onclick="moduloOperadores.setFiltroRol('OPERADOR')"
                        class="px-3 py-2 rounded-lg text-sm font-medium border bg-white text-gray-700 hover:bg-gray-50 transition">
                        Operadores
                    </button>
                    <button id="filtro-rol-supervisor" onclick="moduloOperadores.setFiltroRol('SUPERVISOR')"
                        class="px-3 py-2 rounded-lg text-sm font-medium border bg-white text-gray-700 hover:bg-gray-50 transition">
                        Supervisores
                    </button>
                </div>
                <div class="flex gap-2">
                <button id="filtro-status-todos" onclick="moduloOperadores.setFiltroStatus('ALL')"
                    class="px-3 py-2 rounded-lg text-sm font-medium border bg-mexibus-blue text-white hover:opacity-90 transition">
                    Todos (estatus)
                </button>
                <button id="filtro-status-activo" onclick="moduloOperadores.setFiltroStatus('ACTIVO')"
                    class="px-3 py-2 rounded-lg text-sm font-medium border bg-white text-gray-700 hover:bg-gray-50 transition">
                    Activos
                </button>
                <button id="filtro-status-inactivo" onclick="moduloOperadores.setFiltroStatus('INACTIVO')"
                    class="px-3 py-2 rounded-lg text-sm font-medium border bg-white text-gray-700 hover:bg-gray-50 transition">
                    Inactivos
                </button>
                </div>

                <div class="flex gap-2">
                    <div class="relative">
                        <input id="usuarios-search" oninput="moduloOperadores.aplicarFiltros()"
                            placeholder="Buscar por nombre o email..."
                            class="w-64 max-w-full bg-white border border-gray-300 rounded-lg pl-3 pr-3 py-2 text-sm focus:ring-2 focus:ring-mexibus-blue focus:outline-none" />
                    </div>
                    <button onclick="moduloOperadores.mostrarFormularioNuevo()"
                        class="bg-mexibus-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition">
                        Nuevo
                    </button>
                </div>
            </div>
        </div>

        <div id="msg-operadores" class="hidden mb-4 border rounded-lg p-3"></div>

        <div id="form-operador" class="hidden mb-6 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div class="flex items-center justify-between mb-3">
            <h3 id="form-operador-titulo" class="font-bold text-gray-900">Nuevo Usuario</h3>
            <button onclick="moduloOperadores.cancelar()" class="text-gray-600 hover:text-gray-900">Cerrar</button>
            </div>

            <input type="hidden" id="op-id" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Rol</label>
                <select id="op-rol" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2">
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
                <input id="op-nombre" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Primer apellido</label>
                <input id="op-primer-apellido" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Segundo apellido</label>
                <input id="op-segundo-apellido" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Contacto</label>
                <input id="op-contacto" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <input id="op-email" type="email" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
            <label class="block text-sm font-medium mb-1 text-gray-700">Estado</label>
            <select id="op-activo" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2">
                <option value="true">ACTIVO</option>
                <option value="false">INACTIVO</option>
            </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Nueva contraseña</label>
                <input id="op-password" type="password" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Mín. 8 caracteres, letras y números" />
                <p class="text-xs text-gray-500 mt-1">En edición: dejar vacío para no cambiar.</p>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1 text-gray-700">Confirmar contraseña</label>
                <input id="op-password2" type="password" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Repite la contraseña" />
            </div>
            </div>

            <div class="flex gap-2 mt-4">
            <button onclick="moduloOperadores.guardar()"
                class="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition">
                Guardar
            </button>
            <button onclick="moduloOperadores.cancelar()"
                class="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition">
                Cancelar
            </button>
            </div>
        </div>

            <div class="overflow-x-auto scrollbar-custom">
            <table class="w-full text-sm">
            <thead>
                <tr class="border-b-2 border-gray-200">
                <th class="text-left py-2 px-2 text-gray-700">Nombre</th>
                <th class="text-left py-2 px-2 text-gray-700">Email</th>
                <th class="text-left py-2 px-2 text-gray-700">Rol</th>
                <th class="text-left py-2 px-2 text-gray-700">Contacto</th>
                <th class="text-left py-2 px-2 text-gray-700">Estado</th>
                <th class="text-left py-2 px-2 text-gray-700">Unidad</th>
                <th class="text-left py-2 px-2 text-gray-700">Acciones</th>
                </tr>
            </thead>
            <tbody id="tabla-operadores">
                <tr><td colspan="7" class="text-center py-6 text-gray-400">Cargando...</td></tr>
            </tbody>
            </table>
        </div>
        </div>
    </div>
    `,
};