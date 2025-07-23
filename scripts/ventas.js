/* scripts/ventas.js (versión con impresión y UX de pago corregidas) */
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    const productosDisponibles = JSON.parse(localStorage.getItem('productos')) || [];
    const clientesRegistrados = JSON.parse(localStorage.getItem('clientesRegistrados')) || [];
    let carrito = JSON.parse(sessionStorage.getItem('carritoVentas')) || [];
    let descuentoActivo = false;

    // --- REFERENCIAS AL DOM ---
    const productGrid = document.querySelector('.product-grid');
    const productSearchInput = document.getElementById('product-search');
    const categoryButtonsContainer = document.querySelector('.product-filters');
    const cartSection = document.querySelector('.cart-section');
    const searchClientInput = document.getElementById('ruc');
    const searchClientBtn = document.getElementById('search-client-btn');
    const cartTableBody = document.querySelector('#cart-table-body');
    const subtotalElem = document.getElementById('subtotal-value');
    const igvElem = document.getElementById('igv-value');
    const discountRow = document.getElementById('discount-row');
    const discountElem = document.getElementById('discount-value');
    const totalElem = document.getElementById('total-value');
    const limpiarBtn = document.getElementById('limpiarBtn');
    const procesarVentaBtn = document.getElementById('procesarVentaBtn');
    const paymentModal = document.getElementById('paymentModal');
    const closeModalBtn = paymentModal.querySelector('.close-btn');
    const paymentForm = document.getElementById('paymentForm');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const cardDetailsDiv = document.getElementById('card-details');
    const modalTotalElem = document.getElementById('modal-total-value');
    const receiptModal = document.getElementById('receiptModal');
    const closeReceiptBtn = receiptModal.querySelector('.close-btn');
    const printReceiptBtn = document.getElementById('printReceiptBtn');

    // --- FUNCIONES ---
    const renderProductos = () => {
        const searchTerm = productSearchInput.value.toLowerCase().trim();
        const activeCategoryButton = categoryButtonsContainer.querySelector('.category-btn.active');
        const activeCategory = activeCategoryButton ? activeCategoryButton.textContent : 'Todos';
        const productosFiltrados = productosDisponibles.filter(prod => {
            const matchesCategory = activeCategory === 'Todos' || (prod.categoria && prod.categoria.toLowerCase() === activeCategory.toLowerCase());
            const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        productGrid.innerHTML = '';
        if (productosFiltrados.length === 0) {
            productGrid.innerHTML = `<p class="empty-state-message">No se encontraron productos.</p>`;
            return;
        }
        productosFiltrados.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = prod.id;
            card.innerHTML = `<img src="${prod.imagen}" alt="${prod.nombre}" onerror="this.src='../assets/placeholder.png';"><h3>${prod.nombre}</h3><div class="price">S/ ${parseFloat(prod.precio).toFixed(2)}</div>`;
            productGrid.appendChild(card);
        });
    };
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
                    <td>S/ ${(item.cantidad * parseFloat(item.precio)).toFixed(2)}</td>
                    <td><button class="remove-item-btn" title="Eliminar" data-id="${item.id}">✖</button></td>
                `;
                cartTableBody.appendChild(row);
            });
        }
        actualizarTotales();
        sessionStorage.setItem('carritoVentas', JSON.stringify(carrito));
    };
    const actualizarTotales = () => {
        const totalSinDescuento = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
        let descuento = 0;
        let totalFinal = totalSinDescuento;
        if (descuentoActivo) {
            descuento = totalSinDescuento * 0.10;
            totalFinal = totalSinDescuento - descuento;
            discountRow.style.display = 'flex';
            discountElem.textContent = `- S/ ${descuento.toFixed(2)}`;
        } else {
            discountRow.style.display = 'none';
        }
        const subtotal = totalFinal / 1.18;
        const igv = totalFinal - subtotal;
        subtotalElem.textContent = `S/ ${subtotal.toFixed(2)}`;
        igvElem.textContent = `S/ ${igv.toFixed(2)}`;
        totalElem.textContent = `S/ ${totalFinal.toFixed(2)}`;
        modalTotalElem.textContent = `S/ ${totalFinal.toFixed(2)}`;
        procesarVentaBtn.disabled = carrito.length === 0;
    };
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
        cartSection.classList.add('flash');
        setTimeout(() => cartSection.classList.remove('flash'), 500);
        renderCarrito();
    };
    const limpiarCarrito = () => {
        carrito = [];
        descuentoActivo = false;
        searchClientInput.value = '';
        renderCarrito();
    };
    const verificarCliente = () => {
        const dniIngresado = searchClientInput.value.trim();
        const clienteEncontrado = clientesRegistrados.find(cliente => cliente.dni === dniIngresado);
        if (clienteEncontrado) {
            descuentoActivo = true;
            Swal.fire('¡Cliente Exclusivo!', `Descuento del 10% aplicado para ${clienteEncontrado.nombres}.`, 'success');
        } else {
            descuentoActivo = false;
            if (dniIngresado) {
                Swal.fire('Cliente no encontrado', 'El DNI ingresado no corresponde a un cliente exclusivo.', 'info');
            }
        }
        actualizarTotales();
    };
    const generarRecibo = (venta) => {
        document.getElementById('receipt-id').textContent = venta.id;
        document.getElementById('receipt-date').textContent = venta.fecha;
        document.getElementById('receipt-client').textContent = venta.clienteDNI || 'Cliente Varios';
        const itemsBody = document.getElementById('receipt-items-body');
        itemsBody.innerHTML = '';
        venta.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.cantidad}</td>
                <td>${item.nombre}</td>
                <td>${parseFloat(item.precio).toFixed(2)}</td>
                <td>${(item.cantidad * parseFloat(item.precio)).toFixed(2)}</td>
            `;
            itemsBody.appendChild(row);
        });
        document.getElementById('receipt-subtotal').textContent = `S/ ${venta.subtotal.toFixed(2)}`;
        document.getElementById('receipt-igv').textContent = `S/ ${venta.igv.toFixed(2)}`;
        if (venta.descuento > 0) {
            document.getElementById('receipt-discount-row').style.display = 'block';
            document.getElementById('receipt-discount').textContent = `- S/ ${venta.descuento.toFixed(2)}`;
        } else {
            document.getElementById('receipt-discount-row').style.display = 'none';
        }
        document.getElementById('receipt-total').textContent = `S/ ${venta.total.toFixed(2)}`;
        receiptModal.style.display = 'block';
    };
    
    // --- EVENT LISTENERS ---
    productSearchInput.addEventListener('input', renderProductos);
    categoryButtonsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('category-btn')) {
            categoryButtonsContainer.querySelector('.active').classList.remove('active');
            event.target.classList.add('active');
            renderProductos();
        }
    });
    productGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.product-card');
        if (card) {
            const productId = parseInt(card.dataset.id);
            agregarAlCarrito(productId);
        }
    });
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
    limpiarBtn.addEventListener('click', () => {
        if (carrito.length > 0) {
            Swal.fire({
                title: '¿Limpiar Carrito?', text: "Se eliminarán todos los productos del carrito actual.",
                icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
                confirmButtonText: 'Sí, limpiar', cancelButtonText: 'Cancelar'
            }).then((result) => { if (result.isConfirmed) { limpiarCarrito(); } });
        }
    });
    procesarVentaBtn.addEventListener('click', () => {
        if (carrito.length > 0) {
            paymentModal.style.display = 'block';
            actualizarTotales();
        }
    });
    searchClientBtn.addEventListener('click', verificarCliente);
    searchClientInput.addEventListener('input', () => {
        // Obtenemos el valor actual del input
        const valorActual = searchClientInput.value;
        
        // Usamos una expresión regular para eliminar cualquier caracter que NO sea un dígito
        const valorLimpio = valorActual.replace(/[^0-9]/g, '');
        
        // Reasignamos el valor limpio al input.
        // Esto previene que se escriban o peguen letras, símbolos, etc.
        searchClientInput.value = valorLimpio;
    });
    closeModalBtn.addEventListener('click', () => paymentModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target == paymentModal) {
            paymentModal.style.display = 'none';
        }
    });
    paymentMethodSelect.addEventListener('change', () => {
        cardDetailsDiv.style.display = paymentMethodSelect.value === 'tarjeta' ? 'block' : 'none';
    });
    // REEMPLAZA ESTE EVENT LISTENER COMPLETO

    paymentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        paymentModal.style.display = 'none';
        
        Swal.fire({
            icon: 'success', title: 'Venta Completada', toast: true,
            position: 'top-end', showConfirmButton: false, timer: 3000,
            timerProgressBar: true
        });

        // --- LÓGICA DE VENTA UNIFICADA ---

        // 1. Crear el objeto de la venta final
        const totalSinDescuento = carrito.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
        let descuento = 0;
        if (descuentoActivo) {
            descuento = totalSinDescuento * 0.10;
        }
        const totalFinal = totalSinDescuento - descuento;

        const ventaFinalizada = {
            id: Date.now(),
            fecha: new Date().toLocaleString('es-PE'),
            clienteDNI: descuentoActivo ? searchClientInput.value.trim() : null,
            items: [...carrito],
            subtotal: totalFinal / 1.18,
            igv: totalFinal - (totalFinal / 1.18),
            descuento: descuento,
            total: totalFinal
        };

        // 2. Cargar todos los datos necesarios de localStorage UNA SOLA VEZ
        let productosActuales = JSON.parse(localStorage.getItem('productos')) || [];
        let historialVentas = JSON.parse(localStorage.getItem('historialVentas')) || [];
        let movimientosStock = JSON.parse(localStorage.getItem('movimientosStock')) || [];

        // 3. Procesar CADA item del carrito UNA SOLA VEZ
        ventaFinalizada.items.forEach(itemVendido => {
            // Encontrar el producto correspondiente en la lista principal
            const productoEnStock = productosActuales.find(p => p.id === itemVendido.id);
            
            if (productoEnStock) {
                // a. ACTUALIZAR STOCK
                productoEnStock.stock -= itemVendido.cantidad;

                // b. REGISTRAR MOVIMIENTO DE STOCK
                const nuevoMovimiento = {
                    id: Date.now() + itemVendido.id,
                    productoId: itemVendido.id,
                    fecha: ventaFinalizada.fecha,
                    tipo: 'Venta',
                    cantidad: `-${itemVendido.cantidad}`,
                    stockResultante: productoEnStock.stock,
                    motivo: `Venta Nro. ${ventaFinalizada.id}`
                };
                movimientosStock.push(nuevoMovimiento);
            }
        });

        // 4. Añadir la venta completa al historial
        historialVentas.push(ventaFinalizada);

        // 5. Guardar TODOS los datos actualizados en localStorage
        localStorage.setItem('productos', JSON.stringify(productosActuales));
        localStorage.setItem('historialVentas', JSON.stringify(historialVentas));
        localStorage.setItem('movimientosStock', JSON.stringify(movimientosStock));

        // 6. Generar el recibo y limpiar para la siguiente venta
        generarRecibo(ventaFinalizada);
        limpiarCarrito();
    });
    closeReceiptBtn.addEventListener('click', () => receiptModal.style.display = 'none');
    printReceiptBtn.addEventListener('click', () => {
        // 1. Clonar el contenido del recibo
        const receiptToPrint = document.getElementById('receipt-to-print').cloneNode(true);
    
        // 2. Definir los estilos para la impresión
        const printStyles = `
            <style>
                body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; color: #000; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-header img { width: 50px; }
                .receipt-header h2 { margin: 5px 0; font-size: 1.2em; }
                .receipt-details, .receipt-summary { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .receipt-details p, .receipt-summary p { margin: 4px 0; font-size: 0.9em; }
                .receipt-summary { text-align: right; border-top: 1px dashed #000; border-bottom: none; }
                .receipt-table { width: 100%; font-size: 0.9em; border-collapse: collapse; }
                .receipt-table th, .receipt-table td { text-align: left; padding: 4px 0; }
                .receipt-table th { border-bottom: 1px solid #000; }
                .receipt-summary .discount { color: #000; }
                .receipt-summary .total { font-weight: bold; font-size: 1.1em; border-top: 1px solid #000; padding-top: 5px; }
                .receipt-footer { text-align: center; margin-top: 20px; font-style: italic; }
            </style>
        `;
    
        // 3. Abrir una nueva ventana
        const printWindow = window.open('', '', 'height=600,width=800');
    
        // 4. Escribir el contenido en la nueva ventana
        printWindow.document.write('<html><head><title>Recibo de Venta</title>');
        printWindow.document.write(printStyles);
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptToPrint.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close(); // Finalizar la escritura
    
        // 5. ¡LA CLAVE! Esperar un momento antes de llamar a imprimir
        setTimeout(() => {
            printWindow.focus(); // Asegura que la ventana esté en primer plano
            printWindow.print(); // Llama a imprimir
            printWindow.close(); // Cierra la ventana después de que se envíe a la impresora
        }, 250); // Un retardo de 250 milisegundos suele ser suficiente
    });
    
    renderProductos();
    renderCarrito();
});