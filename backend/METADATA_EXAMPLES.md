```
YOUR ACTUAL PHOTO METADATA EXAMPLES
====================================

Photo 1: Video of London taken on location
─────────────────────────────────────────
UUID:              C3A4E13E-6C97-4E6B-A32B-8FA535C64787
Type:              Video (1)
Resolution:        1080x1920 (Vertical)
Orientation:       1 (Normal)
Duration:          33.53 seconds
Favorite:          ❌ No
Hidden:            ❌ No
Location:          📍 51.6°N, -0.27°W (London area!)
File Format:       com.apple.quicktime-movie (MOV)
Aesthetic Score:   0.39/1.0 (Below average quality)
Iconic Score:      -1.0 (No, videos don't get scores)
Promotion Score:   0.0 (Not recommended for Memories)
Detected Faces:    7600030534729798 (corrupted/invalid data)


Photo 2: Another Video from London
────────────────────────────────────
UUID:              946D36FF-D62D-45BA-9C0F-031905BC3F23
Type:              Video (1)
Resolution:        1080x1920 (Vertical)
Duration:          13.63 seconds
Location:          📍 51.6°N, -0.27°W (Same location!)
Aesthetic Score:   0.48/1.0 (Slightly better)
Detected Faces:    0 (No faces)


Photo 3: Regular Photo
──────────────────────
UUID:              BA8310AE-A5BB-4035-8791-251C5DF8EE96
Type:              Photo (0)
Resolution:        1600x1200 (Standard 4:3 ratio)
Orientation:       1 (Normal)
Duration:          0.0 (Not a video)
Favorite:          ❌ No
Hidden:            ❌ No
Location:          ❌ No location data (-180° is default/none)
File Format:       public.jpeg (JPEG)
Aesthetic Score:   0.50/1.0 (Average)
Iconic Score:      0.0 (Not iconic)
Detected Faces:    0 (No faces)


WHAT THIS TELLS YOU:
====================

✅ You have location data for some videos!
   - Can build LOCATION-BASED COLLECTIONS
   - Create "Photos from London", "Photos from Paris" albums

✅ Aesthetic scores vary (0.38 to 0.50)
   - Can FILTER BEST QUALITY photos
   - Create "Beautiful photos" collection (score > 0.6)

✅ Mix of formats: MOV videos + JPEG photos
   - Handle different types appropriately
   - Show badges (🎬 for video, 📸 for photo)

✅ Standard orientations (all 1 = normal)
   - Most photos don't need rotation
   - Show landscape/portrait indicators

✅ No one has marked anything favorite/hidden yet
   - Could use aesthetic scores to auto-suggest favorites

❌ Some metadata is corrupted (face count 7600030534729798)
   - Common in real databases
   - Need error handling for invalid values
```

## KEY INSIGHTS FOR SNAPORA

### Most Useful Fields (Immediate Impact):
1. **ZLATITUDE + ZLONGITUDE** → Build map view, location-based albums
2. **ZICONICSCORE** → What makes a "great" photo
3. **ZOVERALLAESTHETICSCORE** → Photo quality ranking
4. **ZDURATION** → Separate videos from photos
5. **ZFAVORITE** → Respect user preferences
6. **ZISDETECTEDSCREENSHOT** → Filter out clutter (already doing!)

### Medium Priority (Smart Features):
7. **ZFACEAREAPOINTS** → Group by portrait/group/selfie
8. **ZDEPTHTYPE** → Show portrait mode photos
9. **ZHDRGAIN** → HDR badge/filter
10. **ZKIND + ZUNIFORMTYPEIDENTIFIER** → File format handling

### Advanced (Future):
11. **ZMOMENT** → Auto-group into "Days"
12. **ZDUPLICATEMETADATAMATCHINGALBUM** → Find duplicates
13. **ZADDEDDATE vs ZDATECREATED** → Show real shot date vs import date
14. **ZCLOUDISMYASSET** → Filter shared vs personal

### Storage/Sync Info (Practical):
15. **ZTRASHEDSTATE** → Filter deleted items
16. **ZCLOUDLOCALSTATE** → Show ☁️ if not downloaded
17. **ZCOMPLETE** → Show loading spinner while processing

---

## Example: How to Use This in Snapora

### "Smart Collections" Feature:

```python
# Get HIGH QUALITY photos (aesthetic score > 0.7)
SELECT * FROM ZASSET
WHERE ZOVERALLAESTHETICSCORE > 0.7
ORDER BY ZOVERALLAESTHETICSCORE DESC

# Get ICONIC photos (Apple recommends)
SELECT * FROM ZASSET
WHERE ZICONICSCORE > 0.5
ORDER BY ZICONICSCORE DESC

# Get GROUP PHOTOS (multiple people)
SELECT * FROM ZASSET
WHERE ZKIND = 0 AND ZFACEAREAPOINTS > 2
ORDER BY ZFACEAREAPOINTS DESC

# Get VIDEOS by location from last 30 days
SELECT * FROM ZASSET
WHERE ZKIND = 1
AND ZLATITUDE != -180.0  -- Has location
AND ZDATECREATED > (strftime('%s', 'now') - 2592000)  -- Last 30 days
ORDER BY ZDATECREATED DESC
```

All this metadata is available RIGHT NOW in your Photos library!
