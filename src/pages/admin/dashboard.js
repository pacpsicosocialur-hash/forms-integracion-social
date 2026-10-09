// ============================================================
// src/pages/admin/dashboard.js
// Dashboard administrativo — controlador principal
// ============================================================

import './admin.css'
import { supabase }             from '../../lib/supabase.js'
import { signIn, signOut, getSession, isAdmin, onAuthChange, logAction } from '../../services/auth.js'
import { subscribeToResponses, unsubscribeFromResponses } from '../../services/realtime.js'
import { exportResponsesCSV, exportIndicatorsCSV, downloadCSV } from '../../services/export.js'
import { computeAllStats, frequencyTable, mean, median } from '../../dashboard/statistics.js'
import {
  renderBarChart, renderDonutChart, renderLikertChart,
  renderRadarChart, renderTimelineChart,
} from '../../dashboard/charts.js'
import { formatDateTime, formatPercent, formatNumber, exportFilename } from '../../utils/format.js'

// ============================================================
// ESTADO
// ============================================================
const state = {
  user:         null,
  currentView:  'home',
  dashStats:    null,
  responses:    [],
  answers:      [],
  questions:    [],
  auditLog:     [],
  config:       {},
  realtimeSub:  null,
  isLoading:    false,
}

// ============================================================
// TOAST
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
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'toastOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  })
  container.appendChild(toast)
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards'
    setTimeout(() => toast.remove(), 300)
  }, 5000)
}

// ============================================================
// LOGIN
// ============================================================
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">🏥</div>
        <h1 class="login-title">Panel Administrativo</h1>
        <p class="login-subtitle">Programa de Terapia Ocupacional — Clínica Día</p>

        <div id="loginError" class="login-error" role="alert"></div>

        <form class="login-form" id="loginForm" novalidate>
          <div class="form-group">
            <label class="form-label" for="loginEmail">Correo electrónico</label>
            <input type="email" id="loginEmail" class="form-input" placeholder="admin@clinica.co"
                   autocomplete="email" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="loginPassword">Contraseña</label>
            <input type="password" id="loginPassword" class="form-input" placeholder="••••••••"
                   autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn">
            Iniciar sesión
          </button>
        </form>

        <p style="text-align:center;margin-top:1.5rem;font-size:0.8rem;color:var(--color-text-muted)">
          Acceso exclusivo para administradores autorizados.
        </p>
      </div>
    </div>
    <div class="toast-container" id="toastContainer"></div>
  `

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn     = document.getElementById('loginBtn')
    const errEl   = document.getElementById('loginError')
    const email   = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value

    if (!email || !password) {
      errEl.textContent = 'Por favor complete todos los campos.'
      errEl.classList.add('is-visible')
      return
    }

    btn.disabled = true
    btn.textContent = 'Iniciando sesión...'
    errEl.classList.remove('is-visible')

    try {
      await signIn(email, password)
      // onAuthChange lo detectará y renderizará el dashboard
    } catch (err) {
      errEl.textContent = 'Credenciales incorrectas. Por favor intente de nuevo.'
      errEl.classList.add('is-visible')
      btn.disabled = false
      btn.textContent = 'Iniciar sesión'
    }
  })
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================
function renderDashboardShell(userEmail) {
  const initials = userEmail?.charAt(0).toUpperCase() || 'A'

  document.getElementById('app').innerHTML = `
    <!-- Sidebar toggle (mobile) -->
    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Abrir menú">☰</button>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- Toast -->
    <div class="toast-container" id="toastContainer" aria-live="assertive"></div>

    <!-- Layout -->
    <div class="admin-layout">

      <!-- SIDEBAR -->
      <aside class="sidebar" id="sidebar" role="navigation" aria-label="Navegación principal">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon" aria-hidden="true">🏥</div>
          <div class="sidebar-brand-text">
            <h2>Clínica Día</h2>
            <p>Panel de Investigación</p>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Análisis</div>

          <button class="nav-item is-active" data-view="home" aria-current="page">
            <span class="nav-icon" aria-hidden="true">🏠</span>
            Inicio
          </button>
          <button class="nav-item" data-view="results">
            <span class="nav-icon" aria-hidden="true">📊</span>
            Resultados
          </button>
          <button class="nav-item" data-view="participants">
            <span class="nav-icon" aria-hidden="true">👥</span>
            Participantes
          </button>
          <button class="nav-item" data-view="analysis">
            <span class="nav-icon" aria-hidden="true">🔬</span>
            Análisis
          </button>

          <div class="nav-separator"></div>
          <div class="sidebar-section-label">Gestión</div>

          <button class="nav-item" data-view="export">
            <span class="nav-icon" aria-hidden="true">📤</span>
            Exportar
          </button>
          <button class="nav-item" data-view="settings">
            <span class="nav-icon" aria-hidden="true">⚙️</span>
            Configuración
          </button>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="user-avatar" aria-hidden="true">${initials}</div>
            <div>
              <div class="user-info-name">${userEmail || 'Administrador'}</div>
              <div class="user-info-role">Administrador</div>
            </div>
          </div>
          <button class="nav-item" id="btnSignOut">
            <span class="nav-icon" aria-hidden="true">🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="admin-main">
        <header class="admin-topbar" role="banner">
          <h1 class="topbar-title" id="topbarTitle">Inicio</h1>
          <div class="topbar-actions">
            <div class="realtime-indicator" title="Actualización en tiempo real activa">
              <div class="realtime-dot"></div>
              <span>En vivo</span>
            </div>
            <button class="btn btn-secondary btn-sm" id="btnRefresh" aria-label="Actualizar datos">
              🔄 Actualizar
            </button>
          </div>
        </header>

        <main class="admin-content" id="adminContent" role="main" aria-live="polite">
          <div class="empty-state">
            <div class="spinner" style="margin:0 auto 1rem"></div>
            <p>Cargando datos...</p>
          </div>
        </main>
      </div>

    </div><!-- /.admin-layout -->
  `

  // Sidebar toggle (mobile)
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.toggle('is-open')
    overlay.classList.toggle('is-visible')
  })
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('is-open')
    overlay.classList.remove('is-visible')
  })

  // Navegación
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view
      navigateTo(view)
      sidebar.classList.remove('is-open')
      overlay.classList.remove('is-visible')
    })
  })

  // Cerrar sesión
  document.getElementById('btnSignOut').addEventListener('click', async () => {
    await signOut()
  })

  // Actualizar
  document.getElementById('btnRefresh').addEventListener('click', () => {
    loadAllData().then(() => renderCurrentView())
  })

  // Realtime
  state.realtimeSub = subscribeToResponses((newResponse) => {
    showToast('info', 'Nueva respuesta', 'Se ha registrado una nueva respuesta.')
    loadAllData().then(() => renderCurrentView())
  })
}

// ============================================================
// NAVEGACIÓN
// ============================================================
const VIEW_TITLES = {
  home:         'Inicio',
  results:      'Resultados',
  participants: 'Participantes',
  analysis:     'Análisis',
  export:       'Exportar',
  settings:     'Configuración',
}

function navigateTo(view) {
  state.currentView = view

  // Actualizar nav activo
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === view)
    btn.setAttribute('aria-current', btn.dataset.view === view ? 'page' : 'false')
  })

  // Actualizar título
  const title = document.getElementById('topbarTitle')
  if (title) title.textContent = VIEW_TITLES[view] || view

  renderCurrentView()
}

function renderCurrentView() {
  const views = {
    home:         renderHome,
    results:      renderResults,
    participants: renderParticipants,
    analysis:     renderAnalysis,
    export:       renderExport,
    settings:     renderSettings,
  }
  try {
    views[state.currentView]?.()
  } catch (err) {
    console.error(`[Dashboard] Error renderizando vista ${state.currentView}:`, err)
    const content = document.getElementById('adminContent')
    if (content) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h2 class="empty-title">Error al cargar esta sección</h2>
          <p class="empty-text">${err.message || 'Ocurrió un error inesperado al procesar los datos.'}</p>
          <button class="btn btn-secondary btn-sm" id="btnRetryView" style="margin-top:1rem">🔄 Reintentar</button>
        </div>
      `
      document.getElementById('btnRetryView')?.addEventListener('click', () => {
        loadAllData().then(() => renderCurrentView())
      })
    }
  }
}

