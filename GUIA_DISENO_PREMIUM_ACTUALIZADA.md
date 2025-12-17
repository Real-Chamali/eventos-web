# 🎨 Guía de Diseño Premium - Actualizada

## 📋 Versión: 2.0 - Rediseño Completo 2024

Esta guía documenta el sistema de diseño premium implementado en la aplicación de gestión de eventos.

---

## 🎨 Sistema de Diseño

### Paleta de Colores

#### Light Mode
- **Background**: `#ffffff` (blanco puro)
- **Foreground**: `#0d0d0d` (negro suave)
- **Primary**: Indigo/Violet (`#6366f1` → `#818cf8`)
- **Secondary**: Violet/Purple (`#8b5cf6` → `#a78bfa`)
- **Success**: Emerald (`#10b981` → `#34d399`)
- **Warning**: Amber (`#f59e0b` → `#fbbf24`)
- **Error**: Red (`#ef4444` → `#f87171`)
- **Borders**: `#e5e7eb` (gris muy suave)
- **Muted**: `#f8f9fa` (gris casi blanco)

#### Dark Mode
- **Background**: `#0a0a0a` (negro profundo)
- **Foreground**: `#fafafa` (blanco roto)
- **Primary**: Indigo claro (`#818cf8`)
- **Secondary**: Violet claro (`#a78bfa`)
- **Success**: Emerald claro (`#34d399`)
- **Warning**: Amber claro (`#fbbf24`)
- **Error**: Red claro (`#f87171`)
- **Borders**: `#262626` (gris oscuro)
- **Muted**: `#171717` (gris muy oscuro)

### Tipografía

- **Font Family**: Inter / Geist (SF-like)
- **Títulos**: Bold, tracking-tight
- **Textos**: Medium/Regular, leading-relaxed
- **Jerarquía**: 
  - `text-4xl` (36px) - Títulos principales
  - `text-3xl` (30px) - Títulos de sección
  - `text-2xl` (24px) - Subtítulos
  - `text-xl` (20px) - Headers de cards
  - `text-lg` (18px) - Texto destacado
  - `text-base` (16px) - Texto normal
  - `text-sm` (14px) - Texto secundario
  - `text-xs` (12px) - Texto pequeño

### Espaciado y Bordes

- **Border Radius**: 
  - `rounded-xl` (12px) - Botones, inputs
  - `rounded-2xl` (16px) - Cards premium
  - `rounded-full` - Badges, avatares

- **Espaciado**: Sistema de 4px
  - `gap-2` (8px) - Espaciado pequeño
  - `gap-4` (16px) - Espaciado medio
  - `gap-6` (24px) - Espaciado grande
  - `gap-8` (32px) - Espaciado extra grande

- **Padding**: Generoso para respiración visual
  - `p-6` (24px) - Padding estándar
  - `p-8` (32px) - Padding grande

### Sombras Premium

```css
/* XS - Muy sutil */
shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03)

/* SM - Sutil */
shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.05)

/* MD - Medio */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06)

/* LG - Grande */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08)

/* XL - Extra grande */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)

/* 2XL - Muy grande */
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.12)
```

---

## 🧩 Componentes Premium

### 1. Button

#### Variantes:
- `default` - Gris oscuro elegante
- `premium` - Gradiente indigo-violet con hover scale
- `outline` - Borde sutil con hover
- `ghost` - Transparente con hover suave
- `destructive` - Rojo refinado
- `success` - Verde esmeralda

#### Características:
- Bordes redondeados (`rounded-xl`)
- Transiciones suaves (`duration-200`)
- Active scale (`active:scale-[0.98]`)
- Hover scale en premium (`hover:scale-[1.02]`)
- Sombras dinámicas

### 2. Card

#### Variantes:
- `default` - Borde sutil, sombra suave
- `elevated` - Sin borde, sombra prominente
- `outlined` - Borde destacado, sin fondo
- `glass` - Glassmorphism con backdrop-blur

#### Características:
- Bordes `rounded-2xl`
- Hover scale (`hover:scale-[1.02]`)
- Transiciones suaves
- Headers con gradientes

