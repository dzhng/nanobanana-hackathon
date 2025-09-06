// Web storage utilities (localStorage replacement for AsyncStorage)

export type HairColor = 'black' | 'brown' | 'blonde';
export type Ethnicity = 'asian' | 'black' | 'white' | 'brown';
export type Sex = 'male' | 'female';

export type UserSettings = {
  ethnicity: Ethnicity;
  sex: Sex;
  haircolor: HairColor;
};

export type SavedImage = {
  id: string;
  uri: string;
  timestamp: number;
};

// User Settings
export function getUserSettings(): UserSettings | null {
  if (typeof window === 'undefined') return null;
  
  const userSettings = localStorage.getItem('userSettings');
  return userSettings ? JSON.parse(userSettings) : null;
}

export function hasUserSettings(): boolean {
  const settings = getUserSettings();
  return !!(settings?.ethnicity && settings?.sex && settings?.haircolor);
}

export function setUserSettings(userSettings: UserSettings): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('userSettings', JSON.stringify(userSettings));
}

export function clearUserSettings(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('userSettings');
}

// Saved Images
export function getSavedImages(): SavedImage[] {
  if (typeof window === 'undefined') return [];
  
  const savedImages = localStorage.getItem('savedImages');
  return savedImages ? JSON.parse(savedImages) : [];
}

export function saveGeneratedImage(uri: string): void {
  if (typeof window === 'undefined') return;
  
  const savedImages = getSavedImages();
  const newImage: SavedImage = {
    id: Date.now().toString(),
    uri,
    timestamp: Date.now(),
  };
  savedImages.unshift(newImage); // Add to beginning for most recent first
  localStorage.setItem('savedImages', JSON.stringify(savedImages));
}

export function deleteSavedImage(imageId: string): void {
  if (typeof window === 'undefined') return;
  
  const savedImages = getSavedImages();
  const filteredImages = savedImages.filter(img => img.id !== imageId);
  localStorage.setItem('savedImages', JSON.stringify(filteredImages));
}
