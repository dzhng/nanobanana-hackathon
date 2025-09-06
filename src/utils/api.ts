// API client for Superstyle backend

// Since we now have the backend integrated into the same Next.js app,
// we can use relative URLs for API calls
const BackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
    const url = new URL(`${BackendUrl}/api/get-hairstyles`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    console.log('API Client: Fetching reference styles from:', url.toString());
    console.log('API Client: Params:', params);

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Client: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Client: Error response:', errorText);
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log('API Client: Reference styles response:', data);
    console.log('API Client: Number of styles received:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('API Client: Failed to fetch reference styles:', error);
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

    console.log('API Client: Generating hairstyle with params:', {
      originalImageSize: params.originalImage.size,
      referenceImagesCount: params.referenceImages.length,
      durationMs: params.durationMs,
    });

    const apiUrl = `${BackendUrl || window.location.origin}/api/generate-hairstyle`;
    console.log('API Client: Generate hairstyle URL:', apiUrl);

    const response = await fetch(apiUrl, {
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
