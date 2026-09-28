// ============================================================
// src/services/signatures.js
// Firma manuscrita — Supabase Storage (bucket privado)
// ============================================================

import { supabase } from '../lib/supabase.js'

const BUCKET = 'signatures'

/**
 * Convierte el dataURL del canvas a Blob PNG.
 */
function dataURLtoBlob(dataURL) {
  const arr  = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n      = bstr.length
  const u8   = new Uint8Array(n)
  while (n--) u8[n] = bstr.charCodeAt(n)
  return new Blob([u8], { type: mime })
}

/**
 * Sube la firma al bucket privado de Supabase Storage
 * y guarda la referencia en la tabla signatures.
 *
 * @param {string} responseId - UUID de la respuesta
 * @param {string} signatureDataURL - dataURL de la firma (canvas.toDataURL('image/png'))
 * @param {string} consentVersion - versión del consentimiento aceptado
 * @returns {string} storagePath - ruta del archivo en Storage
 */
export async function saveSignature(responseId, signatureDataURL, consentVersion) {
  // 1. Convertir dataURL a Blob
  const blob = dataURLtoBlob(signatureDataURL)
  const fileSizeBytes = blob.size

  // 2. Definir ruta en Storage
  const storagePath = `${responseId}.png`

  // 3. Subir al bucket privado
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType:  'image/png',
      cacheControl: '3600',
      upsert:       true,
    })

  if (uploadError) throw new Error('No se pudo subir la firma: ' + uploadError.message)

  // 4. Guardar referencia en la tabla signatures
  const { error: dbError } = await supabase
    .from('signatures')
    .insert({
      response_id:      responseId,
      storage_path:     storagePath,
      bucket_name:      BUCKET,
      consent_version:  consentVersion,
      consent_accepted: true,
      file_size_bytes:  fileSizeBytes,
    })

  if (dbError) throw new Error('No se pudo registrar la firma: ' + dbError.message)

  return storagePath
}

/**
 * Genera una URL firmada temporal para que un administrador
 * pueda visualizar la firma. Solo funciona con sesión auth.
 *
 * @param {string} storagePath - ruta del archivo (ej: "{responseId}.png")
 * @param {number} expiresIn - segundos de validez (default: 60)
 */
export async function getSignatureSignedUrl(storagePath, expiresIn = 60) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error) throw new Error('No se pudo generar URL de firma: ' + error.message)
  return data.signedUrl
}
