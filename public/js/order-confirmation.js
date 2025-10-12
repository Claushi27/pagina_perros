import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

async function loadOrderDetails() {
    const loadingState = document.getElementById('loadingState');
    const confirmationContent = document.getElementById('confirmationContent');

    try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const pedidoId = urlParams.get('pedido');
        const numeroPedido = urlParams.get('numero');

        if (!pedidoId) {
            throw new Error('No se encontró el ID del pedido');
        }

        // Obtener datos del pedido desde Firestore
        const pedidoRef = doc(db, 'pedidos', pedidoId);
        const pedidoSnap = await getDoc(pedidoRef);

        if (!pedidoSnap.exists()) {
            throw new Error('Pedido no encontrado');
        }

        const pedido = pedidoSnap.data();

        // Mostrar número de pedido
        document.getElementById('orderNumber').textContent = pedido.numeroPedido || numeroPedido;

        // Mostrar datos del cliente
        document.getElementById('customerName').textContent = pedido.cliente.nombre;
        document.getElementById('customerEmail').textContent = pedido.cliente.email;
        document.getElementById('customerPhone').textContent = pedido.cliente.telefono;

        // Mostrar dirección
        const direccion = `${pedido.direccionEnvio.direccion}, ${pedido.direccionEnvio.ciudad}, ${pedido.direccionEnvio.region}`;
        document.getElementById('shippingAddress').textContent = direccion;

        // Mostrar método de pago
        const metodoPagoTexto = pedido.metodoPago === 'transferencia' ? '💸 Transferencia Bancaria' : '💵 Pago contra entrega';
        document.getElementById('paymentMethod').textContent = metodoPagoTexto;

        // Mostrar productos
        const orderItemsList = document.getElementById('orderItemsList');
        orderItemsList.innerHTML = pedido.productos.map(item => `
            <div class="order-item">
                <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='https://via.placeholder.com/60'">
                <div class="order-item-details">
                    <div class="order-item-name">${item.nombre}</div>
                    <div class="order-item-quantity">Cantidad: ${item.cantidad}</div>
                </div>
                <div class="order-item-price">$${(item.precio * item.cantidad).toLocaleString()}</div>
            </div>
        `).join('');

        // Mostrar total
        document.getElementById('totalAmount').textContent = `$${pedido.total.toLocaleString()}`;

        // Ocultar loading y mostrar contenido
        loadingState.style.display = 'none';
        confirmationContent.style.display = 'block';

        // Si el método es transferencia, mostrar instrucciones adicionales
        if (pedido.metodoPago === 'transferencia') {
            agregarInstruccionesTransferencia(pedido.total, pedido.numeroPedido);
        }

    } catch (error) {
        console.error('Error cargando pedido:', error);
        loadingState.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h2 style="color: #dc3545; margin-bottom: 1rem;">❌ Error al cargar el pedido</h2>
                <p style="color: #666; margin-bottom: 2rem;">${error.message}</p>
                <a href="index.html" class="btn btn-primary">Volver al Inicio</a>
            </div>
        `;
    }
}

function agregarInstruccionesTransferencia(total, numeroPedido) {
    const nextSteps = document.querySelector('.next-steps ul');

    const instruccionesTransferencia = document.createElement('div');
    instruccionesTransferencia.style.cssText = 'margin-top: 1.5rem; padding: 1.5rem; background: white; border-radius: 8px; text-align: left;';
    instruccionesTransferencia.innerHTML = `
        <h4 style="color: #FF6B35; margin-bottom: 1rem;">💸 Instrucciones para Transferencia</h4>
        <p style="margin-bottom: 1rem;"><strong>Banco:</strong> Banco Estado</p>
        <p style="margin-bottom: 1rem;"><strong>Tipo de cuenta:</strong> Cuenta Corriente</p>
        <p style="margin-bottom: 1rem;"><strong>Número de cuenta:</strong> 1234567890</p>
        <p style="margin-bottom: 1rem;"><strong>RUT:</strong> 12.345.678-9</p>
        <p style="margin-bottom: 1rem;"><strong>Nombre:</strong> Awka Petshop SpA</p>
        <p style="margin-bottom: 1rem;"><strong>Email:</strong> pagos@awka.cl</p>
        <p style="margin-bottom: 1rem;"><strong>Monto a transferir:</strong> <span style="color: #FF6B35; font-size: 1.2rem; font-weight: 700;">$${total.toLocaleString()}</span></p>
        <p style="margin-bottom: 1rem;"><strong>Asunto/Glosa:</strong> ${numeroPedido}</p>
        <div style="margin-top: 1rem; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <strong>⚠️ Importante:</strong> Por favor envía el comprobante de transferencia a <strong>pagos@awka.cl</strong> indicando tu número de pedido.
        </div>
    `;

    document.querySelector('.next-steps').appendChild(instruccionesTransferencia);
}

// Cargar detalles al iniciar
document.addEventListener('DOMContentLoaded', loadOrderDetails);
