/* scripts/main.js */

/**
 * Función para cerrar la sesión del usuario.
 * Limpia los datos guardados en localStorage y redirige a la página de login.
 */
// function cerrarSesion() {
//     // Muestra una confirmación antes de cerrar sesión
//     Swal.fire({
//         title: '¿Estás seguro?',
//         text: "Tu sesión actual se cerrará.",
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#004AAD',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Sí, cerrar sesión',
//         cancelButtonText: 'Cancelar'
//     }).then((result) => {
//         if (result.isConfirmed) {
//             // Limpiar datos de sesión
//             localStorage.removeItem('usuario');
//             localStorage.removeItem('tienda');
//             // Podrías limpiar también un token si lo usas
//             // localStorage.removeItem('token'); 

//             // Redirigir a login
//             window.location.href = 'login.html';
//         }
//     });
// }

// Se ejecuta cuando todo el contenido de la página ha sido cargado
document.addEventListener('DOMContentLoaded', () => {
    
    // Obtener datos del usuario desde localStorage
    const usuario = localStorage.getItem('usuario');
    const tienda = localStorage.getItem('tienda');

    // 1. Actualizar el nombre de usuario en el header
    const userInfoSpan = document.getElementById('userInfo');
    if (usuario) {
        userInfoSpan.textContent = usuario; // Cambia "Admin" por el nombre real del usuario
    }

    // 2. Si no hay datos de sesión, redirigir al login para proteger la página
    if (!usuario || !tienda) {
        console.warn('No se encontraron datos de sesión. Redirigiendo a login...');
        window.location.href = 'login.html'; 
        return; // Detiene la ejecución del script
    }

    // 3. Asignar evento de clic al botón de cerrar sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        // Prevenimos el comportamiento por defecto del link para usar nuestra función con confirmación
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            cerrarSesion();
        });
    }

    // 4. Mostrar mensaje de bienvenida (solo si viene de la página de login)
    // Para evitar que salga cada vez que recarga, podemos usar un truco.
    // Esto es opcional, pero mejora la experiencia de usuario.
    if (document.referrer.includes('login.html')) {
        const mensajeBienvenida = `¡Bienvenido, ${usuario}!`;
        const tiendaInfo = `Estás gestionando la ${tienda}.`
        Swal.fire({
            icon: 'success',
            title: mensajeBienvenida,
            text: tiendaInfo,
            timer: 2500, // Duración del mensaje
            showConfirmButton: false,
        });
    }
});
