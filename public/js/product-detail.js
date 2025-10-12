import { auth, db } from './firebase-config.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getProductRating, generateStars, renderRatingSummary, renderReviewsList, openReviewModal } from './reviews.js';

// Obtener el ID del producto de la URL
const urlParams = new URLSearchParams(window.location.search);
const productIdParam = urlParams.get('id');
const productId = isNaN(productIdParam) ? productIdParam : parseInt(productIdParam);

let currentProduct = null;
let allProducts = [];

// Cargar producto desde Firestore
async function loadProduct() {
    if (!productId && productId !== 0) {
        console.error('No hay ID de producto en la URL');
        window.location.href = 'index.html';
        return;
    }

    try {
        const productRef = collection(db, 'productos');
        const q = query(productRef, where('id', '==', productId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error('Producto no encontrado');
            window.location.href = 'index.html';
            return;
        }

        querySnapshot.forEach((doc) => {
            currentProduct = { ...doc.data(), docId: doc.id };
        });

        // Cargar todos los productos para relacionados
        const allProductsSnapshot = await getDocs(collection(db, 'productos'));
        allProducts = allProductsSnapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));

        renderProduct();
        loadRelatedProducts();
        setupTabs();
        setupQuantityControls();
        setupAddToCart();

    } catch (error) {
        console.error('Error al cargar producto:', error);
        alert('Error al cargar el producto');
    }
}

// Renderizar producto
function renderProduct() {
    if (!currentProduct) return;

    // Breadcrumb
    document.getElementById('breadcrumbCategory').textContent = currentProduct.categoria.toUpperCase();
    document.getElementById('breadcrumbCategory').href = `${currentProduct.categoria}.html`;
    document.getElementById('breadcrumbProduct').textContent = currentProduct.nombre;

    // Categoría badge
    document.getElementById('productCategory').textContent = currentProduct.categoria.toUpperCase();

    // Título
    document.getElementById('productTitle').textContent = currentProduct.nombre;

    // Precio
    document.getElementById('productPrice').textContent = `$${currentProduct.precio.toLocaleString('es-CL')}`;

    // Descripción
    document.getElementById('productDescription').textContent = currentProduct.descripcion;

    // Imagen principal
    const mainImage = document.getElementById('mainImage');
    mainImage.src = currentProduct.imagen;
    mainImage.alt = currentProduct.nombre;

    // Thumbnails (simulando múltiples imágenes - en producción vendrían de la BD)
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    const images = [currentProduct.imagen, currentProduct.imagen, currentProduct.imagen];

    thumbnailContainer.innerHTML = images.map((img, index) => `
        <img src="${img}"
             alt="${currentProduct.nombre}"
             class="thumbnail ${index === 0 ? 'active' : ''}"
             onclick="changeMainImage('${img}', this)">
    `).join('');

    // Características
    const features = [
        'Producto de alta calidad',
        'Recomendado por veterinarios',
        'Ingredientes naturales',
        'Sin conservantes artificiales',
        'Libre de transgénicos'
    ];

    document.getElementById('featuresList').innerHTML = features.map(feature =>
        `<li>${feature}</li>`
    ).join('');

    // Rating
    loadProductRating();

    // Descripción detallada para tab
    document.getElementById('detailedDescription').innerHTML = `
        <h3>Acerca de este producto</h3>
        <p style="line-height: 1.8; color: #666; margin-bottom: 1rem;">
            ${currentProduct.descripcion}
        </p>
        <p style="line-height: 1.8; color: #666; margin-bottom: 1rem;">
            Este producto ha sido cuidadosamente seleccionado por nuestro equipo de expertos para garantizar
            la mejor calidad para tu mascota. Cumple con todos los estándares de seguridad y calidad.
        </p>
        <h4 style="margin-top: 2rem; margin-bottom: 1rem;">¿Por qué elegir este producto?</h4>
        <ul style="line-height: 2; color: #666;">
            <li>✓ Fabricado con los más altos estándares de calidad</li>
            <li>✓ Probado y aprobado por profesionales veterinarios</li>
            <li>✓ Garantía de satisfacción del 100%</li>
            <li>✓ Envío rápido y seguro</li>
        </ul>
    `;

    // Especificaciones
    const specifications = [
        ['Marca', 'Premium Pet'],
        ['Categoría', currentProduct.categoria.charAt(0).toUpperCase() + currentProduct.categoria.slice(1)],
        ['Peso', '1.5 kg'],
        ['Dimensiones', '30 x 20 x 15 cm'],
        ['País de origen', 'Chile'],
        ['Garantía', '30 días']
    ];

    document.getElementById('specificationsTable').innerHTML = specifications.map(([key, value]) => `
        <tr>
            <td>${key}</td>
            <td>${value}</td>
        </tr>
    `).join('');
}

