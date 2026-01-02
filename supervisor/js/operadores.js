// operadores.js - Gestión de usuarios (OPERADOR y SUPERVISOR)

const moduloOperadores = {
  lista: [],
  filtroRol: "ALL", // ALL | OPERADOR | SUPERVISOR
  filtroStatus: "ALL", // ALL | ACTIVO | INACTIVO

  init() {
    this.filtroRol = "ALL";
    this.cancelar();
    this.actualizarBotonesFiltro();
    this.cargar();
    this.filtroStatus = "ALL";
  },

  // -----------------------------
  // Filtros
  // -----------------------------
  setFiltroRol(rol) {
    this.filtroRol = rol;
    this.actualizarBotonesFiltro();
    this.cargar();
  },
  setFiltroStatus(status) {
    this.filtroStatus = status;
    this.actualizarBotonesFiltro();
    this.cargar();
  },
  actualizarBotonesFiltro() {
    // Nuevo UI (selects)
    const selRol = document.getElementById('usuarios-filter-rol');
    if (selRol) selRol.value = this.filtroRol;
    const selStatus = document.getElementById('usuarios-filter-status');
    if (selStatus) selStatus.value = this.filtroStatus;

    // Fallback compatibilidad (si existen botones)
    const setBtn = (id, active) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      if (active) {
        btn.classList.add("bg-mexibus-blue", "text-white");
        btn.classList.remove("bg-white", "text-gray-700");
      } else {
        btn.classList.remove("bg-mexibus-blue", "text-white");
        btn.classList.add("bg-white", "text-gray-700");
      }
    };

    setBtn("filtro-rol-todos", this.filtroRol === "ALL");
    setBtn("filtro-rol-operador", this.filtroRol === "OPERADOR");
    setBtn("filtro-rol-supervisor", this.filtroRol === "SUPERVISOR");
    setBtn("filtro-status-todos", this.filtroStatus === "ALL");
    setBtn("filtro-status-activo", this.filtroStatus === "ACTIVO");
    setBtn("filtro-status-inactivo", this.filtroStatus === "INACTIVO");
  },

  limpiarFiltros() {
    this.filtroRol = 'ALL';
    this.filtroStatus = 'ALL';
    const search = document.getElementById('usuarios-search');
    if (search) search.value = '';
    this.actualizarBotonesFiltro();
    this.cargar();
  },

  aplicarFiltros() {
    // Filtro de texto se hace client-side (rápido y sin tocar API)
    this.render();
  },

  getFiltroTexto() {
    const el = document.getElementById("usuarios-search");
    return String(el?.value ?? "").trim().toLowerCase();
  },

  // -----------------------------
  // Formulario
  // -----------------------------
  mostrarFormularioNuevo() {
    document.getElementById("form-operador-titulo").textContent = "Nuevo Usuario";

    document.getElementById("op-id").value = "";
    document.getElementById("op-rol").value = "OPERADOR";
    document.getElementById("op-nombre").value = "";
    document.getElementById("op-primer-apellido").value = "";
    document.getElementById("op-segundo-apellido").value = "";
    document.getElementById("op-contacto").value = "";
    document.getElementById("op-email").value = "";
    document.getElementById("op-activo").value = "true";  
    document.getElementById("op-password").value = "";
    document.getElementById("op-password2").value = "";

    document.getElementById("form-operador").classList.remove("hidden");
  },

  cancelar() {
    const form = document.getElementById("form-operador");
    if (form) form.classList.add("hidden");
  },

  editar(id) {
    const u = this.lista.find(x => x.id_usuario === id);
    if (!u) return;

    document.getElementById("form-operador-titulo").textContent = "Editar Usuario";

    document.getElementById("op-id").value = u.id_usuario;
    document.getElementById("op-rol").value = u.rol ?? "OPERADOR";
    document.getElementById("op-nombre").value = u.nombre ?? "";
    document.getElementById("op-primer-apellido").value = u.primer_apellido ?? "";
    document.getElementById("op-segundo-apellido").value = u.segundo_apellido ?? "";
    document.getElementById("op-contacto").value = u.contacto ?? "";
    document.getElementById("op-email").value = u.email ?? "";
    document.getElementById("op-activo").value = (u.activo === false) ? "false" : "true";

    // Restablecimiento: NO se pide contraseña anterior
    document.getElementById("op-password").value = "";
    document.getElementById("op-password2").value = "";

    document.getElementById("form-operador").classList.remove("hidden");
  },

  // -----------------------------
  // API
  // -----------------------------
  async cargar() {
    try {
      const params = [];

      if (this.filtroRol && this.filtroRol !== "ALL") {
        params.push(`rol=${encodeURIComponent(this.filtroRol)}`);
      }

      if (this.filtroStatus === "ACTIVO") {
        params.push("activo=true");
      } else if (this.filtroStatus === "INACTIVO") {
        params.push("activo=false");
      }

      const qs = params.length ? `?${params.join("&")}` : "";
      const res = await fetch(`${CONFIG.API_BASE}/supervisor/usuarios${qs}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        utils.mostrarMensaje("msg-operadores", data.error || "Error al cargar usuarios", "error");
        return;
      }

      this.lista = await res.json();
      this.render();

    } catch (e) {
      console.error(e);
      utils.mostrarMensaje("msg-operadores", "Error de conexión con el servidor", "error");
    }
  },

  badgeRol(rol) {
    const r = String(rol ?? "").toUpperCase();
    if (r === "SUPERVISOR") return `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">SUPERVISOR</span>`;
    return `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">OPERADOR</span>`;
  },

  badgeEstado(u) {
    if (u.activo === false) {
      return `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">INACTIVO</span>`;
    }

    const rol = String(u.rol ?? "").toUpperCase();
    if (rol === "OPERADOR") {
      if (u.id_unidad !== null && u.id_unidad !== undefined) {
        return `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">OCUPADO</span>`;
      }
      return `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">DISPONIBLE</span>`;
    }

    return `<span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">ACTIVO</span>`;
  },

  render() {
    const tbody = document.getElementById("tabla-operadores");
    if (!tbody) return;

    const q = this.getFiltroTexto();
    const data = (q)
      ? this.lista.filter(u => {
          const nombre = `${u.nombre ?? ""} ${u.primer_apellido ?? ""} ${u.segundo_apellido ?? ""}`.toLowerCase();
          const email = String(u.email ?? "").toLowerCase();
          return nombre.includes(q) || email.includes(q);
        })
      : this.lista;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">Sin usuarios</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(u => {
      const nombreCompleto = `${u.nombre ?? ""} ${u.primer_apellido ?? ""} ${u.segundo_apellido ?? ""}`.replace(/\s+/g, " ").trim();
      const rol = String(u.rol ?? "").toUpperCase();
      const unidad = (rol === "OPERADOR") ? (u.id_unidad ?? "-") : "-";

      const inactivo = (u.activo === false);
      const onDelete = inactivo
        ? ""
        : `onclick="moduloOperadores.eliminar(${u.id_usuario}, '${rol}')"`;

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="py-2 px-2 font-medium text-gray-900">${utils.escapeHtml?.(nombreCompleto) ?? nombreCompleto}</td>
          <td class="py-2 px-2">${utils.escapeHtml?.(u.email ?? "") ?? (u.email ?? "")}</td>
          <td class="py-2 px-2">${this.badgeRol(rol)}</td>
          <td class="py-2 px-2">${utils.escapeHtml?.(u.contacto ?? "") ?? (u.contacto ?? "")}</td>
          <td class="py-2 px-2">${this.badgeEstado(u)}</td>
          <td class="py-2 px-2">${utils.escapeHtml?.(String(unidad)) ?? unidad}</td>
          <td class="py-2 px-2">
            <div class="flex gap-2">
              <button class="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:opacity-90"
                onclick="moduloOperadores.editar(${u.id_usuario})">
                Editar
              </button>
              <button
                class="bg-red-600 text-white px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                ${inactivo ? "disabled" : ""}
                ${onDelete}
              >
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },

  // -----------------------------
  // Guardar / eliminar
  // -----------------------------
  isPasswordOk(pw) {
    // Mín. 8, letras y números.
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(pw ?? ""));
  },

  async guardar() {
    const id = document.getElementById("op-id").value.trim();

    const rol = document.getElementById("op-rol").value;
    const password = document.getElementById("op-password").value;
    const password2 = document.getElementById("op-password2").value;

    const payload = {
      rol,
      nombre: document.getElementById("op-nombre").value.trim(),
      primer_apellido: document.getElementById("op-primer-apellido").value.trim(),
      segundo_apellido: document.getElementById("op-segundo-apellido").value.trim() || null,
      contacto: document.getElementById("op-contacto").value.trim() || null,
      email: document.getElementById("op-email").value.trim(),
      activo: document.getElementById("op-activo").value === "true",
      password,
      confirm_password: password2
    };

    if (!payload.rol || !payload.nombre || !payload.primer_apellido || !payload.email) {
      return utils.mostrarMensaje("msg-operadores", "Rol, nombre, primer apellido y email son obligatorios", "error");
    }

    // Crear: password obligatorio
    if (!id) {
      if (!password || String(password).trim() === "") {
        return utils.mostrarMensaje("msg-operadores", "La contraseña es obligatoria al crear", "error");
      }
    }

    // Validación password (crear o restablecer)
    const wantsPwChange = Boolean(password && String(password).trim() !== "");
    if (wantsPwChange) {
      if (!this.isPasswordOk(password)) {
        return utils.mostrarMensaje(
          "msg-operadores",
          "Contraseña inválida: mínimo 8 caracteres e incluir letras y números",
          "error"
        );
      }
      if (String(password2) !== String(password)) {
        return utils.mostrarMensaje("msg-operadores", "La confirmación de contraseña no coincide", "error");
      }
    } else {
      // Si no se quiere cambiar, no mandar campos de password
      delete payload.password;
      delete payload.confirm_password;
      if (password2 && String(password2).trim() !== "") {
        return utils.mostrarMensaje("msg-operadores", "Confirma la contraseña solo si vas a restablecerla", "error");
      }
    }

    try {
      let res;

      if (!id) {
        res = await fetch(`${CONFIG.API_BASE}/supervisor/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${CONFIG.API_BASE}/supervisor/usuarios/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return utils.mostrarMensaje("msg-operadores", data.error || "Error al guardar", "error");
      }

      utils.mostrarMensaje("msg-operadores", data.message || "Guardado", "success");
      this.cancelar();
      this.cargar();

    } catch (e) {
      console.error(e);
      utils.mostrarMensaje("msg-operadores", "Error de conexión con el servidor", "error");
    }
  },

  eliminar(id, rol = "") {
    const r = String(rol ?? "").toUpperCase();
    const titulo = "¿Eliminar usuario?";
    const cuerpo = (r === "OPERADOR")
      ? "Se dará de baja al operador (no se borra físicamente). Si está OCUPADO, no se permitirá."
      : "Se dará de baja al supervisor (no se borra físicamente).";

    utils.mostrarModal(titulo, cuerpo, async () => {
      try {
        const res = await fetch(`${CONFIG.API_BASE}/supervisor/usuarios/${id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return utils.mostrarMensaje("msg-operadores", data.error || "No se pudo eliminar", "error");
        }

        utils.mostrarMensaje("msg-operadores", data.message || "Eliminado", "success");
        this.cargar();
      } catch (e) {
        console.error(e);
        utils.mostrarMensaje("msg-operadores", "Error de conexión con el servidor", "error");
      }
    });
  }
};
