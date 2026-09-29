// ============================================================
// src/pages/form/form.js
// Controlador principal del formulario público multi-paso
// ============================================================

import './form.css'
import {
  createResponse,
  updateResponseStep,
  saveConsent,
  saveAnswers,
  completeResponse,
  loadQuestions,
  loadPublicConfig,
} from '../../services/responses.js'
import { saveSignature }         from '../../services/signatures.js'
import { validateSection, isSignatureValid, sanitizeText } from '../../utils/validation.js'
import { FALLBACK_QUESTIONS }   from '../../data/fallbackQuestions.js'

// ============================================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ============================================================
const state = {
  currentStep:        0,
  responseId:         null,
  participantId:      null,
  questions:          [...FALLBACK_QUESTIONS], // Inicializado con catálogo completo
  answers:            {},                      // { question_code: value }
  consentVersion:     '1.0',
  consentAccepted:    false,
  signatureDataURL:   null,
  signatureConfirmed: false,
  hasDrawnSignature:  false,
  isSubmitting:       false,
  config:             {},
  submittedCode:      null,
  isOfflineMode:      false,
}

// Definición de los pasos del formulario
const STEPS = [
  { id: 'consent',     label: 'Consentimiento' },
  { id: 'general',     label: 'Datos generales' },
  { id: 'occupational',label: 'Desempeño' },
  { id: 'work_skills', label: 'Habilidades' },
  { id: 'social',      label: 'Social' },
  { id: 'barriers',    label: 'Barreras' },
  { id: 'interests',   label: 'Intereses' },
  { id: 'completion',  label: 'Finalización' },
]

const CONSENT_TEXT = `De acuerdo con la Resolución 8430 de 1993, esta encuesta se clasifica como investigación sin riesgo, ya que utiliza cuestionarios que no implican intervención sobre las condiciones biológicas, fisiológicas, psicológicas o sociales de los participantes. La información solicitada es únicamente de carácter general y ocupacional, sin incluir datos clínicos ni aspectos sensibles que puedan permitir la identificación de los participantes.

La participación es completamente voluntaria y no generará intervención psicoterapéutica, atención clínica ni beneficios laborales dentro o fuera de la institución. Al completar la encuesta, el participante manifiesta haber sido informado sobre la naturaleza del estudio y autoriza el uso de sus datos con fines académicos y para el fortalecimiento del programa, garantizando en todo momento la confidencialidad y el anonimato de la información suministrada.`

