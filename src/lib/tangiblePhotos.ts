// src/lib/tangiblePhotos.ts
import { Capacitor, registerPlugin } from '@capacitor/core'

export interface TangiblePhoto {
  localIdentifier: string
  uri: string          // file:// path — use Capacitor.convertFileSrc() before use in <img>
  date: string         // ISO 8601, e.g. "2024-07-15T14:32:00Z"
  lat: number | null
  lon: number | null
  isFavourite: boolean
  isScreenshot: boolean
  isBurst: boolean
  faceCount: number    // 0 = unknown or no faces
  width: number
  height: number
}

interface TangiblePhotosPluginDef {
  fetchPhotos(): Promise<{ photos: TangiblePhoto[] }>
  getPhotoFile(options: { localIdentifier: string }): Promise<{ path: string }>
}

const TangiblePhotosPlugin = registerPlugin<TangiblePhotosPluginDef>('TangiblePhotos')

/**
 * Fetch all device photos with metadata + thumbnail file paths.
 * On web, returns [] — caller should fall back to the file picker.
 * Throws { message: 'denied' } if the user denies permission.
 */
export async function fetchDevicePhotos(): Promise<TangiblePhoto[]> {
  if (!Capacitor.isNativePlatform()) return []

  const { photos } = await TangiblePhotosPlugin.fetchPhotos()
  return photos.map(p => ({
    ...p,
    uri: Capacitor.convertFileSrc(p.uri),
  }))
}

/**
 * Fetch full-resolution file for a single photo by its local identifier.
 * Returns a web-accessible URL via Capacitor file serving.
 * Only call this for photos the user has confirmed — it is slower than fetchPhotos.
 */
export async function getPhotoFile(localIdentifier: string): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('getPhotoFile is only available on native')
  }
  const { path } = await TangiblePhotosPlugin.getPhotoFile({ localIdentifier })
  return Capacitor.convertFileSrc(path)
}
