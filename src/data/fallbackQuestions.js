// ============================================================
// src/data/fallbackQuestions.js
// Catálogo de preguntas por defecto (offline / fallback)
// Corresponde exactamente a 003_seed_questions.sql
// ============================================================

export const FALLBACK_QUESTIONS = [
  // SECCIÓN: general
  {
    id: 'g1',
    section_code: 'general',
    question_code: 'g_age',
    question_text: '¿QUÉ EDAD TIENE?',
    question_type: 'radio',
    options: [
      { value: '18-29', label: '18 a 29 años' },
      { value: '30-39', label: '30 a 39 años' },
      { value: '40-49', label: '40 a 49 años' },
      { value: '50-60', label: '50 a 60 años' },
      { value: 'otro',  label: 'Otro' }
    ],
    order: 1,
    required: true,
  },
  {
    id: 'g2',
    section_code: 'general',
    question_code: 'g_diagnosis',
    question_text: '¿QUÉ DIAGNÓSTICO TIENE?',
    question_type: 'radio',
    options: [
      { value: 'bipolar',    label: 'Trastorno Afectivo Bipolar' },
      { value: 'depresivo',  label: 'Trastorno depresivo' },
      { value: 'sustancias', label: 'Trastorno por consumo de sustancias' },
      { value: 'ansiedad',   label: 'Trastorno de ansiedad' },
      { value: 'esquizo',    label: 'Esquizofrenia' },
      { value: 'adaptacion', label: 'Trastorno de adaptación' },
      { value: 'otro',       label: 'Otro' }
    ],
    order: 2,
    required: true,
  },
  {
    id: 'g3',
    section_code: 'general',
    question_code: 'g_education',
    question_text: '¿CUÁL ES SU NIVEL EDUCATIVO?',
    question_type: 'radio',
    options: [
      { value: 'primaria',     label: 'Primaria' },
      { value: 'bachillerato', label: 'Bachillerato' },
      { value: 'tecnico',      label: 'Técnico/Tecnólogo' },
      { value: 'pregrado',     label: 'Pregrado' },
      { value: 'posgrado',     label: 'Posgrado' },
      { value: 'otro',         label: 'Otro' }
    ],
    order: 3,
    required: true,
  },
  {
    id: 'g4',
    section_code: 'general',
    question_code: 'g_stratum',
    question_text: '¿CUÁL ES SU ESTRATO SOCIOECONÓMICO?',
    question_type: 'radio',
    options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5', label: '5' },
      { value: '6', label: '6' }
    ],
    order: 4,
    required: true,
  },
  {
    id: 'g5',
    section_code: 'general',
    question_code: 'g_livewith',
    question_text: '¿CON QUIÉN VIVE ACTUALMENTE?',
    question_type: 'radio',
    options: [
      { value: 'pareja',     label: 'Pareja' },
      { value: 'hijos',      label: 'Hijo(s)' },
      { value: 'cuidadores', label: 'Cuidadores' },
      { value: 'mama',       label: 'Mamá' },
      { value: 'papa',       label: 'Papá' },
      { value: 'solo',       label: 'Sólo/a' },
      { value: 'otro',       label: 'Otro' }
    ],
    order: 5,
    required: true,
  },
  {
    id: 'g6',
    section_code: 'general',
    question_code: 'g_works',
    question_text: '¿TRABAJA ACTUALMENTE?',
    question_type: 'radio',
    options: [
      { value: 'si', label: 'Sí' },
      { value: 'no', label: 'No' }
    ],
    order: 6,
    required: true,
  },
  {
    id: 'g7',
    section_code: 'general',
    question_code: 'g_works_what',
    question_text: '¿EN QUÉ TRABAJA ACTUALMENTE?',
    question_type: 'open',
    parent_code: 'g_works',
    parent_value: 'si',
    options: null,
    order: 7,
    required: false,
  },
  {
    id: 'g8',
    section_code: 'general',
    question_code: 'g_studies',
    question_text: '¿ESTUDIA ACTUALMENTE?',
    question_type: 'radio',
    options: [
      { value: 'si', label: 'Sí' },
      { value: 'no', label: 'No' }
    ],
    order: 8,
    required: true,
  },
  {
    id: 'g9',
    section_code: 'general',
    question_code: 'g_studies_what',
    question_text: '¿QUÉ ESTUDIA ACTUALMENTE?',
    question_type: 'open',
    parent_code: 'g_studies',
    parent_value: 'si',
    options: null,
    order: 9,
    required: false,
  },
  {
    id: 'g10',
    section_code: 'general',
    question_code: 'g_occupation_importance',
    question_text: '¿QUÉ TAN IMPORTANTE ES PARA USTED TENER UNA OCUPACIÓN O TRABAJO?',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada importante' },
      { value: '2', label: '2 — Poco importante' },
      { value: '3', label: '3 — Moderadamente importante' },
      { value: '4', label: '4 — Muy importante' },
      { value: '5', label: '5 — Extremadamente importante' }
    ],
    order: 10,
    required: true,
  },

  // SECCIÓN: occupational
  {
    id: 'o1',
    section_code: 'occupational',
    question_code: 'o_motor_hands',
    question_text: 'Cuando realizo actividades que requieren usar mis manos (escribir, cocinar, organizar materiales o hacer manualidades):',
    question_type: 'likert',
    subsection: 'Motor',
    options: [
      { value: '1', label: '1 — Mucha dificultad' },
      { value: '2', label: '2 — Bastante dificultad' },
      { value: '3', label: '3 — Algo de dificultad' },
      { value: '4', label: '4 — Poca dificultad' },
      { value: '5', label: '5 — Sin dificultad' }
    ],
    order: 1,
    required: true,
  },
  {
    id: 'o2',
    section_code: 'occupational',
    question_code: 'o_motor_endurance',
    question_text: 'Cuando realizo actividades durante varios minutos:',
    question_type: 'likert',
    subsection: 'Motor',
    options: [
      { value: '1', label: '1 — Me canso muy rápido' },
      { value: '2', label: '2 — Me canso frecuentemente' },
      { value: '3', label: '3 — Me canso algunas veces' },
      { value: '4', label: '4 — Mantengo el ritmo con pocas pausas' },
      { value: '5', label: '5 — Mantengo el ritmo sin dificultad' }
    ],
    order: 2,
    required: true,
  },
  {
    id: 'o3',
    section_code: 'occupational',
    question_code: 'o_motor_tools',
    question_text: 'Cuando utilizo herramientas o materiales:',
    question_type: 'likert',
    subsection: 'Motor',
    options: [
      { value: '1', label: '1 — Necesito ayuda constante' },
      { value: '2', label: '2 — Necesito bastante ayuda' },
      { value: '3', label: '3 — Necesito ayuda ocasional' },
      { value: '4', label: '4 — Lo realizo casi siempre solo' },
      { value: '5', label: '5 — Lo realizo completamente solo' }
    ],
    order: 3,
    required: true,
  },
  {
    id: 'o4',
    section_code: 'occupational',
    question_code: 'o_cog_concentration',
    question_text: 'Mantengo la concentración hasta terminar una actividad.',
    question_type: 'likert',
    subsection: 'Cognitivo/Procesamiento',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 4,
    required: true,
  },
  {
    id: 'o5',
    section_code: 'occupational',
    question_code: 'o_cog_memory',
    question_text: 'Recuerdo las instrucciones que me dan para realizar una tarea.',
    question_type: 'likert',
    subsection: 'Cognitivo/Procesamiento',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 5,
    required: true,
  },
  {
    id: 'o6',
    section_code: 'occupational',
    question_code: 'o_cog_planning',
    question_text: 'Organizo los pasos antes de iniciar una actividad.',
    question_type: 'likert',
    subsection: 'Cognitivo/Procesamiento',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 6,
    required: true,
  },
  {
    id: 'o7',
    section_code: 'occupational',
    question_code: 'o_cog_problem',
    question_text: 'Encuentro soluciones cuando surge un problema durante una actividad.',
    question_type: 'likert',
    subsection: 'Cognitivo/Procesamiento',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 7,
    required: true,
  },
  {
    id: 'o8',
    section_code: 'occupational',
    question_code: 'o_cog_adapt',
    question_text: 'Me adapto cuando hay cambios inesperados.',
    question_type: 'likert',
    subsection: 'Cognitivo/Procesamiento',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 8,
    required: true,
  },

  // SECCIÓN: work_skills
  {
    id: 'w1',
    section_code: 'work_skills',
    question_code: 'w_schedule',
    question_text: 'Cumplo horarios establecidos.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 1,
    required: true,
  },
  {
    id: 'w2',
    section_code: 'work_skills',
    question_code: 'w_finish',
    question_text: 'Termino las actividades que comienzo.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 2,
    required: true,
  },
  {
    id: 'w3',
    section_code: 'work_skills',
    question_code: 'w_instructions',
    question_text: 'Sigo instrucciones hasta completar una tarea.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 3,
    required: true,
  },
  {
    id: 'w4',
    section_code: 'work_skills',
    question_code: 'w_organize',
    question_text: 'Organizo adecuadamente mis materiales y herramientas.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 4,
    required: true,
  },
  {
    id: 'w5',
    section_code: 'work_skills',
    question_code: 'w_ask_help',
    question_text: 'Solicito ayuda cuando la necesito.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 5,
    required: true,
  },
  {
    id: 'w6',
    section_code: 'work_skills',
    question_code: 'w_rules',
    question_text: 'Cumplo normas y acuerdos establecidos.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 6,
    required: true,
  },
  {
    id: 'w7',
    section_code: 'work_skills',
    question_code: 'w_responsibility',
    question_text: 'Mantengo la responsabilidad frente a mis compromisos.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 7,
    required: true,
  },
  {
    id: 'w8',
    section_code: 'work_skills',
    question_code: 'w_persist',
    question_text: 'Continúo una actividad aunque sea difícil.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 8,
    required: true,
  },

  // SECCIÓN: social
  {
    id: 's1',
    section_code: 'social',
    question_code: 's_listen',
    question_text: 'Escucho a otras personas cuando hablan.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 1,
    required: true,
  },
  {
    id: 's2',
    section_code: 'social',
    question_code: 's_turn',
    question_text: 'Espero mi turno para hablar.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 2,
    required: true,
  },
  {
    id: 's3',
    section_code: 'social',
    question_code: 's_express',
    question_text: 'Expreso mis opiniones de manera respetuosa.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 3,
    required: true,
  },
  {
    id: 's4',
    section_code: 'social',
    question_code: 's_support',
    question_text: 'Solicito apoyo cuando lo necesito.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 4,
    required: true,
  },
  {
    id: 's5',
    section_code: 'social',
    question_code: 's_teamwork',
    question_text: 'Trabajo adecuadamente con otras personas.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 5,
    required: true,
  },
  {
    id: 's6',
    section_code: 'social',
    question_code: 's_conflict',
    question_text: 'Manejo desacuerdos o conflictos de forma adecuada.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 6,
    required: true,
  },

  // SECCIÓN: barriers
  {
    id: 'b1',
    section_code: 'barriers',
    question_code: 'b_family',
    question_text: 'Mi familia apoya que trabaje o estudie.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Totalmente en desacuerdo' },
      { value: '2', label: '2 — En desacuerdo' },
      { value: '3', label: '3 — Neutral' },
      { value: '4', label: '4 — De acuerdo' },
      { value: '5', label: '5 — Totalmente de acuerdo' }
    ],
    order: 1,
    required: true,
  },
  {
    id: 'b2',
    section_code: 'barriers',
    question_code: 'b_transport',
    question_text: 'Tengo medios de transporte para asistir a un trabajo o estudio.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Totalmente en desacuerdo' },
      { value: '2', label: '2 — En desacuerdo' },
      { value: '3', label: '3 — Neutral' },
      { value: '4', label: '4 — De acuerdo' },
      { value: '5', label: '5 — Totalmente de acuerdo' }
    ],
    order: 2,
    required: true,
  },
  {
    id: 'b3',
    section_code: 'barriers',
    question_code: 'b_health',
    question_text: 'Considero que mi estado de salud me permitiría trabajar actualmente.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Totalmente en desacuerdo' },
      { value: '2', label: '2 — En desacuerdo' },
      { value: '3', label: '3 — Neutral' },
      { value: '4', label: '4 — De acuerdo' },
      { value: '5', label: '5 — Totalmente de acuerdo' }
    ],
    order: 3,
    required: true,
  },
  {
    id: 'b4',
    section_code: 'barriers',
    question_code: 'b_stigma',
    question_text: 'He sentido rechazo por mi diagnóstico al buscar oportunidades.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nunca' },
      { value: '2', label: '2 — Rara vez' },
      { value: '3', label: '3 — Algunas veces' },
      { value: '4', label: '4 — Frecuentemente' },
      { value: '5', label: '5 — Siempre' }
    ],
    order: 4,
    required: true,
  },
  {
    id: 'b5',
    section_code: 'barriers',
    question_code: 'b_network',
    question_text: 'Tengo personas que me apoyan para alcanzar mis metas laborales.',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Totalmente en desacuerdo' },
      { value: '2', label: '2 — En desacuerdo' },
      { value: '3', label: '3 — Neutral' },
      { value: '4', label: '4 — De acuerdo' },
      { value: '5', label: '5 — Totalmente de acuerdo' }
    ],
    order: 5,
    required: true,
  },

  // SECCIÓN: interests
  {
    id: 'i1',
    section_code: 'interests',
    question_code: 'i_cooking',
    question_text: 'Cocina y alimentación',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 1,
    required: true,
  },
  {
    id: 'i2',
    section_code: 'interests',
    question_code: 'i_cleaning',
    question_text: 'Aseo y mantenimiento',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 2,
    required: true,
  },
  {
    id: 'i3',
    section_code: 'interests',
    question_code: 'i_customer',
    question_text: 'Atención al cliente',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 3,
    required: true,
  },
  {
    id: 'i4',
    section_code: 'interests',
    question_code: 'i_sales',
    question_text: 'Ventas',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 4,
    required: true,
  },
  {
    id: 'i5',
    section_code: 'interests',
    question_code: 'i_garden',
    question_text: 'Jardinería',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 5,
    required: true,
  },
  {
    id: 'i6',
    section_code: 'interests',
    question_code: 'i_admin',
    question_text: 'Actividades administrativas',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 6,
    required: true,
  },
  {
    id: 'i7',
    section_code: 'interests',
    question_code: 'i_warehouse',
    question_text: 'Bodega y mensajería',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 7,
    required: true,
  },
  {
    id: 'i8',
    section_code: 'interests',
    question_code: 'i_pets',
    question_text: 'Cuidado de mascotas',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 8,
    required: true,
  },
  {
    id: 'i9',
    section_code: 'interests',
    question_code: 'i_crafts',
    question_text: 'Manualidades y artesanías',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 9,
    required: true,
  },
  {
    id: 'i10',
    section_code: 'interests',
    question_code: 'i_tech',
    question_text: 'Tecnología y herramientas digitales',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 10,
    required: true,
  },
  {
    id: 'i11',
    section_code: 'interests',
    question_code: 'i_entrepreneur',
    question_text: 'Emprendimiento o negocio propio',
    question_type: 'likert',
    options: [
      { value: '1', label: '1 — Nada interesado' },
      { value: '2', label: '2 — Poco interesado' },
      { value: '3', label: '3 — Moderadamente interesado' },
      { value: '4', label: '4 — Muy interesado' },
      { value: '5', label: '5 — Extremadamente interesado' }
    ],
    order: 11,
    required: true,
  },
  {
    id: 'i12',
    section_code: 'interests',
    question_code: 'i_other_interest',
    question_text: '¿Hay algún oficio o trabajo que le gustaría desempeñar y no aparece en la lista?',
    question_type: 'open',
    options: null,
    order: 12,
    required: false,
  }
]
