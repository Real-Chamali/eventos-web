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
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // IMPORTANTE: Este script debe ejecutarse ANTES que cualquier otro
                // para capturar errores desde el inicio
                
                // Silenciar errores de Sentry bloqueados por ad blockers
                // Estos errores son esperados y no afectan la funcionalidad
                if (typeof window !== 'undefined') {
                  // Interceptar TODOS los errores de red ANTES que se registren
                  const originalFetch = window.fetch;
                  const originalXHROpen = XMLHttpRequest.prototype.open;
                  const originalXHRSend = XMLHttpRequest.prototype.send;
                  
                  // Interceptar fetch MUY TEMPRANO
                  window.fetch = function(...args) {
                    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
                    const urlLower = url.toLowerCase();
                    if (urlLower.includes('sentry.io') || 
                        urlLower.includes('ingest.us.sentry.io') || 
                        urlLower.includes('o4510508203704320') || 
                        urlLower.includes('4510508220088320')) {
                      // Silenciar completamente - retornar promesa que nunca resuelve
                      return new Promise(() => {});
                    }
                    try {
                      return originalFetch.apply(this, args).catch(function(error) {
                        // Silenciar errores de Sentry bloqueados
                        const errorStr = (error?.message || '').toLowerCase();
                        if (errorStr.includes('blocked') || 
                            errorStr.includes('sentry') ||
                            urlLower.includes('sentry')) {
                          return new Promise(() => {});
                        }
                        throw error;
                      });
                    } catch (e) {
                      // Si fetch mismo falla, silenciar si es Sentry
                      if (urlLower.includes('sentry')) {
                        return new Promise(() => {});
                      }
                      throw e;
                    }
                  };
                  
                  // Interceptar XMLHttpRequest MUY TEMPRANO
                  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                    const urlLower = (typeof url === 'string' ? url : '').toLowerCase();
                    if (urlLower.includes('sentry.io') || 
                        urlLower.includes('ingest.us.sentry.io') || 
                        urlLower.includes('o4510508203704320') || 
                        urlLower.includes('4510508220088320')) {
                      this._shouldIgnore = true;
                      // Prevenir todos los eventos de error
                      const ignoreError = function(e) {
                        if (e) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.stopImmediatePropagation();
                        }
                      };
                      this.addEventListener('error', ignoreError, true);
                      this.addEventListener('loadend', function() {}, true);
                    }
                    return originalXHROpen.apply(this, [method, url, ...rest]);
                  };
                  
                  XMLHttpRequest.prototype.send = function(...args) {
                    if (this._shouldIgnore) {
                      // Prevenir todos los eventos
                      const ignoreError = function(e) {
                        if (e) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.stopImmediatePropagation();
                        }
                      };
                      this.addEventListener('error', ignoreError, true);
                      this.addEventListener('loadend', function() {}, true);
                      return;
                    }
                    return originalXHRSend.apply(this, args);
                  };
                  // Función helper para verificar si un mensaje debe ser silenciado
                  const shouldSilenceMessage = function(message) {
                    if (!message || typeof message !== 'string') return false;
                    const lowerMessage = message.toLowerCase();
                    
                    // Silenciar errores de Sentry bloqueados
                    if (lowerMessage.includes('err_blocked_by_client') ||
                        lowerMessage.includes('net::err_blocked_by_client') ||
                        lowerMessage.includes('sentry.io') ||
                        lowerMessage.includes('ingest.us.sentry.io') ||
                        lowerMessage.includes('o4510508203704320') ||
                        lowerMessage.includes('4510508220088320') ||
                        lowerMessage.includes('failed to load resource')) {
                      return true;
                    }
                    
                    // Silenciar warnings de PWA install prompt - capturar todas las variantes
                    if (lowerMessage.includes('banner not shown') ||
                        (lowerMessage.includes('beforeinstallprompt') && (lowerMessage.includes('preventdefault') || lowerMessage.includes('prevent default'))) ||
                        (lowerMessage.includes('the page must call') && lowerMessage.includes('prompt')) ||
                        (lowerMessage.includes('must call') && lowerMessage.includes('prompt') && (lowerMessage.includes('banner') || lowerMessage.includes('beforeinstallprompt')))) {
                      return true;
                    }
                    
                    return false;
                  };
                  
                  // Interceptar console ANTES que cualquier otro código
                  const originalError = console.error;
                  const originalWarn = console.warn;
                  const originalLog = console.log;
                  
                  console.error = function(...args) {
                    const message = args.map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg instanceof Error) return arg.message;
                      if (arg && typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                      }
                      return String(arg);
                    }).join(' ');
                    
                    if (shouldSilenceMessage(message)) return;
                    originalError.apply(console, args);
                  };
                  
                  console.warn = function(...args) {
                    const message = args.map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg instanceof Error) return arg.message;
                      if (arg && typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                      }
                      return String(arg);
                    }).join(' ');
                    
                    if (shouldSilenceMessage(message)) return;
                    originalWarn.apply(console, args);
                  };
                  
                  console.log = function(...args) {
                    const message = args.map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg instanceof Error) return arg.message;
                      if (arg && typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                      }
                      return String(arg);
                    }).join(' ');
                    
                    if (shouldSilenceMessage(message)) return;
                    originalLog.apply(console, args);
                  };
                  
                  // Interceptar errores de window MUY TEMPRANO (captura fase)
                  window.addEventListener('error', function(e) {
                    const errorMessage = (e.message || '').toLowerCase();
                    const errorSource = ((e.filename || e.target?.src || '')).toLowerCase();
                    if (shouldSilenceMessage(errorMessage) || shouldSilenceMessage(errorSource)) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      return false;
                    }
                  }, true);
                  
                  // Interceptar errores no capturados de promesas
                  window.addEventListener('unhandledrejection', function(e) {
                    const reason = e.reason;
                    const reasonStr = typeof reason === 'string' ? reason : (reason instanceof Error ? reason.message : String(reason || ''));
                    if (shouldSilenceMessage(reasonStr)) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                  }, true);
                  
                }
                
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
              })();
            `,
          }}
        />
        {/* Structured Data para SEO - Organización */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Eventos Web',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://eventos-web.vercel.app',
              description: 'Sistema de gestión de eventos y cotizaciones',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/quotes?search={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
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
