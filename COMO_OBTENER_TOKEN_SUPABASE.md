# 🔑 Cómo Obtener Token de Acceso de Supabase

**Para hacer login en Supabase CLI**

---

## 📋 Pasos Rápidos

### 1. Obtener Token de Acceso

1. **Abre tu navegador** y ve a:
   ```
   https://app.supabase.com/account/tokens
   ```

2. **Haz clic en "Generate new token"**

3. **Dale un nombre** (ej: "CLI Token" o "Terminal Access")

4. **Copia el token** que se genera (solo se muestra una vez)

---

### 2. Hacer Login con el Token

Una vez que tengas el token, ejecuta:

```bash
supabase login --token TU_TOKEN_AQUI
```

O establece como variable de entorno:

```bash
export SUPABASE_ACCESS_TOKEN=TU_TOKEN_AQUI
supabase login
```

---

## ✅ Verificar Login

Después de hacer login, verifica que funciona:

```bash
supabase projects list
```

Deberías ver tu proyecto listado.

---

## 🔗 Enlace Directo

**Obtener Token**: https://app.supabase.com/account/tokens

---

## 💡 Nota

El token es personal y no debe compartirse. Si lo pierdes, puedes generar uno nuevo desde el mismo enlace.

