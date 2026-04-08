/**
 * Utilidades UI para Notificaciones (Toast) y Confirmaciones
 */
window.showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger relayout
  toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

window.customConfirm = (message, title = 'Confirmar Acción') => {
  return new Promise((resolve) => {
    const overlay = document.getElementById('custom-confirm');
    const titleEl = document.getElementById('confirm-header');
    const bodyEl = document.getElementById('confirm-body');
    const btnCancel = document.getElementById('confirm-cancel');
    const btnOk = document.getElementById('confirm-ok');

    if (!overlay) {
      // Fallback a nativo si no existe en HTML
      resolve(confirm(message));
      return;
    }

    titleEl.textContent = title;
    bodyEl.textContent = message;
    
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    const cleanup = () => {
      overlay.classList.remove('show');
      document.body.style.overflow = 'auto';
      btnCancel.removeEventListener('click', onCancel);
      btnOk.removeEventListener('click', onOk);
    };

    const onCancel = () => { cleanup(); resolve(false); };
    const onOk = () => { cleanup(); resolve(true); };

    btnCancel.addEventListener('click', onCancel);
    btnOk.addEventListener('click', onOk);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  // --- Lógica del Tema Oscuro ---
  const themeToggleLabel = document.getElementById('theme-toggle');
  const body = document.body;
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    if (themeToggleLabel) themeToggleLabel.textContent = '☀️';
  } else if (savedTheme === 'light') {
    body.classList.remove('dark-theme');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Si no hay preferencia, usar el del sistema
    body.classList.add('dark-theme');
    if (themeToggleLabel) themeToggleLabel.textContent = '☀️';
  }

  if (themeToggleLabel) {
    themeToggleLabel.addEventListener('click', () => {
      body.classList.toggle('dark-theme');
      const isDark = body.classList.contains('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggleLabel.textContent = isDark ? '☀️' : '🌙';
    });
  }

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
          // window.showToast(data.mensaje || 'Posición actualizada', 'success'); // Opcional, podría ser ruidoso
        } catch (error) {
          console.error('Error:', error);
          window.showToast('No se pudo guardar el cambio de posición. La página se recargará.', 'error');
          // Revertir el cambio en el DOM si es crítico
          setTimeout(() => window.location.reload(), 2000); 
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
      
      const submitBtn = formEditar.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.classList.add('btn-loading');

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
          const p = tarjeta.querySelector('p, .tarjeta-desc');
          if (p) p.textContent = payload.descripcion;
          else if (payload.descripcion) {
            const newP = document.createElement('p');
            newP.className = "tarjeta-desc";
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
          console.log('Botón Editar encontrado:', btnEditar);
          if (btnEditar) {
            btnEditar.setAttribute('onclick', `abrirModalEditar('${id}', '${payload.titulo.replace(/'/g, "\\'")}', '${payload.descripcion.replace(/'/g, "\\'")}', '${payload.prioridad}')`);
          }
        }

        cerrarModal();
        window.showToast('Tarea editada existosamente', 'success');
      } catch (error) {
        console.error(error);
        window.showToast('No se pudo actualizar la tarea', 'error');
      } finally {
        if (submitBtn) submitBtn.classList.remove('btn-loading');
      }
    });
  }

  // --- Manejo de nueva tarjeta vía AJAX ---
  const nuevoForm = document.querySelector('#modalTarea form');
  if (nuevoForm) {
    nuevoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = nuevoForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.classList.add('btn-loading');
      
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
              class="tarjeta tarjeta-anim-enter"
              data-id="${tarjeta.id}"
              tabindex="0"
              role="article"
              aria-label="Tarea: ${tarjeta.titulo}"
            >
              <div class="tarjeta-header">
                <h4>${tarjeta.titulo}</h4>
                <div class="tarjeta-actions">
                  <button 
                  onclick="abrirModalEditar('${tarjeta.id}', '${tarjeta.titulo.replace(/'/g, "\\'")}', '${tarjeta.descripcion ? tarjeta.descripcion.replace(/'/g, "\\'") : ''}', '${tarjeta.prioridad}')"
                  class="btn-edit"
                  title="Editar tarea">✏️</button>
                  <button 
                    onclick="eliminarTarjeta('${tarjeta.id}')"
                    class="btn-delete"
                    title="Eliminar tarea"
                  >🗑️</button>
                </div>
              </div>
              <div class="prioridad-wrapper">
                <span class="prioridad-tag prioridad-${tarjeta.prioridad}">
                  ${tarjeta.prioridad}
                </span>
              </div>
              ${tarjeta.descripcion ? `<p class="tarjeta-desc">${tarjeta.descripcion}</p>` : ''}
            </div>
          `;
          
          container.insertAdjacentHTML('beforeend', tarjetaHtml);
          
          // Limpiar formulario y cerrar modal
          nuevoForm.reset();
          cerrarModal();
          window.showToast('Tarea creada con éxito', 'success');
        } else {
          window.location.reload();
        }

      } catch (error) {
        console.error('Error:', error);
        window.showToast('Ocurrió un error al crear la tarea. Revisa tu conexión.', 'error');
      } finally {
        if (submitBtn) submitBtn.classList.remove('btn-loading');
      }
    });
  }
});

/**
 * Elimina una tarjeta tras confirmación del usuario
 * @param {string} taskId 
 */
window.eliminarTarjeta = async (taskId) => {
  const isConfirmed = await window.customConfirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.', 'Eliminar Tarea');
  
  if (!isConfirmed) {
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
        tarjetaElement.style.transform = 'scale(0.9)';
        tarjetaElement.style.opacity = '0';
        setTimeout(() => tarjetaElement.remove(), 300);
      }
      window.showToast('Tarea eliminada correctamente', 'success');
    } else {
      const error = await response.json();
      window.showToast(error.error || 'No se pudo eliminar la tarea.', 'error');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
    window.showToast('Ocurrió un error al intentar eliminar la tarea.', 'error');
  }
};
