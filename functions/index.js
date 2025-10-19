/**
 * Cloud Functions para Awka Pet Shop
 *
 * Funciones disponibles:
 * - crearPedido: Crea un nuevo pedido y actualiza stock
 * - enviarEmailConfirmacion: Envía email cuando se crea un pedido
 * - createPaymentPreference: Crear preferencia de pago en Mercado Pago
 * - mercadoPagoWebhook: Recibir notificaciones de pagos
 * - createCashOrder: Crear pedido con pago contra entrega
 */

const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {MercadoPagoConfig, Preference, Payment} = require("mercadopago");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configurar transporter de nodemailer para Gmail
// IMPORTANTE: Configura las variables de entorno en Firebase
const {defineString} = require("firebase-functions/params");
const gmailPassword = defineString("GMAIL_PASSWORD");
const mercadoPagoAccessToken = defineString("MERCADOPAGO_ACCESS_TOKEN");
const mercadoPagoPublicKey = defineString("MERCADOPAGO_PUBLIC_KEY");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'Pablohdezr0512@gmail.com',
    pass: gmailPassword.value(),
  },
});

// Configurar cliente de Mercado Pago de forma segura
const client = new MercadoPagoConfig({
  accessToken: mercadoPagoAccessToken.value(),
});

// Crear instancias de las APIs que vamos a usar
const preferenceAPI = new Preference(client);
const paymentAPI = new Payment(client);

/**
 * Función HTTP de ejemplo
 * URL: https://southamerica-west1-awka-ddc36.cloudfunctions.net/hola
 */
exports.hola = onRequest({region: "southamerica-west1"}, (req, res) => {
  res.json({mensaje: "Hola desde Cloud Functions de Awka Pet Shop!"});
});

/**
 * Crear pedido y actualizar stock
 * Esta función se llama desde el frontend cuando un usuario confirma su compra
 */
