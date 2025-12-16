# 🚀 Guía Rápida: Configurar Sentry en 5 Minutos

## Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar el script de configuración
./scripts/setup-sentry.sh
```

El script te guiará paso a paso para:
- Configurar el DSN de Sentry
- Configurar source maps (opcional)
- Actualizar automáticamente `.env.local`

## Opción 2: Configuración Manual

### Paso 1: Crear cuenta y proyecto en Sentry

1. Ve a [https://sentry.io](https://sentry.io) y crea una cuenta
2. Crea un nuevo proyecto:
   - Selecciona **"Next.js"** como plataforma
   - Elige tu organización
   - Copia el **DSN** que Sentry te proporciona

### Paso 2: Configurar variables de entorno

Edita `.env.local` y agrega:

```bash
# DSN de Sentry (REQUERIDO para activar Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Opcional: Para source maps en producción
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=tu-proyecto
SENTRY_AUTH_TOKEN=tu-token-de-autenticacion

# Opcional: Versión de la aplicación
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Paso 3: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C) y reinicia
npm run dev
```

### Paso 4: Verificar la configuración

```bash
# Ejecutar script de verificación
./scripts/test-sentry.sh
```

## ✅ Verificar que Funciona

1. **En desarrollo**: Abre la consola del navegador (F12)
2. **Ejecuta este código** en la consola:

```javascript
import('@/sentry.config').then(m => {
  m.reportErrorToSentry(
    new Error('Test Sentry Integration'),
    'TestScript',
    { timestamp: new Date() }
  )
})
```

3. **Verifica en Sentry**: Ve a [https://sentry.io](https://sentry.io) y deberías ver el error de prueba

## 📚 Documentación Completa

Para más detalles, consulta: [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md)

## 🔧 Troubleshooting

### Sentry no captura errores

1. Verifica que `NEXT_PUBLIC_SENTRY_DSN` esté configurado
2. Verifica el formato del DSN: `https://xxx@xxx.ingest.sentry.io/xxx`
3. Reinicia el servidor después de agregar la variable
4. Verifica que no haya errores en la consola del navegador

### Source maps no funcionan

1. Verifica que `SENTRY_ORG`, `SENTRY_PROJECT` y `SENTRY_AUTH_TOKEN` estén configurados
2. El token debe tener permisos `project:releases`
3. Ejecuta `npm run build` para generar source maps

## 🎯 Próximos Pasos

Una vez configurado Sentry:

1. **Configurar alertas**: Ve a Sentry > Settings > Alerts
2. **Configurar releases**: Para tracking de versiones
3. **Integrar con Slack/Email**: Para notificaciones automáticas
4. **Revisar errores regularmente**: En el dashboard de Sentry

---

**¿Necesitas ayuda?** Consulta [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md) para documentación detallada.

