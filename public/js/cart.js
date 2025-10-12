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

    // Función para cargar el carrito
    function loadCart() {
        const carrito = window.CartUtils ? window.CartUtils.getCart() : [];
        const cartItems = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartContent = document.querySelector('.cart-content');

        if (carrito.length === 0) {
            cartContent.style.display = 'none';
            emptyCart.style.display = 'block';
            return;
        }

        cartContent.style.display = 'flex';
        emptyCart.style.display = 'none';

        cartItems.innerHTML = carrito.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-image">
                    <img src="${item.imagen}" alt="${item.nombre}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/100x100?text=Imagen+No+Disponible'">
                </div>
                <div class="item-details">
                    <h4>${item.nombre}</h4>
                    <p class="item-category">${item.categoria} - ${item.subcategoria}</p>
                    <p class="item-description">${item.descripcion}</p>
                    <div class="item-price">$${item.precio.toLocaleString()}</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="quantity">${item.cantidad}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <div class="item-total">$${(item.precio * item.cantidad).toLocaleString()}</div>
                    <button class="remove-btn" onclick="removeItem(${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');

        updateSummary();
    }

    // Función para actualizar la cantidad
    window.updateQuantity = function(productId, change) {
        let carrito = window.CartUtils ? window.CartUtils.getCart() : [];
        const item = carrito.find(p => p.id === productId);
        
        if (item) {
            item.cantidad += change;
            if (item.cantidad <= 0) {
                carrito = carrito.filter(p => p.id !== productId);
            }
            if (window.CartUtils) window.CartUtils.setCart(carrito);
            loadCart();
            if (window.CartUtils) window.CartUtils.updateCartCounter();
        }
    };

    // Función para remover un item
    window.removeItem = function(productId) {
        let carrito = window.CartUtils ? window.CartUtils.getCart() : [];
        carrito = carrito.filter(p => p.id !== productId);
        if (window.CartUtils) window.CartUtils.setCart(carrito);
        loadCart();
        if (window.CartUtils) window.CartUtils.updateCartCounter();
    };

    // Función para actualizar el resumen
    function updateSummary() {
        const carrito = window.CartUtils ? window.CartUtils.getCart() : [];
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const shipping = subtotal >= 39990 ? 0 : 5000;
        const total = subtotal + shipping;

        document.getElementById('subtotal').textContent = `$${subtotal.toLocaleString()}`;
        document.getElementById('shipping').textContent = shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString()}`;
        document.getElementById('total').textContent = `$${total.toLocaleString()}`;
    }

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

    // Función para proceder al pago
    window.proceedToCheckout = function() {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        if (carrito.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }

        // Redirigir a la página de checkout
        window.location.href = 'checkout.html';
    };

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

    // Cargar el carrito al inicializar
    loadCart();
    updateCartCounter();
});
