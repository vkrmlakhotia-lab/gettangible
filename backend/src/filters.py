"""Photo filtering based on iOS PHAsset metadata."""

from typing import List
import math


# PHAsset mediaType enum values (matches iOS PHAssetMediaType)
MEDIA_TYPE_IMAGE = 1
MEDIA_TYPE_VIDEO = 2

# PHAsset mediaSubtypes bitmask (matches iOS PHAssetMediaSubtype)
SUBTYPE_SCREENSHOT = 1 << 2   # = 4
SUBTYPE_DEPTH_EFFECT = 1 << 4 # = 16 (portrait mode)


def filter_videos(photos: List[dict]) -> List[dict]:
    """Remove video assets. PHAsset mediaType 2 = video, default to image if missing."""
    return [p for p in photos if p.get("mediaType", MEDIA_TYPE_IMAGE) != MEDIA_TYPE_VIDEO]


def filter_screenshots(photos: List[dict]) -> List[dict]:
    """Remove screenshots. PHAsset mediaSubtypes bit 2 (value 4) = screenshot."""
    return [p for p in photos if not (p.get("mediaSubtypes", 0) & SUBTYPE_SCREENSHOT)]


def filter_low_resolution(photos: List[dict], min_megapixels: float = 1.0) -> List[dict]:
    """Remove photos below minimum megapixel count."""
    min_pixels = min_megapixels * 1_000_000
    return [p for p in photos if (p.get("width", 0) * p.get("height", 0)) >= min_pixels]


def deduplicate_bursts(photos: List[dict]) -> List[dict]:
    """
    Keep one photo per burst series.
    Prefers isFavorite within the burst; otherwise keeps the first.
    """
    seen: dict = {}  # burstIdentifier -> index in result
    result = []

    for photo in photos:
        burst_id = photo.get("burstIdentifier")
        if not burst_id:
            result.append(photo)
            continue

        if burst_id not in seen:
            seen[burst_id] = len(result)
            result.append(photo)
        elif photo.get("isFavorite"):
            # Replace the existing burst representative with this favorite
            result[seen[burst_id]] = photo

    return result


def apply_standard_filters(
    photos: List[dict],
    include_videos: bool = False,
    min_megapixels: float = 1.0,
) -> List[dict]:
    """Apply the standard PHAsset filtering pipeline in order."""
    if not include_videos:
        photos = filter_videos(photos)
    photos = filter_screenshots(photos)
    photos = filter_low_resolution(photos, min_megapixels)
    photos = deduplicate_bursts(photos)
    return photos


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two lat/lon points."""
    R = 6371000
    try:
        lat1_r, lon1_r, lat2_r, lon2_r = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2_r - lat1_r
        dlon = lon2_r - lon1_r
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    except (ValueError, TypeError):
        return float("inf")
