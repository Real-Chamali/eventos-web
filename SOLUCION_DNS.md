# 🔧 Solución: Error DNS - Dominio Personalizado

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`  
**Dominio:** `real-chamali-vercel.app`  
**Estado:** ❌ DNS no configurado

---

## ✅ SOLUCIÓN INMEDIATA

### Usa la URL de Vercel (Funciona Ahora)

**URL de Producción que SÍ funciona:**
```
https://eventos-1caznmnl6-victhorrrs-projects.vercel.app
```

Esta URL está activa y funcionando. Puedes usarla mientras configuras el dominio personalizado.

---

## 🔧 CONFIGURAR DOMINIO PERSONALIZADO

El dominio `real-chamali-vercel.app` está registrado en Vercel pero necesita configuración DNS.

### Opción 1: Verificar Configuración DNS en Vercel

1. **Ir al Dashboard de Vercel:**
   - https://vercel.com/victhorrrs-projects/eventos-web/settings/domains

2. **Buscar el dominio:**
   - `real-chamali-vercel.app`

3. **Verificar el estado:**
   - Si dice "Pending" o "Invalid Configuration", necesitas configurar DNS

### Opción 2: Obtener Registros DNS desde CLI

```bash
# Obtener información del dominio
vercel domains inspect real-chamali-vercel.app

# Ver dominios del proyecto
vercel domains ls
```

### Opción 3: Configurar DNS Manualmente (RECOMENDADO)

Según Vercel, necesitas configurar lo siguiente:

**Opción A: Agregar Registro A (Recomendado)**

1. **Ir a tu registrador de dominio** (donde compraste `real-chamali-vercel.app`)

2. **Agregar registro A:**
   ```
   Tipo: A
   Nombre: @ (o real-chamali-vercel.app o dejar en blanco)
   Valor: 76.76.21.21
   TTL: 3600 (o automático)
   ```

3. **Guardar los cambios**

**Opción B: Agregar Registro CNAME** (si A no funciona)

```
Tipo: CNAME
Nombre: @ (o real-chamali-vercel.app)
Valor: cname.vercel-dns.com
TTL: 3600
```

### Opción 4: Usar Nameservers de Vercel (Recomendado)

1. **En Vercel Dashboard:**
   - Ir a Settings → Domains
   - Click en `real-chamali-vercel.app`
   - Copiar los nameservers que muestra Vercel

2. **En tu registrador:**
   - Ir a configuración DNS
   - Cambiar nameservers a los de Vercel
   - Esperar propagación (puede tardar hasta 24 horas)

---

## ⏱️ PROPAGACIÓN DNS

Después de configurar DNS:
- **Tiempo típico:** 5 minutos a 24 horas
- **Verificar propagación:** https://www.whatsmydns.net/
- **Verificar en Vercel:** El dominio debería cambiar a "Valid" en el dashboard

---

## 🔍 VERIFICAR ESTADO ACTUAL

### Comandos Útiles

```bash
# Ver todos los dominios
vercel domains ls

# Ver información específica del dominio
vercel domains inspect real-chamali-vercel.app

# Ver deployments activos
vercel ls

# Ver información del proyecto
vercel project ls
```

---

## ✅ SOLUCIÓN TEMPORAL

**Mientras se configura el DNS, usa:**

```
https://eventos-1caznmnl6-victhorrrs-projects.vercel.app
```

Esta URL:
- ✅ Funciona inmediatamente
- ✅ Tiene SSL/HTTPS
- ✅ Es la misma aplicación
- ✅ Todas las funcionalidades disponibles

---

## 📋 CHECKLIST

- [x] URL de Vercel funciona: `https://eventos-1caznmnl6-victhorrrs-projects.vercel.app`
- [ ] Ir a Vercel Dashboard → Domains
- [ ] Verificar estado de `real-chamali-vercel.app`
- [ ] Configurar DNS según instrucciones de Vercel
- [ ] Esperar propagación DNS
- [ ] Verificar que el dominio funciona

---

## 🆘 SI EL PROBLEMA PERSISTE

1. **Verificar que el dominio esté agregado al proyecto:**
   ```bash
   vercel domains add real-chamali-vercel.app
   ```

2. **Verificar que el proyecto esté vinculado:**
   - Vercel Dashboard → Settings → Domains
   - Asegurarse de que el dominio esté asociado a `eventos-web`

3. **Contactar soporte de Vercel:**
   - Si después de 24 horas aún no funciona
   - Proporcionar el dominio y el estado actual

---

## 📞 COMANDOS RÁPIDOS

```bash
# Ver estado actual
vercel domains ls
vercel ls

# URL que funciona AHORA
echo "https://eventos-1caznmnl6-victhorrrs-projects.vercel.app"
```

---

**Última actualización:** 2025-01-XX  
**Estado:** URL de Vercel funcionando, dominio personalizado pendiente de DNS