exports.crearPedido = onRequest(
    {
      region: "southamerica-west1",
      cors: true, // Permite llamadas desde tu dominio
    },
    async (req, res) => {
      // Solo permitir POST
      if (req.method !== "POST") {
        return res.status(405).json({error: "Método no permitido"});
      }

      try {
        const {userId, productos, total, datosEnvio} = req.body;

        // Validar datos
        if (!userId || !productos || !total || !datosEnvio) {
          return res.status(400).json({
            error: "Faltan datos requeridos",
          });
        }

        const db = admin.firestore();
        const batch = db.batch();

        // 1. Crear el pedido
        const pedidoRef = db.collection("pedidos").doc();
        const numeroPedido = `AWK-${Date.now()}`;

        batch.set(pedidoRef, {
          numeroPedido,
          userId,
          productos,
          total,
          datosEnvio,
          estado: "pendiente",
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Actualizar stock de cada producto
        for (const item of productos) {
          const productoRef = db.collection("productos").doc(item.id);
          batch.update(productoRef, {
            stock: admin.firestore.FieldValue.increment(-item.cantidad),
          });
        }

        // 3. Ejecutar todas las operaciones
        await batch.commit();

        // 4. Retornar confirmación
        res.status(200).json({
          success: true,
          pedidoId: pedidoRef.id,
          numeroPedido,
          mensaje: "Pedido creado exitosamente",
        });
      } catch (error) {
        console.error("Error creando pedido:", error);
        res.status(500).json({
          error: "Error al crear el pedido",
          detalle: error.message,
        });
      }
    }
);

/**
 * Trigger automático cuando se crea un pedido
 * Envía notificación por email al dueño de la tienda
 */
exports.onPedidoCreado = onDocumentCreated(
    {
      document: "pedidos/{pedidoId}",
      region: "southamerica-west1",
    },
    async (event) => {
      const pedido = event.data.data();
      const pedidoId = event.params.pedidoId;

      console.log(`Nuevo pedido creado: ${pedidoId}`);

      try {
        // Preparar la lista de productos
        const productosHTML = pedido.items.map((item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.nombre}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.cantidad}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.precio.toLocaleString()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">$${(item.precio * item.cantidad).toLocaleString()}</td>
          </tr>
        `).join('');

        // HTML del email
        const emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .section h3 { color: #FF6B35; margin-top: 0; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th { background: #FF6B35; color: white; padding: 12px; text-align: left; }
              .total { background: #FF6B35; color: white; padding: 15px; text-align: right; font-size: 1.2em; font-weight: bold; border-radius: 5px; margin-top: 20px; }
              .badge { display: inline-block; padding: 5px 10px; background: #4CAF50; color: white; border-radius: 5px; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🐾 Nuevo Pedido - Awka Pet Shop</h1>
                <p style="margin: 10px 0 0 0; font-size: 1.1em;">¡Tienes una nueva venta!</p>
              </div>
              <div class="content">
                <div class="section">
                  <h3>📋 Información del Pedido</h3>
                  <p><strong>ID del Pedido:</strong> ${pedidoId}</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
                  <p><strong>Método de Pago:</strong> <span class="badge">${pedido.metodoPago === 'mercadopago' ? 'Mercado Pago' : 'Pago contra entrega'}</span></p>
                  <p><strong>Estado de Pago:</strong> ${pedido.estadoPago || 'Pendiente'}</p>
                </div>

                <div class="section">
                  <h3>👤 Datos del Cliente</h3>
                  <p><strong>Nombre:</strong> ${pedido.payer?.nombre || pedido.payer?.name || 'No especificado'}</p>
                  <p><strong>Email:</strong> ${pedido.payer?.email || 'No especificado'}</p>
                  <p><strong>Teléfono:</strong> ${pedido.payer?.telefono || pedido.payer?.phone || 'No especificado'}</p>
                </div>

                <div class="section">
                  <h3>📦 Dirección de Envío</h3>
                  <p><strong>Dirección:</strong> ${pedido.shipment?.direccion || 'No especificado'}</p>
                  <p><strong>Ciudad:</strong> ${pedido.shipment?.ciudad || 'No especificado'}</p>
                  <p><strong>Región:</strong> ${pedido.shipment?.region || 'No especificado'}</p>
                  <p><strong>Código Postal:</strong> ${pedido.shipment?.codigoPostal || 'No especificado'}</p>
                </div>

                <div class="section">
                  <h3>🛍️ Productos</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style="text-align: center;">Cantidad</th>
                        <th style="text-align: right;">Precio Unit.</th>
                        <th style="text-align: right;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productosHTML}
                    </tbody>
                  </table>
                  <div class="total">
                    TOTAL: $${pedido.total.toLocaleString()} CLP
                  </div>
                </div>

                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px;">
                  <p style="margin: 0; color: #856404;">
                    <strong>⚡ Acción Requerida:</strong> Revisa y procesa este pedido desde el panel de administración.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Configurar el email
        const mailOptions = {
          from: '"Awka Pet Shop" <Pablohdezr0512@gmail.com>',
          to: 'Pablohdezr0512@gmail.com',
          subject: `🐾 Nuevo Pedido #${pedidoId.substring(0, 8)} - $${pedido.total.toLocaleString()} CLP`,
          html: emailHTML,
        };

        // Enviar el email
        await transporter.sendMail(mailOptions);
        console.log("✅ Email enviado exitosamente al dueño");

        // Actualizar el pedido con estado de email
        await event.data.ref.update({
          emailEnviado: true,
          fechaEmailEnviado: admin.firestore.FieldValue.serverTimestamp(),
        });

      } catch (error) {
        console.error("❌ Error enviando email:", error);
        // No lanzamos error para que no falle el trigger
        await event.data.ref.update({
          emailEnviado: false,
          emailError: error.message,
        });
      }

      return null;
    }
);

/**
 * Obtener estadísticas del dashboard
 * URL: https://southamerica-west1-awka-ddc36.cloudfunctions.net/obtenerEstadisticas
 */
exports.obtenerEstadisticas = onRequest(
    {
      region: "southamerica-west1",
      cors: true,
    },
    async (req, res) => {
      try {
        const db = admin.firestore();

        // Obtener totales
        const [productosSnap, pedidosSnap, usuariosSnap] = await Promise.all([
          db.collection("productos").get(),
          db.collection("pedidos").get(),
          db.collection("usuarios").get(),
        ]);

        // Calcular ingresos totales
        let ingresosTotales = 0;
        pedidosSnap.forEach((doc) => {
          const pedido = doc.data();
          if (pedido.total) {
            ingresosTotales += pedido.total;
          }
        });

        res.json({
          totalProductos: productosSnap.size,
          totalPedidos: pedidosSnap.size,
          totalUsuarios: usuariosSnap.size,
          ingresosTotales,
        });
      } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        res.status(500).json({error: "Error al obtener estadísticas"});
      }
    }
);

/**
 * MERCADO PAGO: Crear preferencia de pago
 * URL: https://southamerica-west1-awka-ddc36.cloudfunctions.net/createPaymentPreference
 */
