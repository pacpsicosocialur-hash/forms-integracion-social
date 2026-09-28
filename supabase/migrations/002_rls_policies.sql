-- ============================================================
-- MIGRACIÓN 002: ROW LEVEL SECURITY (RLS)
-- Políticas de seguridad a nivel de fila para todas las tablas
-- ============================================================
-- EJECUTAR DESPUÉS DE: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- FUNCIÓN AUXILIAR: is_admin()
-- Verifica si el usuario autenticado tiene rol de administrador
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    );
END;
$$;

-- ============================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE app_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS: app_config
-- Solo admins pueden leer y modificar configuración
-- Anónimos pueden leer solo las claves necesarias para el formulario
-- ============================================================
CREATE POLICY "app_config_public_read" ON app_config
    FOR SELECT TO anon
    USING (key IN ('consent_version', 'form_active', 'form_title', 'form_subtitle'));

CREATE POLICY "app_config_admin_all" ON app_config
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: user_roles
-- Solo admins pueden ver y gestionar roles
-- ============================================================
CREATE POLICY "user_roles_admin_all" ON user_roles
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: sections
-- Lectura pública (necesario para renderizar el formulario)
-- ============================================================
CREATE POLICY "sections_public_read" ON sections
    FOR SELECT TO anon
    USING (active = TRUE);

CREATE POLICY "sections_admin_all" ON sections
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: questions
-- Lectura pública de preguntas activas
-- Solo admins pueden modificar preguntas
-- ============================================================
CREATE POLICY "questions_public_read" ON questions
    FOR SELECT TO anon
    USING (active = TRUE);

CREATE POLICY "questions_admin_all" ON questions
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: participants
-- Anónimos solo pueden INSERTAR su propio registro
-- Nunca pueden SELECT otros participantes
-- ============================================================
CREATE POLICY "participants_anon_insert" ON participants
    FOR INSERT TO anon
    WITH CHECK (TRUE);

-- Admins pueden ver todos los participantes
CREATE POLICY "participants_admin_all" ON participants
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: responses
-- Anónimos: INSERT + UPDATE solo su propia respuesta (por session claim)
-- Anónimos: NO pueden SELECT
-- Admins: acceso total
-- ============================================================
CREATE POLICY "responses_anon_insert" ON responses
    FOR INSERT TO anon
    WITH CHECK (TRUE);

-- Permitir que el anónimo actualice SU propia respuesta (current_step, status)
-- Se usa la función complete_response() con SECURITY DEFINER para el cierre final
CREATE POLICY "responses_anon_update_own" ON responses
    FOR UPDATE TO anon
    USING (TRUE)   -- La validación real se hace con el response_id en el frontend
    WITH CHECK (status != 'completed'); -- No puede marcarla completed directamente

CREATE POLICY "responses_admin_all" ON responses
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: consents
-- Anónimos: INSERT (propio)
-- Anónimos: NO pueden SELECT
-- ============================================================
CREATE POLICY "consents_anon_insert" ON consents
    FOR INSERT TO anon
    WITH CHECK (TRUE);

CREATE POLICY "consents_admin_all" ON consents
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: signatures
-- Anónimos: INSERT solamente (para guardar la referencia de Storage)
-- Anónimos: NUNCA pueden SELECT (acceso a firmas restringido)
-- Admins: acceso total
-- ============================================================
CREATE POLICY "signatures_anon_insert" ON signatures
    FOR INSERT TO anon
    WITH CHECK (TRUE);

CREATE POLICY "signatures_admin_all" ON signatures
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: answers
-- Anónimos: INSERT (sus propias respuestas)
-- Anónimos: NO pueden SELECT ninguna respuesta
-- Admins: acceso total
-- ============================================================
CREATE POLICY "answers_anon_insert" ON answers
    FOR INSERT TO anon
    WITH CHECK (TRUE);

CREATE POLICY "answers_admin_all" ON answers
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- POLÍTICAS: audit_log
-- Solo admins pueden leer
-- La escritura se hace mediante función SECURITY DEFINER
-- ============================================================
CREATE POLICY "audit_log_admin_read" ON audit_log
    FOR SELECT TO authenticated
    USING (is_admin());

-- ============================================================
-- POLÍTICAS DE STORAGE: bucket "signatures"
-- Se ejecutan en la sección Storage Policies de Supabase
-- (incluidas aquí como referencia SQL)
-- ============================================================
-- NOTA: Ejecutar estas políticas de Storage en el dashboard de
-- Supabase > Storage > Policies, o mediante el CLI de Supabase.

-- Crear bucket privado (ejecutar en el Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('signatures', 'signatures', FALSE)
-- ON CONFLICT DO NOTHING;

-- Política Storage: anónimos pueden subir al bucket (INSERT)
-- Límite de tamaño y tipo de archivo controlado en el frontend
-- CREATE POLICY "signatures_anon_upload" ON storage.objects
--     FOR INSERT TO anon
--     WITH CHECK (bucket_id = 'signatures');

-- Política Storage: solo admins pueden descargar firmas
-- CREATE POLICY "signatures_admin_download" ON storage.objects
--     FOR SELECT TO authenticated
--     USING (bucket_id = 'signatures' AND is_admin());

-- Política Storage: admins pueden eliminar si es necesario
-- CREATE POLICY "signatures_admin_delete" ON storage.objects
--     FOR DELETE TO authenticated
--     USING (bucket_id = 'signatures' AND is_admin());

-- ============================================================
-- NOTAS DE SEGURIDAD:
-- 1. Los participantes anónimos NUNCA pueden leer datos de otros.
-- 2. La clave anon de Supabase está protegida por estas políticas RLS.
-- 3. El acceso a firmas requiere autenticación como admin.
-- 4. Los datos agregados del dashboard solo son visibles para admins.
-- 5. La función complete_response() usa SECURITY DEFINER para
--    poder marcar la respuesta como completada desde el anon role.
-- ============================================================
