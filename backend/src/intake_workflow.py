"""Main workflow orchestration for photo intake."""

from pathlib import Path
from typing import List, Optional

from photo_extractor import ApplePhotosExtractor
from permission import PermissionHandler
from file_manager import IntakeFolderManager
from logger import setup_logger

logger = setup_logger(__name__)


class PhotoIntakeWorkflow:
    """Orchestrates the complete photo intake workflow."""

    def __init__(self, auto_approve: bool = False):
        """
        Initialize the workflow.

        Args:
            auto_approve: Skip permission prompts (for testing)
        """
        self.extractor = ApplePhotosExtractor()
        self.permission_handler = PermissionHandler(auto_approve=auto_approve)
        self.file_manager = IntakeFolderManager()

    def intake_recent_photos(self, count: int = 10) -> List[Path]:
        """
        Intake recent photos from Apple Photos.

        Args:
            count: Number of recent photos to intake

        Returns:
            List of successfully copied photo paths
        """
        logger.info(f"Starting intake workflow for {count} recent photos")

        # Step 1: Extract photos from library
        photos = self.extractor.get_recent_photos(count)
        if not photos:
            logger.warning("No recent photos found")
            return []

        # Step 2: Request permission
        if not self.permission_handler.request_photo_intake(photos):
            logger.info("Intake cancelled by user")
            return []

        # Step 3: Copy photos to intake folder
        copied = self.file_manager.copy_photos_batch(photos)
        logger.info(f"Successfully copied {len(copied)} photos")

        return copied

    def intake_album(self, album_name: str) -> List[Path]:
        """
        Intake all photos from a specific album.

        Args:
            album_name: Name of the album to intake

        Returns:
            List of successfully copied photo paths
        """
        logger.info(f"Starting intake workflow for album: {album_name}")

        # Step 1: Extract photos from album
        photos = self.extractor.get_album_photos(album_name)
        if not photos:
            logger.warning(f"No photos found in album: {album_name}")
            return []

        # Step 2: Request permission
        if not self.permission_handler.request_photo_intake(photos, album_name=album_name):
            logger.info("Intake cancelled by user")
            return []

        # Step 3: Copy photos to intake folder
        copied = self.file_manager.copy_photos_batch(photos)
        logger.info(f"Successfully copied {len(copied)} photos from {album_name}")

        return copied

    def get_status(self) -> dict:
        """
        Get current intake folder status.

        Returns:
            Dictionary with intake statistics
        """
        return self.file_manager.get_intake_stats()
