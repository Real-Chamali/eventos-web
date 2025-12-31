# 🔧 Instrucciones Completas para Configurar DNS

**Dominio:** `real-chamali-vercel.app`  
**Registro requerido:** `A @ 76.76.21.21`  
**Estado actual:** ❌ DNS no configurado

---

## ⚠️ IMPORTANTE

**No puedo configurar el DNS automáticamente** porque el dominio está registrado con un proveedor externo ("Third Party"). 

**Necesitas acceso al panel de control de tu registrador de dominio** donde compraste `real-chamali-vercel.app`.

---

## 📋 PASOS PARA CONFIGURAR DNS

### Paso 1: Identificar tu Proveedor de Dominio

El dominio `real-chamali-vercel.app` está registrado con un proveedor externo. Necesitas saber dónde:

**Proveedores comunes:**
- GoDaddy
- Namecheap
- Google Domains / Google Workspace
- Cloudflare
- AWS Route 53
- Network Solutions
- 1&1 IONOS
- OVH
- Otro proveedor

**¿Cómo saber dónde está registrado?**
- Revisa los emails que recibiste al comprar el dominio
- Busca en tus cuentas de servicios de dominio
- Revisa tu facturación

### Paso 2: Acceder al Panel de Control

1. Ve al sitio web de tu proveedor de dominio
2. Inicia sesión con tus credenciales
3. Busca la sección de gestión de dominios
4. Localiza `real-chamali-vercel.app`

### Paso 3: Configurar Registro DNS

#### Opción A: Registro A (Recomendado por Vercel)

1. **Busca la sección de DNS o Zone Records**
   - Puede llamarse: "DNS Management", "Zone File", "DNS Records", "Advanced DNS"

2. **Agrega un nuevo registro:**
   - Tipo: **A** (o Address Record)
   - Nombre/Host: **@** (o déjalo en blanco, o ingresa `real-chamali-vercel.app`)
   - Valor/IP: **76.76.21.21**
   - TTL: **3600** (o déjalo en automático/por defecto)

3. **Guarda el registro**

#### Opción B: Cambiar Nameservers (Alternativa)

Si prefieres que Vercel gestione todo el DNS:

1. **Cambia los nameservers en tu registrador a:**
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

2. **Ventaja:** Vercel gestionará automáticamente todos los registros DNS
3. **Desventaja:** Puede tardar más tiempo en propagarse

### Paso 4: Esperar Propagación

- **Tiempo mínimo:** 5-10 minutos
- **Tiempo típico:** 1-2 horas
- **Tiempo máximo:** 24-48 horas

### Paso 5: Verificar

```bash
# Ejecutar el script de verificación
./scripts/verificar-dns.sh

# O verificar manualmente
vercel domains inspect real-chamali-vercel.app
```

---

## 🎯 INSTRUCCIONES POR PROVEEDOR COMÚN

### GoDaddy

1. Inicia sesión en https://www.godaddy.com
2. Ve a "Mis Productos" → "DNS"
3. Busca `real-chamali-vercel.app`
4. Haz clic en "Administrar DNS"
5. Haz clic en "Agregar" en la sección de Registros
6. Selecciona tipo **A**
7. Nombre: **@**
8. Valor: **76.76.21.21**
9. TTL: **600** (o por defecto)
10. Guarda

### Namecheap

1. Inicia sesión en https://www.namecheap.com
2. Ve a "Domain List"
3. Haz clic en "Manage" junto a `real-chamali-vercel.app`
4. Ve a la pestaña "Advanced DNS"
5. Haz clic en "Add New Record"
6. Tipo: **A Record**
7. Host: **@**
8. Value: **76.76.21.21**
9. TTL: **Automatic** (o 30 min)
10. Guarda

### Cloudflare

1. Inicia sesión en https://dash.cloudflare.com
2. Selecciona el dominio `real-chamali-vercel.app`
3. Ve a "DNS" → "Records"
4. Haz clic en "Add record"
5. Tipo: **A**
6. Nombre: **@** (o `real-chamali-vercel.app`)
7. Contenido: **76.76.21.21**
8. Proxy: **Desactivado** (dns only, no proxy)
9. TTL: **Auto**
10. Guarda

### Google Domains

1. Inicia sesión en https://domains.google.com
2. Haz clic en `real-chamali-vercel.app`
3. Ve a "DNS" en el menú lateral
4. En "Registros de recursos personalizados"
5. Haz clic en "Crear nuevo registro"
6. Tipo de registro: **A**
7. Nombre: **@**
8. Datos: **76.76.21.21**
9. TTL: **3600**
10. Guarda

---

## ✅ VERIFICACIÓN AUTOMÁTICA

Ejecuta este script para verificar el estado:

```bash
./scripts/verificar-dns.sh
```

Este script verificará:
- ✅ Si el registro A está configurado
- ✅ Si apunta a la IP correcta
- ✅ Si el dominio responde
- ✅ Estado en Vercel

---

## 🔍 VERIFICACIÓN MANUAL

### Verificar DNS con comandos:

```bash
# Ver registros A
dig real-chamali-vercel.app A +short
# Debería mostrar: 76.76.21.21

# Ver con nslookup
nslookup real-chamali-vercel.app
# Debería mostrar la IP 76.76.21.21

# Verificar en Vercel
vercel domains inspect real-chamali-vercel.app
```

### Verificar en navegador:

1. Espera al menos 5-10 minutos después de configurar
2. Intenta acceder a: `https://real-chamali-vercel.app`
3. Si funciona, ¡está listo!

---

## 📧 NOTIFICACIÓN DE VERCEL

Vercel verificará automáticamente la configuración DNS y te enviará un email cuando:
- ✅ El DNS esté configurado correctamente
- ✅ El certificado SSL esté emitido
- ✅ El dominio esté listo para usar

---

## 🆘 SI NO FUNCIONA

### El registro no aparece después de configurarlo:

1. **Verifica que guardaste los cambios** en tu proveedor
2. **Espera más tiempo** (puede tardar hasta 48 horas)
3. **Verifica con herramientas online:**
   - https://www.whatsmydns.net/#A/real-chamali-vercel.app
   - https://dnschecker.org/#A/real-chamali-vercel.app

### Vercel sigue mostrando error:

1. Verifica que el registro A apunte exactamente a `76.76.21.21`
2. Verifica que no haya otros registros A conflictivos
3. Espera la propagación completa (puede tardar 24-48 horas)
4. Si después de 48 horas no funciona, contacta a soporte de Vercel

---

## 📝 RESUMEN RÁPIDO

**Lo que necesitas hacer:**

1. ✅ Identificar tu proveedor de dominio
2. ✅ Iniciar sesión en su panel de control
3. ✅ Agregar registro A: `@ → 76.76.21.21`
4. ✅ Guardar cambios
5. ✅ Esperar propagación (5min - 48h)
6. ✅ Verificar con: `./scripts/verificar-dns.sh`

**Mientras tanto, usa:**
- ✅ https://eventos-1caznmnl6-victhorrrs-projects.vercel.app

---

**Última actualización:** 2025-01-XX  
**Estado:** Esperando configuración DNS en proveedor externo

