"""Apple Photos library extraction and photo retrieval."""

import subprocess
from pathlib import Path
from typing import List, Optional

from config.settings import APPLE_PHOTOS_LIBRARY_PATH
from logger import setup_logger

logger = setup_logger(__name__)


class ApplePhotosExtractor:
    """Handles extraction of photos from Apple Photos library."""

    def __init__(self, library_path: Path = APPLE_PHOTOS_LIBRARY_PATH):
        """
        Initialize the photo extractor.

        Args:
            library_path: Path to Apple Photos library
        """
        self.library_path = library_path
        self.verify_library_access()

    def verify_library_access(self) -> bool:
        """
        Verify that the Apple Photos library is accessible.

        Returns:
            True if accessible, False otherwise
        """
        if not self.library_path.exists():
            logger.error(f"Apple Photos library not found: {self.library_path}")
            return False

        logger.info(f"Apple Photos library found: {self.library_path}")
        return True

    def get_recent_photos(self, count: int = 10) -> List[dict]:
        """
        Get recent photos from Apple Photos library with full metadata.

        Args:
            count: Number of recent photos to retrieve

        Returns:
            List of dicts with photo metadata:
            {
                "id": "photo-uuid",
                "path": "/path/to/photo.jpg",
                "aestheticScore": 0.8,
                "iconicScore": 0.6,
                "promotionScore": 0.5,
                "dateCreated": "2026-04-18T10:30:00Z",
                "width": 4000,
                "height": 3000,
                "isFavorite": false,
                "faceCount": 2,
                "latitude": 51.5074,
                "longitude": -0.1278
            }
        """
        # AppleScript to query Photos.app and output tab-separated data
        applescript_code = f"""
tell application "Photos"
    set allPhotos to every media item
    set photoCount to count of allPhotos

    if photoCount > 0 then
        set startIdx to photoCount - {count} + 1
        if startIdx < 1 then
            set startIdx to 1
        end if

        repeat with i from startIdx to photoCount
            set photo to item i of allPhotos
            set photoID to id of photo
            set photoPath to filename of photo
            set photoDate to date of photo
            set photoFav to favorite of photo

            log photoID & tab & photoPath & tab & (photoDate as text) & tab & (photoFav as text)
        end repeat
    end if
end tell
"""

        output = self.run_applescript(applescript_code)
        if not output:
            logger.warning("AppleScript returned no photos")
            return []

        try:
            # Parse tab-separated output (skip logging prefix)
            result = []
            for line in output.strip().split('\n'):
                if not line.strip():
                    continue

                # AppleScript log output format: "2026-04-18 21:55:21,615 - photos - INFO - <content>"
                # Extract the content after the last dash
                if ' - ' in line:
                    content = line.split(' - ')[-1]
                else:
                    content = line

                parts = content.split('\t')
                if len(parts) >= 4:
                    photo_id = parts[0].strip()
                    photo_path = parts[1].strip()
                    photo_date = parts[2].strip()
                    is_fav = parts[3].strip().lower() == 'true'

                    result.append({
                        "id": photo_id,
                        "path": photo_path,
                        "dateCreated": photo_date,
                        "isFavorite": is_fav,
                        "aestheticScore": 1.0,
                        "iconicScore": 1.0,
                        "promotionScore": 1.0,
                    })

            logger.info(f"Retrieved {len(result)} recent photos from Apple Photos")
            return result
        except Exception as e:
            logger.error(f"Failed to parse AppleScript output: {e}")
            logger.debug(f"Raw output: {output[:500] if output else 'empty'}")
            return []

    def get_album_photos(self, album_name: str) -> List[Path]:
        """
        Get all photos from a specific album.

        Args:
            album_name: Name of the album

        Returns:
            List of photo paths (implementation pending)
        """
        logger.warning(f"get_album_photos: Implementation pending for album '{album_name}'")
        return []

    def get_all_photos(self) -> List[Path]:
        """
        Get all photos from the library.

        Returns:
            List of all photo paths (implementation pending)
        """
        logger.warning("get_all_photos: Implementation pending")
        return []

    def run_applescript(self, script: str) -> str:
        """
        Run an AppleScript and return the output.

        Args:
            script: AppleScript code

        Returns:
            Script output as string (from log statements, which go to stderr)
        """
        try:
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                check=True,
            )
            # AppleScript log output goes to stderr, not stdout
            return result.stderr.strip()
        except subprocess.CalledProcessError as e:
            logger.error(f"AppleScript error: {e.stderr}")
            return ""
