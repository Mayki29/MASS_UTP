/* scripts/perfil.js */

document.addEventListener('DOMContentLoaded', () => {
    // Proteger la página
    checkUserSession();

    // --- REFERENCIAS AL DOM ---
    const userNameH2 = document.getElementById('userName');
    const userStoreP = document.getElementById('userStore');
    const profilePictureImg = document.getElementById('profilePicture');
    
    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const telefonoInput = document.getElementById('telefono');
    const direccionInput = document.getElementById('direccion');
    const guardarBtn = document.getElementById('guardarCambiosBtn');

    /** Carga los datos del perfil desde localStorage */
    const loadUserProfile = () => {
        const usuario = localStorage.getItem('usuario');
        const tienda = localStorage.getItem('tienda');
        
        // Cargar datos de la sesión
        if (userNameH2) userNameH2.textContent = usuario || 'Usuario';
        if (userStoreP) userStoreP.textContent = `Tienda: ${tienda || 'No asignada'}`;

        // Cargar datos guardados del perfil (si existen)
        const perfilGuardado = JSON.parse(localStorage.getItem('userProfile')) || {};
        nombreInput.value = perfilGuardado.nombre || usuario || '';
        emailInput.value = perfilGuardado.email || '';
        telefonoInput.value = perfilGuardado.telefono || '';
        direccionInput.value = perfilGuardado.direccion || '';
        // Aquí podrías cargar la foto de perfil también
        profilePictureImg.src = perfilGuardado.picture || '../assets/Foto_Perfil.avif';
    };

    /** Valida el formato de un email */
    const validarEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    /** Guarda los cambios del perfil */
    const saveProfileChanges = (event) => {
        event.preventDefault(); // Evitar envío de formulario si lo hubiera

        const perfil = {
            nombre: nombreInput.value.trim(),
            email: emailInput.value.trim(),
            telefono: telefonoInput.value.trim(),
            direccion: direccionInput.value.trim(),
            picture: profilePictureImg.src // Guardar la ruta de la imagen
        };

        // --- VALIDACIONES ---
        if (!perfil.nombre) {
            Swal.fire('Campo Requerido', 'El nombre es obligatorio.', 'error');
            return;
        }
        if (!validarEmail(perfil.email)) {
            Swal.fire('Email Inválido', 'Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }

        // --- GUARDAR DATOS ---
        // En una app real, aquí se haría un fetch a la API.
        // Por ahora, guardamos en localStorage.
        localStorage.setItem('userProfile', JSON.stringify(perfil));

        // Actualizar el nombre en el header si cambió
        if (localStorage.getItem('usuario') !== perfil.nombre) {
            localStorage.setItem('usuario', perfil.nombre);
            document.getElementById('userInfo').textContent = perfil.nombre; // Actualiza el header
        }
        
        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: 'Tu perfil ha sido actualizado correctamente.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // --- EVENT LISTENERS ---
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveProfileChanges);
    }

    // --- INICIALIZACIÓN ---
    loadUserProfile();
});