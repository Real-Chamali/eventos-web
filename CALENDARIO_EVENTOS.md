# 📅 Calendario de Eventos

## 🎯 Funcionalidad

El calendario muestra todas las fechas ocupadas por eventos confirmados, visible para todos los usuarios del sistema.

## ✨ Características

### Visualización
- ✅ Calendario mensual interactivo
- ✅ Fechas con eventos marcadas en verde
- ✅ Indicador de cantidad de eventos por fecha
- ✅ Navegación entre meses
- ✅ Día actual resaltado
- ✅ Diseño responsive

### Datos Mostrados
- ✅ Eventos de la tabla `events` (con `start_date` y `end_date`)
- ✅ Cotizaciones confirmadas con `event_date`
- ✅ Información del cliente para cada evento
- ✅ Estado del evento

### Actualización Automática
- ✅ Se actualiza cada 30 segundos automáticamente
- ✅ Refresca datos al cambiar de mes
- ✅ Muestra eventos en tiempo real

### Interactividad
- ✅ Click en fecha para ver detalles
- ✅ Lista de eventos del día seleccionado
- ✅ Información del cliente y estado

## 📍 Ubicaciones

### Dashboard Principal
El calendario aparece en el dashboard principal junto al gráfico de ventas.

### Página Dedicada
Ruta: `/dashboard/calendar`
- Vista completa del calendario
- Información adicional
- Más espacio para visualización

### Navegación
- Agregado en el Sidebar como "Calendario"
- Icono de calendario para fácil identificación

## 🎨 Diseño

- **Fechas ocupadas**: Fondo verde claro (light mode) / verde oscuro (dark mode)
- **Día actual**: Borde azul
- **Fecha seleccionada**: Fondo azul claro
- **Indicador de múltiples eventos**: Número en la esquina superior derecha
- **Punto verde**: Indicador de evento en la parte inferior

## 🔄 Fuentes de Datos

### Tabla `events`
```sql
SELECT 
  e.id,
  e.start_date,
  e.end_date,
  e.status,
  q.client_id,
  c.name as client_name
FROM events e
JOIN quotes q ON e.quote_id = q.id
JOIN clients c ON q.client_id = c.id
```

### Tabla `quotes`
```sql
SELECT 
  q.id,
  q.event_date,
  q.status,
  q.client_id,
  c.name as client_name
FROM quotes q
JOIN clients c ON q.client_id = c.id
WHERE q.status = 'APPROVED' 
  AND q.event_date IS NOT NULL
```

## 🚀 Uso

### Ver Calendario
1. Ve al Dashboard o a `/dashboard/calendar`
2. Navega entre meses con las flechas
3. Haz clic en una fecha para ver eventos

### Actualización
- El calendario se actualiza automáticamente cada 30 segundos
- También puedes refrescar manualmente recargando la página

## 📝 Notas Técnicas

- Usa `date-fns` para manejo de fechas
- Componente cliente (`'use client'`)
- Consultas optimizadas a Supabase
- Manejo de rangos de fechas (start_date a end_date)
- Soporte completo dark/light mode

## 🔮 Mejoras Futuras

- [ ] Filtros por tipo de evento
- [ ] Vista semanal y diaria
- [ ] Exportar calendario (iCal)
- [ ] Notificaciones de eventos próximos
- [ ] Vista de disponibilidad
- [ ] Drag and drop para mover eventos

---

**Última actualización**: Diciembre 2025

