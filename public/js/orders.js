import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

let allOrders = [];
let currentUser = null;

// Mapeo de estados a porcentaje de progreso
const statusProgress = {
    'pendiente': 25,
    'procesando': 50,
    'enviado': 75,
    'entregado': 100,
    'cancelado': 0
};

// Mapeo de estados a español
const statusLabels = {
    'pendiente': 'Pendiente',
    'procesando': 'Procesando',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
};

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;
    await loadOrders();
    setupFilters();
});

async function loadOrders() {
    try {
        const ordersRef = collection(db, 'pedidos');
        const q = query(
            ordersRef,
            where('userId', '==', currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        allOrders = [];

        querySnapshot.forEach((doc) => {
            allOrders.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Ordenar por fecha en JavaScript (más recientes primero)
        allOrders.sort((a, b) => {
            // Intentar con fechaCreacion primero, luego fecha
            const dateA = a.fechaCreacion?.toDate?.() || new Date(a.fecha || 0);
            const dateB = b.fechaCreacion?.toDate?.() || new Date(b.fecha || 0);
            return dateB - dateA;
        });

        updateStatistics();
        displayOrders(allOrders);
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        showEmptyState('Error al cargar tus pedidos. Por favor, intenta nuevamente.');
    }
}

function updateStatistics() {
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o =>
        o.estado === 'pendiente' || o.estado === 'procesando' || o.estado === 'enviado'
    ).length;
    const completedOrders = allOrders.filter(o => o.estado === 'entregado').length;
    const totalSpent = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('totalSpent').textContent = `$${totalSpent.toLocaleString()}`;
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    if (orders.length === 0) {
        showEmptyState();
        return;
    }

    ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

function showEmptyState(message = '¡Aún no tienes pedidos!') {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h2>${message}</h2>
            <p>Comienza a comprar y llena de alegría a tu mascota</p>
            <a href="index.html" class="btn btn-primary">Ir a la tienda</a>
        </div>
    `;
}

function createOrderCard(order) {
    // Manejar fechaCreacion (Timestamp de Firebase) o fecha (string)
    let orderDate = 'Fecha no disponible';
    if (order.fechaCreacion?.toDate) {
        orderDate = order.fechaCreacion.toDate().toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (order.fecha) {
        orderDate = new Date(order.fecha).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const estado = order.estado || 'pendiente';
    const productos = order.productos || [];

    return `
        <div class="order-card">
            <div class="order-card-header">
                <div>
                    <div class="order-id">Pedido #${order.id.substring(0, 8).toUpperCase()}</div>
                    <div class="order-date">${orderDate}</div>
                </div>
                <div class="order-status status-${estado}">
                    ${statusLabels[estado] || estado}
                </div>
            </div>
            <div class="order-card-body">
                ${createTracking(estado)}

                <div class="order-items">
                    ${productos.map(item => `
                        <div class="order-item">
                            <img src="${item.imagen || 'imagenes/placeholder.png'}" alt="${item.nombre}">
                            <div class="order-item-info">
                                <div class="order-item-name">${item.nombre}</div>
                                <div class="order-item-quantity">Cantidad: ${item.cantidad}</div>
                            </div>
                            <div class="order-item-price">$${(item.precio * item.cantidad).toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="order-summary">
                    <div class="order-total">
                        Total: $${order.total.toLocaleString()}
                    </div>
                    <div class="order-actions">
                        ${createOrderActions(order)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createTracking(estado) {
    const steps = [
        { id: 'pendiente', icon: '📝', label: 'Recibido' },
        { id: 'procesando', icon: '📦', label: 'Procesando' },
        { id: 'enviado', icon: '🚚', label: 'Enviado' },
        { id: 'entregado', icon: '✅', label: 'Entregado' }
    ];

    const stateOrder = ['pendiente', 'procesando', 'enviado', 'entregado'];
    const currentIndex = stateOrder.indexOf(estado);
    const progress = statusProgress[estado] || 0;

    return `
        <div class="order-tracking">
            <div class="tracking-timeline">
                <div class="tracking-progress" style="width: ${progress}%"></div>
                ${steps.map((step, index) => {
                    let className = 'tracking-step';
                    if (index < currentIndex) {
                        className += ' completed';
                    } else if (index === currentIndex) {
                        className += ' active';
                    }

                    return `
                        <div class="${className}">
                            <div class="tracking-step-icon">${step.icon}</div>
                            <div class="tracking-step-label">${step.label}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function createOrderActions(order) {
    const actions = [];

    // Repetir pedido (siempre disponible)
    actions.push(`
        <button class="btn btn-primary" onclick="repeatOrder('${order.id}')">
            🔄 Repetir Pedido
        </button>
    `);

    // Ver detalles
    actions.push(`
        <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">
            👁️ Ver Detalles
        </button>
    `);

    // Cancelar solo si está pendiente o procesando
    if (order.estado === 'pendiente' || order.estado === 'procesando') {
        actions.push(`
            <button class="btn btn-danger" onclick="cancelOrder('${order.id}')">
                ❌ Cancelar
            </button>
        `);
    }

    return actions.join('');
}

function setupFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');

    statusFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    let filteredOrders = [...allOrders];

    // Filtrar por estado
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.estado === statusFilter);
    }

    // Ordenar
    switch (sortFilter) {
        case 'recent':
            filteredOrders.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            break;
        case 'oldest':
            filteredOrders.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            break;
        case 'highest':
            filteredOrders.sort((a, b) => b.total - a.total);
            break;
        case 'lowest':
            filteredOrders.sort((a, b) => a.total - b.total);
            break;
    }

    displayOrders(filteredOrders);
}

// Función global para repetir pedido
window.repeatOrder = async function(orderId) {
    if (!confirm('¿Deseas agregar estos productos al carrito?')) {
        return;
    }

    try {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        // Agregar productos al carrito usando CartUtils
        if (window.CartUtils) {
            order.productos.forEach(producto => {
                // Agregar la cantidad especificada en el pedido
                for (let i = 0; i < producto.cantidad; i++) {
                    window.CartUtils.addToCart(producto);
                }
            });
        } else {
            // Fallback si CartUtils no está disponible
            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            order.productos.forEach(producto => {
                const existente = carrito.find(p => p.id === producto.id);
                if (existente) {
                    existente.cantidad += producto.cantidad;
                } else {
                    carrito.push({ ...producto });
                }
            });
            localStorage.setItem('carrito', JSON.stringify(carrito));
        }

        // Mostrar mensaje y redirigir
        alert('¡Productos agregados al carrito!');
        window.location.href = 'cart.html';
    } catch (error) {
        console.error('Error al repetir pedido:', error);
        alert('Error al agregar productos al carrito');
    }
};

// Función global para ver detalles
window.viewOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const productos = order.productos.map(p =>
        `• ${p.nombre} - Cantidad: ${p.cantidad} - $${(p.precio * p.cantidad).toLocaleString()}`
    ).join('\n');

    const info = `
PEDIDO #${order.id.substring(0, 8).toUpperCase()}
Fecha: ${new Date(order.fecha).toLocaleDateString('es-CL')}
Estado: ${statusLabels[order.estado] || order.estado}

PRODUCTOS:
${productos}

INFORMACIÓN DE ENTREGA:
Nombre: ${order.nombre}
Email: ${order.email}
Teléfono: ${order.telefono}
Dirección: ${order.direccion}

TOTAL: $${order.total.toLocaleString()}
    `.trim();

    alert(info);
};

// Función global para cancelar pedido
window.cancelOrder = async function(orderId) {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
        return;
    }

    try {
        const orderRef = doc(db, 'pedidos', orderId);
        await updateDoc(orderRef, {
            estado: 'cancelado'
        });

        alert('Pedido cancelado exitosamente');
        await loadOrders();
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        alert('Error al cancelar el pedido. Por favor, contacta al soporte.');
    }
};
