/* scripts/historial_ventas.js (versión COMPLETA con filtros y paginación) */
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();

    // --- REFERENCIAS AL DOM ---
    const historyTableBody = document.getElementById('history-table-body');
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const paginationContainer = document.getElementById('pagination');
    const detailsModal = document.getElementById('detailsModal');
    const closeModalBtn = detailsModal.querySelector('.close-btn');
    const receiptContainer = document.getElementById('receipt-container');

    // --- ESTADO DE LA APLICACIÓN ---
    const todasLasVentas = JSON.parse(localStorage.getItem('historialVentas')) || [];
    let ventasFiltradas = [...todasLasVentas]; // Copia para trabajar con los filtros

    const estado = {
        paginaActual: 1,
        itemsPorPagina: 15, // Límite de 15 ventas
    };

    // --- FUNCIONES ---

    /** Renderiza la tabla y la paginación */
    const render = () => {
        renderTabla();
        renderPaginacion();
    };

    /** Renderiza solo la tabla con los datos de la página actual */
    const renderTabla = () => {
        historyTableBody.innerHTML = '';

        if (ventasFiltradas.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No se encontraron ventas que coincidan con los filtros.</td></tr>`;
            return;
        }
        
        // Mostrar del más reciente al más antiguo
        const ventasOrdenadas = [...ventasFiltradas].reverse();

        const inicio = (estado.paginaActual - 1) * estado.itemsPorPagina;
        const fin = inicio + estado.itemsPorPagina;
        const ventasPagina = ventasOrdenadas.slice(inicio, fin);

        ventasPagina.forEach(venta => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${venta.id}</td>
                <td>${venta.fecha}</td>
                <td>${venta.clienteDNI || 'Varios'}</td>
                <td>${venta.items.length}</td>
                <td>S/ ${venta.total.toFixed(2)}</td>
                <td><button class="view-details-btn" data-id="${venta.id}">Ver Detalles</button></td>
            `;
            historyTableBody.appendChild(row);
        });
    };

    /** Renderiza los controles de paginación */
    const renderPaginacion = () => {
        const totalPaginas = Math.ceil(ventasFiltradas.length / estado.itemsPorPagina);
        paginationContainer.innerHTML = '';

        if (totalPaginas <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '«'; // «
        prevBtn.title = "Anterior";
        prevBtn.disabled = estado.paginaActual === 1;
        prevBtn.addEventListener('click', () => {
            if (estado.paginaActual > 1) {
                estado.paginaActual--;
                render();
            }
        });
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPaginas; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === estado.paginaActual) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => {
                estado.paginaActual = i;
                render();
            });
            paginationContainer.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '»'; // »
        nextBtn.title = "Siguiente";
        nextBtn.disabled = estado.paginaActual === totalPaginas;
        nextBtn.addEventListener('click', () => {
            if (estado.paginaActual < totalPaginas) {
                estado.paginaActual++;
                render();
            }
        });
        paginationContainer.appendChild(nextBtn);
    };

    /** Aplica todos los filtros y actualiza la vista */
    const aplicarFiltros = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const dateRange = dateFilter.value;

        let resultados = [...todasLasVentas];

        if (searchTerm) {
            resultados = resultados.filter(venta => venta.id.toString().includes(searchTerm));
        }
        
        if (dateRange !== 'all') {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a la medianoche

            resultados = resultados.filter(venta => {
                const [fechaParte] = venta.fecha.split(', ');
                const [dia, mes, anio] = fechaParte.split('/');
                const fechaVenta = new Date(anio, mes - 1, dia);

                if (dateRange === 'today') {
                    return fechaVenta.getTime() === hoy.getTime();
                }
                if (dateRange === 'this_week') {
                    const primerDiaSemana = new Date(hoy);
                    primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
                    return fechaVenta >= primerDiaSemana;
                }
                if (dateRange === 'this_month') {
                    return fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear();
                }
                return true;
            });
        }
        
        ventasFiltradas = resultados;
        estado.paginaActual = 1;
        render();
    };

    /** Muestra los detalles de una venta específica en el modal */
    const showSaleDetails = (ventaId) => {
        const venta = todasLasVentas.find(v => v.id === ventaId);
        if (!venta) return;
        
        let receiptHTML = `
            <div class="receipt-header">
                <img src="../assets/store-icon-flat-design-by-Vexels.svg" alt="Logo MASS">
                <h2>Boleta de Venta</h2>
            </div>
            <div class="receipt-details">
                <p><strong>Nro. Venta:</strong> ${venta.id}</p>
                <p><strong>Fecha:</strong> ${venta.fecha}</p>
                <p><strong>Cliente:</strong> ${venta.clienteDNI || 'Cliente Varios'}</p>
            </div>
            <table class="receipt-table">
                <thead><tr><th>Cant.</th><th>Descripción</th><th>P.U.</th><th>Total</th></tr></thead>
                <tbody>`;
        
        venta.items.forEach(item => {
            receiptHTML += `<tr><td>${item.cantidad}</td><td>${item.nombre}</td><td>${parseFloat(item.precio).toFixed(2)}</td><td>${(item.cantidad * parseFloat(item.precio)).toFixed(2)}</td></tr>`;
        });

        receiptHTML += `</tbody></table>
            <div class="receipt-summary">
                <p><strong>Subtotal:</strong> S/ ${venta.subtotal.toFixed(2)}</p>
                <p><strong>IGV (18%):</strong> S/ ${venta.igv.toFixed(2)}</p>`;
        
        if (venta.descuento > 0) {
            receiptHTML += `<p class="discount"><strong>Descuento:</strong> - S/ ${venta.descuento.toFixed(2)}</p>`;
        }
        
        receiptHTML += `<p class="total"><strong>TOTAL PAGADO:</strong> S/ ${venta.total.toFixed(2)}</p></div>`;

        receiptContainer.innerHTML = receiptHTML;
        detailsModal.style.display = 'block';
    };

    // --- EVENT LISTENERS ---
    searchInput.addEventListener('input', aplicarFiltros);
    dateFilter.addEventListener('change', aplicarFiltros);
    
    historyTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-details-btn')) {
            const ventaId = parseInt(event.target.dataset.id);
            showSaleDetails(ventaId);
        }
    });
    
    closeModalBtn.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == detailsModal) {
            detailsModal.style.display = 'none';
        }
    });

    // --- INICIALIZACIÓN ---
    aplicarFiltros();
});