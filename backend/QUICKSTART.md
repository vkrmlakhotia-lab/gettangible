# Quick Start Guide

## Running from VS Code

### Method 1: Task (Recommended)
1. Open the Snapora project in VS Code
2. Press `Cmd + Shift + P` to open Command Palette
3. Type "Tasks: Run Task"
4. Select "Extract Photos from Apple Photos"
5. Follow the interactive prompts in the terminal

### Method 2: Terminal
```bash
cd scripts/apple-photos-intake
python3 extract_photos.py
```

### Method 3: Direct Run
```bash
cd scripts/apple-photos-intake
./run.sh
```

## How It Works

1. **Fetch Photos** - Connects to Apple Photos app and retrieves recent photos
2. **Display List** - Shows up to 50 recent photos with names and dates
3. **Select** - You choose which ones to import by number
4. **Copy** - Selected photos are copied to `test photo dump` folder

## Selection Examples

```
1 5 10          # Import photos 1, 5, and 10
1-5             # Import photos 1 through 5
1 3 5-8         # Mix and match
```

## Notes

- AppleScript requires Photos app to be installed and accessible
- First run may ask for permissions (allow terminal to control Photos app)
- Photos are copied (not moved), originals stay in Apple Photos
- Duplicate filenames are overwritten in the dump folder
