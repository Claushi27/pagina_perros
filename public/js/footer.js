// Footer Newsletter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailInput = document.getElementById('newsletterEmail');
            const submitBtn = newsletterForm.querySelector('button');
            const email = emailInput.value.trim();

            if (!email) {
                showNewsletterMessage('Por favor ingresa tu email', 'error');
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNewsletterMessage('Por favor ingresa un email válido', 'error');
                return;
            }

            // Deshabilitar botón mientras se procesa
            submitBtn.disabled = true;
            submitBtn.textContent = 'Suscribiendo...';

            try {
                // Importar Firebase dinámicamente
                const { db } = await import('./firebase-config.js');
                const { collection, addDoc, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

                // Verificar si el email ya está suscrito
                const newsletterRef = collection(db, 'newsletter');
                const q = query(newsletterRef, where('email', '==', email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    showNewsletterMessage('Este email ya está suscrito', 'info');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Suscribirse';
                    return;
                }

                // Guardar en Firestore
                await addDoc(newsletterRef, {
                    email: email,
                    fechaSuscripcion: new Date().toISOString(),
                    activo: true
                });

                showNewsletterMessage('¡Gracias por suscribirte! 🎉', 'success');
                emailInput.value = '';
                emailInput.classList.add('newsletter-success');

                setTimeout(() => {
                    emailInput.classList.remove('newsletter-success');
                }, 2000);

            } catch (error) {
                console.error('Error al suscribirse:', error);
                showNewsletterMessage('Error al suscribirse. Inténtalo nuevamente.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Suscribirse';
            }
        });
    }
});

function showNewsletterMessage(message, type) {
    // Eliminar mensaje anterior si existe
    const existingMessage = document.querySelector('.newsletter-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `newsletter-message newsletter-message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        margin-top: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        animation: slideDown 0.3s ease;
    `;

    if (type === 'success') {
        messageDiv.style.background = 'rgba(76, 175, 80, 0.2)';
        messageDiv.style.color = '#4CAF50';
        messageDiv.style.border = '1px solid #4CAF50';
    } else if (type === 'error') {
        messageDiv.style.background = 'rgba(244, 67, 54, 0.2)';
        messageDiv.style.color = '#f44336';
        messageDiv.style.border = '1px solid #f44336';
    } else if (type === 'info') {
        messageDiv.style.background = 'rgba(33, 150, 243, 0.2)';
        messageDiv.style.color = '#2196F3';
        messageDiv.style.border = '1px solid #2196F3';
    }

    const form = document.getElementById('newsletterForm');
    form.parentNode.insertBefore(messageDiv, form.nextSibling);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Smooth scroll para enlaces del footer
document.querySelectorAll('.footer-links a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
