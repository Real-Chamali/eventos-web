# Configuración de Cron Jobs para Automatizaciones

## 📋 Resumen

Se han implementado endpoints para automatizaciones que necesitan ejecutarse periódicamente:

1. **Recordatorios de Pagos** - Diariamente
2. **Reportes Semanales** - Cada lunes

## 🔧 Configuración

### Variables de Entorno Requeridas

Agrega a tu `.env.local`:

```bash
# Secreto para proteger endpoints de cron
CRON_SECRET=tu_secreto_ultra_seguro_aqui

# Número de teléfono del admin para reportes
ADMIN_PHONE_NUMBER=+521234567890
```

### Endpoints Disponibles

#### Recordatorios de Pagos
```
GET/POST /api/automations/payment-reminders
Authorization: Bearer {CRON_SECRET}
```

#### Reportes Semanales
```
GET/POST /api/automations/weekly-reports
Authorization: Bearer {CRON_SECRET}
```

## ⏰ Configuración de Cron Jobs

### Opción 1: Vercel Cron Jobs

Agrega a tu `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/automations/payment-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/automations/weekly-reports",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### Opción 2: External Cron Service (Ej: EasyCron, Cron-job.org)

#### Recordatorios diarios (9 AM):
```bash
curl -X GET "https://tu-dominio.com/api/automations/payment-reminders" \
  -H "Authorization: Bearer tu_secreto_ultra_seguro_aqui"
```

#### Reportes semanales (Lunes 9 AM):
```bash
curl -X GET "https://tu-dominio.com/api/automations/weekly-reports" \
  -H "Authorization: Bearer tu_secreto_ultra_seguro_aqui"
```

### Opción 3: GitHub Actions

Crea `.github/workflows/automations.yml`:

```yaml
name: Automatizaciones

on:
  schedule:
    # Diariamente a las 9 AM UTC
    - cron: '0 9 * * *'
    # Los lunes a las 9 AM UTC para reportes semanales
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  payment-reminders:
    if: github.event.schedule == '0 9 * * *' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Ejecutar recordatorios de pagos
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/automations/payment-reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  weekly-reports:
    if: github.event.schedule == '0 9 * * 1' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Ejecutar reportes semanales
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/automations/weekly-reports" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Secrets de GitHub Actions:
- `API_URL`: https://tu-dominio.com
- `CRON_SECRET`: tu_secreto_ultra_seguro_aqui

## 🧪 Pruebas

Para probar manualmente los endpoints:

```bash
# Recordatorios de pagos
curl -X GET "http://localhost:3000/api/automations/payment-reminders" \
  -H "Authorization: Bearer tu_secreto_ultra_seguro_aqui"

# Reportes semanales
curl -X GET "http://localhost:3000/api/automations/weekly-reports" \
  -H "Authorization: Bearer tu_secreto_ultra_seguro_aqui"
```

## 📊 Monitoreo

Los endpoints registran logs en:
- Consola del servidor
- Logs de Vercel (si usas Vercel)
- Sentry (si está configurado)

## 🔄 Flujo de Automatizaciones

### Recordatorios de Pagos (Diarios)
1. **8 AM**: Verifica pagos vencidos y próximos a vencer
2. **9 AM**: Envía recordatorios automáticos vía WhatsApp
3. **9:15 AM**: Envía reporte diario al admin
4. **Todo el día**: Reintentos automáticos si falla envío

### Reportes Semanales (Lunes)
1. **9 AM**: Genera reporte completo de la semana anterior
2. **9:30 AM**: Envía reporte ejecutivo al admin
3. **10 AM**: Genera insights y recomendaciones

## 🎯 Beneficios

✅ **Reducción de trabajo manual** - Automatización completa de recordatorios
✅ **Mejora en cobranza** - Recordatorios oportunos reducen pagos atrasados
✅ **Visibilidad** - Reportes automáticos mantienen informado al admin
✅ **Proactividad** - Sistema anticipa problemas antes de que ocurran
✅ **Escalabilidad** - Sistema crece con el negocio sin esfuerzo adicional

## 🚀 Checklist Final

- [ ] Configurar variables de entorno (`CRON_SECRET`, `ADMIN_PHONE_NUMBER`)
- [ ] Elegir método de cron jobs (Vercel, externo, o GitHub Actions)
- [ ] Probar endpoints manualmente
- [ ] Configurar cron jobs
- [ ] Verificar recepción de mensajes WhatsApp
- [ ] Monitorear primeros días de ejecución

¡Listo! Tu aplicación ahora tiene automatizaciones empresariales completas. 🎉
