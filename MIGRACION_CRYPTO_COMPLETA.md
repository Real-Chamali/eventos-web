# 🔐 Migración Completa a Web Crypto API

## ✅ Estado Actual

La aplicación **ya está completamente migrada** a Web Crypto API. Este documento explica la implementación y los fallbacks legacy.

---

## 🎯 ¿Por qué Web Crypto API?

### Ventajas

1. **✅ Compatible con Edge Runtime**: Funciona en Vercel Edge Functions
2. **✅ Estándar Web**: Disponible en navegadores y Node.js 15+
3. **✅ Sin dependencias**: No requiere módulos de Node.js
4. **✅ Más seguro**: Implementación nativa del navegador/servidor

### Desventajas de Node.js crypto

1. **❌ No funciona en Edge Runtime**: Requiere Node.js completo
2. **❌ Dependencia de runtime**: Limita dónde puede ejecutarse el código
3. **❌ Más pesado**: Incluye más código del necesario

---

## 📋 Funciones Migradas

### ✅ Completamente Migradas (Web Crypto API)

1. **`generateCSRFToken()`**
   - ✅ Usa `webCrypto.getRandomValues()`
   - ✅ Síncrono
   - ✅ Compatible con Edge Runtime

2. **`generateSecureToken()`**
   - ✅ Usa `webCrypto.getRandomValues()`
   - ✅ Síncrono
   - ✅ Compatible con Edge Runtime

3. **`hashSHA256()`**
   - ✅ Usa `webCrypto.subtle.digest('SHA-256')`
   - ✅ Async
   - ✅ Compatible con Edge Runtime

4. **`encryptData()`**
   - ✅ Usa `webCrypto.subtle.encrypt()` con AES-GCM
   - ✅ Usa `webCrypto.subtle.deriveKey()` con PBKDF2
   - ✅ Async
   - ✅ Compatible con Edge Runtime
   - ✅ Formato: `salt:iv:encrypted` (base64)

5. **`deriveKey()`**
   - ✅ Usa `webCrypto.subtle.deriveKey()` con PBKDF2
   - ✅ Async
   - ✅ Compatible con Edge Runtime

### ⚠️ Con Fallback Legacy (Node.js crypto)

**`decryptData()`** soporta múltiples formatos:

1. **Formato Nuevo (Web Crypto API)** ✅
   - Formato: `salt:iv:encrypted` (base64)
   - Usa Web Crypto API
   - Compatible con Edge Runtime

2. **Formato Intermedio (Node.js crypto legacy)** ⚠️
   - Formato: `salt:iv:authTag:encrypted` (hex)
   - Usa Node.js crypto (solo si está disponible)
   - **NO funciona en Edge Runtime**
   - Solo para desencriptar datos antiguos

3. **Formato Muy Legacy (AES-256-CBC)** ⚠️
   - Formato: `encrypted` (hex)
   - Usa Node.js crypto (solo si está disponible)
   - **NO funciona en Edge Runtime**
   - Solo para desencriptar datos muy antiguos

---

## 🔧 Implementación Técnica

### Web Crypto API Global

```typescript
const webCrypto: Crypto = (typeof globalThis !== 'undefined' && globalThis.crypto && 'subtle' in globalThis.crypto)
  ? globalThis.crypto
  : (typeof crypto !== 'undefined' && 'subtle' in crypto)
  ? crypto
  : (() => {
      throw new Error('Web Crypto API not available')
    })()
```

**Explicación**:
- Busca `crypto` en `globalThis` (Node.js 15+)
- Si no, busca `crypto` global (navegador)
- Si no existe, lanza error

### Fallback a Node.js crypto (Solo para Legacy)

```typescript
async function getNodeCrypto(): Promise<any> {
  // Verificar si estamos en Node.js runtime
  const isNodeRuntime = typeof process !== 'undefined' 
    && typeof process.env !== 'undefined'
    && typeof Buffer !== 'undefined'
  
  if (!isNodeRuntime) {
    return null
  }
  
  try {
    // Usar Function constructor para evitar detección en tiempo de build
    const importFunc = new Function('specifier', 'return import(specifier)')
    return await importFunc('crypto')
  } catch {
    return null
  }
}
```

**Explicación**:
- Solo se ejecuta si estamos en Node.js runtime
- Usa `Function` constructor para evitar detección en build time
- Retorna `null` si no está disponible (Edge Runtime)

---

## 📊 Comparación de Formatos

### Formato Nuevo (Web Crypto API)

```
salt:iv:encrypted
```

