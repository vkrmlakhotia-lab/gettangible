#!/usr/bin/env python3
"""
Apple Photos Extractor - Interactive photo selection and import
Run from VS Code terminal: python extract_photos.py
"""

import sqlite3
import shutil
import sys
from pathlib import Path
from typing import List, Tuple

# Configuration
PHOTOS_DUMP_FOLDER = Path.home() / "Documents" / "Claude" / "Projects" / "Snapora" / "test photo dump"
PHOTOS_LIBRARY_PATH = Path.home() / "Pictures" / "Photos Library.photoslibrary"
ORIGINALS_PATH = PHOTOS_LIBRARY_PATH / "originals"
DERIVATIVES_PATH = PHOTOS_LIBRARY_PATH / "resources" / "derivatives" / "masters"
PHOTOS_DB = PHOTOS_LIBRARY_PATH / "database" / "Photos.sqlite"


def get_recent_photos(limit: int = 50, exclude_screenshots: bool = True) -> List[Tuple[str, str, dict]]:
    """
    Get recent photos from Apple Photos library database.
    Returns list of (filename, uuid, metadata) tuples.
    """
    if not PHOTOS_DB.exists():
        print(f"Photos database not found at: {PHOTOS_DB}")
        return []

    try:
        conn = sqlite3.connect(str(PHOTOS_DB))
        cursor = conn.cursor()

        # Query for recent photos with rich metadata
        where_clause = "WHERE ZTRASHEDSTATE = 0"
        if exclude_screenshots:
            where_clause += " AND ZISDETECTEDSCREENSHOT = 0"

        query = f"""
        SELECT
            ZFILENAME,
            ZUUID,
            ZDATECREATED,
            ZWIDTH,
            ZHEIGHT,
            ZKIND,
            ZFAVORITE,
            ZHIDDEN,
            ZLATITUDE,
            ZLONGITUDE,
            ZUNIFORMTYPEIDENTIFIER
        FROM ZASSET
        {where_clause}
        ORDER BY ZMODIFICATIONDATE DESC
        LIMIT ?
        """

        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        conn.close()

        photos = []
        for row in rows:
            filename, uuid, date_created, width, height, kind, favorite, hidden, lat, lon, file_type = row
            metadata = {
                'uuid': str(uuid),
                'date_created': date_created,
                'width': width,
                'height': height,
                'kind': kind,  # 0=photo, 1=video
                'is_favorite': bool(favorite),
                'is_hidden': bool(hidden),
                'latitude': lat if lat != -180.0 else None,
                'longitude': lon if lon != -180.0 else None,
                'file_type': str(file_type),
            }
            photos.append((str(filename), str(uuid), metadata))

        return photos

    except Exception as e:
        print(f"Database error: {e}")
        return []


def get_photos_by_person(person_name: str, limit: int = 50, exclude_screenshots: bool = True) -> List[Tuple[str, str, dict]]:
    """
    Get photos of a specific person by name.
    Returns list of (filename, uuid, metadata) tuples.
    """
    if not PHOTOS_DB.exists():
        print(f"Photos database not found at: {PHOTOS_DB}")
        return []

    try:
        conn = sqlite3.connect(str(PHOTOS_DB))
        cursor = conn.cursor()

        where_clause = "WHERE ZASSET.ZTRASHEDSTATE = 0"
        if exclude_screenshots:
            where_clause += " AND ZASSET.ZISDETECTEDSCREENSHOT = 0"

        query = f"""
        SELECT DISTINCT
            ZASSET.ZFILENAME,
            ZASSET.ZUUID,
            ZASSET.ZDATECREATED,
            ZASSET.ZWIDTH,
            ZASSET.ZHEIGHT,
            ZASSET.ZKIND,
            ZASSET.ZFAVORITE,
            ZASSET.ZHIDDEN,
            ZASSET.ZLATITUDE,
            ZASSET.ZLONGITUDE,
            ZASSET.ZUNIFORMTYPEIDENTIFIER
        FROM ZASSET
        JOIN ZDETECTEDFACE ON ZASSET.Z_PK = ZDETECTEDFACE.ZASSETFORFACE
        JOIN ZPERSON ON ZDETECTEDFACE.ZPERSONFORFACE = ZPERSON.Z_PK
        {where_clause}
        AND (ZPERSON.ZDISPLAYNAME = ? OR ZPERSON.ZFULLNAME LIKE ?)
        ORDER BY ZASSET.ZMODIFICATIONDATE DESC
        LIMIT ?
        """

        cursor.execute(query, (person_name, f"%{person_name}%", limit))
        rows = cursor.fetchall()
        conn.close()

        photos = []
        for row in rows:
            filename, uuid, date_created, width, height, kind, favorite, hidden, lat, lon, file_type = row
            metadata = {
                'uuid': str(uuid),
                'date_created': date_created,
                'width': width,
                'height': height,
                'kind': kind,
                'is_favorite': bool(favorite),
                'is_hidden': bool(hidden),
                'latitude': lat if lat != -180.0 else None,
                'longitude': lon if lon != -180.0 else None,
                'file_type': str(file_type),
            }
            photos.append((str(filename), str(uuid), metadata))

        return photos

    except Exception as e:
        print(f"Database error: {e}")
        return []


