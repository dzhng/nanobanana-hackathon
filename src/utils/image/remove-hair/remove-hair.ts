import dedent from 'dedent';
import { generateImageWithReferences } from '../image-generation/image-generation';

export async function removeHair({
  originalImage,
  width,
  height,
}: {
  originalImage: ArrayBuffer;
  width: number;
  height: number;
}): Promise<ArrayBuffer> {
  return await generateImageWithReferences({
    prompt: dedent`
      Remove all the hair from this person and headwear (hats, caps, etc.), this person should be bald. Keep everything else the same.

      You must NOT return the original person image without hair removal.

      The output should ONLY be the final, composed image. Do not add any text or explanation.
    `,
    originalImage,
    width,
    height,
  });
}
