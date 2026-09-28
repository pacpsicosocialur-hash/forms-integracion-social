// ============================================================
// src/services/responses.js
// Servicio de respuestas — CRUD en Supabase
// ============================================================

import { supabase } from '../lib/supabase.js'

/**
 * Crea un nuevo participante y respuesta en Supabase.
 * Retorna { participant_id, response_id } o lanza error.
 */
export async function createResponse() {
  // 1. Crear participante anónimo
  const { data: participant, error: pErr } = await supabase
    .from('participants')
    .insert({})
    .select('id')
    .single()

  if (pErr) throw new Error('No se pudo crear el registro de participante: ' + pErr.message)

  // 2. Crear respuesta vinculada al participante
  const { data: response, error: rErr } = await supabase
    .from('responses')
    .insert({ participant_id: participant.id, status: 'started', current_step: 0 })
    .select('id')
    .single()

  if (rErr) throw new Error('No se pudo iniciar la respuesta: ' + rErr.message)

  return { participant_id: participant.id, response_id: response.id }
}

/**
 * Actualiza el paso actual y estado de la respuesta.
 */
export async function updateResponseStep(responseId, step, status = 'in_progress') {
  const { error } = await supabase
    .from('responses')
    .update({ current_step: step, status })
    .eq('id', responseId)

  if (error) console.warn('[responses] updateStep error:', error.message)
}

/**
 * Guarda el consentimiento informado.
 */
export async function saveConsent({ responseId, version, accepted, consentText }) {
  const { error } = await supabase
    .from('consents')
    .insert({
      response_id:  responseId,
      version,
      accepted,
      consent_text: consentText,
    })

  if (error) throw new Error('No se pudo guardar el consentimiento: ' + error.message)

  // Actualizar estado de la respuesta
  await supabase
    .from('responses')
    .update({ status: 'consent_done', current_step: 1 })
    .eq('id', responseId)
}

/**
 * Guarda las respuestas de una sección.
 * @param {string} responseId
 * @param {Array} answers - [{ question_id, question_code, value, value_numeric }]
 */
export async function saveAnswers(responseId, answers) {
  if (!answers || answers.length === 0) return

  const rows = answers.map(a => ({
    response_id:   responseId,
    question_id:   a.question_id,
    question_code: a.question_code,
    value:         String(a.value ?? ''),
    value_numeric: a.value_numeric ?? null,
  }))

  const { error } = await supabase
    .from('answers')
    .upsert(rows, { onConflict: 'response_id,question_id' })

  if (error) throw new Error('No se pudo guardar las respuestas: ' + error.message)
}

/**
 * Completa la respuesta mediante la función RPC del servidor.
 * Retorna el código anónimo generado.
 */
export async function completeResponse(responseId) {
  const { data, error } = await supabase
    .rpc('complete_response', { p_response_id: responseId })

  if (error) throw new Error('No se pudo completar la respuesta: ' + error.message)
  return data // código anónimo, ej: "JKL-4823"
}

/**
 * Carga las preguntas activas desde Supabase.
 */
export async function loadQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .order('section_code')
    .order('"order"')

  if (error) throw new Error('No se pudieron cargar las preguntas: ' + error.message)
  return data
}

/**
 * Carga la configuración pública de la app.
 */
export async function loadPublicConfig() {
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', ['consent_version', 'form_active', 'form_title', 'form_subtitle'])

  if (error) return {}

  return data.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})
}