// Cambiar imagen principal
window.changeMainImage = function(imageSrc, thumbnail) {
    document.getElementById('mainImage').src = imageSrc;

    // Actualizar thumbnails activos
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
};

// Cargar rating del producto
async function loadProductRating() {
    try {
        const { average, count } = await getProductRating(productId);
        const ratingContainer = document.getElementById('productRating');

        if (count > 0) {
            ratingContainer.innerHTML = `
                ${generateStars(average)}
                <span style="font-size: 1rem; color: #666; margin-left: 0.5rem; font-weight: 600;">
                    ${average.toFixed(1)} (${count} reseñas)
                </span>
            `;
        } else {
            ratingContainer.innerHTML = `
                ${generateStars(0)}
                <span style="font-size: 1rem; color: #999; margin-left: 0.5rem;">
                    Sin reseñas aún
                </span>
            `;
        }

        // Cargar reviews en el tab
        await renderRatingSummary(productId, 'ratingSummary');
        await renderReviewsList(productId, 'reviewsList');

        // Setup write review button
        document.getElementById('writeReviewBtn').addEventListener('click', () => {
            openReviewModal(productId, currentProduct.nombre);
        });

    } catch (error) {
        console.error('Error al cargar rating:', error);
    }
}

// Cargar productos relacionados
function loadRelatedProducts() {
    if (!currentProduct) return;

    // Filtrar productos de la misma categoría, excluyendo el actual
    const relatedProducts = allProducts
        .filter(p => p.categoria === currentProduct.categoria && p.id !== productId)
        .slice(0, 4);

    const container = document.getElementById('relatedProductsGrid');

    if (relatedProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No hay productos relacionados disponibles</p>';
        return;
    }

    container.innerHTML = relatedProducts.map(producto => `
        <div class="related-product-card" onclick="window.location.href='product-detail.html?id=${producto.id}'">
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <div class="related-product-info">
                <h3>${producto.nombre}</h3>
                <div class="related-product-price">$${producto.precio.toLocaleString('es-CL')}</div>
            </div>
        </div>
    `).join('');
}

// Setup tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Remover active de todos los tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar el tab seleccionado
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Setup controles de cantidad
function setupQuantityControls() {
    const quantityInput = document.getElementById('quantity');

    window.incrementQuantity = function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue < 99) {
            quantityInput.value = currentValue + 1;
        }
    };

    window.decrementQuantity = function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    };

    // Validar input manual
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        if (isNaN(value) || value < 1) {
            quantityInput.value = 1;
        } else if (value > 99) {
            quantityInput.value = 99;
        }
    });
}

// Setup agregar al carrito
function setupAddToCart() {
    const addToCartBtn = document.getElementById('addToCartBtn');

    addToCartBtn.addEventListener('click', () => {
        const quantity = parseInt(document.getElementById('quantity').value);

        // Usar la función global agregarAlCarrito de cart-utils.js
        if (typeof window.agregarAlCarrito === 'function') {
            for (let i = 0; i < quantity; i++) {
                window.agregarAlCarrito(productId);
            }

            // Feedback visual
            addToCartBtn.innerHTML = '<span>✓</span><span>¡Agregado!</span>';
            addToCartBtn.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';

            setTimeout(() => {
                addToCartBtn.innerHTML = '<span>🛒</span><span>Agregar al Carrito</span>';
                addToCartBtn.style.background = '';
            }, 2000);
        } else {
            alert('Producto agregado al carrito');
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadProduct);
