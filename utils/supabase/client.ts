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
2. Verifica que contiene las variables:
   NEXT_PUBLIC_SUPABASE_URL=https://nmcrmgdnpzrrklpcgyzn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY3JtZ2RucHpycmtscGNneXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTE5NzIsImV4cCI6MjA4MDcyNzk3Mn0.fZ_1rRr6PK3HSzqZFtXOx6jpAxAhGPC9qz-cTxWr2PE
3. REINICIA el servidor de desarrollo:
   - Detén el servidor (Ctrl+C)
   - Ejecuta: npm run dev
4. Las variables de entorno solo se cargan al iniciar el servidor

Para verificar, ejecuta: ./scripts/verify-all-env.sh`
    
    throw new Error(errorMessage)
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}


