/**
 * Client-side photo filtering using EXIF and file metadata.
 * Mirrors PHAsset-compatible criteria from backend/src/filters.py.
 *
 * When a custom Capacitor PHAsset plugin is added, swap the fallbacks below
 * for real mediaType / mediaSubtypes values from the native layer.
 */

// PHAsset bitmask values (match iOS PHAssetMediaSubtype)
const SUBTYPE_SCREENSHOT = 1 << 2; // = 4
const MEDIA_TYPE_VIDEO = 2;

// Heuristic fallback threshold when PHAsset data is unavailable
const SCREENSHOT_SIZE_THRESHOLD = 50_000; // 50 KB

export interface FilterablePhoto {
  file: File;
  mediaType?: number;     // PHAsset: 1 = image, 2 = video
  mediaSubtypes?: number; // PHAsset bitmask: 4 = screenshot, 16 = portrait mode
  width?: number;
  height?: number;
}

export function isScreenshot(photo: FilterablePhoto): boolean {
  if (photo.mediaSubtypes !== undefined) {
    return !!(photo.mediaSubtypes & SUBTYPE_SCREENSHOT);
  }
  const name = photo.file.name.toLowerCase();
  return name.includes('screenshot') || photo.file.size < SCREENSHOT_SIZE_THRESHOLD;
}

export function isVideo(photo: FilterablePhoto): boolean {
  if (photo.mediaType !== undefined) return photo.mediaType === MEDIA_TYPE_VIDEO;
  return photo.file.type.startsWith('video/');
}

export function isLowResolution(photo: FilterablePhoto, minMegapixels = 1.0): boolean {
  if (!photo.width || !photo.height) return false;
  return photo.width * photo.height < minMegapixels * 1_000_000;
}

export function applyPhotoFilters<T extends FilterablePhoto>(
  photos: T[],
  options: {
    removeScreenshots?: boolean;
    removeVideos?: boolean;
    minMegapixels?: number;
  } = {}
): T[] {
  let result = photos;
  if (options.removeVideos) result = result.filter(p => !isVideo(p));
  if (options.removeScreenshots) result = result.filter(p => !isScreenshot(p));
  if (options.minMegapixels) result = result.filter(p => !isLowResolution(p, options.minMegapixels));
  return result;
}