- **salt**: 16 bytes (hex)
- **iv**: 12 bytes (hex) - para AES-GCM
- **encrypted**: Datos encriptados (base64)
- **Algoritmo**: AES-256-GCM
- **Derivación**: PBKDF2-SHA256 (100,000 iteraciones)

### Formato Intermedio (Node.js crypto legacy)

```
salt:iv:authTag:encrypted
```

- **salt**: 16 bytes (hex)
- **iv**: 12 bytes (hex)
- **authTag**: 16 bytes (hex) - tag de autenticación GCM
- **encrypted**: Datos encriptados (hex)
- **Algoritmo**: AES-256-GCM
- **Derivación**: PBKDF2-SHA256 (100,000 iteraciones)

### Formato Muy Legacy (AES-256-CBC)

```
encrypted
```

- **encrypted**: Datos encriptados (hex)
- **Algoritmo**: AES-256-CBC (deprecated)
- **Derivación**: Directa desde clave (inseguro)

---

## 🚀 Uso en el Código

### Encriptar (Siempre usa Web Crypto API)

```typescript
import { encryptData } from '@/lib/utils/security'

const encrypted = await encryptData('datos sensibles', 'mi-clave')
// Resultado: "abc123...:def456...:encrypted_data_base64..."
```

### Desencriptar (Soporta múltiples formatos)

```typescript
import { decryptData } from '@/lib/utils/security'

// Funciona con cualquier formato (nuevo, intermedio, legacy)
const decrypted = await decryptData(encrypted, 'mi-clave')
```

### Hash SHA-256

```typescript
import { hashSHA256 } from '@/lib/utils/security'

const hash = await hashSHA256('datos a hashear')
// Resultado: "abc123def456..." (hex)
```

### Generar Tokens Seguros

```typescript
import { generateSecureToken, generateCSRFToken } from '@/lib/utils/security'

const token = generateSecureToken(32) // 32 bytes = 64 caracteres hex
const csrfToken = generateCSRFToken() // 32 bytes = 64 caracteres hex
```

---

## ⚠️ Limitaciones

### Edge Runtime

- ✅ **Funciona**: Web Crypto API
- ❌ **NO funciona**: Node.js crypto (fallback legacy)

**Implicación**: 
- Datos encriptados con formato nuevo: ✅ Funcionan en Edge Runtime
- Datos encriptados con formato legacy: ❌ NO funcionan en Edge Runtime

### Migración de Datos Legacy

Si tienes datos encriptados con formato legacy:

1. **Opción 1**: Desencriptar y re-encriptar con formato nuevo
   ```typescript
   // En Node.js runtime (no Edge)
   const oldData = await decryptData(oldEncrypted, key) // Usa Node.js crypto
   const newEncrypted = await encryptData(oldData, key) // Usa Web Crypto API
   ```

2. **Opción 2**: Mantener fallback legacy (solo funciona en Node.js runtime)

---

## 🔒 Seguridad

### Algoritmos Usados

- **Encriptación**: AES-256-GCM
  - ✅ Autenticado (previene tampering)
  - ✅ IV único por encriptación
  - ✅ 256 bits de clave

- **Derivación de Clave**: PBKDF2-SHA256
  - ✅ 100,000 iteraciones (resistente a fuerza bruta)
  - ✅ Salt único por encriptación
  - ✅ SHA-256 como hash

- **Hash**: SHA-256
  - ✅ Estándar criptográfico
  - ✅ Resistente a colisiones

### Recomendaciones

1. **✅ Usar `ENCRYPTION_KEY` fuerte**:
   ```bash
   # Generar clave segura
   openssl rand -hex 32
   ```

2. **✅ Rotar claves periódicamente**:
   - Desencriptar datos con clave antigua
   - Re-encriptar con clave nueva

3. **✅ Nunca exponer `ENCRYPTION_KEY`**:
   - Solo en variables de entorno del servidor
   - Nunca en código o logs

---

## 📝 Archivos Relacionados

- **`lib/utils/security.ts`**: Implementación principal
- **`lib/api/middleware.ts`**: Uso en APIs
- **`app/api/**/route.ts`**: Uso en rutas API

---

## ✅ Checklist de Migración

- [x] Migrar `generateCSRFToken()` a Web Crypto API
- [x] Migrar `generateSecureToken()` a Web Crypto API
- [x] Migrar `hashSHA256()` a Web Crypto API
- [x] Migrar `encryptData()` a Web Crypto API
- [x] Migrar `decryptData()` a Web Crypto API (con fallback legacy)
- [x] Implementar fallback a Node.js crypto para datos legacy
- [x] Documentar formatos soportados
- [x] Probar en Edge Runtime

---

**Estado**: ✅ **MIGRACIÓN COMPLETA**
**Última actualización**: 2025-12-23

