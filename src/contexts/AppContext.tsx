'use client';

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getSavedImages,
  getUserSettings,
  SavedImage,
  UserSettings,
} from '@/utils/storage';

interface AppContextType {
  userSettings: UserSettings | null;
  savedImages: SavedImage[];
  isLoading: boolean;
  refreshSavedImages: () => void;
  refreshUserSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserSettings = () => {
    const settings = getUserSettings();
    console.log('AppContext: Refreshed user settings:', settings);
    setUserSettings(settings);
  };

  const refreshSavedImages = () => {
    const images = getSavedImages();
    setSavedImages(images);
  };

  useEffect(() => {
    // Load initial data
    console.log('AppContext: Loading initial data');
    refreshUserSettings();
    refreshSavedImages();
    setIsLoading(false);
    console.log('AppContext: Initial data loading complete');
  }, []);

  const value: AppContextType = {
    userSettings,
    savedImages,
    isLoading,
    refreshSavedImages,
    refreshUserSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
