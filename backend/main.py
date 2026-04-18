#!/usr/bin/env python3
"""
Apple Photos Intake Tool

CLI entry point for the photo intake workflow.
"""

import sys
import argparse
from pathlib import Path

# Add src to path so imports work
sys.path.insert(0, str(Path(__file__).parent / "src"))
sys.path.insert(0, str(Path(__file__).parent / "config"))

from intake_workflow import PhotoIntakeWorkflow, extract_recent_photos_with_metadata
from logger import setup_logger

logger = setup_logger(__name__)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Intake photos from Apple Photos to a local folder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py recent --count 20
  python main.py album "My Album"
  python main.py status
        """,
    )

    parser.add_argument(
        "--auto-approve",
        action="store_true",
        help="Auto-approve without permission prompts (dev/testing only)",
    )
    parser.add_argument(
        "--output-json",
        action="store_true",
        help="Output results as JSON (for programmatic use)",
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Recent photos command
    recent_parser = subparsers.add_parser("recent", help="Intake recent photos")
    recent_parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="Number of recent photos to intake (default: 10)",
    )

    # Album command
    album_parser = subparsers.add_parser("album", help="Intake photos from an album")
    album_parser.add_argument("album_name", help="Name of the album to intake")

    # Status command
    subparsers.add_parser("status", help="Show intake folder status")

    args = parser.parse_args()

    # Initialize workflow
    workflow = PhotoIntakeWorkflow(auto_approve=args.auto_approve)

    # Execute command
    try:
        if args.command == "recent":
            if args.output_json:
                # Extract metadata without copying files
                logger.info(f"Extracting metadata for {args.count} recent photos")
                result = extract_recent_photos_with_metadata(args.count)
                import json
                print(json.dumps(result))
            else:
                # Copy photos to intake folder
                logger.info(f"Intaking {args.count} recent photos")
                result = workflow.intake_recent_photos(args.count)
                print(f"\n✓ Successfully copied {len(result)} photos")

        elif args.command == "album":
            logger.info(f"Intaking album: {args.album_name}")
            result = workflow.intake_album(args.album_name)

            if args.output_json:
                import json
                json_result = [
                    r.to_dict() if hasattr(r, 'to_dict') else r
                    for r in result
                ]
                print(json.dumps(json_result))
            else:
                print(f"\n✓ Successfully copied {len(result)} photos")

        elif args.command == "status":
            stats = workflow.get_status()
            print("\nIntake Folder Status:")
            print(f"  Location: {stats.get('path', 'N/A')}")
            print(f"  Photos: {stats.get('photos_count', 0)}")
            print(f"  Size: {stats.get('total_size_mb', 0)} MB")

        else:
            parser.print_help()

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
