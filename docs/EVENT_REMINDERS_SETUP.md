# ⏰ Configuración de Recordatorios Automáticos de Eventos

## ✅ Implementación Completada

El sistema de recordatorios automáticos está **completamente implementado**. Los recordatorios se envían por WhatsApp:

- ✅ 1 día antes del evento
- ✅ 1 semana antes del evento

---

## 🔧 Configuración Requerida

### 1. Configurar Cron Job en Vercel

El cron job ya está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/events/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Horario:** Todos los días a las 9:00 AM UTC

### 2. Configurar Variable de Entorno (Opcional pero Recomendado)

Para proteger el endpoint de llamadas no autorizadas, configura un secreto:

```bash
# En .env.local y Vercel
CRON_SECRET=tu_secreto_super_seguro_aqui
```

**En Vercel:**
```bash
vercel env add CRON_SECRET
# Ingresa un secreto seguro (ej: genera uno con: openssl rand -hex 32)
```

### 3. Configurar Autorización en el Cron Job

Si configuraste `CRON_SECRET`, Vercel automáticamente agregará el header `Authorization: Bearer ${CRON_SECRET}` cuando llame al endpoint.

Si usas otro servicio de cron (GitHub Actions, etc.), asegúrate de incluir el header:

```bash
curl -X GET https://tu-app.vercel.app/api/events/reminders \
  -H "Authorization: Bearer tu_secreto_super_seguro_aqui"
```

---

## 📅 Cómo Funciona

### Recordatorios de 1 Día

- Se envían para eventos que están **mañana**
- Se envían todos los días a las 9:00 AM
- Solo para eventos con estado `confirmed`
- Solo si el cliente tiene teléfono configurado

### Recordatorios de 1 Semana

- Se envían para eventos que están en **7 días**
- Se envían todos los días a las 9:00 AM
- Solo para eventos con estado `confirmed`
- Solo si el cliente tiene teléfono configurado

---

## 🧪 Probar Manualmente

### 1. Probar el Endpoint

```bash
# Sin autenticación (si no configuraste CRON_SECRET)
curl https://tu-app.vercel.app/api/events/reminders

# Con autenticación (si configuraste CRON_SECRET)
curl -X GET https://tu-app.vercel.app/api/events/reminders \
  -H "Authorization: Bearer tu_secreto_super_seguro_aqui"
```

### 2. Respuesta Esperada

```json
{
  "success": true,
  "results": {
    "tomorrow": {
      "sent": 2,
      "failed": 0
    },
    "nextWeek": {
      "sent": 1,
      "failed": 0
    }
  },
  "message": "Recordatorios enviados: 3 exitosos, 0 fallidos"
}
```

### 3. Crear Evento de Prueba

1. Crea un evento con fecha de mañana
2. Asegúrate de que el cliente tenga teléfono configurado
3. Llama al endpoint manualmente
4. Verifica que se envíe el WhatsApp

---

## 🔍 Troubleshooting

### No se envían recordatorios

1. **Verifica que el cron job esté configurado:**
   - Ve a Vercel Dashboard > Settings > Cron Jobs
   - Deberías ver el cron job listado

2. **Verifica los logs:**
   - Ve a Vercel Dashboard > Deployments > Functions
   - Busca logs del endpoint `/api/events/reminders`

3. **Verifica que haya eventos:**
   - Asegúrate de que haya eventos con fecha de mañana o en 7 días
   - Asegúrate de que los eventos tengan estado `confirmed`
   - Asegúrate de que los clientes tengan teléfono configurado

4. **Verifica la configuración de WhatsApp:**
   - Revisa `docs/WHATSAPP_SETUP.md`
   - Asegúrate de que Twilio esté configurado correctamente

### Error 401 Unauthorized

- Verifica que `CRON_SECRET` esté configurado correctamente
- Verifica que el header `Authorization` esté presente y correcto

### Los recordatorios se envían duplicados

- El cron job está diseñado para enviar un recordatorio por evento
- Si un evento tiene múltiples recordatorios, verifica que no haya eventos duplicados en la BD

---

## 📝 Personalizar el Horario

Para cambiar el horario del cron job, edita `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/events/reminders",
      "schedule": "0 9 * * *"  // Formato: minuto hora día mes día-semana
    }
  ]
}
```

**Ejemplos de horarios:**
- `"0 9 * * *"` - Todos los días a las 9:00 AM
- `"0 8,20 * * *"` - Todos los días a las 8:00 AM y 8:00 PM
- `"0 9 * * 1"` - Todos los lunes a las 9:00 AM
- `"*/30 * * * *"` - Cada 30 minutos

**Formato Cron:**
```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (0 = domingo)
│ │ │ │ │
* * * * *
```

---

## 🚀 Producción

### Verificar que Funciona en Producción

1. Despliega la app a producción
2. Crea un evento de prueba con fecha de mañana
3. Espera a que se ejecute el cron job (o ejecútalo manualmente)
4. Verifica que se envíe el WhatsApp

### Monitoreo

- Revisa los logs de Vercel regularmente
- Verifica que los recordatorios se estén enviando
- Monitorea errores en el envío de WhatsApp

---

## 📚 Recursos

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [WhatsApp Setup Guide](./WHATSAPP_SETUP.md)

---

## ✅ Checklist de Configuración

- [ ] Cron job configurado en `vercel.json`
- [ ] Variable `CRON_SECRET` configurada (opcional pero recomendado)
- [ ] WhatsApp configurado (ver `docs/WHATSAPP_SETUP.md`)
- [ ] App desplegada a producción
- [ ] Endpoint probado manualmente
- [ ] Evento de prueba creado
- [ ] Recordatorio recibido por WhatsApp
- [ ] Cron job funcionando en producción

---

**Última actualización:** 2025-01-XX  
**Estado:** ✅ Implementación completa

