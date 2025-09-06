'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CameraIcon,
  Cog6ToothIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

import ImageModal from '@/components/ImageModal';
import { useApp } from '@/contexts/AppContext';
import { clearUserSettings, SavedImage, setTempImage } from '@/utils/storage';

export default function HomePage() {
  const router = useRouter();
  const { userSettings, savedImages, isLoading, refreshUserSettings } =
    useApp();
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);

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
    console.log('Home page: File selected:', file);

    if (file) {
      console.log('Home page: Reading file as data URL');
      const reader = new FileReader();
      reader.onload = e => {
        const uri = e.target?.result as string;
        console.log('Home page: File read successfully');
        console.log('Home page: URI length:', uri?.length || 0);

        // Store image in session storage to avoid URL length limits
        const tempId = setTempImage(uri);
        console.log('Home page: Stored temp image with ID:', tempId);
        router.push(`/preview?tempId=${tempId}`);
      };
      reader.onerror = e => {
        console.error('Home page: Error reading file:', e);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header */}
      <div className="mt-4 flex items-center justify-between px-4 py-6 sm:px-6 sm:py-8">
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
        <div className="flex flex-1 justify-end">
          <button
            onClick={handleRedoOnboarding}
            className="rounded-lg bg-[#F3F4F6] px-3 py-2 transition-colors hover:bg-[#F3F4F680] focus:ring-2 focus:ring-[#FFFC00] focus:ring-offset-2 focus:outline-none"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-300 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <div className="border-t-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300"></div>
                <div className="text-lg text-gray-500">
                  Loading your saved styles...
                </div>
              </div>
            </div>
          ) : savedImages.length === 0 ? (
            // Empty state
            <div className="mx-auto max-w-md lg:max-w-lg">
              <div className="py-4 text-center sm:py-8">
                <div className="mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 sm:h-20 sm:w-20">
                    <PhotoIcon className="h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 sm:text-2xl">
                    No styles yet
                  </h3>
                  <p className="text-md text-gray-500 sm:text-lg">
                    Create your first hairstyle by taking a photo or choosing
                    from your gallery
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Saved images grid
            <div className="mx-auto max-w-7xl">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                  Saved Styles ({savedImages.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {savedImages.map(image => (
                  <div
                    key={image.id}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100 transition-all duration-200 hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-[#FFFC00] focus:ring-offset-2 focus:outline-none"
                    onClick={() => {
                      setSelectedImage(image);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedImage(image);
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
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-3">
                      <div className="text-xs font-medium text-white sm:text-sm">
                        Style
                      </div>
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
      </div>

      {/* Fixed Bottom Actions */}
      <div className="flex justify-center gap-4 pb-6 sm:gap-6">
        <button
          onClick={() => router.push('/capture')}
          className="shadow-lg-light flex h-20 w-20 items-center justify-center rounded-full bg-[#FFFC00] transition-all duration-200 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-[#FFFC00] focus:ring-offset-2 focus:outline-none sm:h-24 sm:w-24"
          aria-label="Take a photo"
        >
          <CameraIcon className="h-8 w-8 text-black sm:h-10 sm:w-10" />
        </button>

        <label className="shadow-lg-light flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-[#F3F4F6] transition-all duration-200 focus-within:ring-2 focus-within:ring-[#FFFC00] focus-within:ring-offset-2 hover:scale-105 hover:shadow-xl sm:h-24 sm:w-24">
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

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
