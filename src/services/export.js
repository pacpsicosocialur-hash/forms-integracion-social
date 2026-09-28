// ============================================================
// src/services/export.js
// Exportación de datos — CSV para administradores
// ============================================================

import { supabase } from '../lib/supabase.js'
import { logAction } from './auth.js'

/**
 * Exporta todas las respuestas completadas con sus respuestas.
 * Retorna un string CSV.
 */
export async function exportResponsesCSV() {
  // Cargar respuestas completadas
  const { data: responses, error: rErr } = await supabase
    .from('responses')
    .select(`
      id,
      response_code,
      status,
      started_at,
      completed_at,
      consents ( version, accepted, accepted_at ),
      answers ( question_code, value, value_numeric )
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (rErr) throw new Error('Error al cargar respuestas: ' + rErr.message)

  // Obtener todos los question_codes únicos para las columnas
  const allCodes = new Set()
  responses.forEach(r => r.answers?.forEach(a => allCodes.add(a.question_code)))
  const codes = Array.from(allCodes).sort()

  // Construir encabezados
  const headers = [
    'response_code',
    'status',
    'started_at',
    'completed_at',
    'consent_version',
    'consent_accepted',
    'consent_accepted_at',
    ...codes,
  ]

  // Construir filas
  const rows = responses.map(r => {
    const answerMap = {}
    r.answers?.forEach(a => { answerMap[a.question_code] = a.value })

    const consent = r.consents?.[0] ?? {}

    return [
      r.response_code ?? '',
      r.status,
      r.started_at ? new Date(r.started_at).toLocaleString('es-CO') : '',
      r.completed_at ? new Date(r.completed_at).toLocaleString('es-CO') : '',
      consent.version ?? '',
      consent.accepted ? 'Sí' : 'No',
      consent.accepted_at ? new Date(consent.accepted_at).toLocaleString('es-CO') : '',
      ...codes.map(code => answerMap[code] ?? ''),
    ]
  })

  // Convertir a CSV
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  // Registrar en audit_log
  await logAction('export', { type: 'responses_csv', count: responses.length })

  return csvContent
}

/**
 * Exporta indicadores agregados como CSV.
 */
export async function exportIndicatorsCSV(stats) {
  const rows = Object.entries(stats).map(([key, value]) => [key, value])
  const csv = [['Indicador', 'Valor'], ...rows]
    .map(row => row.map(c => `"${c}"`).join(','))
    .join('\n')

  await logAction('export', { type: 'indicators_csv' })
  return csv
}

/**
 * Descarga un string como archivo .csv en el navegador.
 */
export function downloadCSV(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
