import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: "/home/voldemort/eventos-web/my-app",
  },
};

/**
 * Wrap Next.js config with Sentry
 * 
 * This wrapping enables:
 * - Automatic error tracking for unhandled exceptions
 * - Performance monitoring (optional)
 * - Automatic breadcrumb collection
 * 
 * Configuration is in sentry.config.ts
 */
export default withSentryConfig(nextConfig, {
  // Sentry configuration for the wrapper
  org: process.env.SENTRY_ORG || "eventos-web",
  project: process.env.SENTRY_PROJECT || "events-management",
  
  // Suppress warning about missing auth token in development
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Silently fail if source maps can't be uploaded (e.g., in development)
  silent: true,
});
