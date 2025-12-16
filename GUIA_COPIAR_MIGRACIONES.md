# 📋 Guía: Cómo Copiar Migraciones SQL Correctamente

## ⚠️ Error Común

Si ves este error:
```
ERROR: 42601: syntax error at or near "GNU" LINE 1: GNU nano 7.2 001_create_audit_logs_table.sql
```

**Causa**: Copiaste el header del editor (nano, vim, etc.) junto con el SQL.

---

## ✅ Solución: Métodos Correctos

### Método 1: Usar el Editor de Código (Recomendado)

1. **Abre el archivo en tu editor** (VS Code, Cursor, etc.)
2. **Selecciona TODO el contenido**:
   - `Ctrl+A` (Windows/Linux) o `Cmd+A` (Mac)
3. **Copia**:
   - `Ctrl+C` (Windows/Linux) o `Cmd+C` (Mac)
4. **Pega en Supabase SQL Editor**:
   - `Ctrl+V` (Windows/Linux) o `Cmd+V` (Mac)

### Método 2: Usar `cat` en Terminal

```bash
# Ver el contenido del archivo
cat migrations/001_create_audit_logs_table.sql

# Copiar directamente al portapapeles (Linux)
cat migrations/001_create_audit_logs_table.sql | xclip -selection clipboard

# Copiar directamente al portapapeles (Mac)
cat migrations/001_create_audit_logs_table.sql | pbcopy
```

### Método 3: Desde GitHub (Si está en el repo)

1. Ve a tu repositorio en GitHub
2. Navega a `migrations/001_create_audit_logs_table.sql`
3. Haz clic en el botón **"Raw"** (arriba a la derecha)
4. Selecciona todo (`Ctrl+A`) y copia (`Ctrl+C`)
5. Pega en Supabase SQL Editor

---

## 🚫 Qué NO Hacer

### ❌ NO copiar desde nano directamente

Si abres el archivo con `nano`:
```bash
nano migrations/001_create_audit_logs_table.sql
```

**NO copies** el header que aparece arriba:
```
GNU nano 7.2                   001_create_audit_logs_table.sql
```

**Solo copia** el contenido SQL que empieza con:
```sql
-- ============================================================================
-- Migración 001: Crear tabla de audit_logs
```

### ❌ NO copiar desde vim directamente

Si abres con `vim`, asegúrate de estar en modo normal y usar comandos correctos.

---

## ✅ Verificación Antes de Pegar

Antes de pegar en Supabase, verifica que el contenido empiece con:

```sql
-- ============================================================================
-- Migración 001: Crear tabla de audit_logs
-- ============================================================================
```

**NO debe empezar con:**
- `GNU nano`
- `vim`
- `#` seguido de información del editor
- Números de línea
- Cualquier texto que no sea SQL

---

## 📝 Pasos Recomendados para Aplicar Migraciones

### Paso 1: Abrir el archivo correctamente

```bash
# Opción A: En tu editor de código
code migrations/001_create_audit_logs_table.sql

# Opción B: Ver en terminal (sin abrir editor)
cat migrations/001_create_audit_logs_table.sql
```

### Paso 2: Seleccionar y copiar

- **En editor**: `Ctrl+A` → `Ctrl+C`
- **En terminal**: Selecciona con el mouse (sin incluir el prompt)

### Paso 3: Verificar en el portapapeles

Pega temporalmente en un editor de texto simple (Notepad, TextEdit) y verifica:
- ✅ Empieza con `--` (comentario SQL)
- ✅ No tiene headers de editor
- ✅ No tiene números de línea

### Paso 4: Pegar en Supabase

1. Ve a Supabase Dashboard → SQL Editor
2. Limpia el editor (si hay contenido previo)
3. Pega el SQL (`Ctrl+V` o `Cmd+V`)
4. Verifica visualmente que se vea correcto
5. Haz clic en **RUN** o presiona `Ctrl+Enter`

---

## 🔍 Ejemplo de Contenido Correcto

El contenido que debes copiar debe verse así:

```sql
-- ============================================================================
-- Migración 001: Crear tabla de audit_logs
-- ============================================================================
-- Esta migración crea la tabla de auditoría para rastrear todos los cambios
-- IMPORTANTE: Aplicar ANTES de las otras migraciones premium
-- ============================================================================

-- Crear tabla audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  -- Primary Key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
```

---

## 🛠️ Si Ya Pegaste el Contenido Incorrecto

Si ya pegaste contenido con headers del editor en Supabase:

1. **Limpia el SQL Editor** completamente
2. **Copia el contenido correcto** usando uno de los métodos arriba
3. **Pega nuevamente** en el editor limpio
4. **Ejecuta** la migración

---

## 💡 Tip Pro

**Usa el comando `cat` para verificar antes de copiar:**

```bash
# Ver las primeras 5 líneas (verificar que no tenga headers)
head -n 5 migrations/001_create_audit_logs_table.sql
```

Debe mostrar:
```
-- ============================================================================
-- Migración 001: Crear tabla de audit_logs
-- ============================================================================
-- Esta migración crea la tabla de auditoría para rastrear todos los cambios
-- IMPORTANTE: Aplicar ANTES de las otras migraciones premium
```

Si ves algo diferente (como "GNU nano" o números), **NO copies ese contenido**.

---

## 📚 Referencias

- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL SQL Syntax](https://www.postgresql.org/docs/current/sql-syntax.html)

---

**Última actualización**: $(date)

