const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

// PHAsset constants (mirror iOS PHAssetMediaType / PHAssetMediaSubtype)
const MEDIA_TYPE_VIDEO = 2;
const SUBTYPE_SCREENSHOT = 1 << 2; // = 4

/**
 * POST /api/photos/filter
 *
 * Accepts photo metadata from the iOS PHAsset picker and returns a filtered
 * subset. Does NOT receive image files — only metadata objects.
 *
 * Body: {
 *   photos: Array<PHAssetPhoto>,
 *   options?: {
 *     includeVideos?: boolean,   // default false
 *     minMegapixels?: number,    // default 1.0
 *   }
 * }
 */
app.post('/api/photos/filter', (req, res) => {
  const { photos, options = {} } = req.body;

  if (!Array.isArray(photos)) {
    return res.status(400).json({ error: 'photos must be an array' });
  }

  const includeVideos = options.includeVideos ?? false;
  const minMegapixels = options.minMegapixels ?? 1.0;

  let filtered = photos;
  if (!includeVideos) filtered = filterVideos(filtered);
  filtered = filterScreenshots(filtered);
  filtered = filterLowResolution(filtered, minMegapixels);
  filtered = deduplicateBursts(filtered);

  res.json({
    total: photos.length,
    filtered: filtered.length,
    photos: filtered,
    timestamp: new Date().toISOString(),
  });
});

function filterVideos(photos) {
  return photos.filter(p => (p.mediaType ?? 1) !== MEDIA_TYPE_VIDEO);
}

function filterScreenshots(photos) {
  return photos.filter(p => !((p.mediaSubtypes ?? 0) & SUBTYPE_SCREENSHOT));
}

function filterLowResolution(photos, minMegapixels) {
  const minPixels = minMegapixels * 1_000_000;
  return photos.filter(p => ((p.width ?? 0) * (p.height ?? 0)) >= minPixels);
}

function deduplicateBursts(photos) {
  const seen = new Map(); // burstIdentifier → index in result
  const result = [];

  for (const photo of photos) {
    const burstId = photo.burstIdentifier;
    if (!burstId) {
      result.push(photo);
      continue;
    }
    if (!seen.has(burstId)) {
      seen.set(burstId, result.length);
      result.push(photo);
    } else if (photo.isFavorite) {
      result[seen.get(burstId)] = photo;
    }
  }

  return result;
}

app.listen(PORT, () => {
  console.log(`Tangible photo filter API on port ${PORT}`);
});

module.exports = app;
