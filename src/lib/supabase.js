// ============================================================
// src/lib/supabase.js
// Cliente Supabase — usa variables de entorno VITE_*
// NUNCA incluir claves reales en este archivo
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[Supabase] Faltan variables de entorno.\n' +
    'Copia .env.example como .env y completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
})

export default supabase
