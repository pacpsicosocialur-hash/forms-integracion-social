// ============================================================
// src/dashboard/statistics.js
// Cálculo de estadísticas descriptivas
// NOTA: Solo descriptiva. No se interpretan clínicamente las puntuaciones.
// ============================================================

/**
 * Frecuencia y porcentaje de cada valor en un array.
 * @param {Array} values - array de strings/números
 * @returns {Object} { value: { count, percent } }
 */
export function frequencyTable(values) {
  const total = values.length
  if (total === 0) return {}

  const counts = {}
  for (const v of values) {
    const key = String(v)
    counts[key] = (counts[key] || 0) + 1
  }

  const result = {}
  for (const [key, count] of Object.entries(counts)) {
    result[key] = {
      count,
      percent: Math.round((count / total) * 1000) / 10,  // 1 decimal
    }
  }
  return result
}

/**
 * Media aritmética de un array numérico.
 */
export function mean(values) {
  const nums = values.filter(v => !isNaN(Number(v))).map(Number)
  if (nums.length === 0) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
}

/**
 * Mediana de un array numérico.
 */
export function median(values) {
  const nums = values.filter(v => !isNaN(Number(v))).map(Number).sort((a, b) => a - b)
  if (nums.length === 0) return null
  const mid = Math.floor(nums.length / 2)
  return nums.length % 2 !== 0
    ? nums[mid]
    : Math.round(((nums[mid - 1] + nums[mid]) / 2) * 100) / 100
}

/**
 * Extrae los valores de una pregunta específica de un array de answers.
 * @param {Array} answers - filas de la tabla answers
 * @param {string} questionCode
 */
export function getValues(answers, questionCode) {
  return answers
    .filter(a => a.question_code === questionCode && a.value !== null && a.value !== '')
    .map(a => a.value)
}

/**
 * Calcula estadísticas de una escala Likert (1-5).
 * @param {Array} answers - filas de la tabla answers
 * @param {string} questionCode
 * @returns { freq, mean, median, n }
 */
export function likertStats(answers, questionCode) {
  const values = getValues(answers, questionCode).map(Number).filter(v => !isNaN(v))
  return {
    n:      values.length,
    freq:   frequencyTable(values),
    mean:   mean(values),
    median: median(values),
  }
}

/**
 * Calcula estadísticas de una variable categórica (radio).
 * @param {Array} answers
 * @param {string} questionCode
 * @param {Array} options - [{ value, label }]
 * @returns { freq, n }
 */
export function categoricalStats(answers, questionCode, options = null) {
  const values = getValues(answers, questionCode)
  const freq   = frequencyTable(values)

  // Mapear labels si se proveen opciones
  const result = {}
  if (options) {
    for (const opt of options) {
      const key = String(opt.value)
      result[opt.label] = freq[key] || { count: 0, percent: 0 }
    }
  } else {
    Object.assign(result, freq)
  }

  return { freq: result, n: values.length }
}

/**
 * Promedio de un dominio (varias preguntas Likert).
 * @param {Array} answers
 * @param {Array} questionCodes
 * @returns { domainMean, domainMedian, perQuestion }
 */
export function domainStats(answers, questionCodes) {
  const perQuestion = {}
  const allValues   = []

  for (const code of questionCodes) {
    const stats = likertStats(answers, code)
    perQuestion[code] = stats
    allValues.push(...getValues(answers, code).map(Number).filter(v => !isNaN(v)))
  }

  return {
    perQuestion,
    domainMean:   mean(allValues),
    domainMedian: median(allValues),
    n: allValues.length,
  }
}

/**
 * Calcula todas las estadísticas del instrumento.
 * @param {Array} answers - todas las filas de la tabla answers
 * @param {Array} questions - catálogo de preguntas
 * @returns {Object} estadísticas por sección
 */
export function computeAllStats(answers, questions) {
  const bySection = {}

  const questionMap = {}
  questions.forEach(q => { questionMap[q.question_code] = q })

  const sections = [...new Set(questions.map(q => q.section_code))]

  for (const section of sections) {
    const sectionQs = questions.filter(q => q.section_code === section)
    bySection[section] = {}

    for (const q of sectionQs) {
      if (q.question_type === 'open' || q.question_type === 'conditional') continue

      if (q.question_type === 'likert') {
        bySection[section][q.question_code] = {
          ...likertStats(answers, q.question_code),
          question_text: q.question_text,
          type: 'likert',
        }
      } else if (q.question_type === 'radio') {
        bySection[section][q.question_code] = {
          ...categoricalStats(answers, q.question_code, q.options),
          question_text: q.question_text,
          type: 'categorical',
        }
      }
    }
  }

  return bySection
}
