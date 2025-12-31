# 🌐 Comandos para Configurar Dominio en Vercel

## ✅ Estado Actual

- **Proyecto**: `eventos-web`
- **Proyecto ID**: `prj_nliCqx6FWBkzbLsofxp0kG607evv`
- **Usuario**: `victhorrr`
- **Dominio actual**: `real-chamali-vercel.app`

---

## 📋 Comandos Disponibles

### 1. Ver Dominios Configurados

```bash
vercel domains ls
```

### 2. Agregar Nuevo Dominio

```bash
vercel domains add tu-dominio.com
```

**Ejemplo:**
```bash
vercel domains add eventos-web.com
```

### 3. Ver Detalles de un Dominio

```bash
vercel domains inspect tu-dominio.com
```

**Ejemplo:**
```bash
vercel domains inspect real-chamali-vercel.app
```

### 4. Eliminar Dominio

```bash
vercel domains rm tu-dominio.com
```

---

## 🚀 Agregar Dominio Personalizado

### Opción 1: Script Simple

```bash
./scripts/configurar-dominio-simple.sh tu-dominio.com
```

### Opción 2: Comando Directo

```bash
vercel domains add tu-dominio.com
```

Luego ver los registros DNS necesarios:

```bash
vercel domains inspect tu-dominio.com
```

---

## 🔧 Configuración DNS

Después de agregar el dominio, Vercel te mostrará los registros DNS que necesitas configurar en tu proveedor de dominio.

**Registros típicos:**

1. **CNAME** (Recomendado):
   ```
   Tipo: CNAME
   Nombre: @
   Valor: cname.vercel-dns.com
   ```

2. **A Record**:
   ```
   Tipo: A
   Nombre: @
   Valor: 76.76.21.21
   ```

---

## 📝 Ejemplo Completo

```bash
# 1. Agregar dominio
vercel domains add eventos-web.com

# 2. Ver registros DNS necesarios
vercel domains inspect eventos-web.com

# 3. Configurar DNS en tu proveedor de dominio
# (Sigue las instrucciones mostradas)

# 4. Verificar estado
vercel domains ls

# 5. Ver detalles del dominio
vercel domains inspect eventos-web.com
```

---

## ✅ Verificar Configuración

```bash
# Listar todos los dominios
vercel domains ls

# Ver detalles específicos
vercel domains inspect tu-dominio.com
```

---

## 🔍 Troubleshooting

### El dominio no aparece

1. Verifica que esté agregado:
   ```bash
   vercel domains ls
   ```

2. Verifica el estado:
   ```bash
   vercel domains inspect tu-dominio.com
   ```

### Error al agregar dominio

- Asegúrate de que el dominio no tenga `http://` o `https://`
- Asegúrate de que el dominio sea válido
- Verifica que tengas permisos en el proyecto

---

**Última actualización:** 2025-01-XX

