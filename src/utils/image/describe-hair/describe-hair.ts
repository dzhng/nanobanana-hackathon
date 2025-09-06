import { generateObject } from 'ai';
import { z } from 'zod';

import { gpt5MiniModel } from '@/utils/ai/providers';

export interface HairstyleDescription {
  style: string;
  length: string;
  color: string;
  texture: string;
  cut: string;
  condition: string;
  overallDescription: string;
}

const hairstyleSchema = z.object({
  style: z
    .string()
    .describe(
      'The overall hairstyle style (e.g., bob, pixie, afro, dreadlocks, etc.)',
    ),
  length: z
    .string()
    .describe(
      'The length of the hair (e.g., short, medium, long, shoulder-length, etc.)',
    ),
  color: z
    .string()
    .describe(
      'The color(s) of the hair (e.g., black, brown, blonde, dyed red, etc.)',
    ),
  texture: z
    .string()
    .describe(
      'The texture of the hair (e.g., straight, wavy, curly, kinky, etc.)',
    ),
  cut: z
    .string()
    .describe('The type of cut (e.g., layered, blunt, asymmetrical, etc.)'),
  condition: z
    .string()
    .describe(
      'The condition/appearance of the hair (e.g., healthy, damaged, oily, etc.)',
    ),
  overallDescription: z
    .string()
    .describe('A detailed overall description of the hairstyle'),
});

export async function describeHairstyle({
  image,
}: {
  image: ArrayBuffer;
}): Promise<HairstyleDescription> {
  // Convert image to base64
  const imageBase64 = Buffer.from(image).toString('base64');
  const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

  const result = await generateObject({
    model: gpt5MiniModel,
    schema: hairstyleSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this person's hairstyle in detail. Describe the style, length, color, texture, cut, and condition of their hair. Provide a comprehensive analysis.`,
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ],
      },
    ],
  });

  return result.object;
}
