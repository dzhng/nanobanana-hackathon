import dedent from 'dedent';
import { generateImageWithReferences } from '../image-generation/image-generation';

export async function relightImage({
  imageToRelight,
  referenceImage,
  width,
  height,
}: {
  imageToRelight: ArrayBuffer;
  referenceImage: ArrayBuffer;
  width: number;
  height: number;
}): Promise<ArrayBuffer> {
  return await generateImageWithReferences({
    prompt: dedent`
      # Role:
      You are an expert photo editor. Your task is to relight the image to match the reference image's lighting. Keep everything else the same.

      # Specifications:

      ## Image to relight:
      The first image provided.

      ## Image to use as reference:
      The second image provided.

      ## Final Image Requirements:
      - The output image's style, lighting, shadows, reflections, and camera perspective must exactly match the reference image. Only modify the lighting, nothing else.

      The output should ONLY be the final, composed image. Do not add any text or explanation.
    `,
    originalImage: imageToRelight,
    referenceImages: [referenceImage],
    width,
    height,
  });
}
