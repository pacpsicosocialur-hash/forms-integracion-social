-- ============================================================
-- MIGRACIÓN 004: CONFIGURACIÓN DE SUPABASE STORAGE
-- Bucket privado para firmas manuscritas
-- ============================================================
-- EJECUTAR DESPUÉS DE: 003_seed_questions.sql
--
-- OPCIÓN A: Ejecutar desde el Dashboard de Supabase
--   Storage > New bucket > "signatures" > Private
--   Luego agregar las políticas manualmente en Storage > Policies
--
-- OPCIÓN B: Ejecutar este SQL directamente en el SQL Editor
-- ============================================================

-- ============================================================
-- CREAR BUCKET PRIVADO "signatures"
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'signatures',
    'signatures',
    FALSE,               -- bucket PRIVADO, no accesible públicamente
    2097152,             -- límite 2MB por archivo
    ARRAY['image/png']   -- solo imágenes PNG (Canvas exporta PNG)
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/png'];


-- ============================================================
-- POLÍTICAS DE STORAGE: bucket "signatures"
-- ============================================================

-- Política 1: Participantes anónimos pueden SUBIR su firma
-- La ruta debe seguir el patrón: {response_id}.png
CREATE POLICY "signatures_anon_upload"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
    bucket_id = 'signatures'
    AND octet_length(name) > 0
);

-- Política 2: Solo admins pueden VER/DESCARGAR firmas
CREATE POLICY "signatures_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'signatures'
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    )
);

-- Política 3: Admins pueden ELIMINAR firmas si es necesario
CREATE POLICY "signatures_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'signatures'
    AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    )
);

-- ============================================================
-- NOTAS DE SEGURIDAD — STORAGE:
--
-- 1. El bucket "signatures" es PRIVADO.
--    No hay URL pública para acceder a las firmas.
--
-- 2. Los participantes (anon) pueden SUBIR su firma
--    pero NO pueden descargar ninguna firma (ni la propia).
--
-- 3. Los administradores acceden mediante URLs firmadas
--    temporales generadas con Supabase Storage createSignedUrl().
--
-- 4. Las URLs firmadas tienen un tiempo de expiración
--    configurable (recomendado: 60 segundos para visualización).
--
-- 5. La ruta de almacenamiento es: signatures/{response_id}.png
--    Esto permite identificar fácilmente la firma de cada respuesta.
--
-- 6. Si se requiere eliminar datos de un participante (derecho
--    al olvido), eliminar:
--    a. El archivo en Storage: signatures/{response_id}.png
--    b. El registro en la tabla signatures
--    c. Los registros en answers donde response_id coincide
--    d. El registro en responses
--    e. El registro en participants
-- ============================================================