#### Estructura Premium:
```tsx
<Card variant="elevated" className="overflow-hidden">
  <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-b border-gray-200/60 dark:border-gray-800/60">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-xl">Título</CardTitle>
        <CardDescription className="mt-1">Descripción</CardDescription>
      </div>
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </CardHeader>
  <CardContent className="p-6">
    {/* Contenido */}
  </CardContent>
</Card>
```

### 3. Page Header Premium

#### Estructura:
```tsx
<div className="flex items-center justify-between">
  <div className="space-y-1">
    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
      Título de Página
    </h1>
    <p className="text-gray-600 dark:text-gray-400 text-lg">
      Descripción de la página
    </p>
  </div>
  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
    <Icon className="h-7 w-7 text-white" />
  </div>
</div>
```

### 4. Stats Cards Premium

#### Estructura:
```tsx
<Card variant="elevated" className="group hover:scale-[1.02] transition-all duration-200">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Label</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">Value</p>
      </div>
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
        <Icon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🎯 Patrones de Diseño

### 1. Headers de Página
- Título grande (text-4xl)
- Descripción (text-lg)
- Icono premium con gradiente
- Espaciado generoso (space-y-8)

### 2. Cards con Gradientes
- Header con gradiente sutil
- Icono en header con gradiente fuerte
- Contenido con padding generoso
- Hover effects sutiles

### 3. Tablas Premium
- Header con gradiente
- Filas con hover effects
- Borders sutiles
- Responsive con scroll

### 4. Formularios Premium
- Inputs con altura generosa (h-11)
- Labels claros
- Validación visual
- Botones premium

### 5. Empty States
- Icono grande
- Título descriptivo
- Descripción útil
- Acción clara

---

## 🌙 Dark Mode

### Principios:
- Contraste adecuado (WCAG AA)
- Colores saturados en dark mode
- Borders visibles pero sutiles
- Gradientes adaptados

### Implementación:
- Usar clases `dark:` de Tailwind
- Opacidades reducidas en dark mode
- Colores más claros para texto
- Backgrounds más oscuros

---

## 📱 Responsive Design

### Breakpoints:
- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`

### Adaptaciones:
- Sidebar oculta en mobile
- Grids adaptativos (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Tablas con scroll horizontal en mobile
- Padding reducido en mobile (`p-4` vs `p-6 lg:p-8`)

---

## ✨ Microinteracciones

### Transiciones:
- Duración estándar: `200ms`
- Easing: `ease-in-out`
- Hover scale: `1.02` o `1.05`
- Active scale: `0.98`

### Efectos Comunes:
- `hover:scale-[1.02]` - Cards
- `hover:shadow-xl` - Elevación
- `group-hover:scale-110` - Iconos en cards
- `transition-all duration-200` - Suavidad

---

## 📋 Checklist de Implementación

Al crear una nueva página premium:

- [ ] Header premium con icono
- [ ] Cards con variante `elevated`
- [ ] Gradientes en headers de cards
- [ ] Iconos con gradientes
- [ ] Hover effects en elementos interactivos
- [ ] Skeleton loading states
- [ ] Empty states elegantes
- [ ] Dark mode probado
- [ ] Responsive verificado
- [ ] Transiciones suaves

---

## 🎨 Recursos

### Iconos:
- Lucide React (`lucide-react`)
- Consistencia en tamaño (h-4 w-4, h-5 w-5, h-7 w-7)

### Gradientes Comunes:
- Indigo-Violet: `from-indigo-500 to-violet-500`
- Emerald-Green: `from-emerald-500 to-green-500`
- Amber-Orange: `from-amber-500 to-orange-500`
- Blue-Indigo: `from-blue-500 to-indigo-500`

### Espaciado Consistente:
- Páginas: `space-y-8 p-6 lg:p-8`
- Cards: `p-6` o `p-8`
- Gaps: `gap-4` o `gap-6`

---

## ✅ Páginas Rediseñadas

### Completadas:
- ✅ Login
- ✅ Dashboard
- ✅ Cotizaciones (lista, nueva, detalle, editar, historial)
- ✅ Clientes (lista, nuevo, detalle)
- ✅ Eventos (lista, detalle)
- ✅ Calendario
- ✅ Analytics
- ✅ Settings
- ✅ Admin (dashboard, services, finance)

---

**Última actualización**: Diciembre 2024
**Versión**: 2.0

