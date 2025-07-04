/* scripts/shared.js */
/* Funcionalidad compartida: autenticación y sesión */

/**
 * Comprueba si existe una sesión de usuario activa en localStorage.
 * Si no existe, redirige a la página de login.
 * También actualiza el nombre de usuario en el header.
 */
function checkUserSession() {
    const usuario = localStorage.getItem('usuario');
    const tienda = localStorage.getItem('tienda');

    // Si no hay datos de sesión, proteger la página
    if (!usuario || !tienda) {
        console.warn('Acceso no autorizado. Redirigiendo a login...');
        // La ruta es relativa a la carpeta 'pages'
        window.location.href = 'login.html'; 
        return;
    }

    // Actualizar el nombre de usuario en el header si el elemento existe
    const userInfoSpan = document.getElementById('userInfo');
    if (userInfoSpan) {
        userInfoSpan.textContent = usuario;
    }
}

/**
 * Cierra la sesión del usuario, limpia localStorage y redirige al login.
 */
function cerrarSesion() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Tu sesión actual se cerrará.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#004AAD',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('usuario');
            localStorage.removeItem('tienda');
            window.location.href = 'login.html';
        }
    });
}

function setActiveNavLink() {
    // 1. Obtener el nombre del archivo de la URL actual.
    // window.location.pathname devuelve algo como "/src/pages/main.html"
    const currentPage = window.location.pathname.split('/').pop(); // Esto extrae "main.html"

    // 2. Obtener todos los enlaces de la barra de navegación.
    const navLinks = document.querySelectorAll('header nav a');

    // 3. Recorrer cada enlace.
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');

        // 4. Comprobar si el href del enlace coincide con la página actual.
        if (linkPage === currentPage) {
            // 5. Si coincide, añadir la clase 'active'.
            link.classList.add('active');
        }
    });
}

// Asociar la función de cerrar sesión al botón correspondiente
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            cerrarSesion();
        });
    }
    setActiveNavLink();
});