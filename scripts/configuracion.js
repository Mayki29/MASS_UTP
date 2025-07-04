/* scripts/configuracion.js (versión unificada y corregida) */

document.addEventListener('DOMContentLoaded', () => {
    // Proteger la página
    checkUserSession();

    // --- REFERENCIAS AL DOM ---
    const notificacionesEmail = document.getElementById('notificacionesEmail');
    const umbralStockBajo = document.getElementById('umbralStockBajo');
    const temaVisualSelect = document.getElementById('temaVisual'); // Cambiado a 'temaVisualSelect' para claridad
    const guardarBtn = document.getElementById('guardarConfigBtn');

    // --- FUNCIONES ---

    /** 
     * ¡NUEVA FUNCIÓN! 
     * Aplica o quita la clase 'dark-theme' del body.
     */
    const aplicarTema = (tema) => {
        if (tema === 'oscuro') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    /** Carga la configuración guardada desde localStorage */
    const loadSettings = () => {
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};

        // Cargar todas las configuraciones existentes
        notificacionesEmail.checked = settings.notificacionesEmail !== undefined ? settings.notificacionesEmail : true;
        umbralStockBajo.value = settings.umbralStockBajo || 20;
        temaVisualSelect.value = settings.temaVisual || 'claro';
        
        // No es estrictamente necesario aplicar el tema aquí porque el script inline ya lo hizo,
        // pero es una buena práctica por si acaso.
        // aplicarTema(temaVisualSelect.value); 
    };

    /** Guarda la configuración actual en localStorage */
    const saveSettings = () => {
        // Obtenemos los valores de TODOS los campos
        const settings = {
            notificacionesEmail: notificacionesEmail.checked,
            umbralStockBajo: parseInt(umbralStockBajo.value),
            temaVisual: temaVisualSelect.value // Usamos el valor del select
        };

        // Guardamos el objeto completo
        localStorage.setItem('appSettings', JSON.stringify(settings));

        // ¡AÑADIDO! Aplicamos el tema visual inmediatamente después de guardar
        aplicarTema(settings.temaVisual);

        // Mostramos la alerta de éxito
        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: 'La configuración ha sido actualizada.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // --- EVENT LISTENERS ---

    // Event listener para el botón de guardar (sin cambios)
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveSettings);
    }

    /**
     * ¡NUEVO EVENT LISTENER!
     * Para que el cambio de tema se vea en tiempo real sin necesidad de guardar.
     */
    temaVisualSelect.addEventListener('change', () => {
        aplicarTema(temaVisualSelect.value);
    });

    // --- INICIALIZACIÓN ---
    loadSettings();
});