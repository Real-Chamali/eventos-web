# ✅ Checklist de Testing Local

## 🚀 Servidor de Desarrollo

El servidor está ejecutándose en: **http://localhost:3000**

---

## 📋 Checklist de Verificación

### 1. ✅ Navegación y Layout

- [ ] **Sidebar** se muestra correctamente
  - [ ] Enlaces funcionan
  - [ ] Estado activo se resalta
  - [ ] Iconos se muestran correctamente
  - [ ] Responsive (se oculta en móvil)

- [ ] **Navbar** funciona correctamente
  - [ ] Búsqueda global funciona (⌘K o Ctrl+K)
  - [ ] Notificaciones se muestran
  - [ ] Menú de usuario funciona
  - [ ] Dark mode toggle funciona

- [ ] **Breadcrumbs** se muestran en páginas correspondientes

---

### 2. ✅ Dashboard Principal (`/dashboard`)

- [ ] Cards de métricas se muestran correctamente
  - [ ] Ventas Totales
  - [ ] Comisiones
  - [ ] Tasa de Conversión
  - [ ] Promedio de Venta

- [ ] Calendario de eventos se muestra
- [ ] Gráfico de ventas mensuales se renderiza
- [ ] Lista de cotizaciones recientes funciona
- [ ] Botones de acción funcionan

---

### 3. ✅ Módulo de Cotizaciones

#### Lista (`/dashboard/quotes`)
- [ ] Tabla se muestra correctamente
- [ ] Búsqueda funciona
- [ ] Filtros por estado funcionan
- [ ] Enlaces a detalles funcionan

#### Detalle (`/dashboard/quotes/[id]`)
- [ ] Información del cliente se muestra
- [ ] Tabla de servicios se muestra
- [ ] Resumen financiero es correcto
- [ ] Botón "Exportar PDF" funciona
- [ ] Botón "Cerrar Venta" funciona (si es draft)
- [ ] Comentarios se muestran (si aplica)

#### Nueva Cotización (`/dashboard/quotes/new`)
- [ ] Formulario multi-paso funciona
- [ ] Búsqueda de clientes funciona
- [ ] Agregar servicios funciona
- [ ] Validación funciona
- [ ] Crear cotización funciona

---

### 4. ✅ Módulo de Eventos

#### Detalle (`/dashboard/events/[id]`)
- [ ] Timeline se muestra correctamente
- [ ] Checklist funciona
- [ ] Información del evento se muestra
- [ ] Resumen de cotización se muestra
- [ ] Comentarios funcionan (si aplica)

---

### 5. ✅ Módulo de Clientes

#### Lista (`/dashboard/clients`)
- [ ] Tabla se muestra correctamente
- [ ] Búsqueda funciona
- [ ] Crear nuevo cliente funciona

#### Detalle (`/dashboard/clients/[id]`)
- [ ] Información del cliente se muestra
- [ ] Historial de cotizaciones se muestra
- [ ] Comentarios funcionan (si aplica)

#### Nuevo Cliente (`/dashboard/clients/new`)
- [ ] Formulario funciona
- [ ] Validación funciona
- [ ] Crear cliente funciona

---

### 6. ✅ Módulo Admin

#### Servicios (`/admin/services`)
- [ ] Tabla de servicios se muestra
- [ ] Edición inline de precios funciona
- [ ] Crear servicio funciona
- [ ] Editar servicio funciona
- [ ] Eliminar servicio funciona (con validación)
- [ ] Cálculo de márgenes funciona

#### Finanzas (`/admin/finance`)
- [ ] Cards de resumen se muestran
- [ ] Tabla de ledger se muestra
- [ ] Filtros funcionan
- [ ] Agregar entrada funciona
- [ ] Gráfico se muestra

---

### 7. ✅ Componentes UI

- [ ] **Botones**: Todos los estilos funcionan
  - [ ] Default, Outline, Ghost, Destructive, Premium
  - [ ] Estados hover y focus
  - [ ] Loading states

- [ ] **Cards**: Se muestran correctamente
  - [ ] Variantes (default, elevated, outlined)
  - [ ] Headers con gradientes
  - [ ] Sombras y bordes

- [ ] **Modales**: Funcionan correctamente
  - [ ] Dialog se abre/cierra
  - [ ] AlertDialog funciona
  - [ ] Animaciones suaves

- [ ] **Tablas**: Se muestran correctamente
  - [ ] Hover effects
  - [ ] Responsive
  - [ ] Acciones visibles

- [ ] **Inputs**: Funcionan correctamente
  - [ ] Validación visual
  - [ ] Estados de error
  - [ ] Labels y placeholders

---

### 8. ✅ Dark Mode

- [ ] Toggle funciona
- [ ] Colores se adaptan correctamente
- [ ] Contraste es adecuado
- [ ] Transición es suave

---

### 9. ✅ Responsive Design

- [ ] **Desktop** (>1024px): Layout completo
- [ ] **Tablet** (768px-1024px): Adaptación correcta
- [ ] **Mobile** (<768px): Sidebar oculta, navegación móvil

---

### 10. ✅ Performance

- [ ] Páginas cargan rápidamente
- [ ] Transiciones son suaves
- [ ] Sin errores en consola
- [ ] Sin warnings importantes

---

## 🐛 Errores a Reportar

Si encuentras algún error, anota:
- [ ] URL donde ocurre
- [ ] Descripción del error
- [ ] Pasos para reproducir
- [ ] Captura de pantalla (si aplica)

---

## ✅ Resultado Final

- [ ] Todo funciona correctamente
- [ ] Sin errores críticos
- [ ] Listo para producción

---

## 📝 Notas

- El servidor está corriendo en: **http://localhost:3000**
- Abre el navegador y navega por la aplicación
- Verifica cada sección según el checklist
- Reporta cualquier problema encontrado

---

**¡Buena suerte con el testing!** 🚀

