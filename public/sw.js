/* eslint-disable @typescript-eslint/no-unused-vars */
// Service Worker para PWA - Versión Premium con Background Sync
const CACHE_NAME = 'eventos-crm-v4'
const RUNTIME_CACHE = 'eventos-runtime-v4'
const STATIC_CACHE = 'eventos-static-v4'
const IMAGE_CACHE = 'eventos-images-v4'
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB

// Archivos estáticos críticos para cachear
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/offline',
]

// Estrategias de cache
const CACHE_STRATEGIES = {
  // Cache First: Para assets estáticos
  CACHE_FIRST: 'cache-first',
  // Network First: Para contenido dinámico
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate: Para contenido que puede estar desactualizado
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
}

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error)
      })
  )
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Tomar control de todas las páginas
        return self.clients.claim()
      })
  )
})

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar peticiones no GET
  if (request.method !== 'GET') {
    return
  }

  // Ignorar WebSocket requests (Supabase Realtime)
  if (url.protocol === 'wss:' || url.protocol === 'ws:') {
    return
  }

  // Ignorar extensiones de Chrome
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Estrategia según el tipo de recurso
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/_next/image') ||
      url.pathname.match(/\.(?:jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf|eot)$/)) {
    // Assets estáticos e imágenes: Cache First con cache dedicado
    if (url.pathname.match(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/)) {
      event.respondWith(cacheFirstWithImageCache(request))
    } else {
      event.respondWith(cacheFirst(request))
    }
  } else if (url.pathname.startsWith('/api/')) {
    // APIs: Network First con timeout
    event.respondWith(networkFirstWithTimeout(request))
  } else {
    // Páginas HTML: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request))
  }
})

// Estrategia: Cache First
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache First error:', error)
    // Retornar página offline si está disponible
    const offlinePage = await cache.match('/offline')
    if (offlinePage) {
      return offlinePage
    }
    // Fallback a página principal
    const homePage = await cache.match('/')
    return homePage || new Response('Offline', { status: 503 })
  }
}

// Estrategia: Network First
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Network First error:', error)
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    // Para rutas API, retornar error JSON
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Offline', message: 'No hay conexión a internet' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    // Para otras rutas, redirigir a página offline
    const offlinePage = await cache.match('/offline')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Estrategia: Cache First con cache de imágenes
async function cacheFirstWithImageCache(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Image cache error:', error)
    return new Response('Image not available offline', { status: 503 })
  }
}

// Estrategia: Network First con timeout
async function networkFirstWithTimeout(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  
  // Timeout de 3 segundos
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), 3000)
  })
  
  try {
    const response = await Promise.race([
      fetch(request),
      timeoutPromise,
    ])
    
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Network First timeout:', error)
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ error: 'Offline', message: 'No hay conexión a internet' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const offlinePage = await cache.match('/offline')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Estrategia: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  
  // Iniciar fetch en background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // Ignorar errores de red
  })
  
  // Retornar cache inmediatamente si existe, o esperar fetch
  if (cached) {
    // Iniciar actualización en background
    fetchPromise.catch(() => {})
    return cached
  }
  
  // Si no hay cache, intentar fetch
  try {
    return await fetchPromise
  } catch (error) {
    // Si fetch falla, retornar página offline
    const offlinePage = await cache.match('/offline')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Background Sync para operaciones offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quotes') {
    event.waitUntil(syncQuotes())
  } else if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments())
  }
})

// Función para sincronizar cotizaciones
async function syncQuotes() {
  try {
    // Obtener cotizaciones pendientes del IndexedDB
    const pendingQuotes = await getPendingQuotes()
    
    for (const quote of pendingQuotes) {
      try {
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote),
        })
        
        if (response.ok) {
          await removePendingQuote(quote.id)
          // Notificar al cliente
          const clients = await self.clients.matchAll()
          clients.forEach((client) => {
            client.postMessage({
              type: 'QUOTE_SYNCED',
              quoteId: quote.id,
            })
          })
        }
      } catch (error) {
        console.error('[SW] Error syncing quote:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Error in syncQuotes:', error)
  }
}

// Función para sincronizar pagos
async function syncPayments() {
  try {
    const pendingPayments = await getPendingPayments()
    
    for (const payment of pendingPayments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        })
        
        if (response.ok) {
          await removePendingPayment(payment.id)
          const clients = await self.clients.matchAll()
          clients.forEach((client) => {
            client.postMessage({
              type: 'PAYMENT_SYNCED',
              paymentId: payment.id,
            })
          })
        }
      } catch (error) {
        console.error('[SW] Error syncing payment:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Error in syncPayments:', error)
  }
}

// Helpers para IndexedDB (simplificados)
async function getPendingQuotes() {
  // Implementación simplificada - en producción usar IndexedDB
  return []
}

async function getPendingPayments() {
  return []
}

async function removePendingQuote(id) {
  // Implementación simplificada
}

async function removePendingPayment(id) {
  // Implementación simplificada
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Eventos CRM'
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data.url || '/dashboard'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Si hay una ventana abierta, enfocarla
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Si no, abrir una nueva ventana
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Limpiar cache antiguo periódicamente
async function cleanOldCache() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('eventos-') && 
    name !== CACHE_NAME && 
    name !== RUNTIME_CACHE && 
    name !== STATIC_CACHE &&
    name !== IMAGE_CACHE
  )
  
  await Promise.all(oldCaches.map(name => caches.delete(name)))
}

// Limpiar cache de imágenes si excede el tamaño máximo
async function cleanImageCache() {
  const cache = await caches.open(IMAGE_CACHE)
  const keys = await cache.keys()
  
  // Calcular tamaño total (simplificado)
  if (keys.length > 100) {
    // Eliminar las más antiguas
    const sortedKeys = keys.sort((a, b) => {
      // Ordenar por fecha (simplificado)
      return 0
    })
    
    const toDelete = sortedKeys.slice(0, keys.length - 100)
    await Promise.all(toDelete.map(key => cache.delete(key)))
  }
}

// Notificar a los clientes cuando hay una nueva versión disponible
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanOldCache(),
      self.clients.claim(),
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_NAME
          })
        })
      })
    ])
  )
})
