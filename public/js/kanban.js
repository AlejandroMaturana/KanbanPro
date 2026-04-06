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
