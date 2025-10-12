(function() {
	const getCart = () => {
		try { return JSON.parse(localStorage.getItem('carrito')) || []; } catch { return []; }
	};

	const setCart = (cart) => {
		localStorage.setItem('carrito', JSON.stringify(cart));
		updateCartCounter();
	};

	const updateCartCounter = () => {
		const cart = getCart();
		const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
		const cartCounter = document.getElementById('cartCounter');
		if (cartCounter) {
			cartCounter.textContent = totalItems;
		}
		// Fallback para páginas antiguas sin ID
		const cartIcon = document.querySelector('.header-icons .icon:last-child');
		if (cartIcon && !cartCounter) {
			cartIcon.innerHTML = totalItems > 0 ? `🛒 <span class="cart-count">${totalItems}</span>` : '🛒';
		}
	};

	const showNotification = (message, type = 'success') => {
		// Remover notificación anterior si existe
		const existing = document.getElementById('cart-notification');
		if (existing) existing.remove();

		const notification = document.createElement('div');
		notification.id = 'cart-notification';
		notification.style.cssText = `
			position: fixed;
			top: 80px;
			right: 20px;
			background: ${type === 'success' ? '#4CAF50' : '#FF6B35'};
			color: white;
			padding: 1rem 1.5rem;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.2);
			z-index: 10000;
			animation: slideIn 0.3s ease-out;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-family: 'Poppins', sans-serif;
			font-size: 0.95rem;
		`;
		notification.innerHTML = `
			<span style="font-size: 1.5rem;">${type === 'success' ? '✓' : '🛒'}</span>
			<span>${message}</span>
		`;

		// Agregar animación
		const style = document.createElement('style');
		style.textContent = `
			@keyframes slideIn {
				from {
					transform: translateX(400px);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}
			@keyframes slideOut {
				from {
					transform: translateX(0);
					opacity: 1;
				}
				to {
					transform: translateX(400px);
					opacity: 0;
				}
			}
		`;
		if (!document.getElementById('cart-notification-styles')) {
			style.id = 'cart-notification-styles';
			document.head.appendChild(style);
		}

		document.body.appendChild(notification);

		// Animar salida y remover
		setTimeout(() => {
			notification.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => notification.remove(), 300);
		}, 3000);
	};

	const addToCart = (product) => {
		if (!product) return;
		const cart = getCart();
		const existing = cart.find(p => p.id === product.id);
		if (existing) {
			existing.cantidad += 1;
			showNotification(`${product.nombre} (x${existing.cantidad}) actualizado en el carrito`);
		} else {
			cart.push({ ...product, cantidad: 1 });
			showNotification(`¡${product.nombre} agregado al carrito!`);
		}
		setCart(cart);
	};

	window.CartUtils = { getCart, setCart, updateCartCounter, addToCart };

	// Inicializar contador al cargar la página
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', updateCartCounter);
	} else {
		updateCartCounter();
	}
})();


