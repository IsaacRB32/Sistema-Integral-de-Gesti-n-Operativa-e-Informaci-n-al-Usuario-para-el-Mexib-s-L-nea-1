// Templates HTML de cada vista
const VISTAS = {
    unidades: () => `
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

`,
    operaciones: () => `
        <div class="fade-in space-y-5">
            <!-- Header -->
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Operaciones</h2>
                    <p class="text-sm text-gray-500">Alta y retiro de unidades con monitoreo visual en tiempo real.</p>
                </div>

                <div class="text-xs text-gray-500">
                    Tip: usa “Pantalla completa” para monitoreo a pantalla completa.
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                <!-- LEFT: Control -->
                <section class="xl:col-span-4">
                    <div class="bg-white rounded-xl shadow-sm border p-5 xl:sticky xl:top-24">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-gray-900">Control de unidades</h3>
                            <span class="text-xs text-gray-500">Entrar / Salir</span>
                        </div>

                        <div id="msg-unidades" class="hidden border p-3 rounded-lg mb-4 text-sm"></div>

                        <!-- Meter unidad -->
                        <div class="rounded-xl border bg-gray-50 p-4">
                            <div class="flex items-center justify-between mb-3">
                                <h4 class="text-sm font-semibold text-gray-900">Meter unidad</h4>
                                <span class="text-xs text-gray-500">Agregar a circuito</span>
                            </div>

                            <input type="hidden" id="input-ruta" value="1" />

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="sm:col-span-2">
                                    <label class="block text-sm font-medium mb-1 text-gray-700">Unidad</label>
                                    <select id="input-unidad-id" class="border rounded-lg px-3 py-2 w-full bg-white">
                                        <option value="">Cargando unidades...</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium mb-1 text-gray-700">Sentido</label>
                                    <select id="input-sentido" class="border rounded-lg px-3 py-2 w-full bg-white">
                                        <option value="IDA">IDA (Abastos → Azteca)</option>
                                        <option value="REGRESO">REGRESO (Azteca → Abastos)</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium mb-1 text-gray-700">Velocidad</label>
                                    <input id="input-velocidad" type="number" step="0.1" min="0.1" max="2.0"
                                        class="border rounded-lg px-3 py-2 w-full bg-white" value="0.8" />
                                    <div class="text-[11px] text-gray-500 mt-1">Sugerido: 0.6–1.0</div>
                                </div>

                                <div class="sm:col-span-2">
                                    <label class="block text-sm font-medium mb-1 text-gray-700">Operador</label>
                                    <select id="input-operador" class="border rounded-lg px-3 py-2 w-full bg-white">
                                        <option value="">Sin asignar</option>
                                    </select>
                                </div>
                            </div>

                            <button class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-mexibus-green text-white hover:opacity-90 transition"
                                id="btn-meter-unidad" onclick="meterUnidad()">
                                Meter
                            </button>
                        </div>

                        <!-- Sacar unidad -->
                        <div class="rounded-xl border bg-gray-50 p-4 mt-4">
                            <div class="flex items-center justify-between mb-3">
                                <h4 class="text-sm font-semibold text-gray-900">Sacar unidad</h4>
                                <span class="text-xs text-gray-500">Retirar del circuito</span>
                            </div>

                            <label class="block text-sm font-medium mb-1 text-gray-700">Unidad (en circuito)</label>
                            <select id="input-unidad-id-sacar" class="border rounded-lg px-3 py-2 w-full bg-white">
                                <option value="">Cargando unidades en circuito...</option>
                            </select>

                            <button class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold bg-red-600 text-white hover:opacity-90 transition"
                                onclick="sacarUnidad()">
                                Sacar
                            </button>
                        </div>

                        <!-- Ayuda UX -->
                        <div class="mt-4 text-xs text-gray-600 leading-5">
                            <div class="font-semibold text-gray-800 mb-1">Notas</div>
                            <ul class="list-disc pl-5 space-y-1">
                                <li>“Simulación en vivo” muestra tarjetas con el estado actual.</li>
                                <li>El “Panel de simulación” permite enfocar y seguir unidades.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- RIGHT: Live + Panel -->
                <section class="xl:col-span-8 space-y-4">

                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

                        <!-- Simulación en vivo -->
                        <div class="bg-white rounded-xl shadow-sm border p-5 lg:col-span-2">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="font-semibold text-gray-900">Simulación en vivo</h3>
                                <span class="text-xs text-gray-500">Tarjetas</span>
                            </div>

                            <div id="simulacion-viva" class="h-[calc(100vh-260px)] min-h-[36rem] overflow-auto scrollbar-custom pr-1">
                                <div class="text-center py-6 text-gray-400 text-sm">Cargando...</div>
                            </div>
                        </div>

                        <!-- Panel de simulación -->
                        <div class="bg-white rounded-xl shadow-sm border p-5 lg:col-span-3">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="font-semibold text-gray-900">Panel de simulación</h3>
                                <button onclick="app.navegarA('simulacion')"
                                    class="px-3 py-2 rounded-lg text-xs font-semibold bg-mexibus-blue text-white hover:opacity-90 transition">
                                    Pantalla completa
                                </button>
                            </div>

                            <!-- Track -->
                            <div id="sim-container" class="mb-4">
                                <div id="cola-lineal"
                                    class="p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto scrollbar-custom">
                                    <div class="text-center py-4 text-gray-400 text-sm">Cargando estaciones...</div>
                                </div>
                            </div>
                                <div class="overflow-x-auto scrollbar-custom">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="border-b-2 border-gray-200">
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

                </section>

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

        <!-- El módulo JS insertará aquí el toolbar + el track -->
        <div id="sim-container" class="mb-6">
        <div id="cola-lineal" class="p-4 bg-gray-50 rounded-lg border border-gray-300 overflow-x-auto scrollbar-custom">
            <div class="text-center py-4 text-gray-400 text-sm">Cargando estaciones...</div>
        </div>
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

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-end">
                <div class="lg:col-span-4">
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Búsqueda</label>
                    <input id="usuarios-search" oninput="moduloOperadores.aplicarFiltros()"
                        placeholder="Nombre, apellidos o email..."
                        class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-mexibus-blue focus:outline-none" />
                </div>
                <div class="lg:col-span-3">
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
                    <select id="usuarios-filter-rol" onchange="moduloOperadores.setFiltroRol(this.value)"
                        class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="ALL">Todos</option>
                        <option value="OPERADOR">OPERADOR</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                    </select>
                </div>
                <div class="lg:col-span-3">
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Estatus</label>
                    <select id="usuarios-filter-status" onchange="moduloOperadores.setFiltroStatus(this.value)"
                        class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="ALL">Todos</option>
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                    </select>
                </div>
                <div class="lg:col-span-2 flex gap-2">
                    <button onclick="moduloOperadores.mostrarFormularioNuevo()"
                        class="flex-1 bg-mexibus-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition">
                        Nuevo
                    </button>
                    <button onclick="moduloOperadores.limpiarFiltros()"
                        class="flex-1 bg-white text-gray-800 px-4 py-2 rounded-lg font-medium border hover:bg-gray-50 transition">
                        Limpiar
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

