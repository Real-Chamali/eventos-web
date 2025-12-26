# 📱 Configuración de WhatsApp con Twilio

## ✅ Implementación Completada

La integración de WhatsApp está **completamente implementada** y lista para usar. Los mensajes se envían automáticamente cuando:

- ✅ Se crea una nueva cotización
- ✅ Se aprueba una cotización
- ✅ Se rechaza una cotización
- ✅ Se registra un pago
- ✅ Se crea un evento (próximamente)

---

## 🔧 Configuración Requerida

### 1. Crear Cuenta en Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Crea una cuenta (o inicia sesión)
3. Verifica tu número de teléfono

### 2. Configurar WhatsApp en Twilio

1. En el dashboard de Twilio, ve a **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Sigue las instrucciones para configurar tu número de WhatsApp Business
3. Obtén tu **WhatsApp Sandbox Number** (formato: `whatsapp:+14155238886`)

**Nota:** En modo sandbox, solo puedes enviar mensajes a números verificados. Para producción, necesitas aprobar tu cuenta de WhatsApp Business.

### 3. Obtener Credenciales

Necesitas estas credenciales de Twilio:

- **Account SID**: Encontrado en el dashboard principal
- **Auth Token**: Encontrado en el dashboard principal (manténlo secreto)
- **WhatsApp Number**: Tu número de WhatsApp Business (ej: `+14155238886`)

### 4. Configurar Variables de Entorno

Agrega estas variables en tu archivo `.env.local` y en Vercel:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886

# Número del administrador (recibe notificaciones importantes)
ADMIN_PHONE_NUMBER=+524612762467
```

**En Vercel:**
```bash
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_WHATSAPP_NUMBER
vercel env add ADMIN_PHONE_NUMBER
```

**Nota:** El número del administrador (`ADMIN_PHONE_NUMBER`) recibirá notificaciones cuando:
- Se crea una nueva cotización
- Se aprueba una cotización
- Se registra un pago importante (>10% del total)

---

## 📝 Formato de Números de Teléfono

Los números deben estar en formato **E.164**:

- ✅ Correcto: `+521234567890` (México)
- ✅ Correcto: `+12125551234` (EE.UU.)
- ❌ Incorrecto: `1234567890` (falta código de país)
- ❌ Incorrecto: `(123) 456-7890` (formato no válido)

La función `normalizePhoneNumber()` convierte automáticamente números mexicanos al formato correcto:
- Si el número no tiene `+`, se asume que es mexicano y se agrega `+52`
- Si el número empieza con `52`, se agrega `+`

---

## 🧪 Probar la Integración

### 1. Verificar Número en Sandbox

En modo sandbox de Twilio, necesitas verificar tu número:

1. Envía un mensaje de WhatsApp a tu número sandbox con el código que Twilio te proporciona
2. Ejemplo: Envía `join <código>` al número sandbox

### 2. Probar Envío Manual

Puedes probar enviando un mensaje manualmente usando la API:

```bash
curl -X POST https://tu-app.vercel.app/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+521234567890",
    "message": "Mensaje de prueba"
  }'
```

### 3. Probar en la App

1. Crea un cliente con un número de teléfono válido
2. Crea una cotización para ese cliente
3. Deberías recibir un mensaje de WhatsApp automáticamente

---

## 📱 Plantillas de Mensajes

Las plantillas están optimizadas para WhatsApp (mensajes cortos y directos):

### Cotización Creada
```
Hola [Cliente]! 👋

Hemos creado una nueva cotización para ti:

📄 ID: [ID]
💰 Total: [Monto]

Puedes ver todos los detalles en:
[URL]

¡Gracias por confiar en nosotros! 🙏
```

### Cotización Aprobada
```
¡Excelente noticia, [Cliente]! 🎉

Tu cotización ha sido *APROBADA*:

📄 ID: [ID]
💰 Total: [Monto]

[URL]

¡Estamos listos para hacer tu evento inolvidable! 🎊
```

### Pago Registrado
```
Hola [Cliente]! ✅

Hemos registrado tu pago:

📄 Cotización: #[ID]
💵 Pago recibido: [Monto]
💰 Total pagado: [Total]
📊 Total de cotización: [Total]
⏳ Pendiente: [Pendiente]

[URL]

¡Gracias por tu pago! 🙏
```

---

## 🚀 Producción

### Aprobar Cuenta de WhatsApp Business

Para usar WhatsApp en producción (no sandbox):

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Solicita aprobación de WhatsApp Business API
3. Proporciona información de tu negocio
4. Espera aprobación (puede tardar varios días)

### Costos

- **Sandbox**: Gratis (limitado a números verificados)
- **Producción**: 
  - Mensajes de plantilla: ~$0.005 USD por mensaje
  - Mensajes de sesión: ~$0.005 USD por mensaje
  - Consulta [precios de Twilio](https://www.twilio.com/whatsapp/pricing) para más detalles

---

## 🔍 Troubleshooting

### Error: "Twilio credentials not configured"
- Verifica que las variables de entorno estén configuradas
- Reinicia el servidor después de agregar variables

### Error: "Invalid phone number format"
- Verifica que el número esté en formato E.164
- Usa `normalizePhoneNumber()` para convertir números

### No se reciben mensajes
- Verifica que el número esté verificado en sandbox
- Revisa los logs de Twilio en el dashboard
- Verifica que el número del cliente tenga código de país

### Mensajes no se envían en producción
- Verifica que tu cuenta de WhatsApp Business esté aprobada
- Revisa que el número de WhatsApp esté configurado correctamente
- Consulta los logs de Twilio para errores específicos

---

## 📚 Recursos

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Twilio WhatsApp Setup Guide](https://www.twilio.com/docs/whatsapp/quickstart)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Twilio creada
- [ ] WhatsApp Sandbox configurado
- [ ] Variables de entorno configuradas (local y Vercel)
- [ ] Número de teléfono verificado en sandbox
- [ ] Prueba de envío exitosa
- [ ] Cliente creado con número de teléfono válido
- [ ] Cotización creada y mensaje recibido

---

**Última actualización:** 2025-01-XX  
**Estado:** ✅ Implementación completa

