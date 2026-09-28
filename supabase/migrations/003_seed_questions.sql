-- ============================================================
-- MIGRACIÓN 003: CATÁLOGO DE PREGUNTAS (SEED)
-- Instrumento completo — todas las secciones
-- ============================================================
-- EJECUTAR DESPUÉS DE: 002_rls_policies.sql
-- ============================================================
-- NOTA IMPORTANTE:
-- Las preguntas de Desempeño Ocupacional están basadas en el
-- AMPS (Assessment of Motor and Process Skills) como referencia
-- conceptual. Este instrumento NO es el AMPS oficial.
-- No se generan puntuaciones oficiales del AMPS.
-- ============================================================

-- ============================================================
-- SECCIÓN: general — Datos Generales
-- ============================================================
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required) VALUES

('general', 'g_age', '¿QUÉ EDAD TIENE?', 'radio',
 '[
   {"value": "18-29", "label": "18 a 29 años"},
   {"value": "30-39", "label": "30 a 39 años"},
   {"value": "40-49", "label": "40 a 49 años"},
   {"value": "50-60", "label": "50 a 60 años"},
   {"value": "otro",  "label": "Otro"}
 ]'::jsonb, 1, TRUE),

('general', 'g_diagnosis', '¿QUÉ DIAGNÓSTICO TIENE?', 'radio',
 '[
   {"value": "bipolar",     "label": "Trastorno Afectivo Bipolar"},
   {"value": "depresivo",   "label": "Trastorno depresivo"},
   {"value": "sustancias",  "label": "Trastorno por consumo de sustancias"},
   {"value": "ansiedad",    "label": "Trastorno de ansiedad"},
   {"value": "esquizo",     "label": "Esquizofrenia"},
   {"value": "adaptacion",  "label": "Trastorno de adaptación"},
   {"value": "otro",        "label": "Otro"}
 ]'::jsonb, 2, TRUE),

('general', 'g_education', '¿CUÁL ES SU NIVEL EDUCATIVO?', 'radio',
 '[
   {"value": "primaria",       "label": "Primaria"},
   {"value": "bachillerato",   "label": "Bachillerato"},
   {"value": "tecnico",        "label": "Técnico/Tecnólogo"},
   {"value": "pregrado",       "label": "Pregrado"},
   {"value": "posgrado",       "label": "Posgrado"},
   {"value": "otro",           "label": "Otro"}
 ]'::jsonb, 3, TRUE),

('general', 'g_stratum', '¿CUÁL ES SU ESTRATO SOCIOECONÓMICO?', 'radio',
 '[
   {"value": "1", "label": "1"},
   {"value": "2", "label": "2"},
   {"value": "3", "label": "3"},
   {"value": "4", "label": "4"},
   {"value": "5", "label": "5"},
   {"value": "6", "label": "6"}
 ]'::jsonb, 4, TRUE),

('general', 'g_livewith', '¿CON QUIÉN VIVE ACTUALMENTE?', 'radio',
 '[
   {"value": "pareja",     "label": "Pareja"},
   {"value": "hijos",      "label": "Hijo(s)"},
   {"value": "cuidadores", "label": "Cuidadores"},
   {"value": "mama",       "label": "Mamá"},
   {"value": "papa",       "label": "Papá"},
   {"value": "solo",       "label": "Sólo/a"},
   {"value": "otro",       "label": "Otro"}
 ]'::jsonb, 5, TRUE),

('general', 'g_works', '¿TRABAJA ACTUALMENTE?', 'radio',
 '[
   {"value": "si", "label": "Sí"},
   {"value": "no", "label": "No"}
 ]'::jsonb, 6, TRUE),

('general', 'g_works_what', '¿EN QUÉ TRABAJA ACTUALMENTE?', 'conditional',
 NULL, 7, FALSE,
 'g_works', 'si'),

('general', 'g_studies', '¿ESTUDIA ACTUALMENTE?', 'radio',
 '[
   {"value": "si", "label": "Sí"},
   {"value": "no", "label": "No"}
 ]'::jsonb, 8, TRUE),

