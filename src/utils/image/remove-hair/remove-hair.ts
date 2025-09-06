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
      Remove all the hair from this person, this person should be bald. Keep everything else the same.
    `,
    originalImage,
    width,
    height,
  });
}
