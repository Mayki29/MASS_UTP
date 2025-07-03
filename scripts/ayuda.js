/* scripts/ayuda.js */

document.addEventListener('DOMContentLoaded', () => {
    // Proteger la página
    checkUserSession();

    // Lógica para el acordeón de FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const answer = item.querySelector('.faq-answer');
            const isActive = item.classList.contains('active');

            // Opcional: Cerrar todos los demás antes de abrir el nuevo
            document.querySelectorAll('.faq-item.active').forEach(activeItem => {
                if (activeItem !== item) {
                    activeItem.classList.remove('active');
                    activeItem.querySelector('.faq-answer').style.maxHeight = 0;
                }
            });
            
            // Abrir/Cerrar el actual
            if (isActive) {
                item.classList.remove('active');
                answer.style.maxHeight = 0;
            } else {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px'; // Altura dinámica
            }
        });
    });
});