// Script para gestionar la autenticación en KanbanPro
// Firma humana: Mejorado para depuración en el Sprint 3

document.addEventListener('DOMContentLoaded', () => {
    console.log('KanbanPro Auth Script Cargado');
    const form = document.querySelector('form');
    
    // --- Lógica del botón de Mostrar/Ocultar Contraseña ---
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // El input asume estar como hermano anterior al botón, o podemos buscarlo en el mismo contenedor
            const input = btn.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                // Cambiar ícono/estado visual
                btn.textContent = type === 'password' ? '👁️' : '🙈';
                btn.setAttribute('aria-label', type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
            }
        });
    });
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Intentando enviar formulario...');

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.add('btn-loading');
                submitBtn.disabled = true;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log('Payload:', { ...data, contrasena: '********' });
            
            // Determinar si es login o register basado en el atributo action del form
            const actionPath = form.getAttribute('action') || '';
            const isLogin = actionPath.includes('login');
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const result = await response.json();
                    
                    if (response.ok) {
                        if (isLogin) {
                            localStorage.setItem('token', result.token);
                            console.log('✅ Login exitoso');
                            if (window.showToast) window.showToast('¡Bienvenido! Redirigiendo al Dashboard...', 'success');
                            setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
                        } else {
                            console.log('✅ Registro exitoso');
                            if (window.showToast) window.showToast('¡Registro completado! Ahora puedes iniciar sesión.', 'success');
                            setTimeout(() => { window.location.href = '/login'; }, 1000);
                        }
                    } else {
                        console.warn('⚠️ Error del servidor:', result.error);
                        if (window.showToast) window.showToast(result.error || 'Ocurrió un problema inesperado.', 'error');
                    }
                } else {
                    const text = await response.text();
                    console.error('❌ El servidor no devolvió JSON:', text);
                    if (window.showToast) window.showToast('Error en el servidor. Por favor revisa la consola.', 'error');
                }

            } catch (error) {
                console.error('🚨 Falla crítica:', error);
                if (window.showToast) window.showToast('No se pudo establecer conexión con el servidor.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.classList.remove('btn-loading');
                    submitBtn.disabled = false;
                }
            }
        });
    } else {
        console.error('❌❌ No se encontró ningún formulario en esta página.');
    }
});
