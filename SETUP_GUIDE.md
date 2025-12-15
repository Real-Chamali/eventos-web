# 🚀 Guía de Configuración Rápida - Sistema de Eventos

## ⚡ Setup en 5 Minutos

### Paso 1: Instalar Dependencias
```bash
npm install
```

### Paso 2: Configurar Variables de Entorno

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Obtén tus credenciales de Supabase:**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto (o crea uno nuevo)
   - Ve a **Settings** → **API**
   - Copia los siguientes valores:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Edita `.env.local` y pega tus credenciales:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   ```

### Paso 3: Configurar Base de Datos

1. **Ve a Supabase Dashboard** → **SQL Editor**

2. **Ejecuta las migraciones en orden:**
   - Primero: `migrations/001_create_audit_logs_table.sql`
   - Segundo: `migrations/002_create_quote_versions_table_final.sql`

3. **Crea las tablas principales** (ver `SETUP.md` para SQL completo):
   - `profiles`
   - `clients`
   - `services`
   - `quotes`
   - `quote_services`
   - `finance_ledger`

### Paso 4: Iniciar la Aplicación

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### Paso 5: Crear Usuario Admin

1. Ve a Supabase Dashboard → **Authentication** → **Users**
2. Crea un nuevo usuario o usa el que ya tienes
3. Ve a **Table Editor** → `profiles`
4. Inserta un registro con:
   - `id`: El UUID del usuario de auth.users
   - `role`: `'admin'`

## ✅ Verificación

Si todo está configurado correctamente:
- ✅ La aplicación carga sin errores
- ✅ Puedes hacer login
- ✅ Eres redirigido según tu rol (admin → /admin, vendor → /dashboard)
- ✅ No hay errores en la consola del navegador

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
**Solución:** Verifica que `.env.local` existe y tiene las variables correctas.

### Error: "Failed to connect to Supabase"
**Solución:** 
1. Verifica que las URLs en `.env.local` son correctas
2. Verifica tu conexión a internet
3. Verifica que el proyecto de Supabase está activo

### Error: "User not found" o problemas de autenticación
**Solución:**
1. Verifica que el usuario existe en Supabase Auth
2. Verifica que existe un registro en la tabla `profiles` con el mismo `id`
3. Verifica las políticas RLS en Supabase

### La aplicación no redirige correctamente
**Solución:**
1. Limpia la caché del navegador
2. Reinicia el servidor de desarrollo
3. Verifica que el rol en `profiles` es correcto ('admin' o 'vendor')

## 📚 Documentación Adicional

- [SETUP.md](SETUP.md) - Configuración detallada y esquemas SQL
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Más soluciones de problemas
- [REPORTE_PROFESIONAL_COMPLETO.md](REPORTE_PROFESIONAL_COMPLETO.md) - Análisis completo

## 🆘 ¿Necesitas Ayuda?

Si sigues teniendo problemas:
1. Revisa la consola del navegador (F12)
2. Revisa la consola del servidor donde ejecutas `npm run dev`
3. Verifica los logs en Supabase Dashboard
4. Consulta [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

