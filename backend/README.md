# Apple Photos Intake Tool

A modular Python tool to extract photos from Apple Photos, ask for user permission, and copy them to a local intake folder.

## Project Structure

```
apple-photos-intake/
├── src/
│   ├── photo_extractor.py      # Apple Photos library integration
│   ├── permission.py            # User permission/confirmation
│   ├── file_manager.py          # File system operations
│   ├── intake_workflow.py        # Workflow orchestration
│   └── logger.py                # Logging utilities
├── config/
│   └── settings.py              # Configuration and settings
├── tests/                       # Unit tests (coming soon)
├── main.py                      # CLI entry point
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## Module Breakdown

### Core Modules (Implemented)

- **logger.py**: Logging setup with console and file output
- **file_manager.py**: IntakeFolderManager for copying photos to the intake folder
- **permission.py**: PermissionHandler for user confirmation dialogs
- **settings.py**: Centralized configuration

### Pending Implementation

- **photo_extractor.py**: ApplePhotosExtractor - needs AppleScript or framework integration
- **intake_workflow.py**: PhotoIntakeWorkflow - orchestrates the full flow
- **main.py**: CLI interface with commands

## Usage

```bash
# Show recent photos (default: 10)
python main.py recent --count 20

# Intake from a specific album
python main.py album "My Album"

# Check intake folder status
python main.py status

# Auto-approve for testing
python main.py --auto-approve recent --count 5
```

## Next Steps

1. **Implement photo_extractor.py** - Add AppleScript methods to:
   - List recent photos
   - List album photos
   - Access photo file paths

2. **Add unit tests** - Test each module in isolation

3. **Enhanced file organization** - Organize by date/album structure

4. **Error handling** - Add retry logic and better error messages

5. **Config file support** - Load settings from JSON/YAML
