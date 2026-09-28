-- ============================================================
-- MIGRACIÓN 001: ESQUEMA INICIAL
-- Programa de Reinserción Socio-Laboral de Clínica Día
-- Terapia Ocupacional — Base de Datos Supabase PostgreSQL
-- ============================================================
-- INSTRUCCIONES:
-- Ejecutar este script en el SQL Editor de Supabase
-- en el orden: 001 → 002 → 003 → 004
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: app_config
-- Configuración general de la aplicación
-- ============================================================
CREATE TABLE IF NOT EXISTS app_config (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key           TEXT UNIQUE NOT NULL,
    value         TEXT NOT NULL,
    description   TEXT,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by    UUID REFERENCES auth.users(id)
);

-- Insertar configuración inicial
INSERT INTO app_config (key, value, description) VALUES
    ('consent_version',   '1.0',  'Versión activa del consentimiento informado'),
    ('form_active',       'true', 'Estado del formulario público (true = activo)'),
    ('form_title',        'PROGRAMA DE REINSERCIÓN SOCIO-LABORAL DE CLÍNICA DÍA', 'Título principal del formulario'),
    ('form_subtitle',     'Programa de Terapia Ocupacional para la inclusión social de personas con diagnóstico psicosocial', 'Subtítulo del formulario')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- TABLA: user_roles
-- Sistema de roles para administradores
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);


-- ============================================================
-- TABLA: sections
-- Secciones del formulario
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code TEXT UNIQUE NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    "order"      INTEGER NOT NULL,
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO sections (section_code, title, description, "order") VALUES
    ('consent',       'Consentimiento',              'Consentimiento informado y firma',                           1),
    ('general',       'Datos Generales',             'Información sociodemográfica básica',                        2),
    ('occupational',  'Desempeño Ocupacional',       'Habilidades motoras y cognitivas/procesamiento (basado en AMPS)', 3),
    ('work_skills',   'Habilidades Laborales',       'Habilidades laborales básicas',                              4),
    ('social',        'Interacción Social',          'Habilidades de interacción social',                          5),
    ('barriers',      'Barreras y Apoyos',           'Barreras y apoyos para la participación laboral',            6),
    ('interests',     'Intereses Laborales',         'Intereses ocupacionales y laborales',                        7)
ON CONFLICT (section_code) DO NOTHING;


-- ============================================================
-- TABLA: questions
-- Catálogo de preguntas del instrumento
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code    TEXT NOT NULL REFERENCES sections(section_code),
    question_code   TEXT UNIQUE NOT NULL,
    question_text   TEXT NOT NULL,
    question_type   TEXT NOT NULL CHECK (question_type IN (
                        'radio',        -- opción única
                        'likert',       -- escala 1-5
                        'open',         -- respuesta abierta
                        'conditional'   -- condicional (depende de otra)
                    )),
    options         JSONB,              -- opciones para radio/likert (array de {value, label})
    "order"         INTEGER NOT NULL,
    required        BOOLEAN NOT NULL DEFAULT TRUE,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    parent_code     TEXT,              -- código de la pregunta padre (para condicionales)
    parent_value    TEXT,              -- valor que activa esta pregunta
    subsection      TEXT,              -- subdominio dentro de la sección
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section_code);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(active);


-- ============================================================
-- TABLA: participants
-- Un registro por intento de respuesta (sin PII identificable)
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TABLA: responses
-- Formulario completo — un registro por participante
-- ============================================================
CREATE TABLE IF NOT EXISTS responses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    status         TEXT NOT NULL DEFAULT 'started'
                   CHECK (status IN ('started', 'consent_done', 'in_progress', 'completed', 'abandoned')),
    current_step   INTEGER NOT NULL DEFAULT 0,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at   TIMESTAMPTZ,
    response_code  TEXT UNIQUE,           -- código anónimo para referencia del participante
    ip_hash        TEXT,                  -- hash de IP (no la IP real) para prevenir duplicados
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_created ON responses(created_at DESC);


