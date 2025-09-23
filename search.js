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

    // Fuente de productos centralizada
    const productos = window.PRODUCTS || [];

    // Función de búsqueda
    function buscarProductos(termino) {
        if (!termino || termino.length < 2) {
            return [];
        }
        
        const terminoLower = termino.toLowerCase();
        return productos.filter(producto => 
            producto.nombre.toLowerCase().includes(terminoLower) ||
            producto.categoria.toLowerCase().includes(terminoLower) ||
            producto.subcategoria.toLowerCase().includes(terminoLower) ||
            producto.descripcion.toLowerCase().includes(terminoLower)
        );
    }

    // Función para mostrar resultados
    function mostrarResultados(resultados, termino) {
        const searchResults = document.getElementById('searchResults');
        const noResults = document.getElementById('noResults');
        const searchTermValue = document.getElementById('searchTermValue');
        
        // Actualizar el término de búsqueda mostrado
        if (searchTermValue) {
            searchTermValue.textContent = termino;
        }

        if (resultados.length === 0) {
            searchResults.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        searchResults.style.display = 'grid';
        noResults.style.display = 'none';

        searchResults.innerHTML = `
            ${resultados.map(producto => `
                <div class="product-card">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
                    <div class="product-info">
                        <h4>${producto.nombre}</h4>
                        <p class="product-category">${producto.categoria} - ${producto.subcategoria}</p>
                        <p class="product-description">${producto.descripcion}</p>
                        <div class="product-price">$${producto.precio.toLocaleString()}</div>
                        <button class="add-to-cart-btn" onclick="agregarAlCarrito(${producto.id})">
                            Agregar al carrito
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    // Función para agregar al carrito
    window.agregarAlCarrito = function(productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;
        if (window.CartUtils) window.CartUtils.addToCart(producto);
    };

    // Función para actualizar contador del carrito
    function actualizarContadorCarrito() { if (window.CartUtils) window.CartUtils.updateCartCounter(); }

    // Función para realizar búsqueda
    window.performSearch = function() {
        const searchInput = document.getElementById('searchInput');
        const termino = searchInput.value.trim();
        
        if (termino.length >= 2) {
            const resultados = buscarProductos(termino);
            mostrarResultados(resultados, termino);
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

    // Cargar búsqueda desde URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q');
    if (searchTerm) {
        searchInput.value = searchTerm;
        const resultados = buscarProductos(searchTerm);
        mostrarResultados(resultados, searchTerm);
    }

    // Inicializar contador del carrito
    actualizarContadorCarrito();
});
