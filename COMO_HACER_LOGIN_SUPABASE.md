# 🔑 Cómo Hacer Login en Supabase CLI

**CLI Instalado**: ✅ `/usr/local/bin/supabase`

---

## 🔍 Problema

El comando `supabase` no está disponible porque `/usr/local/bin` puede no estar en tu PATH actual.

---

## ✅ Soluciones

### Opción 1: Usar ruta completa (Más rápido)

```bash
/usr/local/bin/supabase login
```

### Opción 2: Agregar al PATH temporalmente

```bash
export PATH="/usr/local/bin:$PATH"
supabase login
```

### Opción 3: Agregar al PATH permanentemente

Agrega esta línea a tu `~/.bashrc` o `~/.zshrc`:

```bash
export PATH="/usr/local/bin:$PATH"
```

Luego ejecuta:
```bash
source ~/.bashrc  # o source ~/.zshrc
supabase login
```

---

## 🔑 Login con Token (Recomendado para entornos no interactivos)

### Paso 1: Obtener Token de Acceso

1. Ve a: **https://app.supabase.com/account/tokens**
2. Haz clic en **"Generate new token"**
3. Dale un nombre (ej: "CLI Token")
4. **Copia el token** (solo se muestra una vez)

### Paso 2: Hacer Login con el Token

```bash
# Opción A: Usar flag --token
/usr/local/bin/supabase login --token TU_TOKEN_AQUI

# Opción B: Usar variable de entorno
export SUPABASE_ACCESS_TOKEN=TU_TOKEN_AQUI
/usr/local/bin/supabase login
```

---

## ✅ Verificar Login

```bash
/usr/local/bin/supabase projects list
```

Si funciona, verás la lista de tus proyectos.

---

## 📝 Nota Importante

**Para configurar CORS y protección de contraseñas, NO necesitas el CLI.**

Puedes hacerlo directamente desde el Dashboard:
- **CORS**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/url-configuration
- **Protección de contraseñas**: https://app.supabase.com/project/nmcrmgdnpzrrklpcgyzn/auth/providers

El CLI es útil para:
- Gestionar migraciones
- Ejecutar SQL desde terminal
- Desarrollo local

---

## 🚀 Próximos Pasos

1. **Obtener token**: https://app.supabase.com/account/tokens
2. **Hacer login**: `/usr/local/bin/supabase login --token TU_TOKEN`
3. **Verificar**: `/usr/local/bin/supabase projects list`

---

**¿Necesitas ayuda con algún paso específico?**

