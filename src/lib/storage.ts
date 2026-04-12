import { supabase } from './supabase'
import type { BookPhoto } from '@/types/book'

/**
 * Uploads a single photo file to Supabase Storage.
 * Returns the signed URL (valid for 10 years) and the storage path.
 */
export async function uploadPhoto(file: File, userId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw error

  const { data } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10) // 10 years

  if (!data?.signedUrl) throw new Error('Failed to get signed URL')

  return { url: data.signedUrl, path }
}

/**
 * Uploads all photos that have a File object attached.
 * Returns a new array with blob URLs replaced by Supabase Storage URLs,
 * with storagePath set on each uploaded photo.
 * Photos without a file (e.g. cloud imports) are returned unchanged.
 */
export async function uploadPhotos(
  photos: BookPhoto[],
  userId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<BookPhoto[]> {
  const toUpload = photos.filter(p => p.file)
  let uploaded = 0

  const resultMap = new Map<string, { url: string; path: string }>()

  await Promise.all(
    toUpload.map(async photo => {
      const result = await uploadPhoto(photo.file!, userId)
      resultMap.set(photo.id, result)
      uploaded++
      onProgress?.(uploaded, toUpload.length)
    })
  )

  return photos.map(p => {
    const result = resultMap.get(p.id)
    if (!result) return p
    return { ...p, url: result.url, storagePath: result.path, file: undefined }
  })
}