-- ============================================================
-- TABLA: consents
-- Registro de aceptación del consentimiento informado
-- ============================================================
CREATE TABLE IF NOT EXISTS consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id     UUID NOT NULL UNIQUE REFERENCES responses(id) ON DELETE CASCADE,
    version         TEXT NOT NULL,
    accepted        BOOLEAN NOT NULL,
    accepted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_text    TEXT,               -- snapshot del texto del consentimiento al momento de firmar
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TABLA: signatures
-- Referencia a la firma en Supabase Storage (bucket privado)
-- ============================================================
CREATE TABLE IF NOT EXISTS signatures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id     UUID NOT NULL UNIQUE REFERENCES responses(id) ON DELETE CASCADE,
    storage_path    TEXT NOT NULL,      -- ruta en el bucket de Storage: signatures/{response_id}.png
    bucket_name     TEXT NOT NULL DEFAULT 'signatures',
    consent_version TEXT NOT NULL,
    consent_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    file_size_bytes INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TABLA: answers
-- Una fila por pregunta respondida (estructura relacional)
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id   UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id   UUID NOT NULL REFERENCES questions(id),
    question_code TEXT NOT NULL,
    value         TEXT,                  -- valor seleccionado o texto libre
    value_numeric NUMERIC,              -- valor numérico cuando aplica (escalas Likert)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_code ON answers(question_code);


-- ============================================================
-- TABLA: audit_log
-- Registro de eventos administrativos importantes
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id),
    action      TEXT NOT NULL,          -- login, logout, export, config_change, question_update, consent_version_change
    details     JSONB,                  -- detalles adicionales del evento
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);


-- ============================================================
-- FUNCIÓN: generate_response_code()
-- Genera un código anónimo legible para el participante
-- ============================================================
CREATE OR REPLACE FUNCTION generate_response_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..3 LOOP
        result := result || SUBSTRING(chars FROM (FLOOR(RANDOM() * LENGTH(chars) + 1))::INT FOR 1);
    END LOOP;
    result := result || '-';
    FOR i IN 1..4 LOOP
        result := result || SUBSTRING(chars FROM (FLOOR(RANDOM() * LENGTH(chars) + 1))::INT FOR 1);
    END LOOP;
    RETURN result;
END;
$$;


-- ============================================================
-- FUNCIÓN: complete_response()
-- Marca una respuesta como completada y genera el código
-- ============================================================
CREATE OR REPLACE FUNCTION complete_response(p_response_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_attempts INTEGER := 0;
BEGIN
    LOOP
        v_code := generate_response_code();
        v_attempts := v_attempts + 1;
        BEGIN
            UPDATE responses
            SET status = 'completed',
                completed_at = NOW(),
                response_code = v_code
            WHERE id = p_response_id
              AND status != 'completed';
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            IF v_attempts > 20 THEN
                RAISE EXCEPTION 'No se pudo generar código único';
            END IF;
        END;
    END LOOP;
    RETURN v_code;
END;
$$;


-- ============================================================
-- FUNCIÓN: log_admin_action()
-- Registra acciones del administrador en audit_log
-- ============================================================
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action  TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_log (user_id, action, details)
    VALUES (auth.uid(), p_action, p_details);
END;
$$;


-- ============================================================
-- VISTA: response_summary
-- Resumen de respuestas para el dashboard (sin PII)
-- ============================================================
CREATE OR REPLACE VIEW response_summary AS
SELECT
    r.id,
    r.response_code,
    r.status,
    r.started_at,
    r.completed_at,
    r.current_step,
    CASE WHEN c.accepted IS TRUE THEN TRUE ELSE FALSE END AS consent_accepted,
    CASE WHEN s.id IS NOT NULL THEN TRUE ELSE FALSE END   AS has_signature,
    (SELECT COUNT(*) FROM answers a WHERE a.response_id = r.id)::INTEGER AS answer_count
FROM responses r
LEFT JOIN consents c ON c.response_id = r.id
LEFT JOIN signatures s ON s.response_id = r.id;


-- ============================================================
-- VISTA: dashboard_stats
-- Estadísticas generales para el dashboard
-- ============================================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE status IN ('started','consent_done','in_progress','completed'))   AS total_started,
    COUNT(*) FILTER (WHERE status = 'completed')                                              AS total_completed,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '1 day') AS today_completed,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '7 days') AS week_completed,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '30 days') AS month_completed,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'completed') /
        NULLIF(COUNT(*), 0), 1
    ) AS completion_rate
FROM responses;
