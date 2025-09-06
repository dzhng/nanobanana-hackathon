import { spawn } from 'node:child_process';
import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const binaryPath = path.join(process.cwd(), 'binary');
const ffmpegPath = path.join(binaryPath, 'ffmpeg');

/**
 * Smooth transition (cross-fade) GIF between two images.
 * - Uses FFmpeg xfade + palettegen/paletteuse for quality.
 * - Scales and crops to width x height without distortion.
 * - Outputs an infinitely looping GIF as ArrayBuffer.
 * - Duration is configurable in milliseconds (default: 3000ms)
 *
 * Requires: npm i @ffmpeg-installer/ffmpeg
 */
export async function createFaceMorphGif({
  fromImage,
  toImage,
  width,
  height,
  durationMs = 1000,
}: {
  fromImage: ArrayBuffer;
  toImage: ArrayBuffer;
  width: number;
  height: number;
  durationMs?: number;
}): Promise<{ outputImage: ArrayBuffer }> {
  if (!fromImage || !toImage) {
    throw new Error('fromImage and toImage are required.');
  }
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('width and height must be positive numbers.');
  }

  // Tunables (change if you need different pacing)
  const DURATION_SEC = durationMs / 1000; // total GIF length in seconds
  const FPS = 18; // 15–20 fps looks great for GIFs
  const HOLD_A = 0; // seconds to linger on first image before fade
  const HOLD_B = 0; // seconds to linger on last image after fade

  // Convert ArrayBuffers to Node Buffers
  const bufA = Buffer.from(new Uint8Array(fromImage));
  const bufB = Buffer.from(new Uint8Array(toImage));

  // Minimal header sniffing to pick a friendly extension (helps FFmpeg probing)
  const sniffExt = (b: Buffer): string => {
    const a = b;
    const ascii = (off: number, len: number) =>
      a.toString('ascii', off, off + len);
    if (a.length >= 8 && a[0] === 0x89 && ascii(1, 3) === 'PNG') return '.png';
    if (a.length >= 3 && a[0] === 0xff && a[1] === 0xd8 && a[2] === 0xff)
      return '.jpg';
    if (a.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP')
      return '.webp';
    if (a.length >= 6 && (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a'))
      return '.gif';
    if (a.length >= 2 && ascii(0, 2) === 'BM') return '.bmp';
    // Fallback—FFmpeg can still probe by content, but we'll use a neutral extension
    return '.img';
  };

  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inA = path.join(tmpDir, `morph_${id}_a${sniffExt(bufA)}`);
  const inB = path.join(tmpDir, `morph_${id}_b${sniffExt(bufB)}`);

  // We’ll capture output via stdout (pipe:1), so no temp file for output
  try {
    await fs.writeFile(inA, bufA);
    await fs.writeFile(inB, bufB);

    // Build FFmpeg filter graph
    // - Loop each still image to a "video" of required length
    // - Scale to fill, crop to exact size, keep pixel aspect = 1
    // - xfade cross-fade across the whole duration (offset = HOLD_A)
    // - Generate/apply palette for high-quality GIF
    const lenA = HOLD_A + DURATION_SEC;
    const lenB = HOLD_B + DURATION_SEC;
    const offset = HOLD_A;

    const scaleCrop = (w: number, h: number) =>
      `scale=${w}:${h}:force_original_aspect_ratio=increase,` +
      `crop=${w}:${h}:(ow-iw)/2:(oh-ih)/2,format=rgba,setsar=1`;

    const filterComplex = [
      `[0:v]${scaleCrop(width, height)},trim=duration=${lenA},setpts=PTS-STARTPTS,fade=out:st=${offset}:d=${DURATION_SEC}:alpha=1[v0]`,
      `[1:v]${scaleCrop(width, height)},trim=duration=${lenB},setpts=PTS-STARTPTS,fade=in:st=${offset}:d=${DURATION_SEC}:alpha=1[v1]`,
      `[v0][v1]overlay,fps=${FPS}[x]`,
      `[x]split[x1][x2]`,
      `[x1]palettegen=stats_mode=diff[p]`,
      `[x2][p]paletteuse=new=1:dither=sierra2_4a`,
    ].join(';');

    const args = [
      '-y',
      // Input A (loop still -> video)
      '-loop',
      '1',
      '-t',
      `${lenA}`,
      '-i',
      inA,
      // Input B (loop still -> video)
      '-loop',
      '1',
      '-t',
      `${lenB}`,
      '-i',
      inB,
      // Filters
      '-filter_complex',
      filterComplex,
      // Output GIF options
      '-gifflags',
      '+transdiff',
      '-loop',
      '0', // 0 = loop forever
      '-f',
      'gif',
      'pipe:1',
    ];

    const outputChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const ff = spawn(ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      ff.stdout!.on('data', chunk => outputChunks.push(Buffer.from(chunk)));
      ff.stderr!.on('data', chunk => stderrChunks.push(Buffer.from(chunk)));

      ff.on('error', reject);
      ff.on('close', code => {
        if (code === 0) return resolve();
        const errMsg =
          Buffer.concat(stderrChunks).toString() ||
          `ffmpeg exited with code ${code}`;
        reject(new Error(errMsg));
      });
    });

    const outBuf = Buffer.concat(outputChunks);
    // Return a clean ArrayBuffer view (slice to the used region)
    const outputImage = outBuf.buffer.slice(
      outBuf.byteOffset,
      outBuf.byteOffset + outBuf.byteLength,
    );
    return { outputImage };
  } finally {
    // Best-effort cleanup
    void fs.unlink(inA).catch(() => {});
    void fs.unlink(inB).catch(() => {});
  }
}
