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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Sistema de Eventos",
  description: "Sistema de gestión de eventos y cotizaciones",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Script
          id="prevent-fouc"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Prevenir FOUC - mostrar contenido solo cuando esté listo
                if (document.readyState === 'loading') {
                  document.documentElement.style.visibility = 'hidden';
                  document.documentElement.style.opacity = '0';
                  document.addEventListener('DOMContentLoaded', function() {
                    document.documentElement.style.visibility = 'visible';
                    document.documentElement.style.opacity = '1';
                    document.documentElement.style.transition = 'opacity 0.2s';
                  });
                }
              })();
            `,
          }}
        />
        <ErrorBoundary>
          <ThemeProviderWrapper>
            <AppProvider>
              <SWRProvider>
                <ToastProvider>
                  <SentryProvider>
                    {children}
                    <OnboardingTour />
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
