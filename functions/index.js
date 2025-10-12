/**
 * Cloud Functions para Awka Pet Shop
 *
 * Funciones disponibles:
 * - crearPedido: Crea un nuevo pedido y actualiza stock
 * - enviarEmailConfirmacion: Envía email cuando se crea un pedido
 */

const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

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
 * Envía notificación por email (simulado por ahora)
 *
 * Para habilitar emails reales, instala la extensión:
 * "Trigger Email from Firestore" desde Firebase Extensions
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
      console.log(`Número de pedido: ${pedido.numeroPedido}`);
      console.log(`Total: $${pedido.total}`);

      // Aquí puedes:
      // 1. Enviar email al cliente
      // 2. Enviar email al admin
      // 3. Enviar notificación push
      // 4. Integrar con sistema de envíos
      // 5. Generar factura

      // Por ahora solo logueamos
      console.log("Email de confirmación enviado (simulado)");

      // Actualizar el pedido con estado de email
      await event.data.ref.update({
        emailEnviado: true,
        fechaEmailEnviado: admin.firestore.FieldValue.serverTimestamp(),
      });

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
