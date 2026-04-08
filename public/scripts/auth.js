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

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log('Payload:', { ...data, contrasena: '********' });
            
            // Determinar si es login o register (basado en el h1 o en el texto del botón)
            const h1Text = document.querySelector('h1')?.innerText || "";
            const isLogin = h1Text.includes('Sesión') || h1Text.includes('Login');
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
                            alert('¡Bienvenido! Redirigiendo al Dashboard...');
                            window.location.href = '/dashboard';
                        } else {
                            console.log('✅ Registro exitoso');
                            alert('¡Registro completado! Ahora puedes iniciar sesión.');
                            window.location.href = '/login';
                        }
                    } else {
                        console.warn('⚠️ Error del servidor:', result.error);
                        alert('Error: ' + (result.error || 'Ocurrió un problema inesperado.'));
                    }
                } else {
                    const text = await response.text();
                    console.error('❌ El servidor no devolvió JSON:', text);
                    alert('Error en el servidor. Por favor revisa la consola.');
                }

            } catch (error) {
                console.error('🚨 Falla crítica:', error);
                alert('No se pudo establecer conexión con el servidor.');
            }
        });
    } else {
        console.error('❌❌ No se encontró ningún formulario en esta página.');
    }
});
