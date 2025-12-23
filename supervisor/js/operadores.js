// operadores.js - CRUD de operadores

const moduloOperadores = {
  lista: [],

  init() {
    this.cancelar();
    this.cargar();
  },

  mostrarFormularioNuevo() {
    document.getElementById("form-operador-titulo").textContent = "Nuevo Operador";
    document.getElementById("op-id").value = "";
    document.getElementById("op-nombre").value = "";
    document.getElementById("op-primer-apellido").value = "";
    document.getElementById("op-segundo-apellido").value = "";
    document.getElementById("op-contacto").value = "";
    document.getElementById("op-email").value = "";
    document.getElementById("op-password").value = "";
    document.getElementById("form-operador").classList.remove("hidden");
  },

  cancelar() {
    const form = document.getElementById("form-operador");
    if (form) form.classList.add("hidden");
  },

  async cargar() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/supervisor/operadores`);
      if (!res.ok) {
        utils.mostrarMensaje("msg-operadores", "Error al cargar operadores", "error");
        return;
      }
      this.lista = await res.json();
      this.render();
    } catch (e) {
      console.error(e);
      utils.mostrarMensaje("msg-operadores", "Error de conexión con el servidor", "error");
    }
  },

  render() {
    const tbody = document.getElementById("tabla-operadores");
    if (!tbody) return;

    if (!this.lista.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-400">Sin operadores</td></tr>`;
      return;
    }

    tbody.innerHTML = this.lista.map(op => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="py-2 px-2">${op.nombre_completo ?? `${op.nombre} ${op.primer_apellido} ${op.segundo_apellido ?? ""}`}</td>
        <td class="py-2 px-2">${op.email ?? ""}</td>
        <td class="py-2 px-2">${op.contacto ?? ""}</td>
        <td class="py-2 px-2">${op.estado ?? ""}</td>
        <td class="py-2 px-2">${op.unidad_asignada ?? "-"}</td>
        <td class="py-2 px-2 flex gap-2">
          <button class="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:opacity-90"
            onclick="moduloOperadores.editar(${op.id_usuario})">
            Editar
          </button>
          <button class="bg-red-600 text-white px-3 py-1 rounded-lg hover:opacity-90"
            onclick="moduloOperadores.eliminar(${op.id_usuario})">
            Eliminar
          </button>
        </td>
      </tr>
    `).join("");
  },

  editar(id) {
    const op = this.lista.find(x => x.id_usuario === id);
    if (!op) return;

    document.getElementById("form-operador-titulo").textContent = "Editar Operador";
    document.getElementById("op-id").value = op.id_usuario;
    document.getElementById("op-nombre").value = op.nombre ?? "";
    document.getElementById("op-primer-apellido").value = op.primer_apellido ?? "";
    document.getElementById("op-segundo-apellido").value = op.segundo_apellido ?? "";
    document.getElementById("op-contacto").value = op.contacto ?? "";
    document.getElementById("op-email").value = op.email ?? "";
    document.getElementById("op-password").value = ""; // vacío: no cambia si no se llena

    document.getElementById("form-operador").classList.remove("hidden");
  },

  async guardar() {
    const id = document.getElementById("op-id").value.trim();

    const payload = {
      nombre: document.getElementById("op-nombre").value.trim(),
      primer_apellido: document.getElementById("op-primer-apellido").value.trim(),
      segundo_apellido: document.getElementById("op-segundo-apellido").value.trim() || null,
      contacto: document.getElementById("op-contacto").value.trim() || null,
      email: document.getElementById("op-email").value.trim(),
      password: document.getElementById("op-password").value
    };

    if (!payload.nombre || !payload.primer_apellido || !payload.email) {
      return utils.mostrarMensaje("msg-operadores", "Nombre, primer apellido y email son obligatorios", "error");
    }

    try {
      let res;

      if (!id) {
        // Crear: password obligatorio
        if (!payload.password || payload.password.trim() === "") {
          return utils.mostrarMensaje("msg-operadores", "Password es obligatorio al crear", "error");
        }

        res = await fetch(`${CONFIG.API_BASE}/supervisor/operadores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Editar: si password vacío, no lo mandamos
        if (!payload.password || payload.password.trim() === "") {
          delete payload.password;
        }

        res = await fetch(`${CONFIG.API_BASE}/supervisor/operadores/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();

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

  eliminar(id) {
    utils.mostrarModal(
      "¿Eliminar operador?",
      "Se dará de baja al operador (no se borra físicamente para evitar romper historiales).",
      async () => {
        try {
          const res = await fetch(`${CONFIG.API_BASE}/supervisor/operadores/${id}`, {
            method: "DELETE"
          });
          const data = await res.json();

          if (!res.ok) {
            return utils.mostrarMensaje("msg-operadores", data.error || "No se pudo eliminar", "error");
          }

          utils.mostrarMensaje("msg-operadores", data.message || "Eliminado", "success");
          this.cargar();
        } catch (e) {
          console.error(e);
          utils.mostrarMensaje("msg-operadores", "Error de conexión con el servidor", "error");
        }
      }
    );
  }
};
