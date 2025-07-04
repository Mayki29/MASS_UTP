/* scripts/reportes.js (versión con temas dinámicos para gráficos) */

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();

    // --- FUNCIÓN PARA OBTENER COLORES DEL TEMA ACTUAL ---
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

    const colors = getThemeColors();

    // --- GRÁFICO DE PASTEL (VENTAS POR CATEGORÍA) ---
    const ctxPie = document.getElementById('ventasCategoriaChart');
    if (ctxPie) {
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Abarrotes', 'Bebidas', 'Limpieza', 'Lácteos', 'Otros'],
                datasets: [{
                    label: 'Ventas por Categoría',
                    data: [50, 25, 15, 10, 5],
                    backgroundColor: colors.pieColors, // CAMBIO: Colores dinámicos
                    borderColor: document.body.classList.contains('dark-theme') ? '#1E1E1E' : '#fff' // Borde del color de la tarjeta
                }]
            },
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
    }

    // --- GRÁFICO DE LÍNEAS (TENDENCIA DE VENTAS) ---
    const ctxLine = document.getElementById('tendenciaVentasChart');
    if (ctxLine) {
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'],
                datasets: [{
                    label: 'Ventas Mensuales',
                    data: [3200, 3500, 4800, 4200, 5500, 5100, 6000, 5800, 6200],
                    borderColor: colors.lineColor, // CAMBIO: Color de línea dinámico
                    backgroundColor: colors.lineFillColor, // CAMBIO: Color de relleno dinámico
                    fill: true,
                    tension: 0.4
                }]
            },
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
    }
});