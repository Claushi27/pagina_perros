document.addEventListener('DOMContentLoaded', () => {
    // Hero Slider
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.querySelector('.slider-nav-button.prev');
    const nextButton = document.querySelector('.slider-nav-button.next');
    const dotsContainer = document.querySelector('.slider-dots');
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeMenuButton = document.querySelector('.close-menu');
    let lastFocusedElementBeforeMenu = null;

    let currentIndex = 0;

    function goToSlide(index) {
        if (!slides[index]) return;
        sliderContainer.scrollLeft = slides[index].offsetLeft;
        currentIndex = index;
        updateDots();
    }

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : slides.length - 1;
        goToSlide(currentIndex);
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
        goToSlide(currentIndex);
    });

    function createDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Ir a la diapositiva ${i + 1}`);
            dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }

    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((d, i) => d.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false'));
    }

    createDots();
    updateDots();

    if (sliderContainer) {
        sliderContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); prevButton.click(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); nextButton.click(); }
        });

        sliderContainer.addEventListener('scroll', () => {
            const offsets = Array.from(slides).map(s => s.offsetLeft);
            const scrollLeft = sliderContainer.scrollLeft;
            let nearest = 0; let minDelta = Infinity;
            offsets.forEach((off, i) => {
                const delta = Math.abs(scrollLeft - off);
                if (delta < minDelta) { minDelta = delta; nearest = i; }
            });
            if (nearest !== currentIndex) {
                currentIndex = nearest;
                updateDots();
            }
        }, { passive: true });
    }

    // Mobile Menu functionality with ARIA and focus trap
    const getFocusableElements = (container) => {
        return container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    };

    const openMobileMenu = () => {
        if (!mobileMenu) return;
        lastFocusedElementBeforeMenu = document.activeElement;
        mobileMenu.classList.add('open');
        menuToggle.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        const focusables = getFocusableElements(mobileMenu);
        if (focusables.length > 0) {
            focusables[0].focus();
        }
        document.addEventListener('keydown', handleKeydownInMenu);
    };

    const closeMobileMenu = () => {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', handleKeydownInMenu);
        if (lastFocusedElementBeforeMenu) {
            lastFocusedElementBeforeMenu.focus();
        } else {
            menuToggle.focus();
        }
    };

    const handleKeydownInMenu = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMobileMenu();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = Array.from(getFocusableElements(mobileMenu));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('open');
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (closeMenuButton && mobileMenu) {
        closeMenuButton.addEventListener('click', () => {
            closeMobileMenu();
        });
    }

    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
    }

    // Brands Carousel
    const brandsContainer = document.querySelector('.brands-container');
    const brandItems = document.querySelectorAll('.brand-item');
    let currentBrandIndex = 0;

    function showBrand(index) {
        brandItems.forEach((item, i) => {
            item.style.display = i === index ? 'flex' : 'none';
        });
    }

    function nextBrand() {
        currentBrandIndex = (currentBrandIndex + 1) % brandItems.length;
        showBrand(currentBrandIndex);
    }

    // Initialize brands carousel
    if (brandItems.length > 0) {
        showBrand(0);
        setInterval(nextBrand, 3000); // Change every 3 seconds
    }

    // Customer Stories Carousel
    const storiesContainer = document.querySelector('.stories-container');
    const storyCards = document.querySelectorAll('.new-story-card');
    let currentStoryIndex = 0;

    function showStory(index) {
        storyCards.forEach((card, i) => {
            card.style.display = i === index ? 'flex' : 'none';
        });
    }

    function nextStory() {
        currentStoryIndex = (currentStoryIndex + 1) % storyCards.length;
        showStory(currentStoryIndex);
    }

    // Initialize stories carousel
    if (storyCards.length > 0) {
        showStory(0);
        setInterval(nextStory, 4000); // Change every 4 seconds
    }

    // Search Functionality
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-button');
    

    
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



    // Event listeners para búsqueda
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const termino = e.target.value.trim();
                if (termino.length >= 2) {
                    // Redirigir a la página de búsqueda
                    window.location.href = `search.html?q=${encodeURIComponent(termino)}`;
                } else {
                    alert('Por favor ingresa al menos 2 caracteres para buscar');
                }
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const termino = searchInput.value.trim();
            if (termino.length >= 2) {
                // Redirigir a la página de búsqueda
                window.location.href = `search.html?q=${encodeURIComponent(termino)}`;
            } else {
                alert('Por favor ingresa al menos 2 caracteres para buscar');
            }
        });
    }

    // Función para agregar al carrito (básica)
    window.agregarAlCarrito = function(productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;
        if (window.CartUtils) {
            window.CartUtils.addToCart(producto);
        }
    };

    // Función para actualizar contador del carrito
    function actualizarContadorCarrito() { if (window.CartUtils) window.CartUtils.updateCartCounter(); }

    // Inicializar contador del carrito al cargar la página
    actualizarContadorCarrito();


});