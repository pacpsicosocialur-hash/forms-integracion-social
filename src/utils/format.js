// ============================================================
// src/utils/format.js
// Utilidades de formato y presentación
// ============================================================

/**
 * Formatea una fecha a formato legible en español.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

/**
 * Formatea fecha y hora.
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Formatea número como porcentaje con un decimal.
 */
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.0%'
  return `${Number(value).toFixed(1)}%`
}

/**
 * Formatea número con un decimal.
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0.0'
  return Number(value).toFixed(decimals)
}

/**
 * Genera nombre de archivo para exportación.
 */
export function exportFilename(prefix) {
  const now = new Date()
  const ts  = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  return `${prefix}_${ts}.csv`
}
