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

    // Estado de filtros y búsquedas recientes
    const selectedFilters = new Set(); // permite combinar múltiples filtros
    const RECENTS_KEY = 'recentSearches';
    const MAX_RECENTS = 5;

    const getRecents = () => {
        try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || []; } catch { return []; }
    };
    const setRecents = (items) => localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, MAX_RECENTS)));
    const pushRecent = (term) => {
        if (!term) return;
        const recents = getRecents().filter(t => t.toLowerCase() !== term.toLowerCase());
        recents.unshift(term);
        setRecents(recents);
    };

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
    function highlight(text, term) {
        if (!term) return text;
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'ig');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function renderRecents() {
        const filtersSection = document.querySelector('.filters-section');
        if (!filtersSection) return;
        let container = document.getElementById('recentSearches');
        if (!container) {
            container = document.createElement('div');
            container.id = 'recentSearches';
            container.style.marginTop = '0.75rem';
            container.style.textAlign = 'center';
            filtersSection.appendChild(container);
        }
        const recents = getRecents();
        if (recents.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = recents.map(t => `<button class="filter-btn" data-recent="${t}">${t}</button>`).join(' ');
        container.querySelectorAll('button[data-recent]').forEach(btn => {
            btn.addEventListener('click', () => {
                const term = btn.getAttribute('data-recent');
                const input = document.getElementById('searchInput');
                if (input) input.value = term;
                aplicarBusqueda(term);
            });
        });
    }

    function aplicarFiltros(items) {
        if (selectedFilters.size === 0 || selectedFilters.has('all')) return items;
        return items.filter(p => {
            const tags = new Set([p.categoria, p.subcategoria]);
            for (const f of selectedFilters) {
                if (!tags.has(f)) return false;
            }
            return true;
        });
    }

    function mostrarResultados(resultados, termino) {
        const searchResults = document.getElementById('searchResults');
        const noResults = document.getElementById('noResults');
        const searchTermValue = document.getElementById('searchTermValue');
        
        // Actualizar el término de búsqueda mostrado
        if (searchTermValue) {
            searchTermValue.textContent = termino;
        }

        const resultadosFiltrados = aplicarFiltros(resultados);

        if (resultadosFiltrados.length === 0) {
            searchResults.style.display = 'none';
            noResults.style.display = 'block';
            const p = noResults.querySelector('p');
            if (p && termino && termino.length < 2) p.textContent = 'Ingresa al menos 2 caracteres para buscar';
            return;
        }

        searchResults.style.display = 'grid';
        noResults.style.display = 'none';

        searchResults.innerHTML = `
            ${resultadosFiltrados.map(producto => `
                <div class="product-card">
                    <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
                    <div class="product-info">
                        <h4>${highlight(producto.nombre, termino)}</h4>
                        <p class="product-category">${producto.categoria} - ${producto.subcategoria}</p>
                        <p class="product-description">${highlight(producto.descripcion, termino)}</p>
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
    function aplicarBusqueda(termino) {
        if (termino.length >= 2) {
            pushRecent(termino);
            const resultados = buscarProductos(termino);
            mostrarResultados(resultados, termino);
            renderRecents();
        } else {
            mostrarResultados([], termino);
        }
    }

    window.performSearch = function() {
        const searchInput = document.getElementById('searchInput');
        const termino = searchInput.value.trim();
        aplicarBusqueda(termino);
    };

    // Event listeners para búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const termino = searchInput.value.trim();
            if (termino.length === 0) {
                document.getElementById('searchResults').innerHTML = '';
                document.getElementById('noResults').style.display = 'none';
            }
        });
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
        aplicarBusqueda(searchTerm);
    }

    // Inicializar contador del carrito
    actualizarContadorCarrito();

    // Filtros: múltiples selección
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const f = btn.getAttribute('data-filter');
            if (f === 'all') {
                selectedFilters.clear();
                selectedFilters.add('all');
            } else {
                if (selectedFilters.has('all')) selectedFilters.delete('all');
                if (selectedFilters.has(f)) selectedFilters.delete(f); else selectedFilters.add(f);
            }
            // Actualizar clases activas
            filterButtons.forEach(b => {
                const key = b.getAttribute('data-filter');
                const active = key === 'all' ? selectedFilters.has('all') : selectedFilters.has(key);
                b.classList.toggle('active', active);
            });
            // Re-aplicar búsqueda con filtros
            const term = (document.getElementById('searchInput')?.value || '').trim();
            const resultados = term.length >= 2 ? buscarProductos(term) : productos;
            mostrarResultados(resultados, term);
        });
    });

    // Render de recientes
    renderRecents();
});
