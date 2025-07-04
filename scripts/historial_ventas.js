/* scripts/historial_ventas.js */
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();

    // Referencias al DOM
    const historyTableBody = document.getElementById('history-table-body');
    const detailsModal = document.getElementById('detailsModal');
    const closeModalBtn = detailsModal.querySelector('.close-btn');
    const receiptContainer = document.getElementById('receipt-container');

    // Obtener datos
    const ventas = JSON.parse(localStorage.getItem('historialVentas')) || [];

    /** Muestra los detalles de una venta específica en el modal */
    const showSaleDetails = (ventaId) => {
        const venta = ventas.find(v => v.id === ventaId);
        if (!venta) return;

        // Construir el HTML del recibo
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
            receiptHTML += `<tr>
                <td>${item.cantidad}</td>
                <td>${item.nombre}</td>
                <td>${parseFloat(item.precio).toFixed(2)}</td>
                <td>${(item.cantidad * parseFloat(item.precio)).toFixed(2)}</td>
            </tr>`;
        });

        receiptHTML += `</tbody></table>
            <div class="receipt-summary">
                <p><strong>Subtotal:</strong> S/ ${venta.subtotal.toFixed(2)}</p>
                <p><strong>IGV (18%):</strong> S/ ${venta.igv.toFixed(2)}</p>`;
        
        if (venta.descuento > 0) {
            receiptHTML += `<p class="discount"><strong>Descuento:</strong> - S/ ${venta.descuento.toFixed(2)}</p>`;
        }
        
        receiptHTML += `<p class="total"><strong>TOTAL PAGADO:</strong> S/ ${venta.total.toFixed(2)}</p>
            </div>`;

        receiptContainer.innerHTML = receiptHTML;
        detailsModal.style.display = 'block';
    };

    // --- RENDERIZADO INICIAL ---
    if (ventas.length === 0) {
        historyTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay ventas registradas.</td></tr>`;
    } else {
        ventas.reverse().forEach(venta => {
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
    }

    // --- EVENT LISTENERS ---

    // Delegación de eventos para los botones "Ver Detalles"
    historyTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-details-btn')) {
            const ventaId = parseInt(event.target.dataset.id);
            showSaleDetails(ventaId);
        }
    });

    // Cerrar el modal
    closeModalBtn.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
});