// ============================================================
// CARGA DE DATOS
// ============================================================
async function loadAllData() {
  try {
    const [statsRes, responsesRes, answersRes, questionsRes, auditRes, configRes] = await Promise.all([
      supabase.from('dashboard_stats').select('*').single(),
      supabase.from('responses').select(`
        id, response_code, status, started_at, completed_at,
        consents ( version, accepted ),
        signatures ( storage_path )
      `).order('created_at', { ascending: false }).limit(500),
      supabase.from('answers').select('response_id, question_code, value, value_numeric'),
      supabase.from('questions').select('*').eq('active', true).order('section_code').order('"order"'),
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('app_config').select('key, value'),
    ])

    if (statsRes.data)     state.dashStats  = statsRes.data
    if (responsesRes.data) state.responses  = responsesRes.data
    if (answersRes.data)   state.answers    = answersRes.data
    if (questionsRes.data) state.questions  = questionsRes.data
    if (auditRes.data)     state.auditLog   = auditRes.data
    if (configRes.data)    state.config     = configRes.data.reduce((a, r) => { a[r.key] = r.value; return a }, {})
  } catch (err) {
    console.error('[Dashboard] Error cargando datos:', err)
    showToast('error', 'Error al cargar datos', err.message)
  }
}

// ============================================================
// VISTA: HOME
// ============================================================
function renderHome() {
  const s = state.dashStats || {}
  const content = document.getElementById('adminContent')

  const completedResponses = state.responses.filter(r => r.status === 'completed')

  // Timeline — últimos 14 días
  const today     = new Date()
  const timeLabels = []
  const timeData   = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    timeLabels.push(dateStr)
    const count = completedResponses.filter(r => {
      if (!r.completed_at) return false
      const rd = new Date(r.completed_at)
      return rd.getFullYear() === d.getFullYear() &&
             rd.getMonth()    === d.getMonth()    &&
             rd.getDate()     === d.getDate()
    }).length
    timeData.push(count)
  }

  content.innerHTML = `
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-primary">📋</div>
        <div class="stat-value">${s.total_started ?? 0}</div>
        <div class="stat-label">Formularios iniciados</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-success">✅</div>
        <div class="stat-value">${s.total_completed ?? 0}</div>
        <div class="stat-label">Formularios completados</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-warning">📈</div>
        <div class="stat-value">${formatNumber(s.completion_rate ?? 0)}%</div>
        <div class="stat-label">Tasa de finalización</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-blue">🕐</div>
        <div class="stat-value">${s.today_completed ?? 0}</div>
        <div class="stat-label">Hoy</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-primary">📅</div>
        <div class="stat-value">${s.week_completed ?? 0}</div>
        <div class="stat-label">Últimos 7 días</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-blue">📆</div>
        <div class="stat-value">${s.month_completed ?? 0}</div>
        <div class="stat-label">Último mes</div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="chart-card" style="margin-bottom:1.5rem">
      <div class="chart-card-title">
        Respuestas completadas — Últimos 14 días
        <span class="chart-section-label">Tendencia</span>
      </div>
      <div class="chart-wrapper">
        <canvas id="chartTimeline"></canvas>
      </div>
    </div>

    <!-- Audit Log -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📋 Actividad reciente</h3>
      </div>
      ${state.auditLog.length === 0
        ? '<p class="text-muted">Sin actividad registrada.</p>'
        : state.auditLog.slice(0, 10).map(ev => `
          <div class="audit-item">
            <div class="audit-icon">⚡</div>
            <div>
              <div class="audit-action">${translateAction(ev.action)}</div>
              <div class="audit-time">${formatDateTime(ev.created_at)}</div>
            </div>
          </div>
        `).join('')}
    </div>
  `

  setTimeout(() => renderTimelineChart('chartTimeline', timeLabels, timeData), 100)
}

