import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { processVideoBatch } from './services/ffmpegService';
import { ProcessSettings } from './types';

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Static folders
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../output');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

app.use('/output', express.static(OUTPUT_DIR));

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Helper to parse boolean strings from FormData
const parseBool = (val: any) => val === 'true';

// Route
app.post('/api/unikalize', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Parse settings from FormData (which are all strings)
    const body = req.body;
    const settings: ProcessSettings = {
      copies: parseInt(body.copies || '1', 10),
      brightness: parseBool(body.brightness),
      contrast: parseBool(body.contrast),
      saturation: parseBool(body.saturation),
      mirror: parseBool(body.mirror),
      rotation: parseBool(body.rotation),
      zoom: parseBool(body.zoom),
      audioSpeed: parseBool(body.audioSpeed),
      audioVolume: parseBool(body.audioVolume),
      audioPitch: parseBool(body.audioPitch),
    };

    console.log(`Received job: ${req.file.originalname}, Copies: ${settings.copies}`);

    const results = await processVideoBatch(req.file.path, req.file.originalname, settings);

    // Optional: Cleanup input file
    // fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      copies: results
    });

  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Serving outputs at http://localhost:${PORT}/output/`);
});