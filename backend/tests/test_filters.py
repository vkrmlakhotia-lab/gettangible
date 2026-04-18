"""Unit tests for PHAsset-compatible photo filtering."""

import pytest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from filters import (
    filter_videos,
    filter_screenshots,
    filter_low_resolution,
    deduplicate_bursts,
    apply_standard_filters,
    _haversine_distance,
    MEDIA_TYPE_IMAGE,
    MEDIA_TYPE_VIDEO,
    SUBTYPE_SCREENSHOT,
    SUBTYPE_DEPTH_EFFECT,
)


class TestFilterVideos:
    def test_removes_videos(self):
        photos = [
            {"id": "1", "mediaType": MEDIA_TYPE_IMAGE},
            {"id": "2", "mediaType": MEDIA_TYPE_VIDEO},
            {"id": "3", "mediaType": MEDIA_TYPE_IMAGE},
        ]
        result = filter_videos(photos)
        assert [p["id"] for p in result] == ["1", "3"]

    def test_defaults_to_image_when_missing(self):
        photos = [{"id": "1"}, {"id": "2", "mediaType": MEDIA_TYPE_VIDEO}]
        result = filter_videos(photos)
        assert len(result) == 1
        assert result[0]["id"] == "1"

    def test_empty_list(self):
        assert filter_videos([]) == []


class TestFilterScreenshots:
    def test_removes_screenshots(self):
        photos = [
            {"id": "1", "mediaSubtypes": 0},
            {"id": "2", "mediaSubtypes": SUBTYPE_SCREENSHOT},        # screenshot
            {"id": "3", "mediaSubtypes": SUBTYPE_DEPTH_EFFECT},      # portrait mode, not screenshot
        ]
        result = filter_screenshots(photos)
        assert [p["id"] for p in result] == ["1", "3"]

    def test_removes_screenshot_combined_with_other_flags(self):
        # screenshot (4) | HDR (2) = 6
        photos = [{"id": "1", "mediaSubtypes": SUBTYPE_SCREENSHOT | 2}]
        result = filter_screenshots(photos)
        assert result == []

    def test_keeps_portrait_mode_photos(self):
        photos = [{"id": "1", "mediaSubtypes": SUBTYPE_DEPTH_EFFECT}]
        result = filter_screenshots(photos)
        assert len(result) == 1

    def test_defaults_to_zero_when_missing(self):
        photos = [{"id": "1"}]
        result = filter_screenshots(photos)
        assert len(result) == 1

    def test_empty_list(self):
        assert filter_screenshots([]) == []


class TestFilterLowResolution:
    def test_removes_below_threshold(self):
        photos = [
            {"id": "1", "width": 4000, "height": 3000},  # 12 MP — pass
            {"id": "2", "width": 640, "height": 480},    # 0.3 MP — fail
            {"id": "3", "width": 1920, "height": 1080},  # 2 MP — pass
        ]
        result = filter_low_resolution(photos, min_megapixels=1.0)
        assert [p["id"] for p in result] == ["1", "3"]

    def test_exactly_at_threshold_passes(self):
        # 1000 x 1000 = 1 MP exactly
        photos = [{"id": "1", "width": 1000, "height": 1000}]
        result = filter_low_resolution(photos, min_megapixels=1.0)
        assert len(result) == 1

    def test_missing_dimensions_excluded(self):
        photos = [{"id": "1"}]
        result = filter_low_resolution(photos, min_megapixels=1.0)
        assert result == []

    def test_default_threshold_is_one_megapixel(self):
        photos = [
            {"id": "1", "width": 1000, "height": 1000},  # 1 MP — pass
            {"id": "2", "width": 500, "height": 500},     # 0.25 MP — fail
        ]
        result = filter_low_resolution(photos)
        assert len(result) == 1
        assert result[0]["id"] == "1"

    def test_empty_list(self):
        assert filter_low_resolution([]) == []


class TestDeduplicateBursts:
    def test_keeps_first_of_each_burst(self):
        photos = [
            {"id": "1", "burstIdentifier": "burst-a"},
            {"id": "2", "burstIdentifier": "burst-a"},
            {"id": "3", "burstIdentifier": "burst-b"},
        ]
        result = deduplicate_bursts(photos)
        ids = [p["id"] for p in result]
        assert "1" in ids
        assert "2" not in ids
        assert "3" in ids

    def test_prefers_favorite_within_burst(self):
        photos = [
            {"id": "1", "burstIdentifier": "burst-a", "isFavorite": False},
            {"id": "2", "burstIdentifier": "burst-a", "isFavorite": True},
            {"id": "3", "burstIdentifier": "burst-a", "isFavorite": False},
        ]
        result = deduplicate_bursts(photos)
        assert len(result) == 1
        assert result[0]["id"] == "2"

    def test_photos_without_burst_id_all_kept(self):
        photos = [
            {"id": "1"},
            {"id": "2"},
            {"id": "3"},
        ]
        result = deduplicate_bursts(photos)
        assert len(result) == 3

    def test_mixed_burst_and_non_burst(self):
        photos = [
            {"id": "1"},
            {"id": "2", "burstIdentifier": "burst-a"},
            {"id": "3", "burstIdentifier": "burst-a"},
        ]
        result = deduplicate_bursts(photos)
        assert len(result) == 2

    def test_empty_list(self):
        assert deduplicate_bursts([]) == []


class TestApplyStandardFilters:
    def test_full_pipeline_removes_videos_screenshots_lowres_and_deduplicates(self):
        photos = [
            {"id": "ok",        "mediaType": 1, "mediaSubtypes": 0, "width": 4000, "height": 3000},
            {"id": "video",     "mediaType": 2, "mediaSubtypes": 0, "width": 4000, "height": 3000},
            {"id": "screenshot","mediaType": 1, "mediaSubtypes": 4, "width": 4000, "height": 3000},
            {"id": "lowres",    "mediaType": 1, "mediaSubtypes": 0, "width": 640,  "height": 480},
            {"id": "burst1",    "mediaType": 1, "mediaSubtypes": 0, "width": 4000, "height": 3000, "burstIdentifier": "b"},
            {"id": "burst2",    "mediaType": 1, "mediaSubtypes": 0, "width": 4000, "height": 3000, "burstIdentifier": "b"},
        ]
        result = apply_standard_filters(photos)
        ids = [p["id"] for p in result]
        assert "ok" in ids
        assert "video" not in ids
        assert "screenshot" not in ids
        assert "lowres" not in ids
        assert "burst2" not in ids
        assert len(result) == 2

    def test_include_videos_option(self):
        photos = [
            {"id": "1", "mediaType": 2, "mediaSubtypes": 0, "width": 1920, "height": 1080},
        ]
        result = apply_standard_filters(photos, include_videos=True)
        assert len(result) == 1


class TestHaversineDistance:
    def test_same_point_is_zero(self):
        assert _haversine_distance(51.5074, -0.1278, 51.5074, -0.1278) < 1

    def test_london_to_paris_approx_340km(self):
        dist = _haversine_distance(51.5074, -0.1278, 48.8566, 2.3522)
        assert 330_000 < dist < 350_000

    def test_invalid_coordinates_returns_infinity(self):
        assert _haversine_distance(None, -0.1278, 51.5074, -0.1278) == float("inf")
        assert _haversine_distance("bad", -0.1278, 51.5074, -0.1278) == float("inf")
