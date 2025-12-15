import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El warning de turbopack.root es informativo y no afecta la funcionalidad
  // Next.js infiere automáticamente el root del workspace
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
