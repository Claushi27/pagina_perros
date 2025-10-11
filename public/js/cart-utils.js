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
		const cartIcon = document.querySelector('.header-icons .icon:last-child');
		if (!cartIcon) return;
		cartIcon.innerHTML = totalItems > 0 ? `🛒 <span class="cart-count">${totalItems}</span>` : '🛒';
	};

	const addToCart = (product) => {
		if (!product) return;
		const cart = getCart();
		const existing = cart.find(p => p.id === product.id);
		if (existing) {
			existing.cantidad += 1;
		} else {
			cart.push({ ...product, cantidad: 1 });
		}
		setCart(cart);
		alert(`¡${product.nombre} agregado al carrito!`);
	};

	window.CartUtils = { getCart, setCart, updateCartCounter, addToCart };
})();


