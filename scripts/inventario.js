/* scripts/inventario.js */
const supabaseUrl = 'https://wgivejkvpksrcwmgclrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaXZlamt2cGtzcmN3bWdjbHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MjEyMjcsImV4cCI6MjA2Njk5NzIyN30.mzyEwKXTbFpwyQdrR8w-Wdwx8A4-hnmxUUeNjCCOUtk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Proteger la página y cargar datos compartidos
    checkUserSession();

    // 2. Referencias a elementos del DOM
    const tableBody = document.querySelector('.inventory-table tbody');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfoSpan = document.getElementById('pageInfo');
    const ajustarStockBtn = document.getElementById('ajustarStockBtn');

    // Referencias a los Modals
    const ajustarStockModal = document.getElementById('ajustarStockModal');
    const editarStockMinimoModal = document.getElementById('editarStockMinimoModal');
    const historialMovimientosModal = document.getElementById('historialMovimientosModal');
    const modals = [ajustarStockModal, editarStockMinimoModal, historialMovimientosModal];
    const closeAjusteBtn = ajustarStockModal.querySelector('.close-btn');
    const cancelarAjusteBtn = document.getElementById('cancelarAjusteBtn');
    const ajusteStockForm = document.getElementById('ajusteStockForm');
    const productoSelect = document.getElementById('ajusteProductoSelect');
    const historyTableBodyModal = document.getElementById('history-table-body-modal');
    const exportarExcelBtn = document.getElementById('exportarExcelBtn');

    let inventario = {}


    // 3. Estado de la aplicación
    // Usamos los productos de localStorage como nuestra fuente de datos
    const getProductsSupaBase = async () => {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias (
                nombre,
                descripcion
                )`
            ).order('id', {ascending: false});
        return { data, error }
    }

    let movimientosStock = JSON.parse(localStorage.getItem('movimientosStock')) || [];
    // ¡NUEVO! Estado para la paginación
    const estadoPaginacion = {
        paginaActual: 1,
        itemsPorPagina: 5, // Puedes cambiar este número
        totalPaginas: 1
    };

    /** 
     * ¡NUEVA FUNCIÓN!
     * Exporta los datos del inventario a un archivo Excel (.xlsx).
     */
    const exportarAExcel = () => {
        // 1. Preparar los datos que queremos exportar.
        // Usamos el array `inventario` completo, no solo la página actual.
        const datosParaExportar = inventario.map(item => ({
            'Código': item.id,
            'Producto': item.nombre,
            'Categoría': item.categorias.nombre || 'N/A',
            'Stock Actual': item.stock,
            'Stock Mínimo': item.stock_minimo
        }));

        if (datosParaExportar.length === 0) {
            Swal.fire('Vacío', 'No hay datos en el inventario para exportar.', 'info');
            return;
        }

        // 2. Crear una nueva "hoja de trabajo" (worksheet) a partir de nuestros datos.
        const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);

        // 3. Crear un nuevo "libro" (workbook).
        const workbook = XLSX.utils.book_new();

        // 4. Añadir la hoja de trabajo al libro, dándole un nombre ("Inventario").
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

        // (Opcional) Ajustar el ancho de las columnas
        worksheet['!cols'] = [
            { wch: 10 }, // Ancho para la columna 'Código'
            { wch: 40 }, // Ancho para la columna 'Producto'
            { wch: 20 }, // Ancho para la columna 'Categoría'
            { wch: 15 }, // Ancho para 'Stock Actual'
            { wch: 15 }  // Ancho para 'Stock Mínimo'
        ];

        // 5. Generar y descargar el archivo Excel.
        // El nombre del archivo será "Reporte_Inventario_MASS_FECHA.xlsx"
        const fechaActual = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Reporte_Inventario_MASS_${fechaActual}.xlsx`);
    };

    /**
     * ¡NUEVA FUNCIÓN!
     * Llena el <select> del modal con los productos del inventario.
     */
    const poblarSelectProductos = () => {
        productoSelect.innerHTML = '<option value="">-- Seleccione un producto --</option>'; // Opción por defecto
        inventario.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            option.textContent = producto.nombre;
            productoSelect.appendChild(option);
        });
    };

    /**
     * ¡NUEVA FUNCIÓN!
     * Abre el modal de ajuste de stock y lo prepara.
     */
    const abrirModalAjuste = () => {
        ajusteStockForm.reset(); // Limpiar el formulario
        poblarSelectProductos(); // Llenar el select con los productos actualizados
        ajustarStockModal.style.display = 'block';
    };

    /**
     * ¡NUEVA FUNCIÓN!
     * Cierra el modal de ajuste de stock.
     */
    const cerrarModalAjuste = () => {
        ajustarStockModal.style.display = 'none';
    };


    // --- FUNCIONES ---

    /** Renderiza la tabla de inventario con los datos actuales */
    /** 
     * ¡FUNCIÓN ACTUALIZADA!
     * Renderiza la tabla de inventario para una página específica.
     */
    const renderInventario = async () => {
        // Limpiar la tabla antes de renderizar
        tableBody.innerHTML = '';

        let { data, error } = await getProductsSupaBase();

        if (error) {
            console.error('Error al obtener productos con categorías:', error.message);
        } else {
            console.log('Productos con categorías:', data);
        }

        inventario = data;

        if (inventario.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="empty-state-message">No hay productos en el inventario.</td></tr>';
            actualizarControlesPaginacion(); // Actualizar aunque no haya items
            return;
        }

        // 1. Calcular el total de páginas
        estadoPaginacion.totalPaginas = Math.ceil(inventario.length / estadoPaginacion.itemsPorPagina);

        // 2. Determinar qué "rebanada" (slice) del array mostrar
        const inicio = (estadoPaginacion.paginaActual - 1) * estadoPaginacion.itemsPorPagina;
        const fin = inicio + estadoPaginacion.itemsPorPagina;
        const itemsPagina = inventario.slice(inicio, fin);

        // 3. Renderizar solo los items de la página actual
        itemsPagina.forEach(item => {
            const stockActual = parseInt(item.stock);
            const stockMinimo = parseInt(item.stock_minimo);
            let estado = { text: 'Normal', class: 'status-normal' };

            if (stockActual <= stockMinimo && stockActual > 0) {
                estado = { text: 'Bajo', class: 'status-bajo' };
            } else if (stockActual <= 0) {
                estado = { text: 'Crítico', class: 'status-critico' };
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id.toString().padStart(3, '0')}</td>
                <td>${item.nombre}</td>
                <td>${item.categorias.nombre || 'N/A'}</td>
                <td>${stockActual}</td>
                <td>${stockMinimo}</td>
                <td><span class="status-badge ${estado.class}">${estado.text}</span></td>
                <td class="actions-cell">
                  <svg class="edit-min-stock" data-id="${item.id}" title="Editar Stock Mínimo" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  <svg class="view-history" data-id="${item.id}" title="Ver Historial" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0z" fill="none"/><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // 4. Actualizar los botones y el texto de la paginación
        actualizarControlesPaginacion();
    };

    /** 
     * ¡NUEVA FUNCIÓN!
     * Actualiza el estado de los botones de paginación y el texto informativo.
     */
    const actualizarControlesPaginacion = () => {
        // Actualizar el texto (ej: "Página 1 de 3")
        pageInfoSpan.textContent = `Página ${estadoPaginacion.paginaActual} de ${estadoPaginacion.totalPaginas}`;

        // Habilitar/deshabilitar el botón "Anterior"
        prevPageBtn.disabled = estadoPaginacion.paginaActual === 1;

        // Habilitar/deshabilitar el botón "Siguiente"
        nextPageBtn.disabled = estadoPaginacion.paginaActual === estadoPaginacion.totalPaginas || inventario.length === 0;
    };

    /** 
     * ¡NUEVA FUNCIÓN!
     * Navega a la página siguiente.
     */
    const irAPaginaSiguiente = () => {
        if (estadoPaginacion.paginaActual < estadoPaginacion.totalPaginas) {
            estadoPaginacion.paginaActual++;
            renderInventario();
        }
    };

    /** 
     * ¡NUEVA FUNCIÓN!
     * Navega a la página anterior.
     */
    const irAPaginaAnterior = () => {
        if (estadoPaginacion.paginaActual > 1) {
            estadoPaginacion.paginaActual--;
            renderInventario();
        }
    };

    /**
     * ¡NUEVA FUNCIÓN!
     * Maneja el envío del formulario de ajuste de stock.
     */
    const manejarAjusteStock = (event) => {
        event.preventDefault();

        // 1. Obtener los valores del formulario
        const productoId = parseInt(document.getElementById('ajusteProductoSelect').value);
        const tipo = document.getElementById('tipoAjuste').value;
        const cantidad = parseInt(document.getElementById('cantidadAjuste').value);
        const motivo = document.getElementById('motivoAjuste').value;

        if (!productoId || !cantidad || cantidad <= 0) {
            Swal.fire('Error', 'Por favor, seleccione un producto y una cantidad válida.', 'error');
            return;
        }

        // 2. Encontrar el producto en el array de inventario
        const productoIndex = inventario.findIndex(p => p.id === productoId);

        if (productoIndex === -1) {
            Swal.fire('Error', 'Producto no encontrado.', 'error');
            return;
        }
        const stockAnterior = inventario[productoIndex].stock;
        let cantidadFormateada;

        // 3. Actualizar el stock
        if (tipo === 'entrada') {
            inventario[productoIndex].stock += cantidad;
            cantidadFormateada = `+${cantidad}`;
        } else { // Salida
            if (inventario[productoIndex].stock < cantidad) {
                Swal.fire('Error de Stock', 'No se puede retirar más stock del que existe.', 'error');
                return;
            }
            inventario[productoIndex].stock -= cantidad;
            cantidadFormateada = `-${cantidad}`;
        }

        // ¡NUEVO! Registrar el movimiento de ajuste
        const nuevoMovimiento = {
            id: Date.now(),
            productoId: productoId,
            fecha: new Date().toLocaleString('es-PE'),
            tipo: 'Ajuste',
            cantidad: cantidadFormateada,
            stockResultante: inventario[productoIndex].stock,
            motivo: motivo
        };
        movimientosStock.push(nuevoMovimiento);

        // 4. Guardar el inventario actualizado en localStorage
        localStorage.setItem('productos', JSON.stringify(inventario));

        localStorage.setItem('movimientosStock', JSON.stringify(movimientosStock));

        // (Opcional, para la siguiente mejora) Aquí guardarías el movimiento en un historial

        // 5. Mostrar confirmación, cerrar modal y refrescar la tabla
        Swal.fire('¡Éxito!', 'El stock ha sido ajustado correctamente.', 'success');
        cerrarModalAjuste();
        renderInventario(); // ¡Muy importante! Redibuja la tabla con el nuevo stock
    };

    /** 
     * ¡NUEVA FUNCIÓN! 
     * Muestra el historial de un producto específico en su modal.
     */
    const mostrarHistorial = (productoId, productoNombre) => {
        // Poner el nombre del producto en el título del modal
        document.getElementById('historyProductName').textContent = productoNombre;

        // Filtrar todos los movimientos para obtener solo los de este producto
        const historialProducto = movimientosStock
            .filter(mov => mov.productoId === productoId)
            .reverse(); // .reverse() para mostrar el más reciente primero

        historyTableBodyModal.innerHTML = ''; // Limpiar la tabla

        if (historialProducto.length === 0) {
            historyTableBodyModal.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay movimientos para este producto.</td></tr>`;
        } else {
            historialProducto.forEach(mov => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mov.fecha}</td>
                    <td>${mov.tipo}</td>
                    <td>${mov.cantidad}</td>
                    <td>${mov.stockResultante}</td>
                    <td>${mov.motivo}</td>
                `;
                historyTableBodyModal.appendChild(row);
            });
        }

        // Abrir el modal
        historialMovimientosModal.style.display = 'block';
    };

    /** Cierra cualquier modal que esté abierto */
    const closeModal = (modal) => {
        if (modal) modal.style.display = "none";
    };

    // --- MANEJO DE EVENTOS ---

    // ¡NUEVO! Asignar eventos a los botones de paginación
    ajustarStockBtn.addEventListener('click', abrirModalAjuste);
    closeAjusteBtn.addEventListener('click', cerrarModalAjuste);
    cancelarAjusteBtn.addEventListener('click', cerrarModalAjuste);
    ajusteStockForm.addEventListener('submit', manejarAjusteStock);
    nextPageBtn.addEventListener('click', irAPaginaSiguiente);
    prevPageBtn.addEventListener('click', irAPaginaAnterior);
    exportarExcelBtn.addEventListener('click', exportarAExcel);

    // Abrir Modal de "Ajustar Stock"
    ajustarStockBtn.addEventListener('click', () => {
        ajustarStockModal.style.display = 'block';
    });

    // Delegación de eventos para los botones de la tabla
    tableBody.addEventListener('click', (event) => {
        const target = event.target.closest('svg');
        if (!target) return;

        const id = parseInt(target.dataset.id);
        const item = inventario.find(i => i.id === id);

        if (target.classList.contains('edit-min-stock')) {
            // Llenar el formulario del modal de edición
            document.getElementById('editProductId').value = item.id;
            document.getElementById('editProductName').value = item.nombre;
            document.getElementById('editStockActual').value = item.stock;
            document.getElementById('editStockMinimo').value = item.stockMinimo;
            editarStockMinimoModal.style.display = 'block';
        }

        if (target.classList.contains('view-history')) {
            document.getElementById('historyProductName').textContent = item.nombre;
            // Aquí iría la lógica para cargar el historial real, por ahora es estático
            mostrarHistorial(id, item.nombre);
        }
    });

    // Manejo del formulario de "Editar Stock Mínimo"
    document.getElementById('editarStockMinimoForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("actualizar stock")
        const id = parseInt(document.getElementById('editProductId').value);
        const nuevoStockMinimo = parseInt(document.getElementById('editStockMinimo').value);
        const { data, error } = await supabase
            .from('productos')
            .update({ stock_minimo: nuevoStockMinimo })
            .eq('id', id)
        renderInventario(); // Re-renderizar la tabla
        if(data){
            Swal.fire('¡Actualizado!', 'El stock mínimo ha sido modificado.', 'success');
        }
        closeModal(editarStockMinimoModal);
    });

    // Añadir listener para cerrar el modal de historial
    historialMovimientosModal.querySelector('.close-btn').addEventListener('click', () => {
        historialMovimientosModal.style.display = 'none';
    });

    // Añadir eventos para cerrar todos los modals
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.btn-secondary');

        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));

        window.addEventListener('click', (event) => {
            if (event.target == ajustarStockModal) {
                cerrarModalAjuste();
            }

        });
    });

    // 4. Inicialización
    renderInventario();
});