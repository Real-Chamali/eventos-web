import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import ThemeProviderWrapper from "@/components/ThemeProvider";
import { PremiumErrorBoundary } from "@/components/ui/PremiumErrorBoundary";
import { SentryProvider } from "@/components/SentryProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { AppProvider } from "@/contexts/AppContext";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import PreventFOUC from "@/components/PreventFOUC";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
  // Optimizar carga de fuente para evitar warnings de preload
  weight: ["400", "500", "600", "700"],
});

import { generateMetadata as generateSEOMetadata } from '@/lib/utils/seo'

export const metadata: Metadata = {
  ...generateSEOMetadata({
    title: "Eventos CRM - Sistema de Gestión",
    description: "Sistema completo de gestión de eventos, cotizaciones y clientes",
    path: "/",
  }),
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eventos CRM",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Eventos CRM" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Prevenir FOUC - mostrar contenido solo cuando esté listo
                try {
                  if (document.readyState === 'loading') {
                    document.documentElement.style.visibility = 'hidden';
                    document.documentElement.style.opacity = '0';
                    document.addEventListener('DOMContentLoaded', function() {
                      setTimeout(function() {
                        document.documentElement.style.visibility = 'visible';
                        document.documentElement.style.opacity = '1';
                        document.documentElement.style.transition = 'opacity 0.2s';
                      }, 0);
                    });
                  } else {
                    document.documentElement.style.visibility = 'visible';
                    document.documentElement.style.opacity = '1';
                  }
                } catch(e) {}
                
                // Silenciar errores de Sentry bloqueados por ad blockers
                // Estos errores son esperados y no afectan la funcionalidad
                if (typeof window !== 'undefined' && window.addEventListener) {
                  window.addEventListener('error', function(e) {
                    if (e.message && (
                      e.message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      e.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                      (e.filename && e.filename.includes('sentry.io'))
                    )) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }, true);
                  
                  // También silenciar errores de fetch bloqueados
                  const originalFetch = window.fetch;
                  window.fetch = function(...args) {
                    return originalFetch.apply(this, args).catch(function(error) {
                      if (error && (
                        error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
                        (args[0] && typeof args[0] === 'string' && args[0].includes('sentry.io'))
                      )) {
                        // Silenciar error de Sentry bloqueado
                        return Promise.reject(new Error('Resource blocked by client'));
                      }
                      throw error;
                    });
                  };
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <PreventFOUC />
        <PremiumErrorBoundary>
          <ThemeProviderWrapper>
            <AppProvider>
              <SWRProvider>
                <ToastProvider>
                  <SentryProvider>
                    <ServiceWorkerRegistration />
                    {children}
                    <OnboardingTour />
                    <InstallPrompt />
                    <CommandPalette />
                    <KeyboardShortcuts />
                  </SentryProvider>
                </ToastProvider>
              </SWRProvider>
            </AppProvider>
          </ThemeProviderWrapper>
        </PremiumErrorBoundary>
      </body>
    </html>
  );
}
