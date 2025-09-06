import { compact } from 'lodash';
import sharp from 'sharp';

// Helper function to preprocess images
async function preprocessImageToJpeg(
  input: Parameters<typeof sharp>[0],
  width: number,
  height: number,
): Promise<ArrayBuffer> {
  const output = await sharp(input)
    .resize(width, height, { fit: 'cover' })
    .jpeg()
    .toBuffer();
  return output.buffer.slice(
    output.byteOffset,
    output.byteOffset + output.byteLength,
  ) as ArrayBuffer;
}

// Image generation function
export async function generateImageWithReferences({
  prompt,
  originalImage,
  referenceImages,
  width = 800,
  height = 800,
}: {
  prompt: string;
  originalImage: ArrayBuffer;
  referenceImages?: ArrayBuffer[];
  width?: number;
  height?: number;
}): Promise<ArrayBuffer> {
  // Process original image
  const originalImageData = await preprocessImageToJpeg(
    originalImage,
    width,
    height,
  );

  // Process reference images
  const referenceImageParts = await Promise.all(
    (referenceImages ?? []).map(async image => {
      const processedUint8 = await preprocessImageToJpeg(image, width, height);
      return {
        type: 'file' as const,
        data: processedUint8,
        mediaType: 'image/jpeg',
      };
    }),
  );

  // Convert original image to base64
  const originalImageBase64 = Buffer.from(originalImageData).toString('base64');
  const originalImageUrl = `data:image/jpeg;base64,${originalImageBase64}`;

  // Process reference images and convert to base64
  const referenceImageUrls = await Promise.all(
    referenceImageParts.map(async imagePart => {
      const base64Data = Buffer.from(imagePart.data).toString('base64');
      return `data:image/jpeg;base64,${base64Data}`;
    }),
  );

  // Build the message content with images
  const messages = [
    {
      role: 'user',
      content: compact([
        {
          type: 'image_url',
          image_url: {
            url: originalImageUrl,
          },
        },
        ...referenceImageUrls.map(imageUrl => ({
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        })),
        {
          type: 'text',
          text: prompt,
        },
      ]),
    },
  ];

  // Make the direct API call
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages,
        modalities: ['image', 'text'],
        provider: {
          sort: 'throughput',
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  // Extract the generated image from the response
  if (!result.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
    throw new Error('No image found in response');
  }

  const imageUrl = result.choices[0].message.images[0].image_url.url;

  // Handle base64 data URL
  let imageBuffer: Buffer;
  if (imageUrl.startsWith('data:image/')) {
    // Extract base64 data from data URL
    const base64Data = imageUrl.split(',')[1];
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // If it's a regular URL, fetch it
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to fetch image from URL: ${imageResponse.status}`,
      );
    }
    imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  }

  // Process the image
  const processedOut = await preprocessImageToJpeg(imageBuffer, width, height);

  return processedOut;
}
