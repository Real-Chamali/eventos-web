# 🔧 Configurar DNS para real-chamali-vercel.app

## ✅ Registro DNS Requerido

Para que el dominio `real-chamali-vercel.app` funcione correctamente, necesitas configurar este registro DNS:

### Registro A (Recomendado)

```
Tipo: A
Nombre: @ (o real-chamali-vercel.app)
Valor/IP: 76.76.21.21
TTL: 3600 (o el valor por defecto de tu proveedor)
```

---

## 📋 Pasos para Configurar

### 1. Identificar tu Proveedor de DNS

El dominio `real-chamali-vercel.app` está registrado con un "Third Party" (tercero). Necesitas identificar dónde está registrado:

**Proveedores comunes:**
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare
- AWS Route 53
- Otro proveedor

### 2. Acceder al Panel de Control DNS

1. Inicia sesión en el panel de control de tu proveedor de dominio
2. Busca la sección de "DNS" o "Zone Records" o "DNS Management"
3. Localiza el dominio `real-chamali-vercel.app`

### 3. Agregar el Registro A

1. Haz clic en "Agregar registro" o "Add Record"
2. Selecciona tipo **A**
3. En el campo **Nombre/Host**:
   - Ingresa `@` (para el dominio raíz)
   - O deja en blanco si tu proveedor lo permite
   - O ingresa `real-chamali-vercel.app`
4. En el campo **Valor/IP**:
   - Ingresa: `76.76.21.21`
5. En el campo **TTL**:
   - Deja el valor por defecto (generalmente 3600)
6. Guarda el registro

### 4. Verificar

Después de guardar, puedes verificar con:

```bash
# Verificar el registro DNS
dig real-chamali-vercel.app A

# O con nslookup
nslookup real-chamali-vercel.app
```

---

## 🔄 Alternativa: Cambiar Nameservers

Si prefieres, puedes cambiar los nameservers del dominio a los de Vercel:

### Nameservers de Vercel:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Pasos:**
1. Ve al panel de control de tu proveedor de dominio
2. Busca "Nameservers" o "Servidores de nombres"
3. Cambia a los nameservers de Vercel mostrados arriba
4. Guarda los cambios

**Ventaja:** Vercel gestionará automáticamente todos los registros DNS

---

## ⏱️ Tiempo de Propagación

- **Tiempo mínimo**: 5-10 minutos
- **Tiempo típico**: 1-2 horas
- **Tiempo máximo**: 24-48 horas

---

## ✅ Verificar Configuración

### 1. Verificar en Vercel

```bash
vercel domains inspect real-chamali-vercel.app
```

Cuando esté configurado correctamente, verás:
- ✅ Nameservers configurados correctamente
- ✅ Sin advertencias

### 2. Verificar DNS

```bash
# Verificar registro A
dig real-chamali-vercel.app A +short

# Debería mostrar: 76.76.21.21
```

### 3. Verificar en Navegador

Una vez propagado, deberías poder acceder a:
- `https://real-chamali-vercel.app`

---

## 📧 Notificación de Vercel

Vercel verificará automáticamente la configuración DNS y te enviará un email cuando:
- ✅ El DNS esté configurado correctamente
- ✅ El certificado SSL esté emitido
- ✅ El dominio esté listo para usar

---

## 🔍 Troubleshooting

### El DNS no se propaga

1. **Verifica que el registro esté guardado** en tu proveedor
2. **Espera más tiempo** (puede tardar hasta 48 horas)
3. **Verifica con herramientas online**:
   - [whatsmydns.net](https://www.whatsmydns.net/#A/real-chamali-vercel.app)
   - [dnschecker.org](https://dnschecker.org/#A/real-chamali-vercel.app)

### Vercel muestra error

1. Verifica que el registro A apunte a `76.76.21.21`
2. Verifica que no haya otros registros A conflictivos
3. Espera la propagación completa

### El certificado SSL no se emite

- Vercel emitirá el certificado SSL automáticamente después de que el DNS esté configurado
- Puede tardar unos minutos después de la propagación DNS

---

## 📝 Resumen Rápido

**Lo que necesitas hacer:**

1. Ve al panel de control de tu proveedor de dominio
2. Agrega un registro **A**:
   - Nombre: `@`
   - Valor: `76.76.21.21`
3. Guarda los cambios
4. Espera la propagación (5 min - 48 horas)
5. Vercel verificará y te enviará un email

**Comando para verificar:**
```bash
vercel domains inspect real-chamali-vercel.app
```

---

**Última actualización:** 2025-01-XX

