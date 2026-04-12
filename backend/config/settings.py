"""Configuration and settings for Apple Photos intake workflow."""

import os
from pathlib import Path

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Intake destination folder
INTAKE_FOLDER_NAME = "Intake"
INTAKE_BASE_PATH = Path.home() / "Documents" / "Snapora" / INTAKE_FOLDER_NAME

# Apple Photos library path
APPLE_PHOTOS_LIBRARY_PATH = Path.home() / "Pictures" / "Photos Library.photoslibrary"

# Logging
LOG_DIR = PROJECT_ROOT / "logs"
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Batch processing
BATCH_SIZE = 50  # Number of photos to process at once

# Permissions
REQUIRE_PERMISSION = True  # Ask user before moving photos
