import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Nota: El warning sobre múltiples lockfiles es inofensivo.
  // Next.js detecta package-lock.json en /home/voldemort/ pero usa correctamente
  // el del proyecto. Si quieres eliminar el warning, puedes eliminar o renombrar
  // /home/voldemort/package-lock.json (es un archivo vacío que no se necesita).
  
  // Deshabilitar source maps en producción para evitar warnings
  productionBrowserSourceMaps: false,
  
  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://*.vercel.app",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://*.sentry.io https://*.ingest.us.sentry.io wss://*.supabase.co",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS header para seguridad adicional en producción
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
        ],
      },
    ]

    // Agregar headers CORS para todas las rutas API
    // En producción, los headers se manejan dinámicamente en las rutas API
    // Aquí solo configuramos headers básicos para desarrollo
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
