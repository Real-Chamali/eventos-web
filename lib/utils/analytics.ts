/**
 * Google Analytics y tracking de eventos
 */

interface GAEvent {
  name: string
  params?: Record<string, unknown>
}

interface ConversionEvent {
  event_name: string
  value?: number
  currency?: string
  items?: Array<{
    item_id: string
    item_name: string
    price?: number
    quantity?: number
  }>
}

type WindowWithGtag = { gtag?: (...args: unknown[]) => void }

/**
 * Track evento personalizado
 */
export function trackEvent(event: GAEvent): void {
  if (typeof window !== 'undefined' && (window as unknown as WindowWithGtag).gtag) {
    (window as unknown as WindowWithGtag).gtag?.('event', event.name, event.params || {})
  }
}

/**
 * Track conversión (venta)
 */
export function trackConversion(event: ConversionEvent): void {
  if (typeof window !== 'undefined' && (window as unknown as WindowWithGtag).gtag) {
    (window as unknown as WindowWithGtag).gtag?.('event', 'purchase', {
      event_name: event.event_name,
      value: event.value,
      currency: event.currency || 'MXN',
      items: event.items || [],
    })
  }
}

/**
 * Track página view
 */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window !== 'undefined' && (window as unknown as WindowWithGtag).gtag) {
    (window as unknown as WindowWithGtag).gtag?.('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    })
  }
}

/**
 * Track acciones de usuario
 */
export const trackingEvents = {
  // Cotizaciones
  quoteCreated: (quoteId: string, totalPrice: number) =>
    trackEvent({
      name: 'quote_created',
      params: { quote_id: quoteId, total_price: totalPrice },
    }),
  quoteClosed: (quoteId: string, totalPrice: number) =>
    trackEvent({
      name: 'quote_closed',
      params: { quote_id: quoteId, total_price: totalPrice },
    }),
  quoteViewed: (quoteId: string) =>
    trackEvent({
      name: 'quote_viewed',
      params: { quote_id: quoteId },
    }),

  // Usuarios
  userSignup: (userId: string) =>
    trackEvent({
      name: 'user_signup',
      params: { user_id: userId },
    }),
  userLogin: (userId: string) =>
    trackEvent({
      name: 'user_login',
      params: { user_id: userId },
    }),
  userLogout: () =>
    trackEvent({
      name: 'user_logout',
    }),

  // Exportaciones
  exportPDF: (fileName: string) =>
    trackEvent({
      name: 'export_pdf',
      params: { file_name: fileName },
    }),
  exportCSV: (fileName: string) =>
    trackEvent({
      name: 'export_csv',
      params: { file_name: fileName },
    }),

  // Errores
  error: (errorMessage: string, context: string) =>
    trackEvent({
      name: 'app_error',
      params: { error_message: errorMessage, context },
    }),
}
