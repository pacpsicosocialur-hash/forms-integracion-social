// ============================================================
// src/services/realtime.js
// Supabase Realtime — actualización en tiempo real del dashboard
// ============================================================

import { supabase } from '../lib/supabase.js'

let channel = null

/**
 * Suscribe al dashboard para recibir nuevas respuestas en tiempo real.
 * @param {Function} onNewResponse - callback llamado con el nuevo registro
 */
export function subscribeToResponses(onNewResponse) {
  if (channel) unsubscribeFromResponses()

  channel = supabase
    .channel('dashboard-responses')
    .on(
      'postgres_changes',
      {
        event:  'UPDATE',
        schema: 'public',
        table:  'responses',
        filter: "status=eq.completed",
      },
      (payload) => {
        onNewResponse(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'responses',
      },
      (payload) => {
        onNewResponse(payload.new)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Conectado al canal dashboard-responses')
      }
    })

  return channel
}

/**
 * Cancela la suscripción al canal.
 */
export function unsubscribeFromResponses() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
}