function translateAction(action) {
  const map = {
    login:                   'Inicio de sesión',
    logout:                  'Cierre de sesión',
    export:                  'Exportación de datos',
    config_change:           'Cambio de configuración',
    question_update:         'Actualización de pregunta',
    consent_version_change:  'Cambio de versión del consentimiento',
  }
  return map[action] || action
}

// ============================================================
// VISTA: RESULTS
// ============================================================
function renderResults() {
  const content = document.getElementById('adminContent')

  if (state.responses.filter(r => r.status === 'completed').length === 0) {
    content.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📊</div>
      <h2 class="empty-title">Sin resultados aún</h2>
      <p class="empty-text">Los gráficos aparecerán cuando haya respuestas completadas.</p>
    </div>`
    return
  }

  const answers   = state.answers
  const questions = state.questions

  // Datos por categoría para gráficos
  const ageData       = getAnswerDistribution('g_age', questions)
  const diagData      = getAnswerDistribution('g_diagnosis', questions)
  const eduData       = getAnswerDistribution('g_education', questions)
  const stratumData   = getAnswerDistribution('g_stratum', questions)
  const livewithData  = getAnswerDistribution('g_livewith', questions)
  const worksData     = getAnswerDistribution('g_works', questions)
  const studiesData   = getAnswerDistribution('g_studies', questions)
  const importanceData = getAnswerDistribution('g_occupation_importance', questions)

  // Promedios Likert por sección
  const motorCodes   = ['o_motor_hands', 'o_motor_endurance', 'o_motor_tools']
  const cogCodes     = ['o_cog_concentration', 'o_cog_memory', 'o_cog_planning', 'o_cog_problem', 'o_cog_adapt']
  const workCodes    = ['w_schedule', 'w_finish', 'w_instructions', 'w_organize', 'w_ask_help', 'w_rules', 'w_responsibility', 'w_persist']
  const socialCodes  = ['s_listen', 's_turn', 's_express', 's_support', 's_teamwork', 's_conflict']
  const barrierCodes = ['b_family', 'b_transport', 'b_health', 'b_stigma', 'b_network']
  const interestCodes = ['i_cooking', 'i_cleaning', 'i_customer', 'i_sales', 'i_garden', 'i_admin', 'i_warehouse', 'i_pets', 'i_crafts', 'i_tech', 'i_entrepreneur']

  content.innerHTML = `
    <!-- SECCIÓN 1: Datos Generales -->
    <div style="margin-bottom:2rem">
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary);margin-bottom:1rem">
        📋 Sección 1 — Datos Generales
      </h2>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-title">Distribución de edad <span class="chart-section-label">n=${ageData.total}</span></div>
          <div class="chart-wrapper"><canvas id="chartAge"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Diagnóstico <span class="chart-section-label">n=${diagData.total}</span></div>
          <div class="chart-wrapper"><canvas id="chartDiagnosis"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Nivel educativo <span class="chart-section-label">n=${eduData.total}</span></div>
          <div class="chart-wrapper"><canvas id="chartEducation"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Estrato socioeconómico <span class="chart-section-label">n=${stratumData.total}</span></div>
          <div class="chart-wrapper"><canvas id="chartStratum"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Con quién vive <span class="chart-section-label">n=${livewithData.total}</span></div>
          <div class="chart-wrapper"><canvas id="chartLiveWith"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Situación laboral y educativa</div>
          <div class="chart-wrapper"><canvas id="chartWorkStudy"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Importancia de tener ocupación <span class="chart-section-label">Escala 1-5</span></div>
          <div class="chart-wrapper"><canvas id="chartImportance"></canvas></div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 2: Desempeño Ocupacional -->
    <div style="margin-bottom:2rem">
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary);margin-bottom:1rem">
        ⚙️ Sección 2 — Desempeño Ocupacional
      </h2>
      <p style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:1rem">
        ℹ️ Los promedios son estadísticos descriptivos. No constituyen puntuaciones oficiales del AMPS.
      </p>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-title">Dominio Motor — Promedios <span class="chart-section-label">Escala 1-5</span></div>
          <div class="chart-wrapper"><canvas id="chartMotor"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Dominio Cognitivo/Procesamiento — Promedios</div>
          <div class="chart-wrapper chart-tall"><canvas id="chartCognitive"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Perfil de dominios <span class="chart-section-label">Radar</span></div>
          <div class="chart-wrapper"><canvas id="chartRadarOccupational"></canvas></div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 3: Habilidades Laborales -->
    <div style="margin-bottom:2rem">
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary);margin-bottom:1rem">
        💼 Sección 3 — Habilidades Laborales Básicas
      </h2>
      <div class="charts-grid">
        <div class="chart-card" style="grid-column: span 2">
          <div class="chart-card-title">Habilidades laborales — Promedios por ítem</div>
          <div class="chart-wrapper chart-tall"><canvas id="chartWorkSkills"></canvas></div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 4: Interacción Social -->
    <div style="margin-bottom:2rem">
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary);margin-bottom:1rem">
        🤝 Sección 4 — Habilidades de Interacción Social
      </h2>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-title">Interacción social — Promedios</div>
          <div class="chart-wrapper chart-tall"><canvas id="chartSocial"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">Perfil social <span class="chart-section-label">Radar</span></div>
          <div class="chart-wrapper"><canvas id="chartRadarSocial"></canvas></div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 5: Barreras y Apoyos -->
    <div style="margin-bottom:2rem">
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary);margin-bottom:1rem">
        🚧 Sección 5 — Barreras y Apoyos
      </h2>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-title">Barreras y apoyos — Promedios</div>
          <div class="chart-wrapper chart-tall"><canvas id="chartBarriers"></canvas></div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN 6: Intereses -->
    <div style="margin-bottom:2rem">
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--color-primary);margin-bottom:1rem">
        ⭐ Sección 6 — Intereses Ocupacionales y Laborales
      </h2>
      <div class="charts-grid">
        <div class="chart-card" style="grid-column: span 2">
          <div class="chart-card-title">Intereses laborales — Promedios por actividad</div>
          <div class="chart-wrapper chart-tall" style="height:360px"><canvas id="chartInterests"></canvas></div>
        </div>
      </div>
    </div>
  `

  setTimeout(() => {
    // Sect 1 — Datos Generales
    renderDonutChart('chartAge', ageData.labels, ageData.counts)
    renderDonutChart('chartDiagnosis', diagData.labels, diagData.counts)
    renderBarChart('chartEducation', eduData.labels, eduData.counts, 'Participantes')
    renderBarChart('chartStratum', stratumData.labels, stratumData.counts, 'Participantes')
    renderDonutChart('chartLiveWith', livewithData.labels, livewithData.counts)
    renderBarChart('chartWorkStudy',
      ['Trabaja (Sí)', 'Trabaja (No)', 'Estudia (Sí)', 'Estudia (No)'],
      [
        worksData.counts[worksData.labels.indexOf('Sí')] || 0,
        worksData.counts[worksData.labels.indexOf('No')] || 0,
        studiesData.counts[studiesData.labels.indexOf('Sí')] || 0,
        studiesData.counts[studiesData.labels.indexOf('No')] || 0,
      ],
      'Participantes'
    )
    renderBarChart('chartImportance', importanceData.labels, importanceData.counts, 'Participantes')

    // Sect 2 — Desempeño
    const motorMeans = motorCodes.map(code => {
      const vals = answers.filter(a => a.question_code === code).map(a => Number(a.value_numeric)).filter(v => !isNaN(v))
      return mean(vals) || 0
    })
    const motorLabels = ['Uso de manos', 'Resistencia', 'Uso de herramientas']
    renderBarChart('chartMotor', motorLabels, motorMeans, 'Promedio')

    const cogMeans  = cogCodes.map(code => {
      const vals = answers.filter(a => a.question_code === code).map(a => Number(a.value_numeric)).filter(v => !isNaN(v))
      return mean(vals) || 0
    })
    const cogLabels = ['Concentración', 'Memoria instrucciones', 'Planificación', 'Solución problemas', 'Adaptación']
    renderBarChart('chartCognitive', cogLabels, cogMeans, 'Promedio')

    renderRadarChart('chartRadarOccupational',
      [...motorLabels, ...cogLabels],
      [{ label: 'Promedio', data: [...motorMeans, ...cogMeans] }]
    )

    // Sect 3 — Habilidades Laborales
    const workMeans  = workCodes.map(code => { const v = answers.filter(a => a.question_code === code).map(a => Number(a.value_numeric)).filter(v => !isNaN(v)); return mean(v) || 0 })
    const workLabels = ['Horarios', 'Terminar tareas', 'Seguir instrucciones', 'Organizar materiales', 'Pedir ayuda', 'Cumplir normas', 'Responsabilidad', 'Perseverancia']
    renderBarChart('chartWorkSkills', workLabels, workMeans, 'Promedio')

    // Sect 4 — Social
    const socialMeans  = socialCodes.map(code => { const v = answers.filter(a => a.question_code === code).map(a => Number(a.value_numeric)).filter(v => !isNaN(v)); return mean(v) || 0 })
    const socialLabels = ['Escuchar', 'Esperar turno', 'Expresar opiniones', 'Solicitar apoyo', 'Trabajo en equipo', 'Manejo conflictos']
    renderBarChart('chartSocial', socialLabels, socialMeans, 'Promedio')
    renderRadarChart('chartRadarSocial', socialLabels, [{ label: 'Promedio social', data: socialMeans }])

    // Sect 5 — Barreras
    const barrierMeans  = barrierCodes.map(code => { const v = answers.filter(a => a.question_code === code).map(a => Number(a.value_numeric)).filter(v => !isNaN(v)); return mean(v) || 0 })
    const barrierLabels = ['Apoyo familiar', 'Transporte', 'Estado de salud', 'Estigma (inverso)', 'Red de apoyo']
    renderBarChart('chartBarriers', barrierLabels, barrierMeans, 'Promedio')

    // Sect 6 — Intereses
    const interestMeans  = interestCodes.map(code => { const v = answers.filter(a => a.question_code === code).map(a => Number(a.value_numeric)).filter(v => !isNaN(v)); return mean(v) || 0 })
    const interestLabels = ['Cocina', 'Aseo', 'Atención cliente', 'Ventas', 'Jardinería', 'Administrativo', 'Bodega/Mensajería', 'Mascotas', 'Manualidades', 'Tecnología', 'Emprendimiento']
    renderBarChart('chartInterests', interestLabels, interestMeans, 'Promedio')
  }, 100)
}

function getAnswerDistribution(questionCode, questions) {
  const q = questions.find(q => q.question_code === questionCode)
  const vals = state.answers.filter(a => a.question_code === questionCode).map(a => a.value)
  const freq = frequencyTable(vals)

  let opts = q?.options
  if (typeof opts === 'string') {
    try { opts = JSON.parse(opts) } catch (_) { opts = null }
  }

  if (Array.isArray(opts)) {
    const labels = opts.map(o => o.label)
    const counts = opts.map(o => (freq[String(o.value)]?.count || 0))
    return { labels, counts, total: vals.length }
  }

  const labels = Object.keys(freq)
  const counts = labels.map(l => freq[l].count)
  return { labels, counts, total: vals.length }
}

// ============================================================
// VISTA: PARTICIPANTS
// ============================================================
function renderParticipants() {
  const content = document.getElementById('adminContent')

  content.innerHTML = `
    <div class="filters-bar">
      <select class="filter-select" id="filterStatus">
        <option value="">Todos los estados</option>
        <option value="completed">Completados</option>
        <option value="in_progress">En progreso</option>
        <option value="started">Iniciados</option>
      </select>
      <input type="text" class="filter-input" id="filterCode" placeholder="Buscar por código...">
      <span style="font-size:0.85rem;color:var(--color-text-muted)">
        ${state.responses.length} registros
      </span>
    </div>

    <div class="data-table-wrapper">
      <table class="data-table" role="grid">
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Estado</th>
            <th scope="col">Iniciado</th>
            <th scope="col">Completado</th>
            <th scope="col">Consentimiento</th>
            <th scope="col">Respuestas</th>
            <th scope="col" style="text-align:center">Acciones</th>
          </tr>
        </thead>
        <tbody id="participantsTableBody">
          ${renderParticipantRows(state.responses)}
        </tbody>
      </table>
    </div>
  `

  attachDeleteRowListeners()

  // Filtros
  const filterFn = () => {
    const statusFilter = document.getElementById('filterStatus').value
    const codeFilter   = document.getElementById('filterCode').value.toLowerCase()
    const filtered = state.responses.filter(r => {
      const statusOk = !statusFilter || r.status === statusFilter
      const codeOk   = !codeFilter   || (r.response_code || '').toLowerCase().includes(codeFilter)
      return statusOk && codeOk
    })
    document.getElementById('participantsTableBody').innerHTML = renderParticipantRows(filtered)
    attachDeleteRowListeners()
  }

  document.getElementById('filterStatus').addEventListener('change', filterFn)
  document.getElementById('filterCode').addEventListener('input',  filterFn)
}

function attachDeleteRowListeners() {
  document.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const id   = btn.dataset.id
      const code = btn.dataset.code || 'sin código'
      if (!confirm(`¿Desea eliminar la respuesta "${code}"?\nEsta acción borrará todas sus respuestas y datos asociados de forma permanente.`)) {
        return
      }

      btn.disabled = true
      btn.textContent = '⏳'
      try {
        const { error } = await supabase.from('responses').delete().eq('id', id)
        if (error) throw error

        await logAction('delete_response', { id, code })
        showToast('success', 'Registro eliminado', `Se eliminó la respuesta ${code}.`)
        await loadAllData()
        renderCurrentView()
      } catch (err) {
        showToast('error', 'Error al eliminar', err.message)
        btn.disabled = false
        btn.textContent = '🗑️'
      }
    })
  })
}

function renderParticipantRows(rows) {
  if (rows.length === 0) return `<tr><td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:2rem">Sin registros</td></tr>`

  return rows.map(r => {
    const consent = Array.isArray(r.consents) ? r.consents[0] : (r.consents || null)
    const statusBadge = {
      completed:   '<span class="badge badge-success">Completado</span>',
      in_progress: '<span class="badge badge-warning">En progreso</span>',
      started:     '<span class="badge badge-primary">Iniciado</span>',
      abandoned:   '<span class="badge badge-error">Abandonado</span>',
    }[r.status] || r.status

    const answersCount = state.answers?.filter(a => a.response_id === r.id).length || 0

    return `<tr>
      <td><code style="font-size:0.85rem;font-weight:700;color:var(--color-primary)">${r.response_code || '—'}</code></td>
      <td>${statusBadge}</td>
      <td>${formatDateTime(r.started_at)}</td>
      <td>${formatDateTime(r.completed_at)}</td>
      <td>${consent?.accepted ? '<span style="color:var(--color-success)">✅ Aceptado</span>' : '<span style="color:var(--color-text-muted)">—</span>'}</td>
      <td style="text-align:center">${answersCount > 0 ? answersCount : (r.answer_count ?? '—')}</td>
      <td style="text-align:center">
        <button class="btn btn-secondary btn-sm btn-delete-row"
                data-id="${r.id}"
                data-code="${r.response_code || 'sin código'}"
                title="Eliminar respuesta"
                style="padding:0.25rem 0.5rem;font-size:0.85rem;color:var(--color-error);border-color:rgba(239,68,68,0.3)">
          🗑️
        </button>
      </td>
    </tr>`
  }).join('')
}

