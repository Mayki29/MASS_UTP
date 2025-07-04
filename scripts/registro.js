/* scripts/registro.js (con validación en tiempo real) */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del formulario
    const form = document.getElementById('registroForm');
    const nombresInput = document.getElementById('nombres');
    const apellidosInput = document.getElementById('apellidos');
    const dniInput = document.getElementById('dni');
    const emailInput = document.getElementById('email');
    const clientes = JSON.parse(localStorage.getItem('clientesRegistrados')) || [];

    // --- FUNCIONES DE VALIDACIÓN ---

    const mostrarError = (input, mensaje) => {
        const formGroup = input.parentElement;
        const errorSpan = formGroup.querySelector('.error-message');
        errorSpan.textContent = mensaje;
        input.classList.remove('valid');
        input.classList.add('invalid');
    };

    const mostrarExito = (input) => {
        const formGroup = input.parentElement;
        const errorSpan = formGroup.querySelector('.error-message');
        errorSpan.textContent = '';
        input.classList.remove('invalid');
        input.classList.add('valid');
    };

    const validarNombresApellidos = (input) => {
        const valor = input.value.trim();
        // Permite letras, espacios, tildes y la ñ. No permite números.
        const regex = /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]+$/;
        
        // Reemplaza cualquier número que se intente escribir
        input.value = valor.replace(/[0-9]/g, '');

        if (input.value.trim().length < 3) {
            mostrarError(input, 'Debe tener al menos 3 caracteres.');
            return false;
        } else if (!regex.test(input.value.trim())) {
            mostrarError(input, 'Solo se permiten letras y espacios.');
            return false;
        } else {
            mostrarExito(input);
            return true;
        }
    };

    const validarDNI = () => {
        let valor = dniInput.value;
        // Reemplaza cualquier caracter que no sea un número
        dniInput.value = valor.replace(/[^0-9]/g, '');
        
        valor = dniInput.value; // Re-evaluar después de la limpieza
        
        if (valor.length !== 8) {
            mostrarError(dniInput, 'El DNI debe tener 8 dígitos.');
            return false;
        } else if (clientes.some(cliente => cliente.dni === valor)) {
            mostrarError(dniInput, 'Este DNI ya está registrado.');
            return false;
        } else {
            mostrarExito(dniInput);
            return true;
        }
    };

    const validarEmail = () => {
        const valor = emailInput.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(valor)) {
            mostrarError(emailInput, 'Formato de correo inválido.');
            return false;
        } else if (clientes.some(cliente => cliente.email === valor)) {
            mostrarError(emailInput, 'Este correo ya está registrado.');
            return false;
        } else {
            mostrarExito(emailInput);
            return true;
        }
    };

    // --- EVENT LISTENERS EN TIEMPO REAL ---

    nombresInput.addEventListener('input', () => validarNombresApellidos(nombresInput));
    apellidosInput.addEventListener('input', () => validarNombresApellidos(apellidosInput));
    dniInput.addEventListener('input', validarDNI);
    emailInput.addEventListener('input', validarEmail);

    // --- EVENT LISTENER PARA EL ENVÍO DEL FORMULARIO ---

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Ejecutar todas las validaciones una última vez antes de enviar
        const esNombreValido = validarNombresApellidos(nombresInput);
        const esApellidoValido = validarNombresApellidos(apellidosInput);
        const esDNIValido = validarDNI();
        const esEmailValido = validarEmail();
        
        // Si todas las validaciones son correctas, se procede a registrar
        if (esNombreValido && esApellidoValido && esDNIValido && esEmailValido) {
            const nuevoCliente = {
                nombres: nombresInput.value.trim(),
                apellidos: apellidosInput.value.trim(),
                dni: dniInput.value.trim(),
                email: emailInput.value.trim(),
                celular: document.getElementById('celular').value.trim(),
                genero: document.getElementById('genero').value
            };

            clientes.push(nuevoCliente);
            localStorage.setItem('clientesRegistrados', JSON.stringify(clientes));

            Swal.fire({
                title: '¡Registro Exitoso!',
                text: `Bienvenido, ${nuevoCliente.nombres}. Ahora eres un cliente exclusivo.`,
                icon: 'success',
                confirmButtonText: 'Genial'
            }).then(() => {
                window.location.href = '../index.html';
            });
        } else {
            Swal.fire('Formulario Incompleto', 'Por favor, corrige los errores antes de continuar.', 'error');
        }
    });
});