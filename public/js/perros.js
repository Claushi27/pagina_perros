import { db, logEvent } from './firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getProductRating, generateStars } from './reviews.js';

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeMenuButton = document.querySelector('.close-menu');
    let lastFocusedElementBeforeMenu = null;

    // Accessible Mobile Menu
    const getFocusableElements = (container) => container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');

    const openMobileMenu = () => {
        if (!mobileMenu) return;
        lastFocusedElementBeforeMenu = document.activeElement;
        mobileMenu.classList.add('open');
        menuToggle.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        const focusables = getFocusableElements(mobileMenu);
        if (focusables.length > 0) focusables[0].focus();
        document.addEventListener('keydown', handleKeydownInMenu);
    };

    const closeMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', handleKeydownInMenu);
        (lastFocusedElementBeforeMenu || menuToggle).focus();
    };

    const handleKeydownInMenu = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closeMobileMenu(); return; }
        if (e.key === 'Tab') {
            const focusables = Array.from(getFocusableElements(mobileMenu));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('open');
            isOpen ? closeMobileMenu() : openMobileMenu();
        });
    }

    if (closeMenuButton && mobileMenu) {
        closeMenuButton.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
    }

    // Variable para almacenar productos
    let productosPerros = [];

    // Función para cargar productos de perros desde Firestore
    async function loadPerrosProducts() {
        const perrosGrid = document.getElementById('perrosGrid');

        try {
            // Mostrar indicador de carga
            perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando productos...</p>';

            // Consultar productos de perros desde Firestore
            const q = query(collection(db, 'productos'), where('categoria', '==', 'perros'));
            const querySnapshot = await getDocs(q);

            productosPerros = [];
            querySnapshot.forEach((doc) => {
                productosPerros.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Mostrar productos
            if (productosPerros.length === 0) {
                perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">No hay productos disponibles</p>';
                return;
            }

            // Renderizar productos con loading de ratings
            perrosGrid.innerHTML = productosPerros.map(producto => `
                <div class="perro-product-card" style="cursor: pointer;" onclick="window.location.href='product-detail.html?id=${producto.id}'">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
                    <div class="perro-product-info">
                        <span class="perro-product-category">PERROS</span>
                        <h3>${producto.nombre}</h3>
                        <p>${producto.descripcion}</p>
                        <div id="rating-${producto.id}" class="product-rating" style="margin: 0.5rem 0; min-height: 24px;">
                            <div style="color: #999; font-size: 0.9rem;">Cargando...</div>
                        </div>
                        <div class="perro-product-price">$${producto.precio.toLocaleString()}</div>
                        <button class="perro-add-btn" onclick="event.stopPropagation(); agregarAlCarrito('${producto.id}')">
                            🛒 Agregar al carrito
                        </button>
                    </div>
                </div>
            `).join('');

            // Cargar ratings de cada producto
            productosPerros.forEach(async (producto) => {
                const { average, count } = await getProductRating(producto.id);
                const ratingContainer = document.getElementById(`rating-${producto.id}`);
                if (ratingContainer) {
                    if (count > 0) {
                        ratingContainer.innerHTML = `
                            ${generateStars(average)}
                            <span style="font-size: 0.85rem; color: #666; margin-left: 0.5rem;">
                                ${average.toFixed(1)} (${count})
                            </span>
                        `;
                    } else {
                        ratingContainer.innerHTML = `
                            <span style="font-size: 0.85rem; color: #999;">Sin reseñas aún</span>
                        `;
                    }
                }
            });
        } catch (error) {
            console.error('Error cargando productos:', error);
            perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: red;">Error al cargar productos. Intenta recargar la página.</p>';
        }
    }

    // Función para agregar al carrito
    window.agregarAlCarrito = function(productoId) {
        const producto = productosPerros.find(p => p.id === productoId);
        if (producto) {
            // Usar CartUtils para agregar al carrito con notificación
            if (window.CartUtils) {
                window.CartUtils.addToCart(producto);
            } else {
                // Fallback si CartUtils no está disponible
                let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
                const productoExistente = carrito.find(p => p.id === productoId);

                if (productoExistente) {
                    productoExistente.cantidad += 1;
                } else {
                    carrito.push({
                        ...producto,
                        cantidad: 1
                    });
                }

                localStorage.setItem('carrito', JSON.stringify(carrito));
            }

            // Registrar evento en Analytics
            try {
                logEvent('add_to_cart', {
                    item_id: producto.id,
                    item_name: producto.nombre,
                    item_category: producto.categoria,
                    price: producto.precio,
                    currency: 'CLP'
                });
            } catch (error) {
                console.log('Analytics no disponible:', error);
            }
        }
    };

    // Función para actualizar contador del carrito
    function updateCartCounter() {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        
        const cartIcon = document.querySelector('.header-icons .icon:last-child');
        if (cartIcon && totalItems > 0) {
            cartIcon.innerHTML = `🛒 <span class="cart-count">${totalItems}</span>`;
        } else if (cartIcon) {
            cartIcon.innerHTML = `🛒`;
        }
    }

    // Función para realizar búsqueda
    window.performSearch = function() {
        const searchInput = document.getElementById('searchInput');
        const termino = searchInput.value.trim();
        
        if (termino.length >= 2) {
            window.location.href = `search.html?q=${encodeURIComponent(termino)}`;
        } else {
            alert('Por favor ingresa al menos 2 caracteres para buscar');
        }
    };

    // Event listeners para búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.performSearch();
            }
        });
    }

    // Cargar productos al inicializar
    loadPerrosProducts();
    updateCartCounter();
});

