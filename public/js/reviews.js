import { auth, db } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, getDoc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Función para generar estrellas HTML
export function generateStars(rating, interactive = false) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '<div class="star-rating">';

    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
        starsHTML += `<span class="star filled" ${interactive ? `data-rating="${i + 1}"` : ''}>⭐</span>`;
    }

    // Media estrella
    if (hasHalfStar) {
        starsHTML += `<span class="star half-filled">⭐</span>`;
    }

    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += `<span class="star">⭐</span>`;
    }

    starsHTML += '</div>';
    return starsHTML;
}

// Calcular promedio de calificaciones
export async function getProductRating(productId) {
    try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(
            reviewsRef,
            where('productId', '==', productId),
            where('status', '==', 'approved')
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { average: 0, count: 0 };
        }

        let totalRating = 0;
        let count = 0;

        querySnapshot.forEach((doc) => {
            totalRating += doc.data().rating;
            count++;
        });

        return {
            average: totalRating / count,
            count: count
        };
    } catch (error) {
        console.error('Error al obtener rating:', error);
        return { average: 0, count: 0 };
    }
}

// Cargar reviews de un producto
export async function loadProductReviews(productId, sortBy = 'recent') {
    try {
        const reviewsRef = collection(db, 'reviews');
        let q = query(
            reviewsRef,
            where('productId', '==', productId),
            where('status', '==', 'approved')
        );

        const querySnapshot = await getDocs(q);
        let reviews = [];

        querySnapshot.forEach((doc) => {
            reviews.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Ordenar en JavaScript
        switch(sortBy) {
            case 'recent':
                reviews.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });
                break;
            case 'highest':
                reviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                reviews.sort((a, b) => a.rating - b.rating);
                break;
            case 'helpful':
                reviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
                break;
        }

        return reviews;
    } catch (error) {
        console.error('Error al cargar reviews:', error);
        return [];
    }
}

// Renderizar resumen de calificaciones
export function renderRatingSummary(productId, containerId) {
    getProductRating(productId).then(({ average, count }) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (count === 0) {
            container.innerHTML = `
                <div class="rating-summary">
                    <div class="reviews-empty">
                        <div class="reviews-empty-icon">⭐</div>
                        <h3>Aún no hay reseñas</h3>
                        <p>Sé el primero en compartir tu opinión</p>
                    </div>
                </div>
            `;
            return;
        }

        // Obtener distribución de calificaciones
        getReviewsDistribution(productId).then(distribution => {
            container.innerHTML = `
                <div class="rating-summary">
                    <div class="rating-number">${average.toFixed(1)}</div>
                    <div class="rating-details">
                        <div class="rating-stars-large">
                            ${generateStars(average)}
                        </div>
                        <div class="rating-count">${count} ${count === 1 ? 'reseña' : 'reseñas'}</div>
                    </div>
                    <div class="rating-bars">
                        ${[5,4,3,2,1].map(star => {
                            const starCount = distribution[star] || 0;
                            const percentage = count > 0 ? (starCount / count) * 100 : 0;
                            return `
                                <div class="rating-bar-item">
                                    <span class="rating-bar-label">${star} ⭐</span>
                                    <div class="rating-bar-container">
                                        <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="rating-bar-count">${starCount}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
    });
}

// Obtener distribución de calificaciones
async function getReviewsDistribution(productId) {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
        reviewsRef,
        where('productId', '==', productId),
        where('status', '==', 'approved')
    );

    const querySnapshot = await getDocs(q);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    querySnapshot.forEach((doc) => {
        const rating = doc.data().rating;
        distribution[rating]++;
    });

    return distribution;
}

// Renderizar lista de reviews
export async function renderReviewsList(productId, containerId, sortBy = 'recent') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const reviews = await loadProductReviews(productId, sortBy);

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="reviews-empty">
                <div class="reviews-empty-icon">💬</div>
                <h3>Sin comentarios aún</h3>
                <p>Sé el primero en dejar una reseña</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');
}

