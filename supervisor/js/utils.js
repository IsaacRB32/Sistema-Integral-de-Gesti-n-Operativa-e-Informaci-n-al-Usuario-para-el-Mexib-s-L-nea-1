// Funciones auxiliares reutilizables
const utils = {
    mostrarMensaje(id, mensaje, tipo) {
        const elemento = document.getElementById(id);
        if (!elemento) return;

        elemento.classList.remove('hidden', 'bg-green-100', 'bg-red-100', 'bg-yellow-100', 'text-green-800', 'text-red-800', 'text-yellow-800', 'border-green-300', 'border-red-300', 'border-yellow-300');
        
        if (tipo === 'success') {
            elemento.classList.add('bg-green-100', 'text-green-800', 'border-green-300');
        } else if (tipo === 'error') {
            elemento.classList.add('bg-red-100', 'text-red-800', 'border-red-300');
        } else {
            elemento.classList.add('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
        }
        
        elemento.textContent = mensaje;
        elemento.classList.remove('hidden');
        elemento.classList.add('border');
        
        setTimeout(() => elemento.classList.add('hidden'), 4000);
    },
    mostrarModal(titulo, mensaje, callback) {
        const modal = document.getElementById('modal-confirmacion');
        const tituloEl = document.getElementById('modal-titulo');
        const mensajeEl = document.getElementById('modal-mensaje');
        const btnConfirmar = document.getElementById('modal-btn-confirmar');

        tituloEl.textContent = titulo;
        mensajeEl.textContent = mensaje;
        
        // Remover listeners anteriores clonando el botón
        const nuevoBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
        
        nuevoBtn.onclick = () => {
            this.cerrarModal();
            callback();
        };

        modal.classList.remove('hidden');
    },

    cerrarModal() {
        const modal = document.getElementById('modal-confirmacion');
        modal.classList.add('hidden');
    }
};