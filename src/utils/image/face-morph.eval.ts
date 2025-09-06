import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { createFaceMorphGif } from './face-morph';

describe('face-morph', () => {
  it('should create face morph GIF from two images', async () => {
    // Load the original image (from image)
    const originalImagePath = path.join(
      __dirname,
      'image-generation-original-image.eval.jpeg',
    );
    const originalImageBuffer = fs.readFileSync(originalImagePath);
    const originalImageArrayBuffer = originalImageBuffer.buffer.slice(
      originalImageBuffer.byteOffset,
      originalImageBuffer.byteOffset + originalImageBuffer.byteLength,
    ) as ArrayBuffer;

    // Load the reference image (to image)
    const referenceImagePath = path.join(
      __dirname,
      'image-generation-reference-image.jpeg',
    );
    const referenceImageBuffer = fs.readFileSync(referenceImagePath);
    const referenceImageArrayBuffer = referenceImageBuffer.buffer.slice(
      referenceImageBuffer.byteOffset,
      referenceImageBuffer.byteOffset + referenceImageBuffer.byteLength,
    ) as ArrayBuffer;

    // Define output dimensions
    const width = 512;
    const height = 512;

    const result = await createFaceMorphGif({
      fromImage: originalImageArrayBuffer,
      toImage: referenceImageArrayBuffer,
      width,
      height,
    }).catch(error => {
      console.error('Face morph error:', error);
      throw error;
    });

    // Verify result has content
    assert(result, 'No result returned');
    assert(result.outputImage, 'No outputImage in result');
    assert(result.outputImage.byteLength > 0, 'Generated GIF is empty');

    console.log('Face morph result:', {
      resultType: typeof result.outputImage,
      resultLength: result.outputImage.byteLength,
      width,
      height,
    });

    // Save the generated GIF to file
    const outputPath = path.join(__dirname, 'face-morph-test-eval-result.gif');
    fs.writeFileSync(outputPath, Buffer.from(result.outputImage));
    console.log(`Generated face morph GIF saved to: ${outputPath}`);

    console.log('Face morph test passed');
  });
});