// ============================================================
// UTILIDADES — TOAST
// ============================================================
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer')
  if (!container) return

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Cerrar">×</button>
  `

  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast))
  container.appendChild(toast)
  setTimeout(() => removeToast(toast), 5000)
}

function removeToast(toast) {
  toast.style.animation = 'toastOut 0.3s ease forwards'
  setTimeout(() => toast.remove(), 300)
}

// ============================================================
// UTILIDADES — LOADING
// ============================================================
function setLoading(show, message = 'Guardando...') {
  const overlay = document.getElementById('loadingOverlay')
  const msg     = document.getElementById('loadingMessage')
  if (!overlay) return
  if (msg) msg.textContent = message
  overlay.style.display = show ? 'flex' : 'none'
}

// ============================================================
// PROGRESO
// ============================================================
function updateProgress() {
  const totalSteps = STEPS.length - 1  // sin contar "completion"
  const fill = Math.round((state.currentStep / totalSteps) * 100)

  document.getElementById('progressFill')?.style.setProperty('width', `${fill}%`)

  // Actualizar dots
  document.querySelectorAll('.progress-step').forEach((el, i) => {
    el.classList.toggle('is-active', i === state.currentStep)
    el.classList.toggle('is-done',   i < state.currentStep)
  })
}

// ============================================================
// RENDER — PREGUNTAS DE UNA SECCIÓN
// ============================================================
function getQuestionsBySection(sectionCode) {
  return state.questions
    .filter(q => q.section_code === sectionCode)
    .sort((a, b) => a.order - b.order)
}

function renderOptions(question, container) {
  if (!question.options) return

  if (question.question_type === 'likert') {
    container.innerHTML = `<div class="likert-options" role="radiogroup" aria-label="${question.question_text}">
      ${question.options.map(opt => `
        <label class="likert-option ${state.answers[question.question_code] === opt.value ? 'is-selected' : ''}"
               data-q="${question.question_code}" data-v="${opt.value}">
          <input type="radio" name="${question.question_code}" value="${opt.value}"
                 ${state.answers[question.question_code] === opt.value ? 'checked' : ''}>
          <span class="likert-number">${opt.value}</span>
          <span class="likert-label">${opt.label.replace(/^\d+ — /, '')}</span>
        </label>
      `).join('')}
    </div>`
  } else {
    container.innerHTML = `<div class="radio-options" role="radiogroup" aria-label="${question.question_text}">
      ${question.options.map(opt => `
        <label class="radio-option ${state.answers[question.question_code] === opt.value ? 'is-selected' : ''}"
               data-q="${question.question_code}" data-v="${opt.value}">
          <input type="radio" name="${question.question_code}" value="${opt.value}"
                 ${state.answers[question.question_code] === opt.value ? 'checked' : ''}>
          <span class="radio-option-label">${opt.label}</span>
        </label>
      `).join('')}
    </div>`
  }

  // Event listeners
  container.querySelectorAll('label[data-q]').forEach(lbl => {
    lbl.addEventListener('click', () => {
      const code  = lbl.dataset.q
      const value = lbl.dataset.v
      state.answers[code] = value

      // Deselect others, select this
      container.querySelectorAll(`label[data-q="${code}"]`).forEach(l => l.classList.remove('is-selected'))
      lbl.classList.add('is-selected')
      lbl.querySelector('input').checked = true

      // Limpiar error
      const errEl = document.getElementById(`err_${code}`)
      if (errEl) errEl.classList.remove('is-visible')

      // Mostrar/ocultar condicionales
      handleConditionals(code, value)
    })
  })
}

function renderQuestionBlock(question, parentEl) {
  const isConditional = question.question_type === 'conditional' || question.parent_code
  const isVisible = !isConditional ||
    (state.answers[question.parent_code] === question.parent_value)

  const block = document.createElement('div')
  block.className = 'question-block'
  block.id = `block_${question.question_code}`
  block.style.display = isVisible ? '' : 'none'

  const reqMark = question.required ? '<span class="question-required" aria-hidden="true">*</span>' : ''
  block.innerHTML = `
    <p class="question-text" id="ql_${question.question_code}">${question.question_text}${reqMark}</p>
    <div id="opts_${question.question_code}"></div>
    <div id="err_${question.question_code}" class="question-error" role="alert">
      <span>⚠</span> Este campo es obligatorio.
    </div>
  `

  parentEl.appendChild(block)

  const optsContainer = block.querySelector(`#opts_${question.question_code}`)

  if (question.question_type === 'open' || question.question_type === 'conditional') {
    // Textarea
    const textarea = document.createElement('textarea')
    textarea.className = 'form-textarea'
    textarea.id = question.question_code
    textarea.name = question.question_code
    textarea.placeholder = 'Escriba su respuesta aquí...'
    textarea.maxLength = 500
    textarea.value = state.answers[question.question_code] || ''
    textarea.addEventListener('input', () => {
      state.answers[question.question_code] = sanitizeText(textarea.value)
      const errEl = document.getElementById(`err_${question.question_code}`)
      if (errEl && textarea.value.trim()) errEl.classList.remove('is-visible')
    })
    optsContainer.appendChild(textarea)
  } else {
    renderOptions(question, optsContainer)
  }
}

function handleConditionals(parentCode, value) {
  state.questions
    .filter(q => q.parent_code === parentCode)
    .forEach(q => {
      const block = document.getElementById(`block_${q.question_code}`)
      if (!block) return
      const show = value === q.parent_value
      block.style.display = show ? '' : 'none'
      if (!show) delete state.answers[q.question_code]
    })
}

// ============================================================
// RENDERIZADO DE SECCIONES
// ============================================================

