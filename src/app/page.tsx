'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CameraIcon, PhotoIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { clearUserSettings } from '@/utils/storage';
import { useApp } from '@/contexts/AppContext';

export default function HomePage() {
  const router = useRouter();
  const { userSettings, savedImages, isLoading, refreshUserSettings } = useApp();

  // Check for user settings on mount
  useEffect(() => {
    if (!isLoading && !userSettings) {
      router.replace('/onboarding');
    }
  }, [userSettings, isLoading, router]);

  const handleRedoOnboarding = () => {
    clearUserSettings();
    refreshUserSettings();
    router.replace('/onboarding');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const uri = e.target?.result as string;
        router.push(`/preview?uri=${encodeURIComponent(uri)}`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header */}
      <div className="flex items-center justify-between px-4 py-6 mt-4 sm:px-6 sm:py-8">
        <div className="flex-1" />
        <div className="text-center">
          <Image
            src="/images/logo.png"
            alt="Superstyle"
            width={200}
            height={60}
            className="h-auto w-auto max-w-full"
            priority
          />
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={handleRedoOnboarding}
            className="rounded-lg bg-secondary px-3 py-2 transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
              <div className="text-lg text-gray-500">Loading your styles...</div>
            </div>
          </div>
        ) : savedImages.length === 0 ? (
          // Empty state
          <div className="mx-auto max-w-md lg:max-w-lg">
            <div className="rounded-xl border border-gray-300 px-6 py-16 text-center sm:py-20">
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 sm:h-20 sm:w-20">
                  <PhotoIcon className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 sm:text-2xl">
                  No styles yet
                </h3>
                <p className="text-md text-gray-500 sm:text-lg">
                  Create your first hairstyle by taking a photo or choosing from
                  your gallery
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Saved images grid
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                Your Styles ({savedImages.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {savedImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => {
                    // TODO: Navigate to image detail view
                    console.log('Open image details:', image.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      console.log('Open image details:', image.id);
                    }
                  }}
                >
                  <Image
                    src={image.uri}
                    alt="Generated hairstyle"
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-3">
                    <div className="text-xs font-medium text-white sm:text-sm">Style</div>
                    <div className="text-xs text-gray-300">
                      {new Date(image.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="flex justify-center gap-4 p-6 sm:gap-6 sm:p-8">
        <button
          onClick={() => router.push('/capture')}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-lg-light transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:h-24 sm:w-24"
          aria-label="Take a photo"
        >
          <CameraIcon className="h-8 w-8 text-gray-700 sm:h-10 sm:w-10" />
        </button>

        <label className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary shadow-lg-light cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 sm:h-24 sm:w-24">
          <PhotoIcon className="h-7 w-7 text-gray-700 sm:h-8 sm:w-8" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label="Upload a photo"
          />
        </label>
      </div>
    </div>
  );
}
