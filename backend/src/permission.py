"""Permission and user confirmation handling."""

from typing import List
from pathlib import Path

from logger import setup_logger

logger = setup_logger(__name__)


class PermissionHandler:
    """Manages user permissions and confirmations."""

    def __init__(self, auto_approve: bool = False):
        """
        Initialize the permission handler.

        Args:
            auto_approve: If True, automatically approve without asking (dev/testing only)
        """
        self.auto_approve = auto_approve

    def request_photo_intake(self, photo_paths: List[Path], album_name: str = None) -> bool:
        """
        Request user permission to intake photos.

        Args:
            photo_paths: List of photos to intake
            album_name: Name of the source album (optional)

        Returns:
            True if user approves, False otherwise
        """
        if self.auto_approve:
            logger.info(f"Auto-approving intake of {len(photo_paths)} photos")
            return True

        print("\n" + "=" * 60)
        print("PHOTO INTAKE PERMISSION REQUEST")
        print("=" * 60)
        if album_name:
            print(f"Album: {album_name}")
        print(f"Number of photos: {len(photo_paths)}")
        print("\nPhotos to be imported:")
        for i, path in enumerate(photo_paths[:5], 1):  # Show first 5
            print(f"  {i}. {path.name}")
        if len(photo_paths) > 5:
            print(f"  ... and {len(photo_paths) - 5} more")

        print("\n" + "-" * 60)
        response = input("Do you want to proceed? (yes/no): ").strip().lower()

        approved = response in ["yes", "y"]
        if approved:
            logger.info(f"User approved intake of {len(photo_paths)} photos")
        else:
            logger.info("User declined intake")

        return approved

    def request_folder_overwrite(self, folder_path: Path) -> bool:
        """
        Request permission to overwrite existing intake folder contents.

        Args:
            folder_path: Path to the intake folder

        Returns:
            True if user approves, False otherwise
        """
        if self.auto_approve:
            return True

        print(f"\nFolder already exists: {folder_path}")
        response = input("Overwrite existing contents? (yes/no): ").strip().lower()
        return response in ["yes", "y"]