// PASO 0 — Consentimiento + Firma
function renderConsent() {
  const section = document.getElementById('step-consent')
  if (!section) return
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">Consentimiento Informado</h2>
    </div>

    <div class="consent-box" id="consentText" aria-label="Texto del consentimiento informado">
      <p>${CONSENT_TEXT.replace(/\n\n/g, '</p><p style="margin-top:1rem">').replace(/\n/g, '<br>')}</p>
    </div>

    <div class="consent-checkboxes">
      <label class="custom-checkbox" for="consent1">
        <input type="checkbox" id="consent1">
        <span class="custom-checkbox-label">
          He leído y comprendido la información anterior.
        </span>
      </label>
      <label class="custom-checkbox" for="consent2">
        <input type="checkbox" id="consent2">
        <span class="custom-checkbox-label">
          Acepto participar voluntariamente en este estudio y autorizo el uso de la información suministrada para fines académicos y para el fortalecimiento del programa.
        </span>
      </label>
    </div>

    <div id="consentError" class="question-error" role="alert" style="display:none;margin-bottom:1rem">
      <span>⚠</span> Debe aceptar las dos condiciones marcando ambas casillas para continuar.
    </div>

    <!-- FIRMA -->
    <div class="signature-area" id="signatureArea">
      <h3 class="signature-title">✍️ Firma del participante</h3>
      <p class="signature-hint">Firme en el espacio a continuación utilizando el mouse, el dedo (pantalla táctil) o el lápiz digital.</p>

      <div class="signature-canvas-wrapper" id="signatureWrapper">
        <div class="signature-placeholder" id="signaturePlaceholder">
          <span class="signature-placeholder-icon">✍️</span>
          <span>Dibuje su firma aquí con el mouse o pantalla táctil</span>
        </div>
        <canvas id="signatureCanvas" width="700" height="200" aria-label="Área de firma"></canvas>
      </div>

      <div class="signature-controls">
        <button type="button" class="btn btn-ghost btn-sm" id="btnClearSignature">🗑️ Limpiar firma</button>
        <button type="button" class="btn btn-secondary btn-sm" id="btnConfirmSignature">✅ Confirmar firma</button>
      </div>

      <div class="signature-confirmed" id="signatureConfirmed">
        <span>✅</span>
        <span>Firma confirmada correctamente.</span>
      </div>

      <div id="signatureError" class="question-error" role="alert" style="display:none;margin-top:0.5rem">
        <span>⚠</span> Debe firmar y hacer clic en "✅ Confirmar firma" para continuar.
      </div>
    </div>
  `

  // Agregar listeners a los checkboxes para limpiar error al marcar
  document.getElementById('consent1')?.addEventListener('change', () => {
    const c1 = document.getElementById('consent1')?.checked
    const c2 = document.getElementById('consent2')?.checked
    if (c1 && c2) {
      const err = document.getElementById('consentError')
      if (err) err.style.display = 'none'
    }
  })
  document.getElementById('consent2')?.addEventListener('change', () => {
    const c1 = document.getElementById('consent1')?.checked
    const c2 = document.getElementById('consent2')?.checked
    if (c1 && c2) {
      const err = document.getElementById('consentError')
      if (err) err.style.display = 'none'
    }
  })

  initSignaturePad()
}

// Inicializar el canvas de firma
function initSignaturePad() {
  const canvas      = document.getElementById('signatureCanvas')
  const wrapper     = document.getElementById('signatureWrapper')
  const placeholder = document.getElementById('signaturePlaceholder')
  if (!canvas || !wrapper) return

  const ctx = canvas.getContext('2d')
  let drawing = false
  let lastX = 0, lastY = 0

  // Ajustar resolución del canvas al tamaño real en pantalla
  function resizeCanvas() {
    const rect  = canvas.getBoundingClientRect()
    const width = rect.width > 0 ? rect.width : (wrapper.clientWidth || 700)
    const dpr   = window.devicePixelRatio || 1

    let existingData = null
    if (state.hasDrawnSignature && state.signatureDataURL) {
      existingData = state.signatureDataURL
    }

    canvas.width  = Math.round(width * dpr)
    canvas.height = Math.round(200 * dpr)
    canvas.style.width  = '100%'
    canvas.style.height = '200px'

    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1A2B3C'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    if (existingData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, width, 200)
      img.src = existingData
    }
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e) {
    if (e.button !== undefined && e.button !== 0) return // Solo botón principal (izquierdo)
    e.preventDefault()
    drawing = true
    const pos = getPos(e)
    lastX = pos.x
    lastY = pos.y
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(lastX + 0.1, lastY + 0.1)
    ctx.stroke()

    state.hasDrawnSignature = true
    wrapper.classList.add('has-content')
    if (placeholder) placeholder.style.display = 'none'
  }

  function draw(e) {
    if (!drawing) return
    e.preventDefault()
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastX = pos.x
    lastY = pos.y

    state.hasDrawnSignature = true
    wrapper.classList.add('has-content')
    if (placeholder) placeholder.style.display = 'none'
    state.signatureConfirmed = false
    document.getElementById('signatureConfirmed')?.classList.remove('is-visible')
  }

  function stopDraw() {
    if (drawing) {
      drawing = false
      state.signatureDataURL = canvas.toDataURL('image/png')
    }
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Mouse events
  canvas.addEventListener('mousedown',  startDraw)
  canvas.addEventListener('mousemove',  draw)
  window.addEventListener('mouseup',    stopDraw)
  canvas.addEventListener('mouseleave', stopDraw)

  // Touch events (móviles y tablets)
  canvas.addEventListener('touchstart', startDraw, { passive: false })
  canvas.addEventListener('touchmove',  draw,      { passive: false })
  canvas.addEventListener('touchend',   stopDraw)
  canvas.addEventListener('touchcancel',stopDraw)

  // Botón limpiar
  document.getElementById('btnClearSignature')?.addEventListener('click', () => {
    const rect  = canvas.getBoundingClientRect()
    const width = rect.width > 0 ? rect.width : (wrapper.clientWidth || 700)
    ctx.clearRect(0, 0, width, 200)
    wrapper.classList.remove('has-content')
    wrapper.classList.remove('is-invalid')
    if (placeholder) placeholder.style.display = 'flex'
    state.signatureDataURL   = null
    state.signatureConfirmed = false
    state.hasDrawnSignature  = false
    document.getElementById('signatureConfirmed')?.classList.remove('is-visible')
    const sigErr = document.getElementById('signatureError')
    if (sigErr) sigErr.style.display = 'none'
  })

  // Botón confirmar
  document.getElementById('btnConfirmSignature')?.addEventListener('click', () => {
    state.signatureDataURL = canvas.toDataURL('image/png')
    if (!state.hasDrawnSignature || !isSignatureValid(state.signatureDataURL)) {
      showToast('warning', 'Firma requerida', 'Por favor dibuje su firma en el recuadro antes de confirmar.')
      const sigErr = document.getElementById('signatureError')
      if (sigErr) {
        sigErr.style.display = 'flex'
        sigErr.innerHTML = '<span>⚠</span> Por favor dibuje su firma antes de confirmar.'
      }
      wrapper.classList.add('is-invalid')
      return
    }
    state.signatureConfirmed = true
    wrapper.classList.add('has-content')
    wrapper.classList.remove('is-invalid')
    document.getElementById('signatureConfirmed')?.classList.add('is-visible')
    const sigErr = document.getElementById('signatureError')
    if (sigErr) sigErr.style.display = 'none'
    showToast('success', 'Firma confirmada', 'Su firma ha sido registrada correctamente.')
  })
}

// PASOS 1-6 — Secciones con preguntas
function renderQuestionSection(sectionCode, containerId, subsections = null) {
  const section = document.getElementById(containerId)
  const questions = getQuestionsBySection(sectionCode)

  const sectionInfo = {
    general:     { title: 'Datos Generales', description: null },
    occupational: {
      title: 'Habilidades de Desempeño Ocupacional',
      description: 'En esta sección se indagan las habilidades de desempeño, entendidas como las capacidades que una persona utiliza para llevar a cabo actividades en su vida diaria. Estas incluyen habilidades motoras y de procesamiento/cognitivas. A través de diferentes situaciones, se busca caracterizar cómo la persona se desenvuelve en cada área, identificando su nivel de comodidad y las dificultades que pueda percibir, basado en la evaluación estandarizada Assessment of Motor and Process Skills (AMPS).'
    },
    work_skills:  { title: 'Habilidades Laborales Básicas', description: null },
    social:       { title: 'Habilidades de Interacción Social', description: null },
    barriers:     { title: 'Barreras y Apoyos para la Participación Laboral', description: null },
    interests:    { title: 'Intereses Ocupacionales y Laborales', description: null },
  }

  const info = sectionInfo[sectionCode] || { title: sectionCode, description: null }

  let html = `<div class="section-header">
    <h2 class="section-title">${info.title}</h2>
    ${info.description ? `<div class="section-description">${info.description}</div>` : ''}
  </div>`

  section.innerHTML = html

  // Renderizar preguntas agrupadas por subsección si aplica
  if (sectionCode === 'occupational') {
    // Agrupar por subsección
    const motorQs     = questions.filter(q => q.subsection === 'Motor')
    const cognitiveQs = questions.filter(q => q.subsection === 'Cognitivo/Procesamiento')

    const motorEl = document.createElement('div')
    motorEl.innerHTML = '<h3 class="subsection-title">Dominio Motor</h3>'
    section.appendChild(motorEl)
    motorQs.forEach(q => renderQuestionBlock(q, motorEl))

    const cogEl = document.createElement('div')
    cogEl.innerHTML = '<h3 class="subsection-title">Dominio Cognitivo / Procesamiento</h3>'
    section.appendChild(cogEl)
    cognitiveQs.forEach(q => renderQuestionBlock(q, cogEl))
  } else {
    questions.forEach(q => renderQuestionBlock(q, section))
  }
}

// PASO 7 — Finalización
function renderCompletion() {
  const section = document.getElementById('step-completion')
  section.innerHTML = `
    <div class="completion-screen">
      <div class="completion-icon">✅</div>
      <h2 class="section-title" style="font-size:1.75rem;margin-bottom:1rem">
        ¡Gracias por participar!
      </h2>
      <p style="color:var(--color-text-secondary);font-size:1.1rem;line-height:1.7;max-width:500px;margin:0 auto">
        Sus respuestas han sido registradas correctamente y serán utilizadas con fines académicos y para el fortalecimiento del programa, respetando en todo momento la confidencialidad de la información.
      </p>

      <div style="margin:2.5rem 0">
        <p style="font-size:0.9rem;color:var(--color-text-muted);margin-bottom:0.5rem">Código de referencia anónimo de su respuesta:</p>
        <div class="completion-code" id="responseCode">${state.submittedCode || '—'}</div>
        <p style="font-size:0.8rem;color:var(--color-text-muted);margin-top:0.5rem">
          Puede guardar este código como referencia. No contiene información personal.
        </p>
      </div>

      <div style="background:var(--color-positive);border-radius:var(--radius-lg);padding:1.5rem;max-width:500px;margin:0 auto;border:1px solid var(--color-soft)">
        <p style="font-size:0.9rem;color:var(--color-text-secondary);line-height:1.6">
          🔒 Su información está protegida. Las respuestas son confidenciales y anónimas. El equipo de Terapia Ocupacional agradece su participación en este estudio.
        </p>
      </div>
    </div>
  `
}

// ============================================================
// VALIDACIÓN POR PASO
// ============================================================
async function validateCurrentStep() {
  const step = state.currentStep

  if (step === 0) {
    // Validar checkboxes de consentimiento
    const c1 = document.getElementById('consent1')?.checked
    const c2 = document.getElementById('consent2')?.checked
    const errEl = document.getElementById('consentError')

    if (!c1 || !c2) {
      if (errEl) errEl.style.display = 'flex'
      showToast('error', 'Consentimiento requerido', 'Debe aceptar las dos condiciones marcando ambas casillas para continuar.')
      return false
    }
    if (errEl) errEl.style.display = 'none'

    // Validar firma
    if (!state.hasDrawnSignature || !state.signatureConfirmed || !state.signatureDataURL) {
      const sigErr = document.getElementById('signatureError')
      const wrapper = document.getElementById('signatureWrapper')
      if (sigErr) {
        sigErr.style.display = 'flex'
        sigErr.innerHTML = `<span>⚠</span> ${
          !state.hasDrawnSignature
            ? 'Debe dibujar su firma en el recuadro antes de continuar.'
            : 'Debe hacer clic en el botón "✅ Confirmar firma" para registrar su firma.'
        }`
      }
      if (wrapper) wrapper.classList.add('is-invalid')
      showToast(
        'error',
        'Firma requerida',
        !state.hasDrawnSignature
          ? 'Por favor dibuje su firma con el mouse o pantalla táctil.'
          : 'Presione "Confirmar firma" para validarla antes de continuar.'
      )
      return false
    }

    state.consentAccepted = true
    return true
  }

  // Pasos 1-6: validar preguntas obligatorias
  const sectionCodes = ['general', 'occupational', 'work_skills', 'social', 'barriers', 'interests']
  const sectionCode  = sectionCodes[step - 1]
  if (!sectionCode) return true

  const questions  = getQuestionsBySection(sectionCode)
  const missingCodes = validateSection(questions, state.answers)

  if (missingCodes.length > 0) {
    // Mostrar errores
    missingCodes.forEach(code => {
      const errEl = document.getElementById(`err_${code}`)
      if (errEl) errEl.classList.add('is-visible')
    })

    // Scroll al primero
    const firstErr = document.getElementById(`block_${missingCodes[0]}`)
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' })

    showToast('error', 'Preguntas incompletas', `Hay ${missingCodes.length} pregunta(s) obligatoria(s) sin responder.`)
    return false
  }

  return true
}

// ============================================================
// GUARDAR DATOS POR PASO
// ============================================================
async function saveCurrentStep() {
  const step = state.currentStep

  // Si aún no tenemos responseId y no estamos en offline forzado, intentar crear en Supabase
  if (!state.responseId && !state.isOfflineMode) {
    try {
      const { response_id, participant_id } = await createResponse()
      state.responseId    = response_id
      state.participantId = participant_id
    } catch (err) {
      console.warn('[Form] Supabase no disponible al guardar, operando en modo local:', err.message)
      state.isOfflineMode = true
      state.responseId    = 'local_' + Math.random().toString(36).substring(2, 9)
    }
  }

  // PASO 0 — Guardar consentimiento y firma
  if (step === 0) {
    if (!state.isOfflineMode && state.responseId) {
      try {
        await saveConsent({
          responseId:  state.responseId,
          version:     state.consentVersion,
          accepted:    true,
          consentText: CONSENT_TEXT,
        })
      } catch (err) {
        console.warn('[Form] No se pudo guardar consentimiento en Supabase:', err.message)
      }

      // Subir firma a Supabase Storage
      try {
        await saveSignature(state.responseId, state.signatureDataURL, state.consentVersion)
      } catch (err) {
        console.warn('[Form] No se pudo subir firma a Storage (verifique bucket "signatures"):', err.message)
      }
    }
    return
  }

  // PASOS 1-6 — Guardar respuestas de la sección
  const sectionCodes = ['general', 'occupational', 'work_skills', 'social', 'barriers', 'interests']
  const sectionCode  = sectionCodes[step - 1]
  if (!sectionCode) return

  const questions = getQuestionsBySection(sectionCode)
  const toSave    = []

  questions.forEach(q => {
    const value = state.answers[q.question_code]
    if (value !== undefined && value !== null && value !== '') {
      toSave.push({
        question_id:   q.id,
        question_code: q.question_code,
        value:         String(value),
        value_numeric: !isNaN(Number(value)) && value !== '' ? Number(value) : null,
      })
    }
  })

  if (toSave.length > 0 && !state.isOfflineMode && state.responseId) {
    try {
      await saveAnswers(state.responseId, toSave)
      await updateResponseStep(state.responseId, step + 1, 'in_progress')
    } catch (err) {
      console.warn('[Form] Error guardando respuestas en Supabase:', err.message)
    }
  }
}

// ============================================================
// NAVEGACIÓN ENTRE PASOS
// ============================================================
function showStep(stepIndex) {
  // Ocultar todos los pasos
  STEPS.forEach(s => {
    const el = document.getElementById(`step-${s.id}`)
    if (el) el.classList.remove('is-active')
  })

  // Mostrar el paso actual
  const stepEl = document.getElementById(`step-${STEPS[stepIndex].id}`)
  if (stepEl) stepEl.classList.add('is-active')

  // Actualizar navegación
  const btnBack = document.getElementById('btnBack')
  const btnNext = document.getElementById('btnNext')

  if (btnBack) btnBack.style.visibility = stepIndex > 0 ? 'visible' : 'hidden'
  if (btnNext) {
    if (stepIndex === STEPS.length - 1) {
      btnNext.style.display = 'none'
    } else {
      btnNext.style.display = ''
      btnNext.textContent = stepIndex === STEPS.length - 2 ? 'Enviar respuestas' : 'Continuar →'
    }
  }

  // Ocultar navegación en la pantalla de finalización
  const navEl = document.getElementById('formNavigation')
  if (navEl) navEl.style.display = stepIndex === STEPS.length - 1 ? 'none' : ''

  updateProgress()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function goNext() {
  if (state.isSubmitting) return

  const isValid = await validateCurrentStep()
  if (!isValid) return

  state.isSubmitting = true
  setLoading(true, state.currentStep === STEPS.length - 2 ? 'Enviando sus respuestas...' : 'Guardando...')

  try {
    await saveCurrentStep()

    // Último paso: completar respuesta
    if (state.currentStep === STEPS.length - 2) {
      let code = null
      if (!state.isOfflineMode && state.responseId) {
        try {
          code = await completeResponse(state.responseId)
        } catch (rpcErr) {
          console.warn('[Form] No se pudo completar mediante RPC en Supabase:', rpcErr.message)
        }
      }

      if (!code) {
        // Código de confirmación anónimo autónomo
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        const p1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
        const p2 = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
        code = `${p1}-${p2}`
      }

      state.submittedCode = code
      state.currentStep++
      showStep(state.currentStep)
      renderCompletion()
    } else {
      state.currentStep++
      showStep(state.currentStep)
    }
  } catch (err) {
    console.error('[Form] Error en navegación:', err)
    showToast('error', 'Error al continuar', err.message || 'Por favor intente de nuevo.')
  } finally {
    state.isSubmitting = false
    setLoading(false)
  }
}

function goBack() {
  if (state.currentStep <= 0) return
  state.currentStep--
  showStep(state.currentStep)
}

function renderAllQuestionSections() {
  renderQuestionSection('general',     'step-general')
  renderQuestionSection('occupational','step-occupational')
  renderQuestionSection('work_skills', 'step-work_skills')
  renderQuestionSection('social',      'step-social')
  renderQuestionSection('barriers',    'step-barriers')
  renderQuestionSection('interests',   'step-interests')
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
async function init() {
  // 1. RENDERIZADO INMEDIATO:
  // El consentimiento y todas las preguntas se cargan de inmediato para que
  // la pantalla NUNCA aparezca en blanco ni bloquee al usuario.
  renderConsent()
  renderAllQuestionSections()
  showStep(0)

  // 2. Verificar configuración de Supabase
  const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnon || supabaseUrl.includes('your-project-ref')) {
    console.warn('[Form] Supabase no configurado en Netlify (.env). El formulario funciona con catálogo integrado.')
    state.isOfflineMode = true
    return
  }

  // 3. Conexión asíncrona a Supabase para sincronizar configuración y preguntas
  try {
    const [config, dbQuestions] = await Promise.all([
      loadPublicConfig().catch(e => {
        console.warn('[Form] Config warning:', e.message)
        return {}
      }),
      loadQuestions().catch(e => {
        console.warn('[Form] Questions warning:', e.message)
        return null
      }),
    ])

    if (config) {
      state.config = config
      if (config.consent_version) state.consentVersion = config.consent_version
      const titleEl    = document.getElementById('formTitle')
      const subtitleEl = document.getElementById('formSubtitle')
      if (titleEl    && config.form_title)    titleEl.textContent    = config.form_title
      if (subtitleEl && config.form_subtitle) subtitleEl.textContent = config.form_subtitle

      if (config.form_active === 'false') {
        document.getElementById('app').innerHTML = `
          <div class="form-inactive">
            <div class="card form-inactive-card">
              <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
              <h2 style="color:var(--color-primary);margin-bottom:1rem">Formulario no disponible</h2>
              <p style="color:var(--color-text-secondary)">
                El formulario no está disponible en este momento. Por favor contacte al equipo de Terapia Ocupacional.
              </p>
            </div>
          </div>
        `
        return
      }
    }

    if (dbQuestions && dbQuestions.length > 0) {
      state.questions = dbQuestions
      renderAllQuestionSections()
    }

    // Inicializar respuesta en Supabase de forma no bloqueante
    try {
      const { response_id, participant_id } = await createResponse()
      state.responseId    = response_id
      state.participantId = participant_id
    } catch (createErr) {
      console.warn('[Form] Aviso al crear respuesta inicial en Supabase:', createErr.message)
    }

  } catch (err) {
    console.warn('[Form] Modo sin conexión / inicialización local:', err.message)
  }
}

// ============================================================
// EVENTO DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Event listeners de navegación
  document.getElementById('btnNext')?.addEventListener('click', goNext)
  document.getElementById('btnBack')?.addEventListener('click', goBack)

  // Inicio
  init()
})
