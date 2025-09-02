document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-overlay');
    const closeMenuButton = document.querySelector('.close-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            menuToggle.classList.toggle('active');
        });
    }

    if (closeMenuButton && mobileMenu) {
        closeMenuButton.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            menuToggle.classList.remove('active');
        });
    }

    if (mobileMenu) {
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                menuToggle.classList.remove('active');
            });
        });
    }

    // Base de datos de productos para gatos
    const productosGatos = [
        {
            id: 2,
            nombre: "Alimento Húmedo para Gatos",
            categoria: "gatos",
            subcategoria: "alimento",
            precio: 15000,
            descripcion: "Alimento húmedo premium para gatos",
            imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg"
        },
        {
            id: 4,
            nombre: "Antiparasitario para Gatos",
            categoria: "gatos",
            subcategoria: "salud",
            precio: 30000,
            descripcion: "Tratamiento antiparasitario para gatos",
            imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg"
        },
        {
            id: 6,
            nombre: "Rascador para Gatos",
            categoria: "gatos",
            subcategoria: "juguetes",
            precio: 45000,
            descripcion: "Rascador de múltiples niveles",
            imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg"
        },
        {
            id: 8,
            nombre: "Cama para Gatos",
            categoria: "gatos",
            subcategoria: "accesorios",
            precio: 35000,
            descripcion: "Cama suave y cómoda para gatos",
            imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg"
        },
        {
            id: 11,
            nombre: "Arena para Gatos",
            categoria: "gatos",
            subcategoria: "accesorios",
            precio: 12000,
            descripcion: "Arena aglomerante de alta calidad",
            imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg"
        },
        {
            id: 12,
            nombre: "Juguete con Plumas",
            categoria: "gatos",
            subcategoria: "juguetes",
            precio: 6000,
            descripcion: "Juguete interactivo con plumas",
            imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg"
        }
    ];

    // Función para cargar productos de gatos
    function loadGatosProducts() {
        const gatosGrid = document.getElementById('gatosGrid');
        
        gatosGrid.innerHTML = productosGatos.map(producto => `
            <div class="gato-product-card">
                <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
                <div class="gato-product-info">
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion}</p>
                    <div class="gato-product-price">$${producto.precio.toLocaleString()}</div>
                    <button class="gato-add-btn" onclick="agregarAlCarrito(${producto.id})">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Función para agregar al carrito
    window.agregarAlCarrito = function(productoId) {
        const producto = productosGatos.find(p => p.id === productoId);
        if (producto) {
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
            alert(`¡${producto.nombre} agregado al carrito!`);
            updateCartCounter();
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
    loadGatosProducts();
    updateCartCounter();
});

