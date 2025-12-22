# 🚀 Cómo Aplicar las 3 Tareas Críticas - Guía Paso a Paso

**Tiempo total**: ~50 minutos  
**Dificultad**: Fácil (solo seguir pasos)

---

## 📋 Resumen de las 3 Tareas

1. **Migración 015** (15 min) - Seguridad en base de datos
2. **Protección Contraseñas** (5 min) - Seguridad adicional
3. **Configurar Resend** (30 min) - Email real

---

## ✅ TAREA 1: Aplicar Migración 015 (15 minutos)

### ¿Qué hace?
Corrige problemas de seguridad en la base de datos.

### Pasos:

#### Paso 1: Abrir Supabase Dashboard
1. Ve a tu navegador
2. Abre: https://supabase.com/dashboard
3. Inicia sesión si es necesario
4. Selecciona tu proyecto (debería aparecer automáticamente)

#### Paso 2: Ir al SQL Editor
1. En el menú lateral izquierdo, busca **"SQL Editor"**
2. Haz clic en **"SQL Editor"**
3. Verás una pantalla con un editor de texto grande

#### Paso 3: Verificar si ya está aplicada (OPCIONAL pero recomendado)
1. En el SQL Editor, crea una **nueva query** (botón "New query" arriba)
2. Abre el archivo `QUERY_VERIFICACION_MIGRACION_015.sql` en tu editor de código
3. Copia TODO el contenido del archivo
4. Pega en el SQL Editor de Supabase
5. Haz clic en **"Run"** (botón azul) o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)
6. Mira los resultados:
   - Si TODOS muestran ✅ → La migración ya está aplicada, **SALTA al Paso 5**
   - Si alguno muestra ❌ → Continúa con el Paso 4

#### Paso 4: Aplicar la Migración
1. En el SQL Editor, crea una **nueva query** (botón "New query")
2. Abre el archivo `migrations/015_fix_security_issues.sql` en tu editor de código
3. **Copia TODO el contenido** del archivo (desde la primera línea hasta la última)
4. Pega en el SQL Editor de Supabase
5. Haz clic en **"Run"** o presiona `Ctrl+Enter` / `Cmd+Enter`
6. Espera 1-2 minutos mientras se ejecuta
7. Deberías ver mensajes como:
   - "CREATE VIEW"
   - "ALTER TABLE"
   - "CREATE POLICY"
   - etc.
8. **Si ves errores en rojo**, cópiame el mensaje de error y te ayudo

#### Paso 5: Verificar que Funcionó
1. Ejecuta el script de verificación del Paso 3 nuevamente
2. **Todos deben mostrar ✅ ahora**
3. Si hay algún ❌, avísame y te ayudo

**✅ ¡TAREA 1 COMPLETADA!**

---

## ✅ TAREA 2: Habilitar Protección de Contraseñas (5 minutos)

### ¿Qué hace?
Bloquea contraseñas que han sido expuestas en filtraciones de datos.

### Pasos:

#### Paso 1: Ir a Authentication
1. En Supabase Dashboard, en el menú lateral izquierdo
2. Haz clic en **"Authentication"**

#### Paso 2: Buscar Password Security
1. Dentro de Authentication, busca una de estas opciones:
   - **"Policies"**
   - **"Settings"**
   - **"Configuration"**
2. Haz clic en cualquiera de esas opciones
3. Busca la sección **"Password Security"** o **"Password Requirements"**

**💡 Si no encuentras "Password Security":**
- Busca en diferentes pestañas dentro de Authentication
- Puede estar en "Settings" → "Password"
- O en "Configuration" → "Password Security"

#### Paso 3: Activar Protección
1. Busca la opción **"Leaked Password Protection"** o **"Check for compromised passwords"**
2. **Activa el toggle/switch** (debe quedar en verde/azul)
3. (Opcional) Configura requisitos mínimos:
   - **Minimum password length**: Cambia a `8`
   - **Require uppercase**: Activa ✅
   - **Require lowercase**: Activa ✅
   - **Require numbers**: Activa ✅
   - **Require special characters**: Activa ✅ (opcional)

#### Paso 4: Guardar
1. Busca el botón **"Save"** o **"Update"**
2. Haz clic en él
3. Espera confirmación de que se guardó

**✅ ¡TAREA 2 COMPLETADA!**

---

## ✅ TAREA 3: Configurar Resend - Email Real (30 minutos)

### ¿Qué hace?
Permite enviar emails reales desde tu aplicación.

### Pasos:

#### Parte A: Crear Cuenta en Resend (5 min)

##### Paso 1: Ir a Resend
1. Abre tu navegador
2. Ve a: https://resend.com
3. Haz clic en **"Sign Up"** o **"Get Started"**

##### Paso 2: Registrarse
1. Elige cómo registrarte:
   - **Opción más rápida**: Con GitHub (recomendado)
   - **Opción alternativa**: Con Google
   - **Opción manual**: Con email (necesitarás verificar)
2. Completa el registro
3. Si usas email, verifica tu cuenta desde el email que recibas

#### Parte B: Obtener API Key (5 min)

##### Paso 3: Ir a API Keys
1. Una vez dentro del dashboard de Resend
2. En el menú lateral izquierdo, busca **"API Keys"**
3. Haz clic en **"API Keys"**

##### Paso 4: Crear API Key
1. Haz clic en el botón **"Create API Key"** (botón azul, arriba a la derecha)
2. Completa el formulario:
   - **Name**: Escribe `Eventos Web Production`
   - **Permission**: Selecciona **"Sending access"** (suficiente para enviar emails)
3. Haz clic en **"Add"** o **"Create"**

