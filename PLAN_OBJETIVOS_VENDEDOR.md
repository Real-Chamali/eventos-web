# 🎯 Plan de Implementación: Objetivos para Vendedores

**Fecha**: 2025-12-23  
**Estado**: 🚧 **EN PROGRESO**

---

## 📋 Objetivos a Cumplir

### 1️⃣ Plantillas Inteligentes

**Estado Actual**:
- ✅ Tabla `quote_templates` existe
- ✅ API básica de templates funciona
- ✅ Historial de cambios existe (`quote_versions`)
- ❌ Precios automáticos NO implementados
- ❌ Reglas de mínimos/descuentos NO aplicadas
- ❌ Margen protegido NO implementado
- ❌ Historial de cambios en templates NO implementado

**Funcionalidades a Implementar**:
1. **Precios automáticos**:
   - Aplicar reglas de `service_price_rules` automáticamente
   - Calcular descuentos por cantidad
   - Aplicar promociones por fecha

2. **Reglas claras**:
   - Mínimos de cantidad por servicio
   - Descuentos automáticos por volumen
   - Promociones temporales

3. **Margen protegido**:
   - Validar que precio final >= costo mínimo
   - Alertar si margen es muy bajo
   - Bloquear cotizaciones con pérdida

4. **Historial de cambios**:
   - Guardar versiones de templates
   - Mostrar cambios en templates
   - Comparar versiones

---

### 2️⃣ Calendario Inteligente

**Estado Actual**:
- ✅ Componente Calendar básico existe
- ✅ Muestra eventos del mes
- ❌ NO bloquea fechas automáticamente
- ❌ NO previene dobles reservaciones
- ❌ NO muestra estados visuales claros
- ❌ Solo vista mensual (falta diaria/semanal)

**Funcionalidades a Implementar**:
1. **Bloqueo automático**:
   - Verificar conflictos al crear evento
   - Bloquear fechas ocupadas
   - Mostrar advertencias antes de confirmar

2. **Estados visuales**:
   - Disponible (verde)
   - Apartada (amarillo)
   - Confirmada (azul)
   - Cancelada (gris)

3. **Vistas múltiples**:
   - Vista diaria
   - Vista semanal
   - Vista mensual (ya existe)

4. **Prevención de conflictos**:
   - Validar solapamiento de fechas
   - Mostrar eventos existentes en el rango
   - Bloquear creación si hay conflicto

---

### 3️⃣ Pagos y Finanzas a Prueba de Errores

**Estado Actual**:
- ✅ Tabla `partial_payments` existe
- ✅ Componente `PaymentsList` funciona
- ✅ Cálculo de balance pendiente funciona
- ❌ Anticipos NO diferenciados
- ❌ Fechas límite NO implementadas
- ❌ Recordatorios automáticos NO implementados
- ❌ Reportes claros NO implementados

**Funcionalidades a Implementar**:
1. **Anticipos**:
   - Marcar pagos como anticipo
   - Calcular anticipo mínimo requerido
   - Validar anticipo antes de confirmar evento

2. **Fechas límite**:
   - Agregar `due_date` a `partial_payments`
   - Mostrar pagos vencidos
   - Alertar pagos próximos a vencer

3. **Recordatorios automáticos**:
   - Notificaciones de pagos vencidos
   - Recordatorios de pagos próximos
   - Alertas de anticipos faltantes

4. **Reportes claros**:
   - Ventas reales (confirmadas y pagadas)
   - Pendientes (confirmadas pero no pagadas)
   - Utilidad (ventas - costos)
   - Comisiones (por vendedor)

---

## 🚀 Plan de Implementación

### Fase 1: Plantillas Inteligentes (Prioridad Alta)
1. Crear migración para agregar campos a `quote_templates`:
   - `min_margin_percent` (margen mínimo protegido)
   - `auto_apply_rules` (aplicar reglas automáticamente)
   - `version` (versión del template)

2. Crear función para calcular precios automáticos:
   - Aplicar reglas de `service_price_rules`
   - Calcular descuentos por cantidad
   - Validar margen mínimo

3. Crear componente de historial de templates:
   - Mostrar versiones anteriores
   - Comparar cambios
   - Restaurar versiones

4. Integrar en formulario de cotización:
   - Aplicar precios automáticos al seleccionar template
   - Validar margen antes de guardar
   - Mostrar alertas de margen bajo

### Fase 2: Calendario Inteligente (Prioridad Alta)
1. Mejorar componente Calendar:
   - Agregar vista diaria
   - Agregar vista semanal
   - Mejorar estados visuales

2. Crear función de validación de conflictos:
   - Verificar solapamiento de fechas
   - Bloquear creación si hay conflicto
   - Mostrar eventos existentes

3. Integrar en `CreateEventDialog`:
   - Validar fechas antes de crear
   - Mostrar advertencias
   - Bloquear fechas ocupadas

### Fase 3: Pagos y Finanzas (Prioridad Media)
1. Crear migración para mejorar `partial_payments`:
   - Agregar `is_deposit` (anticipo)
   - Agregar `due_date` (fecha límite)
   - Agregar `reminder_sent` (recordatorio enviado)

2. Crear sistema de recordatorios:
   - Función para enviar recordatorios
   - Cron job o edge function
   - Notificaciones automáticas

3. Crear reportes financieros:
   - Componente de reportes
   - Cálculo de ventas reales
   - Cálculo de utilidad
   - Cálculo de comisiones

---

## 📊 Prioridades

1. **URGENTE**: Calendario inteligente (evitar conflictos)
2. **ALTA**: Plantillas inteligentes (ahorrar tiempo)
3. **MEDIA**: Pagos mejorados (mejor control)

---

## ✅ Próximos Pasos

1. Crear migraciones necesarias
2. Implementar funciones de cálculo
3. Crear componentes UI
4. Integrar en flujos existentes
5. Probar y ajustar

