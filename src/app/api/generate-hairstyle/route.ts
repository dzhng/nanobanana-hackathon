import { NextRequest, NextResponse } from 'next/server';
import dedent from 'dedent';

import { createFaceMorphGif } from '@/utils/image/facemorph/face-morph';
import { removeHair } from '@/utils/image/remove-hair/remove-hair';
import { relightImage } from '@/utils/image/relight/relight';
import { generateImageWithReferenceParallel } from '@/utils/image/parallel-generation/parallel-generation';

async function generateHairstyle({
  originalImage,
  referenceImages,
  widthValue,
  heightValue,
  durationMsValue,
}: {
  originalImage: File;
  referenceImages: File[];
  widthValue?: number;
  heightValue?: number;
  durationMsValue?: number;
}): Promise<{
  generatedImage: Buffer;
  morphingGif: Buffer | null;
}> {
  // Set defaults if not provided
  const finalWidth = widthValue || 400;
  const finalHeight = heightValue || 400;

  const originalImageArrayBuffer = await originalImage.arrayBuffer();
  const referenceImageArrayBuffers = await Promise.all(
    referenceImages.map(async image => image.arrayBuffer()),
  );

  const [cleanedImage, relitReference] = await Promise.all([
    removeHair({
      originalImage: originalImageArrayBuffer,
      width: finalWidth,
      height: finalHeight,
    }),
    relightImage({
      imageToRelight: referenceImageArrayBuffers[0],
      referenceImage: originalImageArrayBuffer,
      width: finalWidth,
      height: finalHeight,
    })
  ]);

  const generatedImage = await generateImageWithReferenceParallel({
    prompt: dedent`
      # Role:
      You are an expert photo editor. Your task is to take an image of a person and seamlessly add a new hairstyle to the person and return a new composite image.

      # Specifications:

      ## Person to add the hairstyle to:
      The first image provided.

      ## Hairstyle to add:
      The second image provided.

      ## Final Image Requirements:
      - The output image's style, lighting, shadows, reflections, and camera perspective must exactly match the original image. Only modify the hairstyle, nothing else.
      - The added hairstyle should exactly match the reference image's hairstyle's length, size, color, style, and parting (e.g., left, right, center), even if it looks unusual or unrealistic. 
      - Make sure the length of the new hairstyle matches the length of the reference hairstyle. E.g. if the reference hairstyle extends down past the person's shoulders, the new hairstyle should also extend down past the person's shoulders.
      - Do not just copy and paste the hairstyle. You must intelligently re-render it to fit the scene of the original image. Adjust the hairstyle's perspective and orientation to the original person's perspective, scale it appropriately, and ensure it casts realistic shadows and have proper lighting according to the original image's light sources. The new hairstyle should look like it is part of the original image.
      - You must NOT return the original person image without hairstyle placement. Do NOT return a bald person. The new hairstyle must be always present in the composite image.

      The output should ONLY be the final, composed image. Do not add any text or explanation.
    `,
    originalImage: cleanedImage,
    referenceImage: relitReference,
    numGenerations: 5,
    width: finalWidth,
    height: finalHeight,
  });

  // Create morphing GIF between original and generated images
  const gifOutput = await createFaceMorphGif({
    fromImage: originalImageArrayBuffer,
    toImage: generatedImage,
    width: finalWidth,
    height: finalHeight,
    ...(durationMsValue && { durationMs: durationMsValue }),
  }).catch(error => {
    console.error('Face morph error:', error);
    return null;
  });

  return {
    generatedImage: Buffer.from(generatedImage),
    morphingGif: gifOutput?.outputImage
      ? Buffer.from(gifOutput.outputImage)
      : null,
  };
}

export async function generateHairstyleWithRetry({
  originalImage,
  referenceImages,
  widthValue,
  heightValue,
  durationMsValue,
  maxRetries = 2,
}: {
  originalImage: File;
  referenceImages: File[];
  widthValue?: number;
  heightValue?: number;
  durationMsValue?: number;
  maxRetries?: number;
}): Promise<{
  generatedImage: Buffer;
  morphingGif: Buffer | null;
}> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateHairstyle({
        originalImage,
        referenceImages,
        widthValue,
        heightValue,
        durationMsValue,
      });
    } catch (error) {
      lastError = error as Error;
      console.error(`generateHairstyle attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<
  NextResponse<
    | { error: string }
    | {
        generatedImage: string;
        morphingGif: string | null;
      }
  >
> {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    const originalImage = formData.get('originalImage');
    if (!(originalImage instanceof File)) {
      return NextResponse.json(
        { error: 'Field "originalImage" is required and must be a file' },
        { status: 400 },
      );
    }

    const referenceImages = formData
      .getAll('referenceImages')
      .filter((v): v is File => v instanceof File);
    if (referenceImages.length === 0) {
      return NextResponse.json(
        { error: 'At least one "referenceImages" file is required' },
        { status: 400 },
      );
    }

    // Parse optional durationMs parameter
    const durationMs = formData.get('durationMs');
    let durationMsValue: number | undefined;
    if (durationMs !== null) {
      const parsedDuration = parseInt(durationMs.toString(), 10);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        return NextResponse.json(
          { error: 'Field "durationMs" must be a positive number' },
          { status: 400 },
        );
      }
      durationMsValue = parsedDuration;
    }

    // Parse optional width and height parameters
    const width = formData.get('width');
    const height = formData.get('height');
    let widthValue: number | undefined;
    let heightValue: number | undefined;

    if (width !== null) {
      const parsedWidth = parseInt(width.toString(), 10);
      if (isNaN(parsedWidth) || parsedWidth <= 0) {
        return NextResponse.json(
          { error: 'Field "width" must be a positive number' },
          { status: 400 },
        );
      }
      widthValue = parsedWidth;
    }

    if (height !== null) {
      const parsedHeight = parseInt(height.toString(), 10);
      if (isNaN(parsedHeight) || parsedHeight <= 0) {
        return NextResponse.json(
          { error: 'Field "height" must be a positive number' },
          { status: 400 },
        );
      }
      heightValue = parsedHeight;
    }

    const result = await generateHairstyleWithRetry({
      originalImage,
      referenceImages,
      widthValue,
      heightValue,
      durationMsValue,
    });

    // Convert buffers to base64 for JSON response
    const generatedImageBase64 = result!.generatedImage.toString('base64');
    const gifBase64 = result!.morphingGif
      ? result!.morphingGif.toString('base64')
      : null;

    return NextResponse.json({
      generatedImage: `data:image/jpeg;base64,${generatedImageBase64}`,
      morphingGif: gifBase64 ? `data:image/gif;base64,${gifBase64}` : null,
    });
  } catch (error) {
    console.error('generate-image route error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