('general', 'g_studies_what', '¿QUÉ ESTUDIA ACTUALMENTE?', 'conditional',
 NULL, 9, FALSE,
 'g_studies', 'si'),

('general', 'g_occupation_importance', '¿QUÉ TAN IMPORTANTE ES PARA USTED TENER UNA OCUPACIÓN O TRABAJO?', 'likert',
 '[
   {"value": "1", "label": "1 — Nada importante"},
   {"value": "2", "label": "2 — Poco importante"},
   {"value": "3", "label": "3 — Moderadamente importante"},
   {"value": "4", "label": "4 — Muy importante"},
   {"value": "5", "label": "5 — Extremadamente importante"}
 ]'::jsonb, 10, TRUE)

ON CONFLICT (question_code) DO NOTHING;


-- Actualizar las preguntas condicionales con la columna correcta
UPDATE questions SET parent_code = 'g_works',   parent_value = 'si' WHERE question_code = 'g_works_what';
UPDATE questions SET parent_code = 'g_studies', parent_value = 'si' WHERE question_code = 'g_studies_what';
UPDATE questions SET question_type = 'open' WHERE question_code IN ('g_works_what', 'g_studies_what');


-- ============================================================
-- SECCIÓN: occupational — Desempeño Ocupacional
-- Basado conceptualmente en el AMPS (no es el AMPS oficial)
-- ============================================================
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required, subsection) VALUES

-- DOMINIO MOTOR
('occupational', 'o_motor_hands',
 'Cuando realizo actividades que requieren usar mis manos (escribir, cocinar, organizar materiales o hacer manualidades):',
 'likert',
 '[
   {"value": "1", "label": "1 — Mucha dificultad"},
   {"value": "2", "label": "2 — Bastante dificultad"},
   {"value": "3", "label": "3 — Algo de dificultad"},
   {"value": "4", "label": "4 — Poca dificultad"},
   {"value": "5", "label": "5 — Sin dificultad"}
 ]'::jsonb, 1, TRUE, 'Motor'),

('occupational', 'o_motor_endurance',
 'Cuando realizo actividades durante varios minutos:',
 'likert',
 '[
   {"value": "1", "label": "1 — Me canso muy rápido"},
   {"value": "2", "label": "2 — Me canso frecuentemente"},
   {"value": "3", "label": "3 — Me canso algunas veces"},
   {"value": "4", "label": "4 — Mantengo el ritmo con pocas pausas"},
   {"value": "5", "label": "5 — Mantengo el ritmo sin dificultad"}
 ]'::jsonb, 2, TRUE, 'Motor'),

('occupational', 'o_motor_tools',
 'Cuando utilizo herramientas o materiales:',
 'likert',
 '[
   {"value": "1", "label": "1 — Necesito ayuda constante"},
   {"value": "2", "label": "2 — Necesito bastante ayuda"},
   {"value": "3", "label": "3 — Necesito ayuda ocasional"},
   {"value": "4", "label": "4 — Lo realizo casi siempre solo"},
   {"value": "5", "label": "5 — Lo realizo completamente solo"}
 ]'::jsonb, 3, TRUE, 'Motor'),

-- DOMINIO COGNITIVO / PROCESAMIENTO
('occupational', 'o_cog_concentration',
 'Mantengo la concentración hasta terminar una actividad.',
 'likert',
 '[
   {"value": "1", "label": "1 — Nunca"},
   {"value": "2", "label": "2 — Rara vez"},
   {"value": "3", "label": "3 — Algunas veces"},
   {"value": "4", "label": "4 — Frecuentemente"},
   {"value": "5", "label": "5 — Siempre"}
 ]'::jsonb, 4, TRUE, 'Cognitivo/Procesamiento'),

