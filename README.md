# Sistema de Eventos - Gestión Completa de Cotizaciones

Sistema web moderno de gestión de eventos y cotizaciones construido con **Next.js 16**, **React 19**, **TypeScript** y **Supabase**.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ✨ Características Principales

### 🔐 Seguridad
- Autenticación JWT con Supabase
- Row Level Security (RLS)
- RBAC (Role-Based Access Control)
- Validación con Zod
- Rate limiting y CSRF protection
- Encriptación de datos sensibles

### 📝 Gestión de Cotizaciones
- Crear y editar cotizaciones
- Exportar a PDF y CSV
- Historial completo
- Cierre de ventas automático

### 💰 Control Financiero
- Dashboard de ventas y comisiones
- Reportes de ingresos/gastos
- Cálculo automático de márgenes
- Auditoría completa

### 🎨 Interfaz Moderna
- Dark mode automático
- Responsive design
- Loading skeletons
- Toast notifications
- Error handling global

### 🧪 Testing Completo
- Unit tests (Vitest)
- E2E tests (Playwright)
- CI/CD con GitHub Actions
- Coverage reporting

## 📦 Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Validación**: Zod, React Hook Form
- **Testing**: Vitest, Playwright
- **Herramientas**: ESLint, Prettier, GitHub Actions

## 📚 Documentación

- [**SETUP.md**](SETUP.md) - Configuración inicial y base de datos
- [**IMPROVEMENTS.md**](IMPROVEMENTS.md) - 50 mejoras implementadas
- [**CORRECTIONS_REPORT.md**](CORRECTIONS_REPORT.md) - Errores corregidos
- [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) - Decisiones arquitectónicas (10 ADRs)
- [**docs/CONTRIBUTING.md**](docs/CONTRIBUTING.md) - Guía de contribución
- [**docs/TROUBLESHOOTING.md**](docs/TROUBLESHOOTING.md) - Solución de problemas

## 🔧 Comandos

```bash
# Desarrollo
npm run dev              # Servidor dev
npm run build            # Build producción
npm start                # Iniciar servidor

# Testing
npm run test             # Tests unitarios
npm run test:ui          # UI tests
npm run test:coverage    # Cobertura
npm run playwright       # Tests E2E
npm run playwright:ui    # UI E2E

# Herramientas
npm run lint             # ESLint
```

## 📖 Configuración

Ver [SETUP.md](SETUP.md) para:
1. Crear proyecto en Supabase
2. Configurar variables de entorno
3. Crear tablas de base de datos
4. Ejecutar SQL inicial

## 🌐 Deployment

### Vercel (Recomendado)
```bash
vercel deploy
```

### Docker
```bash
docker build -t eventos-web .
docker run -p 3000:3000 eventos-web
```

## 📄 Licencia

MIT

## 🤝 Soporte

- [Issues](https://github.com/tuusuario/eventos-web/issues)
- [Discussions](https://github.com/tuusuario/eventos-web/discussions)

---

**Última actualización**: 8 de diciembre de 2025
