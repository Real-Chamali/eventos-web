import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // turbopack config removed - using default Next.js behavior
  reactStrictMode: true,
};

// Solo usar Sentry si está configurado
// Si NEXT_PUBLIC_SENTRY_DSN no está configurado, usar configuración normal sin Sentry
let finalConfig: NextConfig = nextConfig;

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Dynamic import para evitar errores si Sentry no está disponible
  try {
    const { withSentryConfig } = require("@sentry/nextjs");
    finalConfig = withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "eventos-web",
      project: process.env.SENTRY_PROJECT || "events-management",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    });
  } catch (error) {
    // Si Sentry no está disponible, usar configuración normal
    console.warn('Sentry no disponible, usando configuración sin Sentry');
  }
}

export default finalConfig;
