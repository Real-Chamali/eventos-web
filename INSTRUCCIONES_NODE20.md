# 🔧 Instrucciones: Actualizar Node.js a 20.x en CI/CD

## Problema
CI/CD está usando Node.js 18.20.8, pero Next.js requiere Node.js >=20.9.0

## ✅ Solución: Cambiar una línea en el workflow

### Paso 1: Abrir el archivo del workflow
1. Ve a: https://github.com/Real-Chamali/eventos-web/blob/2025-12-14-jy0q/.github/workflows/ci-cd.yml
2. Haz clic en el ícono de **lápiz** (✏️) para editar

### Paso 2: Cambiar la línea 15
**Busca esta línea (línea 15):**
```yaml
        node-version: [18.x, 20.x]
```

**Cámbiala por:**
```yaml
        node-version: [20.x]
```

### Paso 3: Hacer commit
1. Desplázate hacia abajo
2. Título del commit: `fix: usar solo Node.js 20.x para cumplir requisitos de Next.js`
3. Selecciona: **"Commit directly to the 2025-12-14-jy0q branch"**
4. Haz clic en **"Commit changes"**

## ✅ Verificación

Después del commit, el workflow debería:
- ✅ Usar solo Node.js 20.x
- ✅ El build debería funcionar correctamente
- ✅ Next.js debería aceptar la versión de Node.js

## 📋 Cambio Específico

**Antes:**
```yaml
    strategy:
      matrix:
        node-version: [18.x, 20.x]
```

**Después:**
```yaml
    strategy:
      matrix:
        node-version: [20.x]
```

Eso es todo. Solo necesitas cambiar esa una línea. 🚀

