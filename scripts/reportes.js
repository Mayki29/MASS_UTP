/* scripts/reportes.js (versión completamente dinámica) */
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();

    // --- REFERENCIAS GLOBALES Y DATOS ---
    const todasLasVentas = JSON.parse(localStorage.getItem('historialVentas')) || [];
    const todosLosProductos = JSON.parse(localStorage.getItem('productos')) || [];
    const periodoSelect = document.getElementById('periodo');

    // Referencias a los gráficos (se deben guardar para poder destruirlos y recrearlos)
    let pieChartInstance = null;
    let lineChartInstance = null;

    // --- FUNCIONES DE CÁLCULO ---

    /** Filtra las ventas según el periodo seleccionado */
    const filtrarVentasPorPeriodo = (periodo) => {
        const ahora = new Date();
        const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

        return todasLasVentas.filter(venta => {
            const [fechaParte] = venta.fecha.split(', ');
            const [dia, mes, anio] = fechaParte.split('/');
            const fechaVenta = new Date(anio, mes - 1, dia);

            switch (periodo) {
                case 'today':
                    return fechaVenta.getTime() === hoy.getTime();
                case 'this_week':
                    const primerDiaSemana = new Date(hoy);
                    primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
                    return fechaVenta >= primerDiaSemana;
                case 'this_month':
                    return fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear();
                default: // 'all'
                    return true;
            }
        });
    };

    /** Función principal para actualizar todo el dashboard */
    const actualizarDashboard = () => {
        const periodo = periodoSelect.value || 'this_month';
        const ventasFiltradas = filtrarVentasPorPeriodo(periodo);

        // 1. Actualizar KPIs
        actualizarKPIs(ventasFiltradas);
        
        // 2. Actualizar Gráfico de Pastel
        actualizarGraficoCategorias(ventasFiltradas);

        // 3. Actualizar Gráfico de Líneas (siempre muestra los últimos 7 días)
        actualizarGraficoTendencia();

        // 4. Actualizar Tabla de Top Productos
        actualizarTablaTopProductos(ventasFiltradas);
    };
    
    // --- FUNCIONES DE ACTUALIZACIÓN DE UI ---

    const actualizarKPIs = (ventas) => {
        const ingresosTotales = ventas.reduce((sum, venta) => sum + venta.total, 0);
        const nroVentas = ventas.length;
        const ticketPromedio = nroVentas > 0 ? ingresosTotales / nroVentas : 0;
        
        const productosStockBajo = todosLosProductos.filter(p => p.stock <= p.stockMinimo).length;

        document.getElementById('kpi-ingresos-totales').textContent = `S/ ${ingresosTotales.toFixed(2)}`;
        document.getElementById('kpi-nro-ventas').textContent = nroVentas;
        document.getElementById('kpi-ticket-promedio').textContent = `S/ ${ticketPromedio.toFixed(2)}`;
        document.getElementById('kpi-stock-bajo').textContent = productosStockBajo;
    };

    const actualizarGraficoCategorias = (ventas) => {
        const ingresosPorCategoria = {};
        
        ventas.forEach(venta => {
            venta.items.forEach(item => {
                const categoria = item.categoria || 'Sin Categoría';
                const ingresoItem = item.cantidad * item.precio;
                ingresosPorCategoria[categoria] = (ingresosPorCategoria[categoria] || 0) + ingresoItem;
            });
        });
        
        const labels = Object.keys(ingresosPorCategoria);
        const data = Object.values(ingresosPorCategoria);
        const colors = getThemeColors();

        if (pieChartInstance) pieChartInstance.destroy(); // Destruir gráfico anterior
        
        const ctx = document.getElementById('ventasCategoriaChart').getContext('2d');
        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: { labels, datasets: [{ data, backgroundColor: getThemeColors().pieColors }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: colors.textColor // CAMBIO: Color de texto de la leyenda
                        }
                    }
                }
            }
        });
    };

    const actualizarGraficoTendencia = () => {
        const ventasUltimos7Dias = {};
        const labels = [];
        const hoy = new Date();

        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(hoy.getDate() - i);
            const fechaStr = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
            labels.push(fechaStr);
            ventasUltimos7Dias[fechaStr] = 0;
        }

        todasLasVentas.forEach(venta => {
            const [fechaParte] = venta.fecha.split(', ');
            const [dia, mes] = fechaParte.split('/');
            const fechaStr = `${dia}/${mes}`;
            if (ventasUltimos7Dias[fechaStr] !== undefined) {
                ventasUltimos7Dias[fechaStr] += venta.total;
            }
        });

        const data = Object.values(ventasUltimos7Dias);
        const colors = getThemeColors();

        if (lineChartInstance) lineChartInstance.destroy();

        const ctx = document.getElementById('tendenciaVentasChart').getContext('2d');
        lineChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Ingresos', data, ...getThemeColors().lineDataset }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            color: colors.textColor, // CAMBIO: Color de texto del eje Y
                            callback: function(value) {
                                return 'S/ ' + (value / 1000) + 'k';
                            }
                        },
                        grid: {
                            color: colors.gridColor // CAMBIO: Color de la cuadrícula del eje Y
                        }
                    },
                    x: {
                        ticks: {
                            color: colors.textColor // CAMBIO: Color de texto del eje X
                        },
                         grid: {
                            color: colors.gridColor // CAMBIO: Color de la cuadrícula del eje X
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    };

    const actualizarTablaTopProductos = (ventas) => {
        const unidadesPorProducto = {};

        ventas.forEach(venta => {
            venta.items.forEach(item => {
                if (unidadesPorProducto[item.nombre]) {
                    unidadesPorProducto[item.nombre].unidades += item.cantidad;
                } else {
                    unidadesPorProducto[item.nombre] = { 
                        nombre: item.nombre, 
                        categoria: item.categoria || 'N/A', 
                        unidades: item.cantidad 
                    };
                }
            });
        });
        
        const productosOrdenados = Object.values(unidadesPorProducto).sort((a, b) => b.unidades - a.unidades);
        const top5Productos = productosOrdenados.slice(0, 5);

        const tableBody = document.getElementById('top-products-table-body');
        tableBody.innerHTML = '';
        if(top5Productos.length === 0){
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay datos de ventas en este periodo.</td></tr>`;
            return;
        }
        top5Productos.forEach(prod => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${prod.nombre}</td>
                <td>${prod.categoria}</td>
                <td>${prod.unidades}</td>
            `;
            tableBody.appendChild(row);
        });
    };
    
    const getThemeColors = () => { 
        // Comprueba si el body tiene la clase del tema oscuro
        const isDarkMode = document.body.classList.contains('dark-theme');
        return {
            // Colores para textos y ejes de los gráficos
            textColor: isDarkMode ? '#E0E0E0' : '#666',
            gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            
            // Paleta de colores para los gráficos
            pieColors: ['#5378c5', '#FF6384', '#4BC0C0', '#FFCD56', '#c482de'],
            lineColor: isDarkMode ? '#5378c5' : '#004AAD',
            lineFillColor: isDarkMode ? 'rgba(83, 120, 197, 0.2)' : 'rgba(0, 74, 173, 0.1)'
        };
    };

    // --- EVENT LISTENERS ---
    periodoSelect.addEventListener('change', actualizarDashboard);
    
    // --- INICIALIZACIÓN ---
    actualizarDashboard(); // Primera carga del dashboard
});