// ============================================================
// VISTA: ANALYSIS
// ============================================================
function renderAnalysis() {
  const content  = document.getElementById('adminContent')
  const stats    = computeAllStats(state.answers, state.questions)
  const sections = {
    general:     { label: '📋 Datos Generales', type: 'categorical' },
    occupational:{ label: '⚙️ Desempeño Ocupacional', type: 'likert' },
    work_skills: { label: '💼 Habilidades Laborales', type: 'likert' },
    social:      { label: '🤝 Interacción Social', type: 'likert' },
    barriers:    { label: '🚧 Barreras y Apoyos', type: 'likert' },
    interests:   { label: '⭐ Intereses', type: 'likert' },
  }

  let html = `
    <div style="margin-bottom:1.5rem;padding:1rem 1.25rem;background:var(--color-soft-light);border-radius:var(--radius-md);border-left:4px solid var(--color-secondary);font-size:0.875rem;color:var(--color-text-secondary)">
      ℹ️ Las estadísticas presentadas son <strong>descriptivas</strong>. No se realizan interpretaciones clínicas ni se asignan categorías diagnósticas a las puntuaciones.
    </div>
  `

  for (const [sectionCode, info] of Object.entries(sections)) {
    const sectionStats = stats[sectionCode] || {}
    if (Object.keys(sectionStats).length === 0) continue

    html += `<div class="stats-section"><h3 class="stats-section-title">${info.label}</h3>`

    for (const [qCode, qStats] of Object.entries(sectionStats)) {
      html += `<div style="margin-bottom:1.5rem"><p style="font-size:0.875rem;font-weight:600;color:var(--color-text);margin-bottom:0.5rem">${qStats.question_text}</p><p style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:0.75rem">n = ${qStats.n}</p>`

      if (qStats.type === 'likert') {
        // Mostrar media y mediana
        if (qStats.mean !== null) html += `<div class="stat-row"><span class="stat-row-label">Promedio</span><span class="stat-row-value">${formatNumber(qStats.mean)} / 5</span></div>`
        if (qStats.median !== null) html += `<div class="stat-row"><span class="stat-row-label">Mediana</span><span class="stat-row-value">${qStats.median}</span></div>`
        // Distribución de frecuencias
        const totalN = qStats.n
        for (const [val, fq] of Object.entries(qStats.freq || {})) {
          const pct = totalN > 0 ? Math.round((fq.count / totalN) * 1000) / 10 : 0
          html += `<div class="stat-row">
            <span class="stat-row-label" style="min-width:120px">${val}</span>
            <div class="freq-bar-container">
              <div class="freq-bar-track"><div class="freq-bar-fill" style="width:${pct}%"></div></div>
              <span class="stat-row-value" style="min-width:60px">${fq.count} (${formatNumber(pct)}%)</span>
            </div>
          </div>`
        }
      } else {
        // Categórico
        const freq = qStats.freq || {}
        for (const [label, fq] of Object.entries(freq)) {
          const pct = qStats.n > 0 ? Math.round((fq.count / qStats.n) * 1000) / 10 : 0
          html += `<div class="stat-row">
            <span class="stat-row-label" style="min-width:180px">${label}</span>
            <div class="freq-bar-container">
              <div class="freq-bar-track"><div class="freq-bar-fill" style="width:${pct}%"></div></div>
              <span class="stat-row-value" style="min-width:70px">${fq.count} (${formatNumber(pct)}%)</span>
            </div>
          </div>`
        }
      }
      html += `</div>`
    }
    html += `</div>`
  }

  content.innerHTML = html || `<div class="empty-state"><div class="empty-icon">🔬</div><h2 class="empty-title">Sin datos suficientes</h2></div>`
}

