"""Photo filtering and duplicate detection."""

from typing import List
import math
from datetime import datetime


def filter_by_aesthetic_score(photos: List[dict], min_score: float = 0.5) -> List[dict]:
    """
    Filter photos by aesthetic quality score (0-1, higher = better).

    Args:
        photos: List of photo dicts with 'aestheticScore' field
        min_score: Minimum aesthetic score threshold (0-1)

    Returns:
        List of photos meeting the threshold
    """
    return [p for p in photos if (p.get("aestheticScore", 0) >= min_score)]


def detect_duplicates(photos: List[dict]) -> List[dict]:
    """
    Mark likely duplicate photos.

    Heuristics:
    - Same duplicateMetadataMatchingAlbum field (Apple's native duplicate detection)
    - Same location (lat/lon within 5m) + similar time (within 5s)

    Args:
        photos: List of photo dicts with metadata

    Returns:
        List of photos with 'isDuplicate' field added
    """
    TOLERANCE_METERS = 5
    TOLERANCE_SECONDS = 5

    result = []
    for i, photo in enumerate(photos):
        photo = dict(photo)  # Avoid mutating input
        photo["isDuplicate"] = False

        # Check duplicateMetadataMatchingAlbum field (Apple's native detection)
        if photo.get("duplicateMetadataMatchingAlbum"):
            photo["isDuplicate"] = True
            result.append(photo)
            continue

        # Check against earlier photos for geolocation + time match
        for other in result:
            if _photos_likely_duplicate(photo, other, TOLERANCE_METERS, TOLERANCE_SECONDS):
                photo["isDuplicate"] = True
                break

        result.append(photo)

    return result


def _photos_likely_duplicate(
    photo1: dict,
    photo2: dict,
    tolerance_meters: float,
    tolerance_seconds: float,
) -> bool:
    """
    Check if two photos are likely duplicates based on location and time.

    Args:
        photo1: First photo dict
        photo2: Second photo dict
        tolerance_meters: Location tolerance in meters
        tolerance_seconds: Time tolerance in seconds

    Returns:
        True if photos are likely duplicates
    """
    # Both must have location and time
    if not all([
        photo1.get("latitude"),
        photo1.get("longitude"),
        photo1.get("dateCreated"),
        photo2.get("latitude"),
        photo2.get("longitude"),
        photo2.get("dateCreated"),
    ]):
        return False

    # Calculate distance (Haversine)
    dist = _haversine_distance(
        photo1["latitude"],
        photo1["longitude"],
        photo2["latitude"],
        photo2["longitude"],
    )

    if dist > tolerance_meters:
        return False

    # Check time proximity (parse ISO 8601)
    try:
        date1 = datetime.fromisoformat(photo1["dateCreated"].replace("Z", "+00:00"))
        date2 = datetime.fromisoformat(photo2["dateCreated"].replace("Z", "+00:00"))
        time_diff = abs((date1 - date2).total_seconds())
        return time_diff <= tolerance_seconds
    except (ValueError, AttributeError, TypeError):
        # If we can't parse dates, we can't confidently call it a duplicate
        return False


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance in meters between two geographic points.

    Args:
        lat1, lon1: First point latitude/longitude
        lat2, lon2: Second point latitude/longitude

    Returns:
        Distance in meters
    """
    R = 6371000  # Earth radius in meters

    try:
        lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except (ValueError, TypeError):
        # If we get invalid coordinates, return large distance (not a duplicate)
        return float('inf')
