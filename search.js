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

    // Base de datos simulada de productos (misma que en script.js)
    const productos = [
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
            id: 2,
            nombre: "Alimento Húmedo para Gatos",
            categoria: "gatos",
            subcategoria: "alimento",
            precio: 15000,
            descripcion: "Alimento húmedo premium para gatos",
            imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg"
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
            id: 4,
            nombre: "Antiparasitario para Gatos",
            categoria: "gatos",
            subcategoria: "salud",
            precio: 30000,
            descripcion: "Tratamiento antiparasitario para gatos",
            imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg"
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
            id: 6,
            nombre: "Rascador para Gatos",
            categoria: "gatos",
            subcategoria: "juguetes",
            precio: 45000,
            descripcion: "Rascador de múltiples niveles",
            imagen: "https://i.ibb.co/d7z1y1C/prod-2.jpg"
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
            id: 8,
            nombre: "Cama para Gatos",
            categoria: "gatos",
            subcategoria: "accesorios",
            precio: 35000,
            descripcion: "Cama suave y cómoda para gatos",
            imagen: "https://i.ibb.co/M9F5D21/prod-4.jpg"
        }
    ];

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
            <div class="search-results-header">
                <h3>Resultados encontrados: ${resultados.length}</h3>
            </div>
            ${resultados.map(producto => `
                <div class="product-card">
                    <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/200x200?text=Imagen+No+Disponible'">
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
            actualizarContadorCarrito();
        }
    };

    // Función para actualizar contador del carrito
    function actualizarContadorCarrito() {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        
        const cartIcon = document.querySelector('.header-icons .icon:last-child');
        if (cartIcon && totalItems > 0) {
            cartIcon.innerHTML = `🛒 <span class="cart-count">${totalItems}</span>`;
        }
    }

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
