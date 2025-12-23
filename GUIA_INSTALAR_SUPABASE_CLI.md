# 🔧 Guía: Instalar y Configurar Supabase CLI

**Fecha**: Diciembre 2024

---

## 📋 Métodos de Instalación

### Opción 1: Usar npx (Recomendado - No requiere instalación)

```bash
npx supabase@latest login
```

**Nota**: Requiere un token de acceso. Ver sección "Obtener Token de Acceso" abajo.

---

### Opción 2: Instalar con npm (Local en proyecto)

```bash
npm install supabase --save-dev
npx supabase login
```

---

### Opción 3: Instalar binario directamente (Linux)

```bash
# Descargar el binario
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz

# Mover a un directorio en PATH
sudo mv supabase /usr/local/bin/

# Verificar instalación
supabase --version
```

---

## 🔑 Obtener Token de Acceso

### Método 1: Desde Supabase Dashboard

1. Ve a: https://app.supabase.com/account/tokens
2. Haz clic en **"Generate new token"**
3. Dale un nombre (ej: "CLI Token")
4. Copia el token generado
5. Úsalo con:

```bash
npx supabase@latest login --token TU_TOKEN_AQUI
```

O establece como variable de entorno:

```bash
export SUPABASE_ACCESS_TOKEN=TU_TOKEN_AQUI
npx supabase@latest login
```

---

### Método 2: Login Interactivo (Requiere navegador)

Si tienes acceso a un entorno interactivo con navegador:

```bash
npx supabase@latest login
```

Esto abrirá tu navegador para autenticarte.

---

## ✅ Verificar Instalación

```bash
npx supabase@latest --version
```

---

## 📝 Uso del CLI

Una vez autenticado, puedes usar comandos como:

```bash
# Listar proyectos
npx supabase@latest projects list

# Ver logs
npx supabase@latest projects list --linked

# Ejecutar SQL
npx supabase@latest db execute "SELECT * FROM profiles;"
```

---

## 🔗 Enlaces Útiles

- Dashboard de Tokens: https://app.supabase.com/account/tokens
- Documentación CLI: https://supabase.com/docs/reference/cli
- Releases: https://github.com/supabase/cli/releases

---

## 💡 Nota

Para la mayoría de las tareas (como configurar CORS), **no necesitas el CLI**. Puedes hacerlo directamente desde el Dashboard de Supabase.

El CLI es útil para:
- Gestionar migraciones localmente
- Ejecutar SQL desde terminal
- Sincronizar esquemas
- Desarrollo local

