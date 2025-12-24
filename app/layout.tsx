import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import ThemeProviderWrapper from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SentryProvider } from "@/components/SentryProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { AppProvider } from "@/contexts/AppContext";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import PreventFOUC from "@/components/PreventFOUC";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";

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

export const metadata: Metadata = {
  title: "Eventos CRM - Sistema de Gestión",
  description: "Sistema completo de gestión de eventos, cotizaciones y clientes",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <PreventFOUC />
        <ErrorBoundary>
          <ThemeProviderWrapper>
            <AppProvider>
              <SWRProvider>
                <ToastProvider>
                  <SentryProvider>
                    <ServiceWorkerRegistration />
                    {children}
                    <OnboardingTour />
                    <InstallPrompt />
                  </SentryProvider>
                </ToastProvider>
              </SWRProvider>
            </AppProvider>
          </ThemeProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
