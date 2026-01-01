import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars: string[] = []
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    const errorMessage = `Missing Supabase environment variables: ${missingVars.join(', ')} must be set.

SOLUCIÓN:
1. Verifica que el archivo .env.local existe en la raíz del proyecto
2. Verifica que contiene las variables (ver .env.local.example para formato):
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_publica_aqui
3. REINICIA el servidor de desarrollo:
   - Detén el servidor (Ctrl+C)
   - Ejecuta: npm run dev
4. Las variables de entorno solo se cargan al iniciar el servidor

Para verificar, ejecuta: ./scripts/verify-all-env.sh

NOTA: Obtén tus credenciales en https://app.supabase.com -> Tu Proyecto -> Settings -> API`
    
    throw new Error(errorMessage)
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      // NO especificar opciones de auth personalizadas
      // Dejar que Supabase SSR maneje todo automáticamente con cookies
      // Esto es necesario para que el middleware pueda leer la sesión
      global: {
        headers: {
          'x-client-info': 'eventos-web',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        // Configuración mejorada para WebSockets
        // Nota: El warning de cookie __cf_bm de Cloudflare es informativo y no afecta la funcionalidad
      },
    }
  )
}


