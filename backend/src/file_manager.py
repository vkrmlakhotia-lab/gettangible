"""File system operations for the intake workflow."""

import shutil
from pathlib import Path
from typing import List

from config.settings import INTAKE_BASE_PATH
from logger import setup_logger

logger = setup_logger(__name__)


class IntakeFolderManager:
    """Manages the intake folder and file operations."""

    def __init__(self, base_path: Path = INTAKE_BASE_PATH):
        """
        Initialize the folder manager.

        Args:
            base_path: Root path for intake folder
        """
        self.base_path = base_path
        self.ensure_intake_folder()

    def ensure_intake_folder(self) -> Path:
        """
        Create the intake folder if it doesn't exist.

        Returns:
            Path to intake folder
        """
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Intake folder ready: {self.base_path}")
        return self.base_path

    def copy_photo(self, source: Path, preserve_structure: bool = True) -> Path:
        """
        Copy a photo to the intake folder.

        Args:
            source: Source photo path
            preserve_structure: Whether to preserve folder structure by date/album

        Returns:
            Path to copied file
        """
        if not source.exists():
            raise FileNotFoundError(f"Source photo not found: {source}")

        # For now, copy to root of intake folder
        # Can be enhanced to organize by date/album
        dest = self.base_path / source.name
        shutil.copy2(source, dest)
        logger.info(f"Copied: {source.name}")
        return dest

    def copy_photos_batch(self, sources: List[Path], preserve_structure: bool = True) -> List[Path]:
        """
        Copy multiple photos to the intake folder.

        Args:
            sources: List of source photo paths
            preserve_structure: Whether to preserve folder structure

        Returns:
            List of destination paths
        """
        copied = []
        for source in sources:
            try:
                dest = self.copy_photo(source, preserve_structure)
                copied.append(dest)
            except Exception as e:
                logger.error(f"Failed to copy {source}: {e}")
        return copied

    def get_intake_stats(self) -> dict:
        """
        Get statistics about the intake folder.

        Returns:
            Dictionary with folder stats
        """
        if not self.base_path.exists():
            return {"photos_count": 0, "total_size_mb": 0}

        photos = list(self.base_path.glob("*"))
        total_size = sum(p.stat().st_size for p in photos if p.is_file())

        return {
            "photos_count": len(photos),
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "path": str(self.base_path),
        }
