import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { removeHair } from './remove-hair';

// Helper function to create an ArrayBuffer from a file path
function createArrayBufferFromPath(filePath: string): ArrayBuffer {
  const buffer = fs.readFileSync(filePath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

describe('removeHair', () => {
  it('should remove hair from the input image', async () => {
    // Load the input image
    const inputImagePath = path.join(__dirname, 'input.jpeg');
    const inputImage = createArrayBufferFromPath(inputImagePath);

    // Start timing
    const startTime = performance.now();

    // Call removeHair function
    const result = await removeHair({
      originalImage: inputImage,
      width: 512,
      height: 512,
    }).catch(error => {
      console.error('removeHair error:', error);
      throw error;
    });

    // End timing
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    const durationSeconds = durationMs / 1000;

    console.log(`removeHair execution time: ${durationMs.toFixed(2)} ms (${durationSeconds.toFixed(2)} seconds)`);

    // Verify result has content
    assert(result, 'No result returned');
    assert(result.byteLength > 0, 'Result ArrayBuffer is empty');

    console.log('removeHair result:', {
      resultSize: result.byteLength,
    });

    // Save the hair-removed image
    const outputPath = path.join(__dirname, 'result.jpeg');
    fs.writeFileSync(outputPath, Buffer.from(result));
    console.log(`Hair-removed image saved to: ${outputPath}`);

    console.log('removeHair eval test passed');
  });
});
