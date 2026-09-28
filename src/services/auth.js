// ============================================================
// src/services/auth.js
// Autenticación de administradores — Supabase Auth
// ============================================================

import { supabase } from '../lib/supabase.js'

/**
 * Inicia sesión con email y contraseña.
 * Retorna { user, session } o lanza error.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Cierra sesión del usuario actual.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
  // Registrar en audit_log
  try {
    await supabase.rpc('log_admin_action', { p_action: 'logout' })
  } catch (_) {}
}

/**
 * Retorna la sesión actual o null.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Verifica si el usuario actual tiene rol de administrador.
 */
export async function isAdmin() {
  const session = await getSession()
  if (!session) return false

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  return !error && !!data
}

/**
 * Escucha cambios de estado de autenticación.
 * @param {Function} callback - (event, session) => void
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Registra acción administrativa en audit_log.
 */
export async function logAction(action, details = null) {
  try {
    await supabase.rpc('log_admin_action', {
      p_action:  action,
      p_details: details ? details : undefined,
    })
  } catch (_) {}
}
