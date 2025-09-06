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
  // NOTE: originally the prompt was to remove all the hair and make the person bald, but this was causing issues with the hairline. The newly generated image will have hairline that was wayyy too high.
  return await generateImageWithReferences({
    prompt: dedent`
      Remove all the hair from this person and headwear (hats, caps, etc.), this person should have a very short buzz cut.

      You must NOT return the original person image without hair removal.

      The output should ONLY be the final, composed image. Do not add any text or explanation.
    `,
    originalImage,
    width,
    height,
  });
}
