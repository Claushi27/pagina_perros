import { auth, db, analytics } from './firebase-config.js';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { logEvent } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

let currentUser = null;

// Verificar autenticación
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const checkoutForm = document.getElementById('checkoutForm');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    if (user) {
        // Pre-llenar datos del usuario si están disponibles
        document.getElementById('nombre').value = user.displayName?.split(' ')[0] || '';
        document.getElementById('apellido').value = user.displayName?.split(' ').slice(1).join(' ') || '';
        document.getElementById('email').value = user.email || '';

        // Habilitar formulario
        checkoutForm.style.opacity = '1';
        placeOrderBtn.disabled = false;
    } else {
        // Deshabilitar formulario y mostrar mensaje
        checkoutForm.style.opacity = '0.5';
        checkoutForm.style.pointerEvents = 'none';
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = '🔒 Inicia sesión para continuar';
    }
});

// Cargar resumen del pedido
function loadOrderSummary() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const summaryItems = document.getElementById('summaryItems');

    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        window.location.href = 'cart.html';
        return;
    }

    summaryItems.innerHTML = carrito.map(item => `
        <div class="summary-item">
            <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='https://via.placeholder.com/60'">
            <div class="summary-item-details">
                <div class="summary-item-name">${item.nombre}</div>
                <div class="summary-item-quantity">Cantidad: ${item.cantidad}</div>
            </div>
            <div class="summary-item-price">$${(item.precio * item.cantidad).toLocaleString()}</div>
        </div>
    `).join('');

    updateSummary();
}

// Actualizar totales
function updateSummary() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const shipping = subtotal >= 39990 ? 0 : 3000;
    const total = subtotal + shipping;

    document.getElementById('summarySubtotal').textContent = `$${subtotal.toLocaleString()}`;
    document.getElementById('summaryShipping').textContent = shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString()}`;
    document.getElementById('summaryTotal').textContent = `$${total.toLocaleString()}`;
}

// Manejar selección de método de pago
document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', function() {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('input[type="radio"]').checked = true;
    });
});

// Marcar el método inicial como seleccionado
document.querySelector('.payment-method').classList.add('selected');

// Manejar envío del formulario
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<span class="loading"></span> Procesando...';

    try {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

        if (carrito.length === 0) {
            throw new Error('El carrito está vacío');
        }

        // Recopilar datos del formulario
        const formData = {
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            region: document.getElementById('region').value,
            referencia: document.getElementById('referencia').value,
            metodoPago: document.querySelector('input[name="metodoPago"]:checked').value,
            notas: document.getElementById('notas').value
        };

        // Calcular totales
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const envio = subtotal >= 39990 ? 0 : 3000;
        const total = subtotal + envio;

        // Preparar datos para Cloud Function
        const requestData = {
            items: carrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                imagen: item.imagen
            })),
            payer: {
                nombre: `${formData.nombre} ${formData.apellido}`,
                email: formData.email,
                telefono: formData.telefono
            },
            shipment: {
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                region: formData.region,
                codigoPostal: '8320000',
                referencia: formData.referencia
            }
        };

        // Registrar evento en Analytics
        try {
            if (analytics) {
                logEvent(analytics, 'begin_checkout', {
                    value: total,
                    currency: 'CLP',
                    items: carrito.map(item => ({
                        item_id: String(item.id),
                        item_name: item.nombre,
                        price: item.precio,
                        quantity: item.cantidad
                    }))
                });
            }
        } catch (error) {
            console.warn('Analytics no disponible:', error);
        }

        // Procesar según método de pago
        if (formData.metodoPago === 'mercadopago') {
            // MERCADO PAGO - Crear preferencia y redirigir
            console.log('🔄 Creando preferencia de Mercado Pago...');

            const response = await fetch('https://southamerica-west1-awka-ddc36.cloudfunctions.net/createPaymentPreference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al crear preferencia de pago');
            }

            console.log('✅ Preferencia creada:', data.preference_id);
            console.log('🔗 Redirigiendo a Mercado Pago...');

            // Guardar datos en localStorage por si el usuario vuelve
            localStorage.setItem('pending_order', JSON.stringify({
                pedidoId: data.pedidoId,
                preference_id: data.preference_id
            }));

            // Redirigir a Mercado Pago
            window.location.href = data.init_point;

        } else if (formData.metodoPago === 'efectivo') {
            // PAGO CONTRA ENTREGA - Crear pedido directo
            console.log('💵 Creando pedido con pago contra entrega...');

            const response = await fetch('https://southamerica-west1-awka-ddc36.cloudfunctions.net/createCashOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al crear pedido');
            }

            console.log('✅ Pedido creado:', data.pedidoId);

            // Limpiar carrito
            localStorage.removeItem('carrito');

            // Redirigir a página de confirmación
            window.location.href = `order-confirmation.html?pedido=${data.pedidoId}&metodo=efectivo`;
        }

    } catch (error) {
        console.error('❌ Error al procesar el pedido:', error);
        alert(`Hubo un error al procesar tu pedido: ${error.message}\n\nPor favor intenta nuevamente.`);

        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Realizar Pedido';
    }
});

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadOrderSummary();
});