def get_photo_path_by_uuid(photo_uuid: str) -> Path:
    """
    Find the actual file path of a photo by UUID.
    Photos are stored in multiple locations within the library.
    """
    if not photo_uuid:
        return None

    # Get the first character of UUID (determines subfolder like A, B, C, etc.)
    first_char = photo_uuid[0].upper()

    # Search in multiple possible locations
    search_locations = [
        DERIVATIVES_PATH / first_char,  # resources/derivatives/masters/
        PHOTOS_LIBRARY_PATH / "scopes" / "cloudsharing" / "resources" / "derivatives" / "masters" / first_char,  # cloudsharing photos
    ]

    # Try to find the photo in each location
    for search_dir in search_locations:
        if search_dir.exists():
            for file in search_dir.glob(f"{photo_uuid}_*_c.*"):
                if file.is_file():
                    return file

    # Fallback: broad search for the UUID in originals
    if ORIGINALS_PATH.exists():
        for file in ORIGINALS_PATH.rglob(f"{photo_uuid}*"):
            if file.is_file():
                return file

    # Last resort: search everywhere for this UUID
    for file in PHOTOS_LIBRARY_PATH.rglob(f"{photo_uuid}*"):
        if file.is_file() and "_c." in file.name:  # Look for processed versions
            return file

    return None


def copy_photos_to_dump(photo_paths: List[Path]) -> int:
    """Copy selected photos to dump folder. Returns count of successful copies."""
    if not PHOTOS_DUMP_FOLDER.exists():
        PHOTOS_DUMP_FOLDER.mkdir(parents=True, exist_ok=True)
        print(f"Created folder: {PHOTOS_DUMP_FOLDER}")

    successful = 0
    for photo_path in photo_paths:
        if photo_path and photo_path.exists():
            try:
                dest = PHOTOS_DUMP_FOLDER / photo_path.name
                shutil.copy2(photo_path, dest)
                print(f"  ✓ {photo_path.name}")
                successful += 1
            except Exception as e:
                print(f"  ✗ {photo_path.name}: {e}")
        else:
            print(f"  ✗ Could not find file: {photo_path}")

    return successful


def main():
    """Main interactive flow."""
    print("\n" + "="*60)
    print("APPLE PHOTOS EXTRACTOR")
    print("="*60)

    # Ask what to search for
    print("\nSearch modes:")
    print("  1. Recent photos (default)")
    print("  2. Photos of a person by name")
    search_mode = input("\nEnter mode (1-2) [default: 1]: ").strip() or "1"

    person_name = None
    if search_mode == "2":
        person_name = input("Enter person's name (e.g., 'Kabir', 'Urmila'): ").strip()
        if not person_name:
            print("✗ No person name provided")
            sys.exit(1)

    # Check dump folder
    if not PHOTOS_DUMP_FOLDER.exists():
        print(f"\n⚠️  Dump folder doesn't exist: {PHOTOS_DUMP_FOLDER}")
        try:
            PHOTOS_DUMP_FOLDER.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created dump folder")
        except Exception as e:
            print(f"✗ Failed to create folder: {e}")
            sys.exit(1)
    else:
        print(f"✓ Dump folder: {PHOTOS_DUMP_FOLDER}")

    # Check Photos library
    if not PHOTOS_LIBRARY_PATH.exists():
        print(f"✗ Photos library not found: {PHOTOS_LIBRARY_PATH}")
        sys.exit(1)
    else:
        print(f"✓ Photos library found")

    # Fetch photos
    if person_name:
        print(f"\nSearching for photos of '{person_name}'...")
        photos = get_photos_by_person(person_name, limit=50)
    else:
        print("\nFetching recent photos from Apple Photos...")
        photos = get_recent_photos(limit=50)

    if not photos:
        print("✗ No photos found. Make sure Photos app is accessible.")
        sys.exit(1)

    print(f"✓ Found {len(photos)} photos\n") if person_name else print(f"✓ Found {len(photos)} recent photos\n")

    # Display photos
    print("Available photos:")
    print("-" * 80)
    for i, (name, uuid, metadata) in enumerate(photos, 1):
        kind = "Video" if metadata['kind'] == 1 else "Photo"
        fav = "★" if metadata['is_favorite'] else " "
        size = f"{metadata['width']}x{metadata['height']}" if metadata['width'] else "?"
        print(f"{i:2}. {fav} {name:45} {kind:5} {size:10}")

    # Get user selection
    print("-" * 80)
    print("\nEnter photo numbers to import (e.g., '1 5 10' or '1-5'):")
    print("Press Enter with no input to cancel")

    selection_input = input("> ").strip()

    if not selection_input:
        print("Cancelled.")
        sys.exit(0)

    # Parse selection
    selected_indices = []
    try:
        # Handle ranges like "1-5"
        for part in selection_input.split():
            if "-" in part:
                start, end = part.split("-")
                selected_indices.extend(range(int(start)-1, int(end)))
            else:
                selected_indices.append(int(part) - 1)
    except (ValueError, IndexError):
        print("✗ Invalid input")
        sys.exit(1)

    # Validate selections
    selected_indices = [i for i in selected_indices if 0 <= i < len(photos)]
    if not selected_indices:
        print("✗ No valid selections")
        sys.exit(1)

    # Resolve photo paths
    print(f"\nImporting {len(selected_indices)} photos...")
    photo_paths = []
    for idx in selected_indices:
        photo_name, photo_uuid, metadata = photos[idx]
        photo_path = get_photo_path_by_uuid(photo_uuid)
        if photo_path:
            photo_paths.append(photo_path)
            print(f"  Found: {photo_path.name}")

    if not photo_paths:
        print("✗ Could not locate any selected photos in the library")
        sys.exit(1)

    # Copy photos
    print("\nCopying photos:")
    successful = copy_photos_to_dump(photo_paths)

    # Summary
    print("\n" + "="*60)
    print(f"✓ Successfully imported {successful}/{len(photo_paths)} photos")
    print(f"Location: {PHOTOS_DUMP_FOLDER}")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
