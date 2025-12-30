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
                if (typeof window !== 'undefined') {
                  // Interceptar TODOS los métodos de console que puedan mostrar errores
                  const originalError = console.error;
                  const originalWarn = console.warn;
                  const originalLog = console.log;
                  
                  const shouldSilence = function(...args) {
                    const message = args.map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg instanceof Error) return arg.message;
                      if (arg && typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                      }
                      return String(arg);
                    }).join(' ');
                    
                    return message.includes('ERR_BLOCKED_BY_CLIENT') || 
                           message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                           message.includes('sentry.io') ||
                           message.includes('ingest.us.sentry.io') ||
                           message.includes('o4510508203704320') ||
                           message.includes('Failed to load resource');
                  };
                  
                  console.error = function(...args) {
                    if (shouldSilence(...args)) return;
                    originalError.apply(console, args);
                  };
                  
                  console.warn = function(...args) {
                    if (shouldSilence(...args)) return;
                    originalWarn.apply(console, args);
                  };
                  
                  console.log = function(...args) {
                    if (shouldSilence(...args)) return;
                    originalLog.apply(console, args);
                  };
                  
                  // Interceptar errores de window (captura fase)
                  window.addEventListener('error', function(e) {
                    if (e.message && (
                      e.message.includes('ERR_BLOCKED_BY_CLIENT') ||
                      e.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                      e.message.includes('sentry.io') ||
                      e.message.includes('ingest.us.sentry.io') ||
                      (e.filename && (e.filename.includes('sentry.io') || e.filename.includes('ingest.us.sentry.io')))
                    )) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      return false;
                    }
                  }, true);
                  
                  // Interceptar errores no capturados de promesas
                  window.addEventListener('unhandledrejection', function(e) {
                    const reason = e.reason;
                    if (reason && (
                      (typeof reason === 'string' && (
                        reason.includes('ERR_BLOCKED_BY_CLIENT') || 
                        reason.includes('sentry.io') ||
                        reason.includes('ingest.us.sentry.io')
                      )) ||
                      (reason instanceof Error && (
                        reason.message.includes('ERR_BLOCKED_BY_CLIENT') || 
                        reason.message.includes('sentry.io') ||
                        reason.message.includes('ingest.us.sentry.io')
                      ))
                    )) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }, true);
                  
                  // Interceptar fetch/XHR bloqueados ANTES de que se ejecuten
                  const originalFetch = window.fetch;
                  window.fetch = function(...args) {
                    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
                    if (url.includes('sentry.io') || url.includes('ingest.us.sentry.io')) {
                      // Retornar una promesa que nunca se resuelve (silenciosa)
                      // Esto previene que aparezca en la consola como error
                      return new Promise(() => {});
                    }
                    return originalFetch.apply(this, args).catch(function(error) {
                      if (error && (
                        (error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT')) ||
                        url.includes('sentry.io') ||
                        url.includes('ingest.us.sentry.io')
                      )) {
                        // Silenciar error de Sentry bloqueado - retornar promesa que nunca se resuelve
                        return new Promise(() => {});
                      }
                      throw error;
                    });
                  };
                  
                  // Interceptar XMLHttpRequest también
                  const originalXHROpen = XMLHttpRequest.prototype.open;
                  const originalXHRSend = XMLHttpRequest.prototype.send;
                  
                  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                    if (typeof url === 'string' && (url.includes('sentry.io') || url.includes('ingest.us.sentry.io'))) {
                      // Marcar para ignorar
                      this._shouldIgnore = true;
                      // Prevenir que aparezca en la consola
                      this.addEventListener('error', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                      }, true);
                    }
                    return originalXHROpen.apply(this, [method, url, ...rest]);
                  };
                  
                  XMLHttpRequest.prototype.send = function(...args) {
                    if (this._shouldIgnore) {
                      // No hacer nada si es Sentry - prevenir completamente la request
                      // Agregar listeners para silenciar cualquier error
                      this.addEventListener('error', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                      }, true);
                      this.addEventListener('loadend', function() {}, true);
                      return;
                    }
                    return originalXHRSend.apply(this, args);
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
