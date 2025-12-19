# 📧 Guía: Configurar Resend API Key en Vercel

## 🎯 Objetivo
Configurar la integración de email real con Resend para que los emails se envíen correctamente en producción.

---

## 📋 Pasos para Configurar

### 1. Crear Cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta (gratis hasta 3,000 emails/mes)
3. Verifica tu email

### 2. Obtener API Key

1. Una vez dentro del dashboard de Resend:
   - Ve a **API Keys** en el menú lateral
   - Haz clic en **Create API Key**
   - Dale un nombre (ej: "Eventos Web Production")
   - Selecciona los permisos: **Sending access**
   - Copia la API key (solo se muestra una vez)

### 3. Configurar en Vercel

#### Opción A: Desde Vercel Dashboard (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

**Para Production:**
```
RESEND_API_KEY = re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL = Eventos Web <noreply@tudominio.com>
```

**Para Preview y Development:**
```
RESEND_API_KEY = re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL = Eventos Web <noreply@tudominio.com>
```

4. Haz clic en **Save**
5. **Redeploy** tu aplicación para que los cambios surtan efecto

#### Opción B: Desde Vercel CLI

```bash
# Configurar para Production
vercel env add RESEND_API_KEY production
# Pega tu API key cuando se solicite

vercel env add RESEND_FROM_EMAIL production
# Ingresa: Eventos Web <noreply@tudominio.com>

# Configurar para Preview
vercel env add RESEND_API_KEY preview
vercel env add RESEND_FROM_EMAIL preview

# Configurar para Development
vercel env add RESEND_API_KEY development
vercel env add RESEND_FROM_EMAIL development
```

### 4. Verificar Dominio (Opcional pero Recomendado)

Para mejorar la deliverabilidad de emails:

1. En Resend Dashboard, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio (ej: `tudominio.com`)
4. Agrega los registros DNS que Resend te proporciona
5. Espera a que se verifique (puede tomar hasta 24 horas)

### 5. Verificar Configuración

Una vez configurado, puedes probar el envío de emails:

1. Ve a tu aplicación en producción
2. Crea una cotización o evento
3. Revisa los logs de Vercel para ver si el email se envió correctamente
4. Revisa el dashboard de Resend para ver el estado de los emails enviados

---

## 🔒 Seguridad

- ✅ **Nunca** compartas tu API key públicamente
- ✅ **Nunca** commitees la API key al repositorio
- ✅ Usa diferentes API keys para desarrollo y producción si es posible
- ✅ Rota las API keys periódicamente

---

## 📊 Monitoreo

### Dashboard de Resend
- Ve a **Logs** para ver todos los emails enviados
- Revisa **Analytics** para métricas de entrega
- Configura **Webhooks** para recibir notificaciones de eventos

### Logs de Vercel
- Revisa los logs de función para ver errores de envío
- Busca mensajes que contengan "Email" o "Resend"

---

## ⚠️ Troubleshooting

### Error: "Missing API key"
- Verifica que la variable `RESEND_API_KEY` esté configurada en Vercel
- Asegúrate de haber hecho redeploy después de agregar la variable

### Error: "Invalid API key"
- Verifica que copiaste la API key completa
- Asegúrate de que la API key no haya expirado
- Verifica que la API key tenga permisos de "Sending access"

### Emails no se envían
- Revisa los logs de Vercel para ver el error específico
- Verifica que el dominio esté verificado (si usas dominio personalizado)
- Revisa el dashboard de Resend para ver el estado del email

---

## ✅ Checklist

- [ ] Cuenta creada en Resend
- [ ] API key generada y copiada
- [ ] Variables de entorno configuradas en Vercel
- [ ] Aplicación redeployada
- [ ] Email de prueba enviado
- [ ] Verificación de dominio (opcional)

---

## 📝 Notas

- El plan gratuito de Resend permite 3,000 emails/mes
- Los emails se envían desde `noreply@resend.dev` por defecto
- Para usar un dominio personalizado, necesitas verificarlo primero
- Los emails se envían de forma asíncrona, puede haber un pequeño delay

---

**Última actualización**: $(date)