exports.createPaymentPreference = onRequest(
    {
      region: "southamerica-west1",
      cors: true,
    },
    async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({error: "Método no permitido"});
      }

      try {
        const {items, payer, shipment} = req.body;

        console.log("📦 Creando preferencia de pago...", {items, payer});

        // Crear preferencia en Mercado Pago
        const preference = {
          items: items.map((item) => ({
            title: item.nombre,
            unit_price: Number(item.precio),
            quantity: Number(item.cantidad),
            currency_id: "CLP",
          })),
          payer: {
            name: payer.nombre,
            email: payer.email,
            phone: {
              number: payer.telefono,
            },
          },
          shipments: {
            receiver_address: {
              street_name: shipment.direccion,
              city_name: shipment.ciudad || "Santiago",
              state_name: shipment.region || "Región Metropolitana",
              zip_code: shipment.codigoPostal || "8320000",
            },
          },
          back_urls: {
            success: "https://awka-ddc36.web.app/payment-success.html",
            failure: "https://awka-ddc36.web.app/payment-failure.html",
            pending: "https://awka-ddc36.web.app/payment-pending.html",
          },
          auto_return: "approved",
          notification_url: "https://southamerica-west1-awka-ddc36.cloudfunctions.net/mercadoPagoWebhook",
          external_reference: `ORDER_${Date.now()}`,
          statement_descriptor: "AWKA PET SHOP",
        };

        const response = await preferenceAPI.create({body: preference});

        console.log("✅ Preferencia creada:", response.id);

        // Guardar pedido en Firestore con estado "pendiente"
        const pedidoRef = await admin.firestore().collection("pedidos").add({
          items: items,
          payer: payer,
          shipment: shipment,
          mercadoPagoPreferenceId: response.id,
          externalReference: preference.external_reference,
          metodoPago: "mercadopago",
          estadoPago: "pendiente",
          estado: "pendiente",
          total: items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("💾 Pedido guardado en Firestore:", pedidoRef.id);

        return res.status(200).json({
          success: true,
          preference_id: response.id,
          init_point: response.init_point,
          pedidoId: pedidoRef.id,
        });
      } catch (error) {
        console.error("❌ Error creando preferencia:", error);
        return res.status(500).json({
          error: "Error al crear preferencia de pago",
          details: error.message,
        });
      }
    }
);

/**
 * MERCADO PAGO: Webhook para recibir notificaciones
 * URL: https://southamerica-west1-awka-ddc36.cloudfunctions.net/mercadoPagoWebhook
 */
exports.mercadoPagoWebhook = onRequest(
    {
      region: "southamerica-west1",
    },
    async (req, res) => {
      try {
        const {type, data} = req.body;

        console.log("🔔 Webhook recibido:", {type, data});

        if (type === "payment") {
          const paymentId = data.id;
          const payment = await paymentAPI.get({id: paymentId});

          console.log("💳 Información del pago:", {
            id: payment.id,
            status: payment.status,
            external_reference: payment.external_reference,
          });

          // Buscar el pedido en Firestore
          const pedidosRef = admin.firestore().collection("pedidos");
          const querySnapshot = await pedidosRef
              .where("externalReference", "==", payment.external_reference)
              .limit(1)
              .get();

          if (!querySnapshot.empty) {
            const pedidoDoc = querySnapshot.docs[0];

            let estadoPago = "pendiente";
            let estado = "pendiente";

            if (payment.status === "approved") {
              estadoPago = "pagado";
              estado = "confirmado";
            } else if (payment.status === "rejected") {
              estadoPago = "rechazado";
              estado = "cancelado";
            } else if (payment.status === "in_process") {
              estadoPago = "en_proceso";
              estado = "pendiente";
            }

            await pedidoDoc.ref.update({
              estadoPago: estadoPago,
              estado: estado,
              mercadoPagoPaymentId: payment.id,
              mercadoPagoStatus: payment.status,
              mercadoPagoStatusDetail: payment.status_detail,
              fechaPago: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log("✅ Pedido actualizado:", pedidoDoc.id);
          }
        }

        return res.status(200).send("OK");
      } catch (error) {
        console.error("❌ Error en webhook:", error);
        return res.status(500).send("Error");
      }
    }
);

/**
 * Crear pedido con pago contra entrega
 * URL: https://southamerica-west1-awka-ddc36.cloudfunctions.net/createCashOrder
 */
exports.createCashOrder = onRequest(
    {
      region: "southamerica-west1",
      cors: true,
    },
    async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({error: "Método no permitido"});
      }

      try {
        const {items, payer, shipment} = req.body;

        console.log("💵 Creando pedido con pago contra entrega...");

        const pedidoRef = await admin.firestore().collection("pedidos").add({
          items: items,
          payer: payer,
          shipment: shipment,
          metodoPago: "efectivo",
          estadoPago: "pendiente",
          estado: "pendiente",
          total: items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("✅ Pedido contra entrega guardado:", pedidoRef.id);

        return res.status(200).json({
          success: true,
          pedidoId: pedidoRef.id,
        });
      } catch (error) {
        console.error("❌ Error creando pedido:", error);
        return res.status(500).json({
          error: "Error al crear pedido",
          details: error.message,
        });
      }
    }
);
