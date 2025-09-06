import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { generateHairstyle } from '../route';

// Helper function to create a File object from a file path
function createFileFromPath(filePath: string, fileName: string): File {
  const buffer = fs.readFileSync(filePath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;

  return new File([arrayBuffer], fileName, { type: 'image/jpeg' });
}

describe('generateHairstyle', () => {
  it('should generate hairstyle with original and reference images', async () => {
    // Load the original image
    const originalImagePath = path.join(__dirname, 'original.jpeg');
    const originalImage = createFileFromPath(originalImagePath, 'original.jpeg');

    // Load the reference image
    const referenceImagePath = path.join(__dirname, 'reference.jpeg');
    const referenceImage = createFileFromPath(referenceImagePath, 'reference.jpeg');

    // Start timing
    const startTime = performance.now();

    // Call generateHairstyle function
    const result = await generateHairstyle({
      originalImage,
      referenceImages: [referenceImage],
      widthValue: 400,
      heightValue: 400,
      durationMsValue: 2000,
    }).catch(error => {
      console.error('generateHairstyle error:', error);
      throw error;
    });

    // End timing
    const endTime = performance.now();
    const durationMs = endTime - startTime;
    const durationSeconds = durationMs / 1000;

    console.log(`generateHairstyle execution time: ${durationMs.toFixed(2)} ms (${durationSeconds.toFixed(2)} seconds)`);

    // Verify result has content
    assert(result, 'No result returned');
    assert(result.generatedImage, 'No generatedImage in result');
    assert(result.generatedImage.length > 0, 'Generated image is empty');

    console.log('generateHairstyle result:', {
      generatedImageSize: result.generatedImage.length,
      morphingGif: result.morphingGif ? result.morphingGif.length : null,
    });

    // Save the generated image as composite.jpeg
    const outputPath = path.join(__dirname, 'composite.jpeg');
    fs.writeFileSync(outputPath, result.generatedImage);
    console.log(`Generated composite image saved to: ${outputPath}`);

    // Save the morphing GIF if it exists
    if (result.morphingGif) {
      const gifOutputPath = path.join(__dirname, 'composite.gif');
      fs.writeFileSync(gifOutputPath, result.morphingGif);
      console.log(`Generated morphing GIF saved to: ${gifOutputPath}`);
    }

    console.log('generateHairstyle eval test passed');
  });
});
