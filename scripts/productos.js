/* scripts/productos.js */
/* Lógica para la página de gestión de productos */

document.addEventListener('DOMContentLoaded', () => {
    // Primero, verificar si el usuario tiene una sesión activa
    checkUserSession();

    // Referencias a elementos del DOM
    const productModal = document.getElementById('productModal');
    const abrirModalBtn = document.getElementById('abrirModalBtn');
    const closeModalBtn = document.querySelector('.close-btn');
    const productForm = document.getElementById('productForm');
    const productList = document.querySelector('.product-list');
    const modalTitulo = document.getElementById('modalTitulo');
    const productIdInput = document.getElementById('productId'); // Input oculto para el ID

    // Base de datos local (array de productos)
    let productos = JSON.parse(localStorage.getItem('productos')) || [
        // Datos de ejemplo si no hay nada en localStorage
        { id: 1, nombre: "Arroz Extra Bells 5kg", precio: "15.90", stock: 150, imagen: "../assets/Arroz_extra_bells.webp" },
        { id: 2, nombre: "Aceite Vegetal Bells 1L", precio: "12.50", stock: 40, imagen: "../assets/Aceite_Vegetal_bells.webp" }
    ];
    let nextId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;

    // --- FUNCIONES ---

    /** Renderiza la lista de productos en el DOM */
    const renderProductos = () => {
        productList.innerHTML = ''; // Limpiar la lista
        if (productos.length === 0) {
            productList.innerHTML = '<p>No hay productos para mostrar. ¡Agrega uno nuevo!</p>';
            return;
        }
        productos.forEach(producto => {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            productDiv.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='../assets/placeholder.png';">
                <h3>${producto.nombre}</h3>
                <p class="price">S/ ${parseFloat(producto.precio).toFixed(2)}</p>
                <p>Stock: ${producto.stock} unidades</p>
                <div class="product-actions">
                    <button class="edit" data-id="${producto.id}">Editar</button>
                    <button class="delete" data-id="${producto.id}">Eliminar</button>
                </div>
            `;
            productList.appendChild(productDiv);
        });
        saveToLocalStorage();
    };

    /** Guarda el array de productos en localStorage */
    const saveToLocalStorage = () => {
        localStorage.setItem('productos', JSON.stringify(productos));
    };

    /** Abre el modal, reseteando el formulario para un nuevo producto */
    const openNewModal = () => {
        modalTitulo.textContent = "Nuevo Producto";
        productForm.reset();
        productIdInput.value = ''; // Asegura que no estemos en modo edición
        productModal.style.display = "block";
    };


    /** Abre el modal para editar, poblando el formulario con datos existentes */
    const openEditModal = (id) => {
        const producto = productos.find(p => p.id === id);
        if (!producto) return;
        
        modalTitulo.textContent = "Editar Producto";
        productIdInput.value = producto.id;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('stock').value = producto.stock;
        document.getElementById('categoria').value = producto.categoria || '';
        document.getElementById('fecha').value = producto.fecha || '';
        // Aquí podrías manejar la imagen si tuvieras un input file
        
        productModal.style.display = "block";
    };

    /** Cierra el modal */
    const closeModal = () => {
        productModal.style.display = "none";
    };
    
    // --- EVENT LISTENERS ---

    // Abrir modal para nuevo producto
    abrirModalBtn.addEventListener('click', openNewModal);

    // Cerrar modal
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == productModal) {
            closeModal();
        }
    });
    document.getElementById('cancelarBtn').addEventListener('click', closeModal);

    // Manejar el envío del formulario (Crear o Actualizar)
    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const id = parseInt(productIdInput.value);
        const productoData = {
            nombre: document.getElementById('nombre').value,
            precio: document.getElementById('precio').value,
            stock: parseInt(document.getElementById('stock').value),
            fecha: document.getElementById('fecha').value,
            categoria: document.getElementById('categoria').value,
            imagen: '../assets/placeholder.png' // Imagen por defecto
        };

        if (id) { // Si hay un ID, estamos actualizando
            const index = productos.findIndex(p => p.id === id);
            productos[index] = { ...productos[index], ...productoData };
            Swal.fire('¡Actualizado!', 'El producto ha sido modificado.', 'success');
        } else { // Si no, estamos creando
            productoData.id = nextId++;
            productos.push(productoData);
            Swal.fire('¡Guardado!', 'El nuevo producto ha sido agregado.', 'success');
        }

        renderProductos();
        closeModal();
    });

    // Manejar clics en los botones de "Editar" y "Eliminar" (Event Delegation)
    productList.addEventListener('click', (event) => {
        const target = event.target;
        const id = parseInt(target.dataset.id);

        if (target.classList.contains('edit')) {
            openEditModal(id);
        }

        if (target.classList.contains('delete')) {
            Swal.fire({
                title: '¿Estás seguro?',
                text: "¡No podrás revertir esto!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, ¡eliminar!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    productos = productos.filter(p => p.id !== id);
                    renderProductos();
                    Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
                }
            });
        }
    });

    // --- INICIALIZACIÓN ---
    renderProductos(); // Cargar y mostrar productos al iniciar la página
});