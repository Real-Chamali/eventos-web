import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Nota: El warning sobre múltiples lockfiles es inofensivo.
  // Next.js detecta package-lock.json en /home/voldemort/ pero usa correctamente
  // el del proyecto. Si quieres eliminar el warning, puedes eliminar o renombrar
  // /home/voldemort/package-lock.json (es un archivo vacío que no se necesita).
  
  // Deshabilitar source maps en producción para evitar warnings
  productionBrowserSourceMaps: false,
  
  // Headers para manejar cookies de Cloudflare y WebSockets
  async headers() {
    const headers = [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]

    // Agregar headers CORS para todas las rutas API
    // En producción, los headers se manejan dinámicamente en las rutas API
    // Aquí solo configuramos headers básicos para desarrollo
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || 
                         (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '*')
    
    headers.push({
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, x-api-key, Accept',
        },
        {
          key: 'Access-Control-Allow-Credentials',
          value: 'true',
        },
        {
          key: 'Access-Control-Max-Age',
          value: '86400', // 24 horas
        },
      ],
    })

    return headers
  },
};

// Solo usar Sentry si está configurado
// Si NEXT_PUBLIC_SENTRY_DSN no está configurado, usar configuración normal sin Sentry
let finalConfig: NextConfig = nextConfig;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Dynamic import para evitar errores si Sentry no está disponible
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sentryModule = require("@sentry/nextjs");
  if (sentryModule?.withSentryConfig) {
    finalConfig = sentryModule.withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "eventos-web",
      project: process.env.SENTRY_PROJECT || "events-management",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    });
  }
}

export default finalConfig;