// ============================================================
// VISTA: EXPORT
// ============================================================
function renderExport() {
  const content = document.getElementById('adminContent')
  const n = state.responses.filter(r => r.status === 'completed').length

  content.innerHTML = `
    <div class="export-warning">
      <span>⚠️</span>
      <div>
        <strong>Advertencia de privacidad</strong><br>
        Los datos exportados pueden contener información sobre participantes. Asegúrese de manejar estos archivos de manera segura y conforme a la Resolución 8430 de 1993 y las políticas de confidencialidad del programa.
      </div>
    </div>

    <div style="display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      <div class="config-group">
        <h3 class="config-group-title">📋 Respuestas completas</h3>
        <p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">
          Exporta todas las ${n} respuestas completadas con sus respuestas individuales por pregunta.
        </p>
        <button class="btn btn-primary" id="btnExportResponses">
          ⬇️ Descargar respuestas (CSV)
        </button>
      </div>

      <div class="config-group">
        <h3 class="config-group-title">📊 Estadísticas agregadas</h3>
        <p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">
          Exporta los indicadores y estadísticas descriptivas agrupadas por sección.
        </p>
        <button class="btn btn-secondary" id="btnExportStats">
          ⬇️ Descargar estadísticas (CSV)
        </button>
      </div>
    </div>
  `

  document.getElementById('btnExportResponses').addEventListener('click', async () => {
    const btn = document.getElementById('btnExportResponses')
    btn.disabled = true
    btn.textContent = 'Generando...'
    try {
      const csv = await exportResponsesCSV()
      downloadCSV(csv, exportFilename('respuestas_TO'))
      showToast('success', 'Exportación exitosa', `${n} respuestas exportadas.`)
    } catch (err) {
      showToast('error', 'Error al exportar', err.message)
    } finally {
      btn.disabled = false
      btn.textContent = '⬇️ Descargar respuestas (CSV)'
    }
  })

  document.getElementById('btnExportStats').addEventListener('click', async () => {
    const btn = document.getElementById('btnExportStats')
    btn.disabled = true
    btn.textContent = 'Generando...'
    try {
      const allStats = computeAllStats(state.answers, state.questions)
      const flat = {}
      for (const [sec, qs] of Object.entries(allStats)) {
        for (const [code, s] of Object.entries(qs)) {
          if (s.mean !== undefined) flat[`${sec}__${code}__mean`] = s.mean ?? ''
          if (s.median !== undefined) flat[`${sec}__${code}__median`] = s.median ?? ''
          flat[`${sec}__${code}__n`] = s.n ?? ''
        }
      }
      const csv = await exportIndicatorsCSV(flat)
      downloadCSV(csv, exportFilename('estadisticas_TO'))
      showToast('success', 'Exportación exitosa', 'Estadísticas exportadas.')
    } catch (err) {
      showToast('error', 'Error al exportar', err.message)
    } finally {
      btn.disabled = false
      btn.textContent = '⬇️ Descargar estadísticas (CSV)'
    }
  })
}

