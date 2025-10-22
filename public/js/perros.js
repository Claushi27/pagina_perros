import { db, logEvent } from './firebase-config.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getProductRating, generateStars } from './reviews.js';
import { applyFilters, createFilterPanel, updateFilter, clearFilters } from './filters.js';
import { toggleFavorite, checkIfFavorite, updateFavoriteButton, initializeFavoriteButtons } from './favorites.js';

document.addEventListener('DOMContentLoaded', () => {
    // Variable para almacenar productos
    let productosPerros = [];
    let allProductosPerros = [];

    // Función para cargar productos de perros desde Firestore
    async function loadPerrosProducts() {
        const perrosGrid = document.getElementById('perrosGrid');
        const filtersContainer = document.getElementById('filtersContainer');

        try {
            // Mostrar indicador de carga
            if (perrosGrid) perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">Cargando productos...</p>';

            // Consultar productos de perros desde Firestore
            const q = query(collection(db, 'productos'), where('categoria', '==', 'perros'));
            const querySnapshot = await getDocs(q);

            allProductosPerros = [];
            querySnapshot.forEach((doc) => {
                allProductosPerros.push({
                    id: doc.id,  // Usar docId de Firestore como ID
                    ...doc.data()
                });
            });

            // Mostrar productos
            if (allProductosPerros.length === 0) {
                if (perrosGrid) perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">No hay productos disponibles</p>';
                return;
            }

            // Crear panel de filtros si existe el contenedor
            if (filtersContainer) {
                filtersContainer.innerHTML = createFilterPanel(allProductosPerros, 'perros');
            }

            // Leer parámetro de categoría de la URL y aplicar filtro
            const urlParams = new URLSearchParams(window.location.search);
            const subcategoria = urlParams.get('categoria');

            if (subcategoria) {
                // Esperar un momento para que los filtros se rendericen
                setTimeout(() => {
                    const subcategoriaBtn = document.querySelector(`.filter-btn[data-subcategoria="${subcategoria}"]`);
                    if (subcategoriaBtn) {
                        subcategoriaBtn.click();
                    }
                }, 100);
            }

            // Aplicar filtros y renderizar
            renderProducts(allProductosPerros);

        } catch (error) {
            console.error('Error cargando productos:', error);
            if (perrosGrid) perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: red;">Error al cargar productos. Intenta recargar la página.</p>';
        }
    }

    // Función para renderizar productos
    async function renderProducts(productos) {
        const perrosGrid = document.getElementById('perrosGrid');
        if (!perrosGrid) return;

        // Aplicar filtros
        const filteredProducts = applyFilters(productos);
        productosPerros = filteredProducts;

        // Actualizar contador de resultados
        const filterResultCount = document.getElementById('filterResultCount');
        if (filterResultCount) {
            filterResultCount.textContent = `Mostrando ${filteredProducts.length} de ${allProductosPerros.length} productos`;
        }

        if (filteredProducts.length === 0) {
            perrosGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">No se encontraron productos con los filtros seleccionados</p>';
            return;
        }

        // Renderizar productos con loading de ratings y botón de favoritos
        perrosGrid.innerHTML = filteredProducts.map(producto => {
            const descuento = producto.descuento || 0;
            const precioOriginal = producto.precio;
            const precioConDescuento = descuento > 0 ? Math.round(precioOriginal * (1 - descuento / 100)) : precioOriginal;
            const tieneDescuento = descuento > 0;

            return `
            <div class="perro-product-card" style="cursor: pointer; position: relative;" onclick="window.location.href='product-detail.html?id=${producto.id}'">
                ${tieneDescuento ? `<div class="discount-badge" style="position: absolute; top: 10px; left: 10px; background: #ff4757; color: white; padding: 0.3rem 0.6rem; border-radius: 5px; font-weight: bold; font-size: 0.85rem; z-index: 10; box-shadow: 0 2px 8px rgba(255,71,87,0.3);">-${descuento}%</div>` : ''}
                <button class="favorite-btn" data-product-id="${producto.id}" onclick="event.stopPropagation(); handleFavoriteClick('${producto.id}')"
                        style="position: absolute; top: 10px; right: 10px; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; transition: transform 0.2s;">
                    🤍
                </button>
                <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
                <div class="perro-product-info">
                    <span class="perro-product-category">PERROS</span>
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion}</p>
                    <div id="rating-${producto.id}" class="product-rating" style="margin: 0.5rem 0; min-height: 24px;">
                        <div style="color: #999; font-size: 0.9rem;">Cargando...</div>
                    </div>
                    <div class="perro-product-price">
                        ${tieneDescuento ? `
                            <span style="text-decoration: line-through; color: #999; font-size: 0.9rem; display: block;">$${precioOriginal.toLocaleString()}</span>
                            <span style="color: #ff4757; font-weight: bold; font-size: 1.2rem;">$${precioConDescuento.toLocaleString()}</span>
                        ` : `$${precioOriginal.toLocaleString()}`}
                    </div>
                    <button class="perro-add-btn" onclick="event.stopPropagation(); agregarAlCarrito('${producto.id}')">
                        🛒 Agregar al carrito
                    </button>
                </div>
            </div>
        `;
        }).join('');

        // Cargar ratings de cada producto
        filteredProducts.forEach(async (producto) => {
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

        // Inicializar botones de favoritos
        await initializeFavoriteButtons();
    }

    // Manejar click en favoritos
    window.handleFavoriteClick = async function(productId) {
        const button = document.querySelector(`.favorite-btn[data-product-id="${productId}"]`);
        if (button) {
            const newState = await toggleFavorite(productId);
            if (newState !== null) {
                updateFavoriteButton(button, newState);
            }
        }
    };

    // Funciones globales para filtros
    window.updatePriceFilter = function(value) {
        updateFilter('priceMax', value);
        renderProducts(allProductosPerros);
    };

    window.updateBrandFilter = function(brand) {
        updateFilter('brand', brand);
        renderProducts(allProductosPerros);
    };

    window.updateAgeFilter = function(age) {
        updateFilter('age', age);
        renderProducts(allProductosPerros);
    };

    window.updateSortFilter = function(sortBy) {
        updateFilter('sortBy', sortBy);
        renderProducts(allProductosPerros);
    };

    window.clearAllFilters = function() {
        clearFilters();
        // Reset UI
        document.getElementById('priceMin').value = 0;
        document.getElementById('priceMax').value = '';
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        document.querySelector('select').value = 'default';
        renderProducts(allProductosPerros);
    };

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

