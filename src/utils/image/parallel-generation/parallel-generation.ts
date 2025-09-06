import { generateObject } from 'ai';
import z from 'zod';
import dedent from 'dedent';

import { gpt5MiniModel } from '@/utils/ai/providers';
import { generateImageWithReferences } from '@/utils/image/image-generation/image-generation';

export async function generateImageWithReferenceParallel({
  prompt,
  originalImage,
  referenceImage,
  width = 800,
  height = 800,
  numGenerations = 3,
}: {
  prompt: string;
  originalImage: ArrayBuffer;
  referenceImage: ArrayBuffer;
  width?: number;
  height?: number;
  numGenerations?: number;
}): Promise<ArrayBuffer> {
  // Generate multiple images in parallel
  const results = await Promise.allSettled(
    Array.from({ length: numGenerations }, () =>
      generateImageWithReferences({
        prompt,
        originalImage,
        referenceImages: [referenceImage],
        width,
        height,
      })
    )
  );

  // Filter out failed generations and log errors
  const successfulResults = results
    .map((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Generation ${index + 1} failed:`, result.reason);
        return null;
      }
      return { image: result.value, index };
    })
    .filter((result): result is { image: ArrayBuffer; index: number } => result !== null);

  if (successfulResults.length === 0) {
    throw new Error('All image generations failed');
  }

  // If only one successful result, return it
  if (successfulResults.length === 1) {
    const result = successfulResults[0];
    return result.image!;
  }

  // Convert original image to base64 for GPT evaluation
  const referenceImageBase64 = Buffer.from(referenceImage).toString('base64');
  const referenceImageUrl = `data:image/jpeg;base64,${referenceImageBase64}`;

  // Use GPT to evaluate and pick the best image
  const evaluation = await generateObject({
    model: gpt5MiniModel,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: dedent`
              You are an expert image evaluator. I have generated ${successfulResults.length} variations of an image based on the original reference image of a hairstyle.

              Please evaluate each generated image and pick the BEST one based on:
              1. How well the hairstyle matches the reference style, length, and color
              2. Natural integration with the person's face and head
              3. Lighting and shadow consistency of the hairstyle to the face and background
              4. Overall quality and realism

              Return the index of the best image (0-based) and your reasoning.

              Here is the original reference image of a hairstyle:
            `,
          },
          {
            type: 'image',
            image: referenceImageUrl,
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: "Ok, I'm ready to evaluate the generated images",
          },
        ],
      },
      {
        role: 'user',
        content: [
          ...successfulResults.map((result) => ({
            type: 'image' as const,
            image: Buffer.from(result.image!).toString('base64'),
          })),
          {
            type: 'text',
            text: 'The generated images. The first image is at index 0, the second image is at index 1, etc.',
          },
        ],
      },
    ],
    schema: z.object({
      reason: z.string().describe('Detailed reason for choosing this image'),
      bestIndex: z.number().describe('The 0-based index of the best generated image'),
    }),
  });

  const bestResult = successfulResults[evaluation.object.bestIndex];

  if (!bestResult || !bestResult.image) {
    throw new Error('Selected best result is invalid');
  }

  console.info('Evaluation result:', evaluation.object);
  return bestResult.image;
}