##### Paso 5: Copiar API Key
1. **⚠️ IMPORTANTE**: Resend te mostrará la API key **SOLO UNA VEZ**
2. La API key tiene este formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **Cópiala inmediatamente** y guárdala en un lugar seguro temporalmente
4. Haz clic en **"Done"** o **"Close"**

#### Parte C: Configurar Dominio (10 min) - OPCIONAL pero RECOMENDADO

**Si tienes un dominio propio** (ej: `tudominio.com`):

##### Paso 6: Agregar Dominio
1. En Resend Dashboard, ve a **"Domains"** (menú lateral)
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio: `tudominio.com` (sin www, sin http://)
4. Haz clic en **"Add"**

##### Paso 7: Configurar DNS
1. Resend te mostrará registros DNS que debes agregar:
   - **SPF Record** (1 registro)
   - **DKIM Record** (puede haber varios, normalmente 3)
   - **DMARC Record** (opcional)
2. Ve a donde compraste tu dominio (Cloudflare, GoDaddy, Namecheap, etc.)
3. Busca la sección de **"DNS"** o **"DNS Records"**
4. Agrega cada registro que Resend te dio
5. Vuelve a Resend y haz clic en **"Verify"**
6. Espera verificación (puede tardar hasta 48 horas, pero usualmente es más rápido)

**Si NO tienes dominio:**
- Puedes saltar esta parte
- Usarás el dominio de prueba de Resend temporalmente
- Los emails pueden ir a spam, pero funcionará para testing

#### Parte D: Configurar en Vercel (10 min)

##### Paso 8: Ir a Vercel Dashboard
1. Abre tu navegador
2. Ve a: https://vercel.com/dashboard
3. Inicia sesión si es necesario
4. Selecciona tu proyecto **"eventos-web"**

##### Paso 9: Ir a Environment Variables
1. En la parte superior, haz clic en **"Settings"**
2. En el menú lateral izquierdo, busca **"Environment Variables"**
3. Haz clic en **"Environment Variables"**

##### Paso 10: Agregar RESEND_API_KEY
1. Haz clic en el botón **"Add New"** o **"Add"** (arriba a la derecha)
2. Completa:
   - **Key**: Escribe exactamente `RESEND_API_KEY` (sin espacios)
   - **Value**: Pega la API key que copiaste en el Paso 5 (`re_xxxxxxxxxxxxx`)
   - **Environment**: Marca las 3 casillas:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Haz clic en **"Save"**

##### Paso 11: Agregar RESEND_FROM_EMAIL (Opcional)
1. Haz clic en **"Add New"** nuevamente
2. Completa:
   - **Key**: Escribe exactamente `RESEND_FROM_EMAIL`
   - **Value**: 
     - Si configuraste dominio: `Eventos Web <noreply@tudominio.com>`
     - Si NO configuraste dominio: `Eventos Web <noreply@eventos-web.com>`
   - **Environment**: Marca las 3 casillas:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Haz clic en **"Save"**

#### Parte E: Redeploy (2 min)

##### Paso 12: Redeploy en Vercel
1. En Vercel Dashboard, ve a **"Deployments"** (menú superior)
2. Encuentra el último deployment (el más reciente)
3. A la derecha del deployment, haz clic en los **3 puntos** (⋯)
4. Selecciona **"Redeploy"**
5. Confirma el redeploy
6. Espera 1-2 minutos a que termine

#### Parte F: Verificar (3 min)

##### Paso 13: Probar Email
Tienes 3 opciones para probar:

**Opción A: Desde la aplicación**
1. Ve a tu aplicación: `https://eventos-web.vercel.app`
2. Inicia sesión
3. Crea una cotización nueva
4. Si está configurado para enviar emails, debería enviar uno

**Opción B: Desde Resend Dashboard**
1. Ve a Resend Dashboard → **"Emails"**
2. Deberías ver el historial de emails enviados
3. Si hay errores, aparecerán aquí con detalles

**Opción C: Desde API** (avanzado)
```bash
curl -X POST https://eventos-web.vercel.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN" \
  -d '{
    "to": "tu-email@ejemplo.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>Este es un email de prueba</p>"
  }'
```

**✅ ¡TAREA 3 COMPLETADA!**

---

## 🎉 ¡FELICIDADES!

Has completado las 3 tareas críticas. Tu aplicación ahora tiene:
- ✅ Seguridad mejorada en base de datos
- ✅ Protección contra contraseñas comprometidas
- ✅ Email real funcionando

---

## 🆘 Si Algo Sale Mal

### Error en Migración 015:
- **"relation already exists"** → Es normal, continúa
- **"permission denied"** → Asegúrate de estar en Supabase Dashboard con permisos de admin
- **"syntax error"** → Verifica que copiaste TODO el contenido del archivo

### No encuentro Password Security:
- Busca en diferentes pestañas dentro de Authentication
- Puede estar en "Settings", "Policies", o "Configuration"
- La ubicación exacta puede variar según la versión de Supabase

### Error con Resend:
- **"Invalid API key"** → Verifica que copiaste la key completa sin espacios
- **Emails no se envían** → Revisa logs en Vercel Dashboard → Deployments → Functions
- **Emails van a spam** → Configura tu propio dominio en Resend

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas con algún paso:
1. Revisa los logs de error
2. Verifica que seguiste todos los pasos
3. Consulta las guías detalladas:
   - `GUIA_APLICAR_MIGRACION_015.md`
   - `GUIA_CONFIGURAR_RESEND.md`
   - `GUIA_HABILITAR_PROTECCION_CONTRASEÑAS.md`

---

**¡Éxito!** 🚀

