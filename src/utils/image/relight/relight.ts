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
      You are an expert photo editor. Your task is to change the background and relight the face of the input image to match the reference image's background and lighting. The person in the input image should look like they are in the exact same location as the person in the reference image.

      # Specifications:

      ## Image to relight:
      The first image provided.

      ## Image to use as reference:
      I will provide you with a reference image to use for relighting.

      ## Final Image Requirements:
      - The output image's style, lighting, shadows, and reflections must exactly match the reference image.
      - If the reference image has lighting from a light source, the output image should also have lighting from the same light source. 
      - If the reference image has backlighting, the output image should also have backlighting.
      - If the reference image has shadows on the face, the output image should also have shadows on the face.

      The output should ONLY be the final, composed image. Do not add any text or explanation.
    `,
    originalImage: imageToRelight,
    referenceImages: [referenceImage],
    width,
    height,
  });
}
