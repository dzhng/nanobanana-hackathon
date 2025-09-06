import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { relightImage } from './relight';

// Helper function to create an ArrayBuffer from a file path
function createArrayBufferFromPath(filePath: string): ArrayBuffer {
  const buffer = fs.readFileSync(filePath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

describe('relightImage', () => {
  it('should relight image to match reference lighting', async () => {
    // Load the image to relight
    const imageToRelightPath = path.join(__dirname, 'image-to-relight.jpeg');
    const imageToRelight = createArrayBufferFromPath(imageToRelightPath);

    // Load the reference image
    const referenceImagePath = path.join(__dirname, 'reference.jpeg');
    const referenceImage = createArrayBufferFromPath(referenceImagePath);

    // Start timing
    const startTime = performance.now();

    // Call relightImage function
    const result = await relightImage({
      imageToRelight,
      referenceImage,
      width: 400,
      height: 400,
    }).catch(error => {
      console.error('relightImage error:', error);
      throw error;
    });

    // End timing
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    const durationSeconds = durationMs / 1000;

    console.log(`relightImage execution time: ${durationMs.toFixed(2)} ms (${durationSeconds.toFixed(2)} seconds)`);

    // Verify result has content
    assert(result, 'No result returned');
    assert(result.byteLength > 0, 'Result ArrayBuffer is empty');

    console.log('relightImage result:', {
      resultSize: result.byteLength,
    });

    // Save the relighted image
    const outputPath = path.join(__dirname, 'relighted-result.jpeg');
    fs.writeFileSync(outputPath, Buffer.from(result));
    console.log(`Relighted image saved to: ${outputPath}`);

    console.log('relightImage eval test passed');
  });
});
