"""Unit tests for photo filtering and duplicate detection."""

import pytest
from pathlib import Path
import sys

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from filters import filter_by_aesthetic_score, detect_duplicates, _haversine_distance


class TestFilterByAestheticScore:
    """Tests for aesthetic score filtering."""

    def test_filter_by_score_above_threshold(self):
        """Photos above threshold are included."""
        photos = [
            {"id": "1", "aestheticScore": 0.8},
            {"id": "2", "aestheticScore": 0.4},
            {"id": "3", "aestheticScore": 0.9},
        ]

        result = filter_by_aesthetic_score(photos, min_score=0.5)

        assert len(result) == 2
        assert result[0]["id"] == "1"
        assert result[1]["id"] == "3"

    def test_filter_by_score_no_match(self):
        """Returns empty list when no photos meet threshold."""
        photos = [
            {"id": "1", "aestheticScore": 0.3},
            {"id": "2", "aestheticScore": 0.2},
        ]

        result = filter_by_aesthetic_score(photos, min_score=0.5)

        assert len(result) == 0

    def test_filter_by_score_default_threshold(self):
        """Uses 0.5 as default threshold."""
        photos = [
            {"id": "1", "aestheticScore": 0.5},
            {"id": "2", "aestheticScore": 0.49},
        ]

        result = filter_by_aesthetic_score(photos)

        assert len(result) == 1
        assert result[0]["id"] == "1"

    def test_filter_by_score_missing_field(self):
        """Treats missing aestheticScore as 0."""
        photos = [
            {"id": "1"},  # No aestheticScore
            {"id": "2", "aestheticScore": 0.8},
        ]

        result = filter_by_aesthetic_score(photos, min_score=0.5)

        assert len(result) == 1
        assert result[0]["id"] == "2"

    def test_filter_by_score_empty_list(self):
        """Handles empty input gracefully."""
        result = filter_by_aesthetic_score([], min_score=0.5)
        assert result == []


class TestDetectDuplicates:
    """Tests for duplicate detection."""

    def test_detect_duplicates_with_matching_album(self):
        """Photos with duplicateMetadataMatchingAlbum are marked as duplicates."""
        photos = [
            {"id": "1", "duplicateMetadataMatchingAlbum": None},
            {"id": "2", "duplicateMetadataMatchingAlbum": "album-x"},
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False
        assert result[1]["isDuplicate"] is True

    def test_detect_duplicates_same_location_close_time(self):
        """Photos at same location taken within 5 seconds are marked as duplicates."""
        photos = [
            {
                "id": "1",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:00Z",
            },
            {
                "id": "2",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:03Z",  # 3 seconds later
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False
        assert result[1]["isDuplicate"] is True

    def test_detect_duplicates_same_location_far_time(self):
        """Photos at same location but far apart in time are not duplicates."""
        photos = [
            {
                "id": "1",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:00Z",
            },
            {
                "id": "2",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:10Z",  # 10 seconds later (beyond 5s threshold)
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False
        assert result[1]["isDuplicate"] is False

    def test_detect_duplicates_different_location_close_time(self):
        """Photos at different locations are not marked as duplicates."""
        photos = [
            {
                "id": "1",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:00Z",
            },
            {
                "id": "2",
                "latitude": 51.5074,
                "longitude": -0.1200,  # Different longitude (several meters away)
                "dateCreated": "2026-04-18T10:30:02Z",
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False
        assert result[1]["isDuplicate"] is False

    def test_detect_duplicates_missing_location(self):
        """Photos without location data are not marked as duplicates."""
        photos = [
            {
                "id": "1",
                "dateCreated": "2026-04-18T10:30:00Z",
            },
            {
                "id": "2",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:01Z",
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False
        assert result[1]["isDuplicate"] is False

    def test_detect_duplicates_missing_time(self):
        """Photos without time data are not marked as duplicates."""
        photos = [
            {
                "id": "1",
                "latitude": 51.5074,
                "longitude": -0.1278,
            },
            {
                "id": "2",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:01Z",
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False
        assert result[1]["isDuplicate"] is False

    def test_detect_duplicates_preserves_other_fields(self):
        """Duplicate detection preserves all other photo fields."""
        photos = [
            {
                "id": "1",
                "name": "photo1.jpg",
                "aestheticScore": 0.8,
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:00Z",
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["id"] == "1"
        assert result[0]["name"] == "photo1.jpg"
        assert result[0]["aestheticScore"] == 0.8
        assert "isDuplicate" in result[0]

    def test_detect_duplicates_empty_list(self):
        """Handles empty input gracefully."""
        result = detect_duplicates([])
        assert result == []

    def test_detect_duplicates_single_photo(self):
        """Single photo cannot be a duplicate."""
        photos = [
            {
                "id": "1",
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:00Z",
            },
        ]

        result = detect_duplicates(photos)

        assert result[0]["isDuplicate"] is False


class TestHaversineDistance:
    """Tests for geographic distance calculation."""

    def test_haversine_distance_same_point(self):
        """Distance between same point is 0."""
        distance = _haversine_distance(51.5074, -0.1278, 51.5074, -0.1278)
        assert distance < 1  # Allow tiny floating point error

    def test_haversine_distance_known_distance(self):
        """Test with known distance (London to Paris ≈ 340 km)."""
        # London: 51.5074, -0.1278
        # Paris: 48.8566, 2.3522
        distance = _haversine_distance(51.5074, -0.1278, 48.8566, 2.3522)

        # Should be roughly 340 km = 340000 meters
        assert 330000 < distance < 350000

    def test_haversine_distance_short_distance(self):
        """Test with short distance."""
        # Two points roughly 111 meters apart in London
        distance = _haversine_distance(
            51.5074, -0.1278,
            51.5084, -0.1278,  # ~0.001 degrees of latitude ≈ 111 meters
        )

        # Should be roughly 111 meters
        assert 100 < distance < 120

    def test_haversine_distance_invalid_coordinates(self):
        """Handles invalid coordinates gracefully."""
        distance = _haversine_distance(None, -0.1278, 51.5074, -0.1278)
        assert distance == float('inf')

    def test_haversine_distance_invalid_type(self):
        """Handles non-numeric coordinates gracefully."""
        distance = _haversine_distance("invalid", -0.1278, 51.5074, -0.1278)
        assert distance == float('inf')


class TestIntegration:
    """Integration tests combining filtering and duplicate detection."""

    def test_filter_and_detect_together(self):
        """Can apply filters and duplicate detection in sequence."""
        photos = [
            {
                "id": "1",
                "aestheticScore": 0.8,
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:00Z",
            },
            {
                "id": "2",
                "aestheticScore": 0.4,
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:02Z",
            },
            {
                "id": "3",
                "aestheticScore": 0.9,
                "latitude": 51.5074,
                "longitude": -0.1278,
                "dateCreated": "2026-04-18T10:30:01Z",
            },
        ]

        # First filter by score
        filtered = filter_by_aesthetic_score(photos, min_score=0.5)
        assert len(filtered) == 2

        # Then detect duplicates
        with_dups = detect_duplicates(filtered)
        assert len(with_dups) == 2
        assert with_dups[0]["isDuplicate"] is False
        assert with_dups[1]["isDuplicate"] is True
