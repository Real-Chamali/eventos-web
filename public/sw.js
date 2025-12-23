// Service Worker para PWA - Versión mejorada
const CACHE_NAME = 'eventos-crm-v2'
const RUNTIME_CACHE = 'eventos-runtime-v2'
const STATIC_CACHE = 'eventos-static-v2'

// Archivos estáticos críticos para cachear
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
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

  // Ignorar phtp requests (Supabase Realtime)
  if (url.protocol === 'wss:' || url.protocol === 'ws:') {
    return
  }

  // Estrategia según el tipo de recurso
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/_next/image') ||
      url.pathname.match(/\.(?:jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf|eot)$/)) {
    // Assets estáticos: Cache First
    event.respondWith(cacheFirst(request))
  } else if (url.pathname.startsWith('/api/')) {
    // APIs: Network First
    event.respondWith(networkFirst(request))
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
    const offlinePage = await cache.match('/')
    return offlinePage || new Response('Offline', { status: 503 })
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
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
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
  return cached || fetchPromise || new Response('Offline', { status: 503 })
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
})
