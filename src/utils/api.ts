// API client for Superstyle backend

const BackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://superstyle.vercel.app' 
    : 'http://localhost:3000');

export type HairColor = 'black' | 'brown' | 'blonde';
export type Ethnicity = 'asian' | 'black' | 'white' | 'brown';
export type Sex = 'male' | 'female';
export type Length = 'short' | 'medium' | 'long';

export type ReferenceStyle = {
  imageUrl: string;
  name: string;
  haircolor: HairColor;
  ethnicity: Ethnicity;
  sex: Sex;
  length: Length;
  externalLink?: string;
};

export type GetReferenceStylesParams = {
  haircolor?: HairColor;
  ethnicity?: Ethnicity;
  sex?: Sex;
  length?: Length;
  maxRecords?: number;
};

export async function getReferenceStyles(
  params: GetReferenceStylesParams = {},
): Promise<ReferenceStyle[]> {
  try {
    const url = new URL(`${BackendUrl}/api/get-hairstyles`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    console.log('Fetching reference styles from:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log('Reference styles response:', data);
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch reference styles:', error);
    throw error; // Re-throw to allow proper error handling in components
  }
}

export type GenerateHairstyleParams = {
  originalImage: File;
  referenceImages: File[];
  durationMs?: number;
};

export type GenerateHairstyleResult = {
  generatedImage: string; // base64 data URL
  morphingGif: string | null; // base64 data URL
};

export async function generateHairstyle(
  params: GenerateHairstyleParams,
): Promise<GenerateHairstyleResult> {
  try {
    const formData = new FormData();
    formData.append('originalImage', params.originalImage);

    params.referenceImages.forEach(image => {
      formData.append('referenceImages', image);
    });

    if (params.durationMs !== undefined) {
      formData.append('durationMs', params.durationMs.toString());
    }

    console.log('Generating hairstyle with params:', {
      originalImageSize: params.originalImage.size,
      referenceImagesCount: params.referenceImages.length,
      durationMs: params.durationMs,
    });

    const response = await fetch(`${BackendUrl}/api/generate-hairstyle`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    console.log('Hairstyle generation successful');
    return {
      generatedImage: data.generatedImage,
      morphingGif: data.morphingGif,
    };
  } catch (error) {
    console.error('Failed to generate hairstyle:', error);
    throw error;
  }
}