('occupational', 'o_cog_memory',
 'Recuerdo las instrucciones que me dan para realizar una tarea.',
 'likert',
 '[
   {"value": "1", "label": "1 — Nunca"},
   {"value": "2", "label": "2 — Rara vez"},
   {"value": "3", "label": "3 — Algunas veces"},
   {"value": "4", "label": "4 — Frecuentemente"},
   {"value": "5", "label": "5 — Siempre"}
 ]'::jsonb, 5, TRUE, 'Cognitivo/Procesamiento'),

('occupational', 'o_cog_planning',
 'Organizo los pasos antes de iniciar una actividad.',
 'likert',
 '[
   {"value": "1", "label": "1 — Nunca"},
   {"value": "2", "label": "2 — Rara vez"},
   {"value": "3", "label": "3 — Algunas veces"},
   {"value": "4", "label": "4 — Frecuentemente"},
   {"value": "5", "label": "5 — Siempre"}
 ]'::jsonb, 6, TRUE, 'Cognitivo/Procesamiento'),

('occupational', 'o_cog_problem',
 'Encuentro soluciones cuando surge un problema durante una actividad.',
 'likert',
 '[
   {"value": "1", "label": "1 — Nunca"},
   {"value": "2", "label": "2 — Rara vez"},
   {"value": "3", "label": "3 — Algunas veces"},
   {"value": "4", "label": "4 — Frecuentemente"},
   {"value": "5", "label": "5 — Siempre"}
 ]'::jsonb, 7, TRUE, 'Cognitivo/Procesamiento'),

('occupational', 'o_cog_adapt',
 'Me adapto cuando hay cambios inesperados.',
 'likert',
 '[
   {"value": "1", "label": "1 — Nunca"},
   {"value": "2", "label": "2 — Rara vez"},
   {"value": "3", "label": "3 — Algunas veces"},
   {"value": "4", "label": "4 — Frecuentemente"},
   {"value": "5", "label": "5 — Siempre"}
 ]'::jsonb, 8, TRUE, 'Cognitivo/Procesamiento')

ON CONFLICT (question_code) DO NOTHING;


-- ============================================================
-- SECCIÓN: work_skills — Habilidades Laborales Básicas
-- ============================================================
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required) VALUES