// Crear card de review
function createReviewCard(review) {
    const date = review.createdAt?.toDate?.() || new Date();
    const dateStr = date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const userInitial = review.userName?.charAt(0)?.toUpperCase() || '?';
    const verifiedBadge = review.verified ? '<span class="review-verified">✓ Compra verificada</span>' : '';

    return `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user">
                    <div class="review-avatar">${userInitial}</div>
                    <div class="review-user-info">
                        <h4>${review.userName}</h4>
                        <span class="review-date">${dateStr}</span>
                    </div>
                </div>
                ${verifiedBadge}
            </div>
            <div class="review-content">
                <div class="review-rating">
                    ${generateStars(review.rating)}
                </div>
                <p class="review-text">${review.comment}</p>
                ${review.images && review.images.length > 0 ? `
                    <div class="review-images">
                        ${review.images.map(img => `
                            <img src="${img}" alt="Review image" class="review-image" onclick="openImageModal('${img}')">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="review-actions">
                <button class="review-action-btn ${review.helpful > 0 ? 'active' : ''}" onclick="markHelpful('${review.id}')">
                    👍 Útil (${review.helpful || 0})
                </button>
            </div>
        </div>
    `;
}

// Abrir modal para escribir review
export function openReviewModal(productId, productName) {
    const modal = document.getElementById('reviewModal');
    if (!modal) {
        createReviewModal(productId, productName);
    } else {
        modal.classList.add('active');
        document.getElementById('reviewProductId').value = productId;
        document.getElementById('reviewProductName').textContent = productName;
    }
}

// Crear modal de review
function createReviewModal(productId, productName) {
    const modalHTML = `
        <div id="reviewModal" class="review-form-modal active">
            <div class="review-form-container">
                <div class="review-form-header">
                    <h3>Escribe tu reseña</h3>
                    <button class="review-form-close" onclick="closeReviewModal()">×</button>
                </div>
                <p style="color: #666; margin-bottom: 1.5rem;">Producto: <strong id="reviewProductName">${productName}</strong></p>

                <form id="reviewForm">
                    <input type="hidden" id="reviewProductId" value="${productId}">

                    <div class="review-form-group">
                        <label>Calificación *</label>
                        <div class="rating-input" id="ratingInput">
                            ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">⭐</span>`).join('')}
                        </div>
                        <input type="hidden" id="reviewRating" required>
                    </div>

                    <div class="review-form-group">
                        <label>Tu reseña *</label>
                        <textarea id="reviewComment" placeholder="Comparte tu experiencia con este producto..." required minlength="20"></textarea>
                    </div>

                    <div class="review-form-actions">
                        <button type="button" class="btn-cancel" onclick="closeReviewModal()">Cancelar</button>
                        <button type="submit" class="btn-submit-review">Publicar reseña</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupReviewForm();
}

// Configurar formulario de review
function setupReviewForm() {
    // Rating stars interaction
    const stars = document.querySelectorAll('#ratingInput .star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            document.getElementById('reviewRating').value = rating;

            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
        });
    });

    // Form submission
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);
}

// Manejar envío de review
async function handleReviewSubmit(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert('Debes iniciar sesión para dejar una reseña');
        window.location.href = 'login.html';
        return;
    }

    const productId = document.getElementById('reviewProductId').value;
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;

    if (!rating) {
        alert('Por favor selecciona una calificación');
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit-review');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';

    try {
        // Verificar si el usuario compró el producto
        const verified = await checkIfUserBoughtProduct(user.uid, productId);

        // Obtener nombre del usuario
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        const userName = userDoc.data()?.nombre || user.displayName || user.email.split('@')[0];

        // Guardar review
        await addDoc(collection(db, 'reviews'), {
            productId,
            userId: user.uid,
            userName,
            rating,
            comment,
            images: [], // Por ahora sin imágenes
            verified,
            helpful: 0,
            createdAt: serverTimestamp(),
            status: 'approved' // Auto-aprobar (puedes cambiar a 'pending' para moderación)
        });

        alert('¡Gracias por tu reseña! 🎉');
        closeReviewModal();

        // Recargar reviews
        location.reload();
    } catch (error) {
        console.error('Error al publicar reseña:', error);
        alert('Error al publicar la reseña. Inténtalo nuevamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar reseña';
    }
}

// Verificar si el usuario compró el producto
async function checkIfUserBoughtProduct(userId, productId) {
    try {
        const ordersRef = collection(db, 'pedidos');
        const q = query(ordersRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        for (const orderDoc of querySnapshot.docs) {
            const order = orderDoc.data();
            if (order.productos && order.productos.some(p => String(p.id) === String(productId))) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error verificando compra:', error);
        return false;
    }
}

// Cerrar modal
window.closeReviewModal = function() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

// Marcar como útil
window.markHelpful = async function(reviewId) {
    try {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, {
            helpful: increment(1)
        });

        // Actualizar UI
        const btn = event.target.closest('.review-action-btn');
        btn.classList.add('active');
        const currentCount = parseInt(btn.textContent.match(/\d+/)[0]);
        btn.innerHTML = `👍 Útil (${currentCount + 1})`;
    } catch (error) {
        console.error('Error al marcar como útil:', error);
    }
};

// Abrir imagen en modal
window.openImageModal = function(imageUrl) {
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
            <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; border-radius: 10px;">
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};
