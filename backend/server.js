const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

/**
 * POST /api/import/recent
 * Query params:
 *   - count: number of photos (default 10)
 *   - minAestheticScore: filter threshold (0-1, default 0.5)
 *   - detectDuplicates: boolean (default true)
 */
app.post('/api/import/recent', async (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const minAestheticScore = parseFloat(req.query.minAestheticScore) || 0.5;
  const detectDuplicates = req.query.detectDuplicates !== 'false';

  try {
    // Call Python backend
    const pythonResult = await callPythonExtractor('recent', { count });

    if (!pythonResult.success) {
      return res.status(500).json({ error: pythonResult.error });
    }

    // Filter by aesthetic score
    let photos = pythonResult.photos || [];
    photos = photos.filter(p => (p.aestheticScore || 0) >= minAestheticScore);

    // Detect duplicates (TBD - for now return as-is)
    if (detectDuplicates) {
      // TODO: Implement duplicate detection
    }

    res.json({
      count: photos.length,
      photos,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Call Python extraction script
 */
function callPythonExtractor(command, options) {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, 'main.py');
    // Build args: global flags first, then subcommand, then subcommand-specific options
    const args = [pythonScript, '--output-json', command];

    if (options.count) {
      args.push('--count', String(options.count));
    }

    const python = spawn('python3', args, { cwd: __dirname });
    let stdout = '';
    let stderr = '';

    // Handle spawn errors (e.g., Python not found, permission denied)
    python.on('error', (err) => {
      resolve({ success: false, error: `Failed to spawn Python: ${err.message}` });
    });

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve({ success: true, photos: result });
        } catch (e) {
          const errorMsg = stderr || `JSON parse error: ${e.message}`;
          resolve({ success: false, error: errorMsg });
        }
      } else {
        resolve({ success: false, error: stderr || `Python exited with code ${code}` });
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Apple Photos import server listening on port ${PORT}`);
});

module.exports = app;