('work_skills', 'w_schedule', 'Cumplo horarios establecidos.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 1, TRUE),

('work_skills', 'w_finish', 'Termino las actividades que comienzo.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 2, TRUE),

('work_skills', 'w_instructions', 'Sigo instrucciones hasta completar una tarea.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 3, TRUE),

('work_skills', 'w_organize', 'Organizo adecuadamente mis materiales y herramientas.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 4, TRUE),

('work_skills', 'w_ask_help', 'Solicito ayuda cuando la necesito.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 5, TRUE),

('work_skills', 'w_rules', 'Cumplo normas y acuerdos establecidos.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 6, TRUE),

('work_skills', 'w_responsibility', 'Mantengo la responsabilidad frente a mis compromisos.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 7, TRUE),

('work_skills', 'w_persist', 'Continúo una actividad aunque sea difícil.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 8, TRUE)

ON CONFLICT (question_code) DO NOTHING;


-- ============================================================
-- SECCIÓN: social — Habilidades de Interacción Social
-- ============================================================
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required) VALUES

('social', 's_listen', 'Escucho a otras personas cuando hablan.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 1, TRUE),

('social', 's_turn', 'Espero mi turno para hablar.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 2, TRUE),

('social', 's_express', 'Expreso mis opiniones de manera respetuosa.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 3, TRUE),

('social', 's_support', 'Solicito apoyo cuando lo necesito.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 4, TRUE),

('social', 's_teamwork', 'Trabajo adecuadamente con otras personas.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 5, TRUE),

('social', 's_conflict', 'Manejo desacuerdos o conflictos de forma adecuada.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 6, TRUE)

ON CONFLICT (question_code) DO NOTHING;


-- ============================================================
-- SECCIÓN: barriers — Barreras y Apoyos
-- ============================================================
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required) VALUES

('barriers', 'b_family', 'Mi familia apoya que trabaje o estudie.', 'likert',
 '[{"value":"1","label":"1 — Totalmente en desacuerdo"},{"value":"2","label":"2 — En desacuerdo"},{"value":"3","label":"3 — Neutral"},{"value":"4","label":"4 — De acuerdo"},{"value":"5","label":"5 — Totalmente de acuerdo"}]'::jsonb,
 1, TRUE),

('barriers', 'b_transport', 'Tengo medios de transporte para asistir a un trabajo o estudio.', 'likert',
 '[{"value":"1","label":"1 — Totalmente en desacuerdo"},{"value":"2","label":"2 — En desacuerdo"},{"value":"3","label":"3 — Neutral"},{"value":"4","label":"4 — De acuerdo"},{"value":"5","label":"5 — Totalmente de acuerdo"}]'::jsonb,
 2, TRUE),

('barriers', 'b_health', 'Considero que mi estado de salud me permitiría trabajar actualmente.', 'likert',
 '[{"value":"1","label":"1 — Totalmente en desacuerdo"},{"value":"2","label":"2 — En desacuerdo"},{"value":"3","label":"3 — Neutral"},{"value":"4","label":"4 — De acuerdo"},{"value":"5","label":"5 — Totalmente de acuerdo"}]'::jsonb,
 3, TRUE),

('barriers', 'b_stigma', 'He sentido rechazo por mi diagnóstico al buscar oportunidades.', 'likert',
 '[{"value":"1","label":"1 — Nunca"},{"value":"2","label":"2 — Rara vez"},{"value":"3","label":"3 — Algunas veces"},{"value":"4","label":"4 — Frecuentemente"},{"value":"5","label":"5 — Siempre"}]'::jsonb,
 4, TRUE),

('barriers', 'b_network', 'Tengo personas que me apoyan para alcanzar mis metas laborales.', 'likert',
 '[{"value":"1","label":"1 — Totalmente en desacuerdo"},{"value":"2","label":"2 — En desacuerdo"},{"value":"3","label":"3 — Neutral"},{"value":"4","label":"4 — De acuerdo"},{"value":"5","label":"5 — Totalmente de acuerdo"}]'::jsonb,
 5, TRUE)

ON CONFLICT (question_code) DO NOTHING;


-- ============================================================
-- SECCIÓN: interests — Intereses Ocupacionales y Laborales
-- ============================================================
INSERT INTO questions (section_code, question_code, question_text, question_type, options, "order", required) VALUES

('interests', 'i_cooking',    'Cocina y alimentación',            'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 1, TRUE),

('interests', 'i_cleaning',   'Aseo y mantenimiento',             'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 2, TRUE),

('interests', 'i_customer',   'Atención al cliente',              'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 3, TRUE),

('interests', 'i_sales',      'Ventas',                           'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 4, TRUE),

('interests', 'i_garden',     'Jardinería',                       'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 5, TRUE),

('interests', 'i_admin',      'Actividades administrativas',      'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 6, TRUE),

('interests', 'i_warehouse',  'Bodega y mensajería',              'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 7, TRUE),

('interests', 'i_pets',       'Cuidado de mascotas',              'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 8, TRUE),

('interests', 'i_crafts',     'Manualidades y artesanías',        'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 9, TRUE),

('interests', 'i_tech',       'Tecnología y herramientas digitales', 'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 10, TRUE),

('interests', 'i_entrepreneur','Emprendimiento o negocio propio', 'likert',
 '[{"value":"1","label":"1 — Nada interesado"},{"value":"2","label":"2 — Poco interesado"},{"value":"3","label":"3 — Moderadamente interesado"},{"value":"4","label":"4 — Muy interesado"},{"value":"5","label":"5 — Extremadamente interesado"}]'::jsonb,
 11, TRUE),

('interests', 'i_other_interest', '¿Hay algún oficio o trabajo que le gustaría desempeñar y no aparece en la lista?',
 'open', NULL, 12, FALSE)

ON CONFLICT (question_code) DO NOTHING;
