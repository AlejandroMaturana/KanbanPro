document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('.tarjetas');

  containers.forEach(container => {
    new Sortable(container, {
      group: 'kanban', // Permite mover entre listas
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: async (evt) => {
        const taskId = evt.item.getAttribute('data-id');
        const newListId = evt.to.closest('.lista').getAttribute('data-id');
        
        console.log(`Moviendo tarea ${taskId} a lista ${newListId}`);

        try {
          const response = await fetch(`/api/tarjetas/${taskId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ listaId: newListId })
          });

          if (!response.ok) {
            throw new Error('Error al actualizar el estado en el servidor');
          }

          const data = await response.json();
          console.log('Actualizado:', data.mensaje);
        } catch (error) {
          console.error('Error:', error);
          alert('No se pudo guardar el cambio de posición. Por favor, intenta de nuevo.');
          // Opcional: Revertir el cambio en el DOM si es crítico
          window.location.reload(); 
        }
      }
    });
  });

  // --- Lógica del Modal ---
  const modal = document.getElementById('modalTarea');
  const btnAbrir = document.getElementById('btnAbrirModal');
  const btnCerrar = document.getElementById('btnCerrarModal');
  const btnCancelar = document.getElementById('btnCancelar');

  const abrirModal = () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const cerrarModal = () => {
    modal.style.display = 'none';
    const modalEdit = document.getElementById('modalEditarTarea');
    if (modalEdit) modalEdit.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  if (btnAbrir) btnAbrir.onclick = abrirModal;
  if (btnCerrar) btnCerrar.onclick = cerrarModal;

  // Botones genéricos de cancelar
  document.querySelectorAll('.btn-cancelar-modal, .btn-cerrar-editar').forEach(btn => {
    btn.onclick = cerrarModal;
  });

  // Cerrar al hacer clic fuera del contenido
  window.onclick = (e) => {
    if (e.target.classList.contains('modal-overlay')) cerrarModal();
  };

  // --- Lógica de Edición ---
  window.abrirModalEditar = (id, titulo, descripcion, prioridad) => {
    const modalEdit = document.getElementById('modalEditarTarea');
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTitulo').value = titulo;
    document.getElementById('editDescripcion').value = descripcion;
    document.getElementById('editPrioridad').value = prioridad;
    
    modalEdit.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const formEditar = document.getElementById('formEditarTarea');
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editTaskId').value;
      const payload = {
        titulo: document.getElementById('editTitulo').value,
        descripcion: document.getElementById('editDescripcion').value,
        prioridad: document.getElementById('editPrioridad').value
      };

      try {
        const response = await fetch(`/api/tarjetas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error al actualizar');

        // Actualizar el DOM
        const tarjeta = document.querySelector(`.tarjeta[data-id="${id}"]`);
        if (tarjeta) {
          tarjeta.querySelector('h4').textContent = payload.titulo;
          const p = tarjeta.querySelector('p');
          if (p) p.textContent = payload.descripcion;
          else if (payload.descripcion) {
            const newP = document.createElement('p');
            newP.style = "color: #666; font-size: 13px; margin: 0; line-height: 1.4;";
            newP.textContent = payload.descripcion;
            tarjeta.appendChild(newP);
          }
          
          const badge = tarjeta.querySelector('.prioridad-tag');
          if (badge) {
            badge.className = `prioridad-tag prioridad-${payload.prioridad}`;
            badge.textContent = payload.prioridad;
          }

          // Actualizar el botón de editar con los nuevos valores para la siguiente edición
          const btnEditar = tarjeta.querySelector('button[title="Editar tarea"]');
          if (btnEditar) {
            btnEditar.setAttribute('onclick', `abrirModalEditar('${id}', '${payload.titulo.replace(/'/g, "\\'")}', '${payload.descripcion.replace(/'/g, "\\'")}', '${payload.prioridad}')`);
          }
        }

        cerrarModal();
      } catch (error) {
        console.error(error);
        alert('No se pudo actualizar la tarea');
      }
    });
  }

  // --- Manejo de nueva tarjeta vía AJAX ---
  const nuevoForm = document.querySelector('#modalTarea form');
  if (nuevoForm) {
    nuevoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(nuevoForm);
      const payload = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/nueva-tarjeta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('No se pudo crear la tarea');

        const { tarjeta } = await response.json();
        
        // Determinar en qué lista añadirla
        const container = document.getElementById(`lista-${tarjeta.listaId}`);
        if (container) {
          const tarjetaHtml = `
            <div
              class="tarjeta"
              data-id="${tarjeta.id}"
              style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; opacity: 0; transform: translateY(10px); transition: all 0.3s ease;"
            >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h4 style="color: #333; margin: 0; flex: 1;">${tarjeta.titulo}</h4>
                <button 
                  onclick="eliminarTarjeta('${tarjeta.id}')"
                  style="background: none; border: none; cursor: pointer; color: #ff4d4d; font-size: 16px; padding: 0 0 0 10px;"
                  title="Eliminar tarea"
                >🗑️</button>
              </div>
              <div style="margin-bottom: 10px;">
                <span class="prioridad-tag prioridad-${tarjeta.prioridad}">
                  ${tarjeta.prioridad}
                </span>
              </div>
              ${tarjeta.descripcion ? `<p style="color: #666; font-size: 13px; margin: 0; line-height: 1.4;">${tarjeta.descripcion}</p>` : ''}
            </div>
          `;
          
          container.insertAdjacentHTML('beforeend', tarjetaHtml);
          
          // Animación de entrada
          const nuevaTarjeta = container.lastElementChild;
          setTimeout(() => {
            nuevaTarjeta.style.opacity = '1';
            nuevaTarjeta.style.transform = 'translateY(0)';
          }, 10);

          // Limpiar formulario y cerrar modal
          nuevoForm.reset();
          cerrarModal();
        } else {
          window.location.reload();
        }

      } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al crear la tarea. Revisa tu conexión.');
      }
    });
  }
});

/**
 * Elimina una tarjeta tras confirmación del usuario
 * @param {string} taskId 
 */
async function eliminarTarjeta(taskId) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    const response = await fetch(`/api/tarjetas/${taskId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      // Eliminar el elemento del DOM directamente para una respuesta rápida
      const tarjetaElement = document.querySelector(`.tarjeta[data-id="${taskId}"]`);
      if (tarjetaElement) {
        tarjetaElement.style.opacity = '0';
        setTimeout(() => tarjetaElement.remove(), 300);
      }
    } else {
      const error = await response.json();
      alert(error.error || 'No se pudo eliminar la tarea.');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
    alert('Ocurrió un error al intentar eliminar la tarea.');
  }
}
