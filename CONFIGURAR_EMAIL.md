# 📧 Configurar Notificaciones por Email

Este documento explica cómo configurar las notificaciones por email para que el dueño reciba un correo cada vez que se realiza una compra.

## 🔑 Paso 1: Generar Contraseña de Aplicación de Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. En el menú lateral, selecciona **Seguridad**
3. Busca y habilita **Verificación en 2 pasos** (si no la tienes activada)
4. Una vez habilitada, busca **Contraseñas de aplicaciones**
5. Crea una nueva contraseña de aplicación:
   - Nombre sugerido: "Awka Pet Shop Notifications"
   - Google te dará una contraseña de 16 caracteres como: `abcd efgh ijkl mnop`
6. **COPIA esta contraseña** (elimina los espacios)

## ⚙️ Paso 2: Configurar la Contraseña en Firebase

Abre tu terminal y ejecuta este comando (reemplaza `TU_CONTRASEÑA_AQUI` con la contraseña que copiaste):

```bash
firebase functions:secrets:set GMAIL_PASSWORD
```

Cuando te lo pida, pega la contraseña de 16 caracteres (sin espacios).

Alternativamente, puedes usar este comando:

```bash
firebase functions:config:set gmail.password="TU_CONTRASEÑA_AQUI"
```

## 🚀 Paso 3: Desplegar las Funciones

Una vez configurada la contraseña, despliega las funciones:

```bash
cd functions
firebase deploy --only functions
```

## ✅ Paso 4: Verificar que Funciona

1. Realiza una compra de prueba en tu sitio web
2. Verifica que llegue un email a: **Pablohdezr0512@gmail.com**
3. El email debe incluir:
   - Información del pedido (ID, fecha, método de pago)
   - Datos del cliente (nombre, email, teléfono)
   - Dirección de envío completa
   - Lista detallada de productos con cantidades y precios
   - Total de la compra

## 🎨 Formato del Email

El email se enviará con:
- **Asunto**: `🐾 Nuevo Pedido #XXXXXX - $XX.XXX CLP`
- **Remitente**: Awka Pet Shop <Pablohdezr0512@gmail.com>
- **Destinatario**: Pablohdezr0512@gmail.com
- **Formato**: HTML con diseño profesional y colores de la marca

## 🔧 Solución de Problemas

### El email no llega

1. Verifica que la contraseña de aplicación esté configurada correctamente
2. Revisa los logs de Firebase:
   ```bash
   firebase functions:log
   ```
3. Asegúrate de que la verificación en 2 pasos esté habilitada en Gmail

### Error de autenticación

Si ves errores de autenticación:
1. Regenera la contraseña de aplicación en Google
2. Actualiza la configuración en Firebase
3. Vuelve a desplegar las funciones

## 📝 Notas Importantes

- Las notificaciones se envían **automáticamente** cuando se crea un pedido en Firestore
- No es necesario modificar código del frontend
- La función `onPedidoCreado` se ejecuta en segundo plano
- Si el email falla, el pedido igual se guarda en la base de datos
- Puedes cambiar el destinatario editando el archivo `functions/index.js` línea 227

## 🔐 Seguridad

- La contraseña de aplicación **NO** es tu contraseña de Gmail
- Puedes revocarla en cualquier momento desde tu cuenta de Google
- Solo tiene acceso para enviar emails, no para leer
- Se almacena de forma segura en Firebase Functions
