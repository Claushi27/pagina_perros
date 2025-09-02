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

    // Base de datos de productos para perros
    const productosPerros = [
        {
            id: 1,
            nombre: "Alimento Premium para Perros",
            categoria: "perros",
            subcategoria: "alimento",
            precio: 25000,
            descripcion: "Alimento balanceado para perros adultos",
            imagen: "https://i.ibb.co/S7Jj4r7/prod-1.jpg"
        },
        {
            id: 3,
            nombre: "Antiparasitario para Perros",
            categoria: "perros",
            subcategoria: "salud",
            precio: 35000,
            descripcion: "Tratamiento antiparasitario mensual",
            imagen: "https://i.ibb.co/R2qJ2X4/prod-3.jpg"
        },
        {
            id: 5,
            nombre: "Juguete para Perros",
            categoria: "perros",
            subcategoria: "juguetes",
            precio: 12000,
            descripcion: "Juguete interactivo resistente",
            imagen: "https://i.ibb.co/S7Jj4r7/prod-1.jpg"
        },
        {
            id: 7,
            nombre: "Cama para Perros",
            categoria: "perros",
            subcategoria: "accesorios",
            precio: 55000,
            descripcion: "Cama ortopédica para perros grandes",
            imagen: "https://i.ibb.co/R2qJ2X4/prod-3.jpg"
        },
        {
            id: 9,
            nombre: "Correa para Perros",
            categoria: "perros",
            subcategoria: "accesorios",
            precio: 15000,
            descripcion: "Correa resistente y cómoda",
            imagen: "https://i.ibb.co/S7Jj4r7/prod-1.jpg"
        },
        {
            id: 10,
            nombre: "Shampoo para Perros",
            categoria: "perros",
            subcategoria: "salud",
            precio: 8000,
            descripcion: "Shampoo hipoalergénico para perros",
            imagen: "https://i.ibb.co/R2qJ2X4/prod-3.jpg"
        }
    ];

    // Función para cargar productos de perros
    function loadPerrosProducts() {
        const perrosGrid = document.getElementById('perrosGrid');
        
        perrosGrid.innerHTML = productosPerros.map(producto => `
            <div class="perro-product-card">
                <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
                <div class="perro-product-info">
                    <h3>${producto.nombre}</h3>
                    <p>${producto.descripcion}</p>
                    <div class="perro-product-price">$${producto.precio.toLocaleString()}</div>
                    <button class="perro-add-btn" onclick="agregarAlCarrito(${producto.id})">
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Función para agregar al carrito
    window.agregarAlCarrito = function(productoId) {
        const producto = productosPerros.find(p => p.id === productoId);
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
    loadPerrosProducts();
    updateCartCounter();
});

