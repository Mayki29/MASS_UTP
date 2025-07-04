/* scripts/inventario.js */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Proteger la página y cargar datos compartidos
    checkUserSession();

    // 2. Referencias a elementos del DOM
    const tableBody = document.querySelector('.inventory-table tbody');
    const ajustarStockBtn = document.getElementById('ajustarStockBtn');
    
    // Referencias a los Modals
    const ajustarStockModal = document.getElementById('ajustarStockModal');
    const editarStockMinimoModal = document.getElementById('editarStockMinimoModal');
    const historialMovimientosModal = document.getElementById('historialMovimientosModal');
    const modals = [ajustarStockModal, editarStockMinimoModal, historialMovimientosModal];

    // 3. Estado de la aplicación
    // Usamos los productos de localStorage como nuestra fuente de datos
    let inventario = (JSON.parse(localStorage.getItem('productos')) || []).map(p => ({
        ...p,
        stockMinimo: p.stockMinimo || 20 // Añadir un stock mínimo por defecto si no existe
    }));

    // --- FUNCIONES ---

    /** Renderiza la tabla de inventario con los datos actuales */
    const renderInventario = () => {
        tableBody.innerHTML = ''; // Limpiar tabla
        if (inventario.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No hay productos en el inventario.</td></tr>';
            return;
        }

        inventario.forEach(item => {
            const stockActual = parseInt(item.stock);
            const stockMinimo = parseInt(item.stockMinimo);
            let estado = { text: 'Normal', class: 'status-normal' };

            if (stockActual <= stockMinimo) {
                estado = { text: 'Bajo', class: 'status-bajo' };
            }
            if (stockActual <= 0) {
                estado = { text: 'Crítico', class: 'status-critico' };
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id.toString().padStart(3, '0')}</td>
                <td>${item.nombre}</td>
                <td>${item.categoria || 'N/A'}</td>
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
    };

    /** Cierra cualquier modal que esté abierto */
    const closeModal = (modal) => {
        if (modal) modal.style.display = "none";
    };

    // --- MANEJO DE EVENTOS ---
    
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
            historialMovimientosModal.style.display = 'block';
        }
    });

    // Manejo del formulario de "Editar Stock Mínimo"
    document.getElementById('editarStockMinimoForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const id = parseInt(document.getElementById('editProductId').value);
        const nuevoStockMinimo = parseInt(document.getElementById('editStockMinimo').value);

        const itemIndex = inventario.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            inventario[itemIndex].stockMinimo = nuevoStockMinimo;
            localStorage.setItem('productos', JSON.stringify(inventario)); // Guardar cambios
            renderInventario(); // Re-renderizar la tabla
            Swal.fire('¡Actualizado!', 'El stock mínimo ha sido modificado.', 'success');
        }
        closeModal(editarStockMinimoModal);
    });

    // Añadir eventos para cerrar todos los modals
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.btn-secondary');
        
        if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));
        
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                closeModal(modal);
            }
        });
    });

    // 4. Inicialización
    renderInventario();
});