// ============================================================
// VISTA: SETTINGS
// ============================================================
function renderSettings() {
  const content = document.getElementById('adminContent')
  const cfg     = state.config

  content.innerHTML = `
    <div style="display:grid;gap:1.5rem;max-width:700px">

      <div class="config-group">
        <h3 class="config-group-title">📋 Consentimiento informado</h3>
        <div class="form-group">
          <label class="form-label" for="consentVersionInput">Versión del consentimiento</label>
          <div style="display:flex;gap:0.75rem;align-items:center">
            <input type="text" id="consentVersionInput" class="form-input" value="${cfg.consent_version || '1.0'}" style="max-width:200px">
            <button class="btn btn-primary btn-sm" id="btnSaveConsentVersion">Guardar</button>
          </div>
          <span class="form-hint">Cambiar la versión registra el nuevo número en las aceptaciones futuras. Los registros históricos no se modifican.</span>
        </div>
      </div>

      <div class="config-group">
        <h3 class="config-group-title">📝 Estado del formulario</h3>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem">
          <div>
            <p style="font-weight:600;font-size:0.9rem">Formulario público activo</p>
            <p style="font-size:0.8rem;color:var(--color-text-muted)">Cuando está inactivo, los participantes verán un mensaje de "no disponible".</p>
          </div>
          <label class="toggle" for="formActiveToggle">
            <input type="checkbox" id="formActiveToggle" ${cfg.form_active !== 'false' ? 'checked' : ''}>
            <span class="toggle-track"></span>
          </label>
        </div>
        <button class="btn btn-primary btn-sm" id="btnSaveFormActive" style="margin-top:1rem">Guardar estado</button>
      </div>

      <div class="config-group">
        <h3 class="config-group-title">🔑 Gestión de administradores</h3>
        <p style="font-size:0.875rem;color:var(--color-text-secondary);margin-bottom:1rem">
          Para agregar o eliminar administradores, acceda al panel de Supabase Authentication y asigne el rol correspondiente en la tabla <code>user_roles</code>.
        </p>
        <div style="background:var(--color-soft-light);border-radius:var(--radius-md);padding:1rem;font-size:0.8rem;color:var(--color-text-muted)">
          ℹ️ El registro de nuevos administradores debe hacerse de forma controlada desde el panel de Supabase > Authentication > Users, y luego insertar el rol en la tabla <code>user_roles</code>.
        </div>
      </div>

      <div class="config-group" style="border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.03)">
        <h3 class="config-group-title" style="color:var(--color-error)">⚠️ Zona de peligro — Datos de prueba</h3>
        <p style="font-size:0.875rem;color:var(--color-text-secondary);margin-bottom:1rem">
          Si ha realizado pruebas de llenado del formulario y necesita vaciar todas las respuestas recolectadas para comenzar una recolección limpia, puede reiniciar los datos aquí.
        </p>
        <button class="btn btn-secondary btn-sm" id="btnResetAllResponses" style="color:var(--color-error);border-color:var(--color-error)">
          🗑️ Reiniciar / Vaciar todas las respuestas
        </button>
      </div>

      <div class="config-group">
        <h3 class="config-group-title">📋 Auditoría</h3>
        <div id="auditLogSettings">
          ${state.auditLog.slice(0, 5).map(ev => `
            <div class="audit-item">
              <div class="audit-icon">⚡</div>
              <div>
                <div class="audit-action">${translateAction(ev.action)}</div>
                <div class="audit-time">${formatDateTime(ev.created_at)}</div>
              </div>
            </div>
          `).join('') || '<p style="font-size:0.875rem;color:var(--color-text-muted)">Sin actividad registrada.</p>'}
        </div>
      </div>
    </div>
  `

  // Guardar versión consentimiento
  document.getElementById('btnSaveConsentVersion').addEventListener('click', async () => {
    const newVersion = document.getElementById('consentVersionInput').value.trim()
    if (!newVersion) { showToast('error', 'Versión inválida', 'Ingrese una versión válida.'); return }
    try {
      await supabase.from('app_config').update({ value: newVersion, updated_at: new Date().toISOString() }).eq('key', 'consent_version')
      await logAction('consent_version_change', { new_version: newVersion })
      state.config.consent_version = newVersion
      showToast('success', 'Versión actualizada', `Versión del consentimiento cambiada a ${newVersion}.`)
    } catch (err) { showToast('error', 'Error', err.message) }
  })

  // Guardar estado formulario
  document.getElementById('btnSaveFormActive').addEventListener('click', async () => {
    const active = document.getElementById('formActiveToggle').checked ? 'true' : 'false'
    try {
      await supabase.from('app_config').update({ value: active, updated_at: new Date().toISOString() }).eq('key', 'form_active')
      await logAction('config_change', { key: 'form_active', value: active })
      state.config.form_active = active
      showToast('success', 'Estado guardado', `Formulario ${active === 'true' ? 'activado' : 'desactivado'}.`)
    } catch (err) { showToast('error', 'Error', err.message) }
  })

  // Reiniciar respuestas de prueba
  document.getElementById('btnResetAllResponses')?.addEventListener('click', async () => {
    const confirmText = prompt(
      '⚠️ ADVERTENCIA: Esta acción eliminará permanentemente TODAS las respuestas, consentimientos y firmas registradas.\n\nPara confirmar, escriba BORRAR en el campo:'
    )
    if (confirmText !== 'BORRAR') {
      if (confirmText !== null) showToast('warning', 'Cancelado', 'La confirmación no fue válida.')
      return
    }

    const btn = document.getElementById('btnResetAllResponses')
    btn.disabled = true
    btn.textContent = 'Borrando respuestas...'

    try {
      const { error: rErr } = await supabase
        .from('responses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (rErr) throw rErr

      try {
        await supabase
          .from('participants')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
      } catch (_) {}

      await logAction('reset_all_responses')
      showToast('success', 'Respuestas reiniciadas', 'Se han borrado todas las respuestas de prueba.')
      await loadAllData()
      renderCurrentView()
    } catch (err) {
      showToast('error', 'Error al reiniciar', err.message)
      btn.disabled = false
      btn.textContent = '🗑️ Reiniciar / Vaciar todas las respuestas'
    }
  })
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
let isInitializing = false
let isInitialized  = false

async function init() {
  if (isInitializing || isInitialized) return
  isInitializing = true

  try {
    // Verificar sesión existente
    const session = await getSession()

    if (!session) {
      renderLogin()
      isInitializing = false
      return
    }

    // Verificar rol de admin
    const admin = await isAdmin()
    if (!admin) {
      document.getElementById('app').innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;padding:2rem;text-align:center">
          <div style="font-size:3rem">🔒</div>
          <h2 style="color:var(--color-error)">Acceso no autorizado</h2>
          <p style="color:var(--color-text-muted)">Su cuenta no tiene permisos de administrador.</p>
          <button class="btn btn-primary" id="btnUnauthSignOut">Cerrar sesión</button>
        </div>
      `
      document.getElementById('btnUnauthSignOut')?.addEventListener('click', async () => {
        await signOut()
        window.location.reload()
      })
      isInitializing = false
      return
    }

    // Registrar login
    await logAction('login')

    // Renderizar shell
    renderDashboardShell(session.user.email)

    // Cargar datos y renderizar vista inicial
    await loadAllData()
    renderCurrentView()
    isInitialized = true
  } catch (err) {
    console.error('[Dashboard] Error al inicializar panel:', err)
    document.getElementById('app').innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;padding:2rem;text-align:center">
        <div style="font-size:3rem">⚠️</div>
        <h2 style="color:var(--color-error)">Error al cargar el panel</h2>
        <p style="color:var(--color-text-muted);max-width:500px">${err.message || 'No se pudieron cargar los datos del sistema.'}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Reintentar</button>
      </div>
    `
  } finally {
    isInitializing = false
  }
}

// Auth state change listener
onAuthChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    if (!isInitialized) {
      await init()
    }
  } else if (event === 'SIGNED_OUT') {
    isInitialized = false
    unsubscribeFromResponses()
    renderLogin()
  }
})

// Ejecutar de inmediato si el DOM ya está listo (evita pantalla en blanco cuando DOMContentLoaded ya disparó)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
