import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProcessSettings, GeneratedFileInfo } from '../types';

// Set the binary path
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.error("FFmpeg binary not found in ffmpeg-static!");
}

const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;
const getBool = () => Math.random() > 0.5;

/**
 * Helper to build the filter string and processing logic for a single copy
 */
const createUniqueCopy = (
  inputPath: string,
  outputDir: string,
  originalName: string,
  settings: ProcessSettings,
  index: number
): Promise<GeneratedFileInfo> => {
  return new Promise((resolve, reject) => {
    const uniqueId = `copy_${uuidv4().split('-')[0]}`;
    const ext = path.extname(originalName);
    const outputFilename = `${uniqueId}${ext}`;
    const outputPath = path.join(outputDir, outputFilename);

    // Build Video Filters
    const videoFilters: string[] = [];
    const logs: string[] = [];

    // 1. EQ (Brightness, Contrast, Saturation)
    let b = 0, c = 1, s = 1;
    if (settings.brightness) b = getRandom(-0.08, 0.08);
    if (settings.contrast) c = getRandom(0.9, 1.1);
    if (settings.saturation) s = getRandom(0.9, 1.1);
    
    if (settings.brightness || settings.contrast || settings.saturation) {
      videoFilters.push(`eq=brightness=${b.toFixed(3)}:contrast=${c.toFixed(3)}:saturation=${s.toFixed(3)}`);
      logs.push(`EQ(b:${b.toFixed(2)}, c:${c.toFixed(2)}, s:${s.toFixed(2)})`);
    }

    // 2. Rotation (Rotate command uses radians)
    if (settings.rotation) {
      const angleDeg = getRandom(-2, 2);
      const angleRad = (angleDeg * Math.PI) / 180;
      // 'ow' and 'oh' keep original width/height to avoid resizing canvas too oddly, 
      // but 'rotate' usually fills corners with black.
      videoFilters.push(`rotate=${angleRad.toFixed(4)}`);
      logs.push(`Rot(${angleDeg.toFixed(1)}deg)`);
    }

    // 3. Zoom (Scale up slightly + Crop to original center)
    if (settings.zoom) {
      const zoomFactor = getRandom(1.01, 1.05);
      // scale=iw*zoom:ih*zoom, crop=iw:ih
      videoFilters.push(`scale=iw*${zoomFactor.toFixed(3)}:ih*${zoomFactor.toFixed(3)},crop=iw:ih`);
      logs.push(`Zoom(${((zoomFactor-1)*100).toFixed(1)}%)`);
    }

    // 4. Mirror
    if (settings.mirror && getBool()) {
      videoFilters.push('hflip');
      logs.push('Mirror(H)');
    }

    // Build Audio Filters
    const audioFilters: string[] = [];
    
    // 5. Volume
    if (settings.audioVolume) {
      const vol = getRandom(0.9, 1.1);
      audioFilters.push(`volume=${vol.toFixed(2)}`);
      logs.push(`Vol(${vol.toFixed(2)})`);
    }

    // 6. Speed (atempo)
    if (settings.audioSpeed) {
      const speed = getRandom(0.98, 1.02);
      audioFilters.push(`atempo=${speed.toFixed(3)}`);
      logs.push(`Spd(${speed.toFixed(2)})`);
    }

    // 7. Pitch (asetrate + aresample)
    if (settings.audioPitch) {
      const pitch = getRandom(0.97, 1.03);
      // Assuming 44100Hz base, but valid for most. 
      // Note: This changes duration inversely to pitch.
      audioFilters.push(`asetrate=44100*${pitch.toFixed(3)},aresample=44100`);
      logs.push(`Pitch(${pitch.toFixed(2)})`);
    }

    const command = ffmpeg(inputPath);

    if (videoFilters.length > 0) {
      command.videoFilters(videoFilters.join(','));
    }

    if (audioFilters.length > 0) {
      command.audioFilters(audioFilters.join(','));
    }

    // Execute
    command
      .output(outputPath)
      .on('end', () => {
        resolve({
          id: uniqueId,
          filename: outputFilename,
          url: `http://localhost:4000/output/${outputFilename}`,
          filters: logs.join(', ') || 'No filters'
        });
      })
      .on('error', (err) => {
        console.error(`Error processing copy ${index}:`, err);
        reject(err);
      })
      .run();
  });
};

export const processVideoBatch = async (
  inputPath: string,
  originalName: string,
  settings: ProcessSettings
): Promise<GeneratedFileInfo[]> => {
  const results: GeneratedFileInfo[] = [];
  const outputDir = path.join(__dirname, '../../output'); // ensure this exists

  // Process sequentially to avoid killing the CPU
  for (let i = 0; i < settings.copies; i++) {
    try {
      const result = await createUniqueCopy(inputPath, outputDir, originalName, settings, i);
      results.push(result);
    } catch (e) {
      console.error(`Failed to generate copy #${i + 1}`, e);
    }
  }

  return results;
};