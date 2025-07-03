/* scripts/login.js */
const supabaseUrl = 'https://wgivejkvpksrcwmgclrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaXZlamt2cGtzcmN3bWdjbHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjEyMjcsImV4cCI6MjA2Njk5NzIyN30.mzyEwKXTbFpwyQdrR8w-Wdwx8A4-hnmxUUeNjCCOUtk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('contraseña');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"/></svg>`;
    } else {
        passwordInput.type = 'password';
        toggleIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    }
}
// ... (el resto del código JS es exactamente el mismo que antes) ... */
document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const usuario = document.getElementById('usuario').value;
            const contrasena = document.getElementById('contraseña').value;
            const tienda = document.getElementById('tienda').value;

              const { data, error } = await supabase.auth.signInWithPassword({
                email: usuario,
                password: contrasena,
            });

            console.log("La data es: ", data)
            console.log("El error es: ", error)

            

            if (data.user != null && tienda !== '') {
                localStorage.setItem('usuario', usuario);
                localStorage.setItem('data', data);
                localStorage.setItem('tienda', tienda);
                Swal.fire({
                    icon: 'success',
                    title: '¡Inicio de Sesión Exitoso!',
                    text: 'Redirigiendo...',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'main.html';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de inicio de sesión',
                    text: 'Credenciales incorrectas o tienda no seleccionada.',
                });
            }
        });
    }
    const togglePasswordSpan = document.querySelector('.toggle-password');
    if (togglePasswordSpan) {
        togglePasswordSpan.addEventListener('click', togglePasswordVisibility);
    }
});