/* scripts/ventas.js */

document.addEventListener('DOMContentLoaded', () => {
    // Proteger la página
    checkUserSession();

    // --- ESTADO DE LA APLICACIÓN ---
    const productosDisponibles = JSON.parse(localStorage.getItem('productos')) || [];
    // ¡MEJORA! Cargamos el carrito desde sessionStorage para que no se pierda al recargar.
    let carrito = JSON.parse(sessionStorage.getItem('carritoVentas')) || [];

    // --- REFERENCIAS AL DOM ---
    const productGrid = document.querySelector('.product-grid');
    const productSearchInput = document.getElementById('product-search');
    const categoryButtonsContainer = document.querySelector('.product-filters');
    const cartSection = document.querySelector('.cart-section');
    const cartTableBody = document.querySelector('#cart-table-body');
    const subtotalElem = document.getElementById('subtotal-value');
    const igvElem = document.getElementById('igv-value');
    const totalElem = document.getElementById('total-value');
    const limpiarBtn = document.getElementById('limpiarBtn');
    const procesarVentaBtn = document.getElementById('procesarVentaBtn');

    // --- FUNCIONES DE RENDERIZADO ---

    /**
     * Dibuja los productos en la cuadrícula, aplicando los filtros actuales.
     */
    const renderProductos = () => {
        const searchTerm = productSearchInput.value.toLowerCase().trim();
        const activeCategory = document.querySelector('.category-btn.active').textContent;

        const productosFiltrados = productosDisponibles.filter(prod => {
            const matchesCategory = activeCategory === 'Todos' || prod.categoria === activeCategory.toLowerCase();
            const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        
        productGrid.innerHTML = ''; // Limpiar la vista
        if (productosFiltrados.length === 0) {
            productGrid.innerHTML = `<p class="empty-state-message">No se encontraron productos.</p>`;
            return;
        }

        productosFiltrados.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = prod.id;
            card.innerHTML = `
                <img src="${prod.imagen}" alt="${prod.nombre}" onerror="this.src='../assets/placeholder.png';">
                <h3>${prod.nombre}</h3>
                <div class="price">S/ ${parseFloat(prod.precio).toFixed(2)}</div>
            `;
            productGrid.appendChild(card);
        });
    };

    /** Dibuja los items del carrito en la tabla */
    const renderCarrito = () => {
        cartTableBody.innerHTML = '';
        if (carrito.length === 0) {
            cartTableBody.innerHTML = `<tr><td colspan="5" class="empty-state-message" style="padding: 20px;">El carrito está vacío</td></tr>`;
        } else {
            carrito.forEach(item => {
                const row = document.createElement('tr');
                row.dataset.id = item.id;
                row.innerHTML = `
                    <td>${item.nombre}</td>
                    <td><input type="number" class="quantity-input" value="${item.cantidad}" min="1" data-id="${item.id}"></td>
                    <td>S/ ${parseFloat(item.precio).toFixed(2)}</td>
                    <td>S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
                    <td><button class="remove-item-btn" title="Eliminar" data-id="${item.id}">✖</button></td>
                `;
                cartTableBody.appendChild(row);
            });
        }
        actualizarTotales();
        // ¡MEJORA! Guardar el estado del carrito en sessionStorage
        sessionStorage.setItem('carritoVentas', JSON.stringify(carrito));
    };

    /** Calcula y actualiza los totales y el estado de los botones */
    const actualizarTotales = () => {
        const subtotal = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
        const igv = subtotal * 0.18;
        const total = subtotal + igv;

        subtotalElem.textContent = `S/ ${subtotal.toFixed(2)}`;
        igvElem.textContent = `S/ ${igv.toFixed(2)}`;
        totalElem.textContent = `S/ ${total.toFixed(2)}`;

        // ¡MEJORA! Habilitar o deshabilitar el botón de procesar venta
        procesarVentaBtn.disabled = carrito.length === 0;
    };

    // --- FUNCIONES DE LÓGICA ---
    
    /** Agrega un producto al carrito o incrementa su cantidad */
    const agregarAlCarrito = (productId) => {
        const productoEnCarrito = carrito.find(item => item.id === productId);

        if (productoEnCarrito) {
            productoEnCarrito.cantidad++;
        } else {
            const productoAAgregar = productosDisponibles.find(p => p.id === productId);
            if (productoAAgregar) {
                carrito.push({ ...productoAAgregar, cantidad: 1 });
            }
        }
        
        // ¡MEJORA! Feedback visual
        cartSection.classList.add('flash');
        setTimeout(() => cartSection.classList.remove('flash'), 500);

        renderCarrito();
    };

    /** Limpia completamente el carrito */
    const limpiarCarrito = () => {
        carrito = [];
        renderCarrito();
    };

    // --- EVENT LISTENERS ---

    // Añadir producto al hacer clic en su tarjeta
    productGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.product-card');
        if (card) {
            const productId = parseInt(card.dataset.id);
            agregarAlCarrito(productId);
        }
    });

    // Manejar cambios en el carrito (cantidad, eliminar)
    cartTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const id = parseInt(event.target.dataset.id);
            carrito = carrito.filter(item => item.id !== id);
            renderCarrito();
        }
    });
    cartTableBody.addEventListener('change', (event) => {
        if (event.target.classList.contains('quantity-input')) {
            const id = parseInt(event.target.dataset.id);
            const nuevaCantidad = parseInt(event.target.value);
            const itemEnCarrito = carrito.find(item => item.id === id);

            if (itemEnCarrito && nuevaCantidad > 0) {
                itemEnCarrito.cantidad = nuevaCantidad;
            } else {
                carrito = carrito.filter(item => item.id !== id);
            }
            renderCarrito();
        }
    });

    // Botones de acción principales
    limpiarBtn.addEventListener('click', () => {
        if (carrito.length > 0) {
            Swal.fire({
                title: '¿Limpiar Carrito?',
                text: "Se eliminarán todos los productos del carrito actual.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Sí, limpiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    limpiarCarrito();
                }
            });
        }
    });

    procesarVentaBtn.addEventListener('click', () => {
        if (carrito.length === 0) {
            // La validación del botón deshabilitado previene esto, pero es una buena práctica tenerlo
            Swal.fire('Carrito Vacío', 'Agrega productos antes de procesar la venta.', 'error');
            return;
        }
        // Lógica de procesar venta
        Swal.fire('¡Venta Procesada!', 'La venta ha sido registrada con éxito.', 'success');
        
        // Aquí podrías enviar los datos al backend y actualizar el stock
        
        limpiarCarrito();
    });

    // ¡NUEVO! Event Listeners para los filtros
    productSearchInput.addEventListener('input', renderProductos);
    categoryButtonsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('category-btn')) {
            // Quitar la clase 'active' del botón anterior
            categoryButtonsContainer.querySelector('.active').classList.remove('active');
            // Añadir 'active' al botón presionado
            event.target.classList.add('active');
            renderProductos();
        }
    });


    // --- INICIALIZACIÓN ---
    renderProductos(); // Dibuja los productos al cargar
    renderCarrito(); // Dibuja el carrito guardado (si lo hay)
});