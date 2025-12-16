# 🔧 Solución: Error "The schema must be one of the following: graphql_public, api"

## 🎯 Problema

Error `PGRST106`: Supabase no puede acceder a la tabla `profiles` porque no está en los esquemas permitidos.

```
Error: The schema must be one of the following: graphql_public, api
```

## ✅ Soluciones

### Solución 1: Verificar que la tabla `profiles` existe en Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Table Editor**
4. Verifica que la tabla `profiles` existe en el esquema `public`

### Solución 2: Crear la tabla `profiles` si no existe

Ejecuta este SQL en el **SQL Editor** de Supabase:

```sql
-- Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'vendor' CHECK (role IN ('admin', 'vendor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Política: Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Solución 3: Verificar configuración de esquemas en Supabase

1. Ve a **Settings** → **API** en Supabase
2. Verifica que el esquema `public` esté habilitado
3. Si usas PostgREST, verifica la configuración de esquemas permitidos

### Solución 4: Crear perfil para usuario existente

Si la tabla existe pero tu usuario no tiene perfil:

```sql
-- Insertar perfil para usuario existente (reemplaza USER_ID)
INSERT INTO public.profiles (id, role)
VALUES ('TU_USER_ID_AQUI', 'vendor')
ON CONFLICT (id) DO NOTHING;
```

Para obtener tu USER_ID:
1. Ve a **Authentication** → **Users** en Supabase
2. Copia el ID del usuario
3. Reemplaza `TU_USER_ID_AQUI` en el SQL anterior

### Solución 5: Verificar variables de entorno

Asegúrate de que las variables de entorno estén correctas:

```bash
# Ejecutar script de verificación
./scripts/verify-all-env.sh
```

Verifica:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` apunta a tu proyecto correcto
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` es la clave correcta

## 🔍 Diagnóstico

### Verificar si la tabla existe

Ejecuta en el SQL Editor de Supabase:

```sql
-- Verificar si la tabla existe
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name = 'profiles';
```

Debería mostrar:
```
table_name | table_schema
-----------|-------------
profiles   | public
```

### Verificar permisos RLS

```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 📝 Notas

- El código ahora maneja este error de forma más elegante
- Si la tabla no existe, se usa el rol por defecto `vendor`
- Esto evita bucles de redirección cuando hay problemas con la tabla

## ✅ Verificación

Después de aplicar las soluciones:

1. ✅ La tabla `profiles` existe en Supabase
2. ✅ Tu usuario tiene un perfil en la tabla
3. ✅ Las políticas RLS están configuradas
4. ✅ Las variables de entorno son correctas
5. ✅ Reinicia el servidor: `npm run dev`

---

**¿Sigue sin funcionar?** Comparte:
- El resultado de la consulta SQL de verificación
- Capturas de pantalla de la configuración de Supabase
- El error completo del servidor

