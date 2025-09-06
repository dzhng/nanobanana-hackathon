import { describe, it } from 'node:test';
import { generateObject } from 'ai';
import { z } from 'zod';

import { gpt5MiniModel } from './providers';

describe('providers', () => {
  it('should be able to create objects with schemas', async () => {
    const res = await generateObject({
      system: 'You are a creative writer.',
      prompt: 'Write a poem or a story about a cat, you decide which one.',
      model: gpt5MiniModel,
      schema: z.object({
        poemOrStory: z.union([
          z.object({
            poem: z.string(),
          }),
          z.object({
            story: z.string(),
          }),
        ]),
      }),
    });

    console.log('Result:', res.object);
  });
});
