/* scripts/reportes.js */

document.addEventListener('DOMContentLoaded', () => {
    // Proteger la página
    checkUserSession();

    // --- GRÁFICO DE PASTEL (VENTAS POR CATEGORÍA) ---
    const ctxPie = document.getElementById('ventasCategoriaChart');
    if (ctxPie) {
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Abarrotes', 'Bebidas', 'Limpieza', 'Lácteos'],
                datasets: [{
                    label: 'Ventas por Categoría',
                    data: [50, 25, 15, 10], // Valores de ejemplo
                    backgroundColor: [
                        '#004AAD', // Azul MASS
                        '#FF6384', // Rosa
                        '#4BC0C0', // Turquesa
                        '#FFCD56', // Amarillo
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right', // Muestra la leyenda a la derecha
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
                    borderColor: '#004AAD',
                    backgroundColor: 'rgba(0, 74, 173, 0.1)',
                    fill: true,
                    tension: 0.4 // Para curvas suaves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false, // El eje Y no empieza en 0
                        ticks: {
                            callback: function(value, index, values) {
                                return 'S/ ' + (value / 1000) + 'k'; // Formato del eje Y
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // Oculta la leyenda del dataset
                    }
                }
            }
        });
    }
});