/* scripts/configuracion.js */

document.addEventListener('DOMContentLoaded', () => {
    // Proteger la página
    checkUserSession();

    // Referencias a los elementos de configuración
    const notificacionesEmail = document.getElementById('notificacionesEmail');
    const umbralStockBajo = document.getElementById('umbralStockBajo');
    const temaVisual = document.getElementById('temaVisual');
    const guardarBtn = document.getElementById('guardarConfigBtn');

    /** Carga la configuración guardada desde localStorage */
    const loadSettings = () => {
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};

        notificacionesEmail.checked = settings.notificacionesEmail !== undefined ? settings.notificacionesEmail : true;
        umbralStockBajo.value = settings.umbralStockBajo || 20;
        temaVisual.value = settings.temaVisual || 'claro';
    };

    /** Guarda la configuración actual en localStorage */
    const saveSettings = () => {
        const settings = {
            notificacionesEmail: notificacionesEmail.checked,
            umbralStockBajo: parseInt(umbralStockBajo.value),
            temaVisual: temaVisual.value
        };

        localStorage.setItem('appSettings', JSON.stringify(settings));

        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: 'La configuración ha sido actualizada.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // Event listener para el botón de guardar
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveSettings);
    }

    // Inicialización
    loadSettings();
});