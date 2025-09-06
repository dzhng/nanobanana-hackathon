import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { generateImageWithReferences } from './image-generation';

describe('image-generation', () => {
  it('should generate images with references', async () => {
    // Load the original test image file
    const originalImagePath = path.join(
      __dirname,
      'image-generation-original-image.eval.jpeg',
    );
    const originalImageBuffer = fs.readFileSync(originalImagePath);
    const originalImageArrayBuffer = originalImageBuffer.buffer.slice(
      originalImageBuffer.byteOffset,
      originalImageBuffer.byteOffset + originalImageBuffer.byteLength,
    ) as ArrayBuffer;

    // Load the reference image (hat)
    const referenceImagePath = path.join(
      __dirname,
      'image-generation-reference-image.jpeg',
    );
    const referenceImageBuffer = fs.readFileSync(referenceImagePath);
    const referenceImageArrayBuffer = referenceImageBuffer.buffer.slice(
      referenceImageBuffer.byteOffset,
      referenceImageBuffer.byteOffset + referenceImageBuffer.byteLength,
    ) as ArrayBuffer;

    const result = await generateImageWithReferences({
      prompt: 'Add this hat to the image',
      originalImage: originalImageArrayBuffer,
      referenceImages: [referenceImageArrayBuffer],
    }).catch(error => {
      console.error('Image generation error:', error);
      return;
    });

    // Verify result has content
    assert(result, 'No result returned');
    assert(result.byteLength > 0, 'Generated image is empty');

    console.log('Image generation result:', {
      resultType: typeof result,
      resultLength: result.byteLength,
    });

    // Save the generated image to file
    const outputPath = path.join(
      __dirname,
      'image-generation-test-eval-result.jpeg',
    );
    fs.writeFileSync(outputPath, Buffer.from(result));
    console.log(`Generated image saved to: ${outputPath}`);

    console.log('Image generation test passed');
  });
});
