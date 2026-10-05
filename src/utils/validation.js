// ============================================================
// src/utils/validation.js
// Utilidades de validación del formulario
// ============================================================

/**
 * Valida que un campo no esté vacío.
 */
export function required(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

/**
 * Valida que todas las preguntas obligatorias tengan respuesta.
 * @param {Array} questions - preguntas de la sección actual
 * @param {Object} answers - { question_code: value }
 * @returns {Array} lista de question_codes sin responder
 */
export function validateSection(questions, answers) {
  const missing = []
  for (const q of questions) {
    if (!q.required) continue
    if (q.question_type === 'conditional') {
      // Verificar si la condición padre está activa
      const parentValue = answers[q.parent_code]
      if (parentValue !== q.parent_value) continue // no es obligatoria si el padre no lo activa
    }
    const val = answers[q.question_code]
    if (!required(val)) {
      missing.push(q.question_code)
    }
  }
  return missing
}

/**
 * Sanitiza texto libre para prevenir inyección.
 * Elimina tags HTML y limita longitud.
 */
export function sanitizeText(text, maxLength = 1000) {
  if (!text) return ''
  return String(text)
    .replace(/<[^>]*>/g, '')   // eliminar tags HTML
    .replace(/[<>]/g, '')      // eliminar < > residuales
    .trim()
    .substring(0, maxLength)
}

/**
 * Verifica que el dataURL de la firma no esté vacío
 * y tenga contenido real (no solo el canvas en blanco).
 */
export function isSignatureValid(dataURL) {
  if (!dataURL || dataURL === 'data:,' || typeof dataURL !== 'string') return false
  // Una imagen PNG válida en dataURL con algún trazo supera los 500 caracteres
  return dataURL.length > 500 && dataURL.startsWith('data:image/')
}
