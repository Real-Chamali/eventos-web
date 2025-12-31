# 🌐 Configurar Dominio Personalizado en Vercel

## ✅ Método 1: Usando Vercel CLI (Recomendado)

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Autenticarse

```bash
vercel login
```

### 3. Ejecutar Script Automático

```bash
./scripts/configurar-dominio-vercel.sh
```

El script te guiará paso a paso para:
- Agregar el dominio a Vercel
- Mostrar las instrucciones de DNS
- Verificar el estado del dominio

---

## 📋 Método 2: Comandos Manuales

### 1. Agregar Dominio

```bash
vercel domains add tu-dominio.com
```

### 2. Ver Registros DNS Necesarios

```bash
vercel domains inspect tu-dominio.com
```

### 3. Listar Todos los Dominios

```bash
vercel domains ls
```

---

## 🔧 Configuración de DNS

Después de agregar el dominio en Vercel, necesitas configurar los registros DNS en tu proveedor de dominio:

### Opción 1: CNAME (Recomendado)

```
Tipo: CNAME
Nombre: @ (o tu subdominio)
Valor: cname.vercel-dns.com
TTL: 3600 (o el valor por defecto)
```

### Opción 2: A Record

```
Tipo: A
Nombre: @ (o tu subdominio)
Valor: 76.76.21.21
TTL: 3600 (o el valor por defecto)
```

### Opción 3: Usar Registros Específicos de Vercel

Para obtener los registros DNS exactos que Vercel necesita:

```bash
vercel domains inspect tu-dominio.com
```

Esto mostrará los registros DNS específicos que debes configurar.

---

## ⏱️ Propagación DNS

Después de configurar los registros DNS:

1. **Tiempo de propagación**: Puede tardar de 5 minutos a 48 horas
2. **Verificar propagación**: Usa herramientas como:
   - [whatsmydns.net](https://www.whatsmydns.net/)
   - [dnschecker.org](https://dnschecker.org/)

3. **Verificar en Vercel**:
   ```bash
   vercel domains inspect tu-dominio.com
   ```

---

## ✅ Verificar Configuración

### 1. Ver Estado del Dominio

```bash
vercel domains inspect tu-dominio.com
```

### 2. Verificar en el Dashboard

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Domains**
4. Verifica que el dominio aparezca y esté configurado correctamente

### 3. Verificar SSL

Vercel emitirá automáticamente un certificado SSL (Let's Encrypt) una vez que el DNS esté configurado correctamente. Esto puede tardar unos minutos después de la propagación DNS.

---

## 🔍 Troubleshooting

### El dominio no se verifica

1. **Verifica los registros DNS**:
   ```bash
   vercel domains inspect tu-dominio.com
   ```

2. **Verifica la propagación DNS**:
   - Usa [whatsmydns.net](https://www.whatsmydns.net/)
   - Asegúrate de que los registros DNS estén propagados globalmente

3. **Espera más tiempo**: La propagación DNS puede tardar hasta 48 horas

### Error: "Domain already exists"

Si el dominio ya está agregado:
```bash
vercel domains ls
```

Para ver todos los dominios configurados.

### Error: "Invalid domain"

- Asegúrate de que el dominio no tenga `http://` o `https://`
- Asegúrate de que el dominio sea válido (ej: `tu-dominio.com`, no `www.tu-dominio.com`)

### El certificado SSL no se emite

1. Verifica que el DNS esté configurado correctamente
2. Espera unos minutos después de la propagación DNS
3. Vercel emitirá el certificado automáticamente

---

## 📚 Comandos Útiles

```bash
# Listar todos los dominios
vercel domains ls

# Ver detalles de un dominio específico
vercel domains inspect tu-dominio.com

# Agregar un dominio
vercel domains add tu-dominio.com

# Eliminar un dominio
vercel domains rm tu-dominio.com

# Ver información del proyecto
vercel ls

# Ver información detallada del proyecto
vercel inspect
```

---

## 🎯 Ejemplo Completo

```bash
# 1. Instalar Vercel CLI (si no está instalado)
npm i -g vercel

# 2. Autenticarse
vercel login

# 3. Agregar dominio
vercel domains add eventos-web.com

# 4. Ver registros DNS necesarios
vercel domains inspect eventos-web.com

# 5. Configurar DNS en tu proveedor de dominio
# (Sigue las instrucciones mostradas)

# 6. Verificar estado
vercel domains inspect eventos-web.com

# 7. Listar todos los dominios
vercel domains ls
```

---

## ✅ Checklist

- [ ] Vercel CLI instalado
- [ ] Autenticado en Vercel (`vercel login`)
- [ ] Dominio agregado en Vercel (`vercel domains add`)
- [ ] Registros DNS configurados en proveedor de dominio
- [ ] DNS propagado (verificado con herramientas online)
- [ ] Certificado SSL emitido (automático en Vercel)
- [ ] Dominio funcionando correctamente

---

**Última actualización:** 2025-01-XX  
**Estado:** ✅ Script y documentación completos

