// ============================================================
// src/dashboard/charts.js
// Helpers de Chart.js para el dashboard
// ============================================================

import Chart from 'chart.js/auto'

// Paleta del proyecto
const PALETTE = {
  primary:   '#036DA4',
  secondary: '#5EA3C0',
  soft:      '#B9D9DC',
  positive:  '#DBEBE2',
  text:      '#4A6070',
  border:    '#D5E8EC',
}

const LIKERT_COLORS = [
  'rgba(192,57,43,0.75)',   // 1 — Negativo
  'rgba(230,126,34,0.75)',  // 2
  'rgba(185,217,220,0.85)', // 3
  'rgba(94,163,192,0.85)',  // 4
  'rgba(3,109,164,0.90)',   // 5 — Positivo
]

const DEFAULT_PLUGINS = {
  legend: {
    labels: {
      font: { family: 'Inter, sans-serif', size: 11 },
      color: PALETTE.text,
      padding: 16,
    },
  },
  tooltip: {
    backgroundColor: 'white',
    titleColor: PALETTE.primary,
    bodyColor: PALETTE.text,
    borderColor: PALETTE.border,
    borderWidth: 1,
    padding: 10,
    titleFont: { weight: '600', family: 'Inter, sans-serif' },
    bodyFont: { family: 'Inter, sans-serif', size: 12 },
  },
}

// Mapa de instancias para destruir antes de recrear
const chartInstances = {}

function destroyChart(id) {
  try {
    const existing = Chart.getChart(id)
    if (existing) {
      existing.destroy()
    }
  } catch (_) {}

  if (chartInstances[id]) {
    try {
      chartInstances[id].destroy()
    } catch (_) {}
    delete chartInstances[id]
  }
}

/**
 * Gráfico de barras horizontales para distribución categórica.
 * @param {string} canvasId
 * @param {string[]} labels
 * @param {number[]} data - counts o porcentajes
 * @param {string} label - etiqueta del dataset
 */
export function renderBarChart(canvasId, labels, data, label = 'Respuestas') {
  destroyChart(canvasId)
  const ctx = document.getElementById(canvasId)?.getContext('2d')
  if (!ctx) return

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: labels.map((_, i) =>
          `${PALETTE.primary}${Math.round(40 + (i / labels.length) * 90).toString(16).padStart(2,'0')}`
        ),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { ...DEFAULT_PLUGINS, legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, color: PALETTE.text },
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 }, color: PALETTE.text },
        },
      },
    },
  })
}

/**
 * Gráfico de dona para distribución porcentual.
 */
export function renderDonutChart(canvasId, labels, data) {
  destroyChart(canvasId)
  const ctx = document.getElementById(canvasId)?.getContext('2d')
  if (!ctx) return

  const colors = [
    '#036DA4', '#5EA3C0', '#B9D9DC', '#7BB8D1', '#DBEBE2',
    '#4A8FA8', '#9ECBD8', '#2C7DA0', '#89C2D9', '#61A5C2',
  ]

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: 'white',
        hoverBorderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...DEFAULT_PLUGINS,
        legend: {
          position: 'bottom',
          labels: {
            ...DEFAULT_PLUGINS.legend.labels,
            boxWidth: 12,
            pointStyle: 'circle',
            usePointStyle: true,
          },
        },
      },
      cutout: '62%',
    },
  })
}

/**
 * Gráfico de barras apiladas para distribución Likert.
 */
export function renderLikertChart(canvasId, labels, datasets) {
  destroyChart(canvasId)
  const ctx = document.getElementById(canvasId)?.getContext('2d')
  if (!ctx) return

  const chartDatasets = datasets.map((d, i) => ({
    label:           d.label,
    data:            d.data,
    backgroundColor: LIKERT_COLORS[i] || PALETTE.soft,
    borderRadius:    i === 0 ? { topLeft: 4, bottomLeft: 4 } : i === datasets.length - 1 ? { topRight: 4, bottomRight: 4 } : 0,
    borderSkipped:   false,
  }))

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: chartDatasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...DEFAULT_PLUGINS,
        legend: {
          position: 'bottom',
          labels: { ...DEFAULT_PLUGINS.legend.labels, boxWidth: 12, usePointStyle: true },
        },
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          ticks: {
            font: { family: 'Inter', size: 10 },
            callback: v => v + '%',
          },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 }, color: PALETTE.text },
        },
      },
    },
  })
}

/**
 * Gráfico radar para perfiles de dominio.
 */
export function renderRadarChart(canvasId, labels, datasets) {
  destroyChart(canvasId)
  const ctx = document.getElementById(canvasId)?.getContext('2d')
  if (!ctx) return

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label:           d.label,
        data:            d.data,
        fill:            true,
        backgroundColor: i === 0 ? 'rgba(3,109,164,0.15)' : 'rgba(94,163,192,0.15)',
        borderColor:     i === 0 ? PALETTE.primary : PALETTE.secondary,
        pointBackgroundColor: i === 0 ? PALETTE.primary : PALETTE.secondary,
        borderWidth: 2,
        pointRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { ...DEFAULT_PLUGINS },
      scales: {
        r: {
          min: 1, max: 5,
          ticks: { stepSize: 1, font: { family: 'Inter', size: 10 } },
          grid: { color: PALETTE.border },
          angleLines: { color: PALETTE.border },
          pointLabels: { font: { family: 'Inter', size: 10 }, color: PALETTE.text },
        },
      },
    },
  })
}

/**
 * Gráfico de línea para respuestas a lo largo del tiempo.
 */
export function renderTimelineChart(canvasId, labels, data) {
  destroyChart(canvasId)
  const ctx = document.getElementById(canvasId)?.getContext('2d')
  if (!ctx) return

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Respuestas completadas',
        data,
        fill: true,
        backgroundColor: 'rgba(3,109,164,0.08)',
        borderColor: PALETTE.primary,
        borderWidth: 2.5,
        tension: 0.4,
        pointBackgroundColor: PALETTE.primary,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { ...DEFAULT_PLUGINS, legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 }, color: PALETTE.text },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { stepSize: 1, font: { family: 'Inter', size: 11 }, color: PALETTE.text },
        },
      },
    },
  })
}

export { destroyChart }
