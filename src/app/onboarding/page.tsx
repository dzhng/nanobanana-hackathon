'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { setUserSettings, UserSettings, HairColor, Ethnicity, Sex } from '@/utils/storage';
import { useApp } from '@/contexts/AppContext';

type EmojiOption = {
  image: string;
  settings: UserSettings;
};

const FemaleEmojiOptions: EmojiOption[] = [
  {
    image: '/images/emojis/female-brown.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
  },
  {
    image: '/images/emojis/female-asian.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'black' as HairColor,
      ethnicity: 'asian' as Ethnicity,
    },
  },
  {
    image: '/images/emojis/female-blonde.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'blonde' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
  },
  {
    image: '/images/emojis/female-black.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'black' as Ethnicity,
    },
  },
];

const MaleEmojiOptions: EmojiOption[] = [
  {
    image: '/images/emojis/male-brown.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
  },
  {
    image: '/images/emojis/male-asian.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'black' as HairColor,
      ethnicity: 'asian' as Ethnicity,
    },
  },
  {
    image: '/images/emojis/male-blonde.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'blonde' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
  },
  {
    image: '/images/emojis/male-black.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'black' as Ethnicity,
    },
  },
];

const emojiOptions = [...FemaleEmojiOptions, ...MaleEmojiOptions];

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshUserSettings } = useApp();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelection = (index: number) => {
    setSelectedIndex(index);
  };

  const handleContinue = async () => {
    if (selectedIndex === null) return;

    setIsLoading(true);
    try {
      const selectedOption = emojiOptions[selectedIndex];
      setUserSettings(selectedOption.settings);
      refreshUserSettings(); // Update context
      router.push('/');
    } catch (error) {
      console.error('Error saving user settings:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-md px-4 py-12 sm:max-w-2xl sm:px-6 sm:py-16 lg:max-w-3xl lg:py-20">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <div className="mb-6">
            <h1 className="mb-4 text-xl font-bold text-black sm:text-2xl lg:text-3xl">Welcome to</h1>
            <div className="flex justify-center">
              <Image
                src="/images/logo.png"
                alt="Superstyle"
                width={280}
                height={84}
                className="h-auto w-auto max-w-full"
                priority
              />
            </div>
          </div>
          <p className="text-md text-gray-600 sm:text-lg lg:text-xl">
            Select the option that best matches you. This helps us personalize
            your hairstyle recommendations
          </p>
        </div>

        {/* Emoji Grid */}
        <div className="mb-8 sm:mb-10">
          {/* Female Section */}
          <div className="mb-8 sm:mb-10">
            <h2 className="mb-6 text-center text-lg font-semibold text-black sm:text-xl">
              Female
            </h2>
            <div 
              className="grid grid-cols-2 justify-items-center place-items-center sm:grid-cols-2 lg:grid-cols-4"
              style={{ gap: 'clamp(0.5rem, 1.5vw, 1rem)' }}
            >
              {FemaleEmojiOptions.map((item, index) => (
                <button
                  key={`female-${index}`}
                  onClick={() => handleSelection(index)}
                  className={`rounded-2xl p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:p-5 ${
                    selectedIndex === index
                      ? 'border-2 border-[#FFFC00] bg-[#FFFC00] shadow-lg focus:ring-[#FFFC00]'
                      : 'border-2 border-gray-300 bg-gray-100 hover:border-gray-400 hover:shadow-md focus:ring-gray-400'
                  }`}
                  disabled={isLoading}
                  aria-label={`Select female avatar ${index + 1}`}
                >
                  <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                    <Image
                      src={item.image}
                      alt={`Female avatar ${index + 1}`}
                      width={100}
                      height={100}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Male Section */}
          <div>
            <h2 className="mb-6 text-center text-lg font-semibold text-black sm:text-xl">
              Male
            </h2>
            <div 
              className="grid grid-cols-2 justify-items-center place-items-center sm:grid-cols-2 lg:grid-cols-4"
              style={{ gap: 'clamp(0.5rem, 1.5vw, 1rem)' }}
            >
              {MaleEmojiOptions.map((item, index) => {
                const actualIndex = FemaleEmojiOptions.length + index;
                return (
                  <button
                    key={`male-${index}`}
                    onClick={() => handleSelection(actualIndex)}
                    className={`rounded-2xl p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:p-5 ${
                      selectedIndex === actualIndex
                        ? 'border-2 border-[#FFFC00] bg-[#FFFC00] shadow-lg focus:ring-[#FFFC00]'
                        : 'border-2 border-gray-300 bg-gray-100 hover:border-gray-400 hover:shadow-md focus:ring-gray-400'
                    }`}
                    disabled={isLoading}
                    aria-label={`Select male avatar ${index + 1}`}
                  >
                    <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                      <Image
                        src={item.image}
                        alt={`Male avatar ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-contain max-w-full max-h-full"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={selectedIndex === null || isLoading}
          className={`w-full rounded-xl px-6 py-4 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-xl ${
            selectedIndex !== null && !isLoading
              ? 'bg-[#FFFC00] text-black hover:bg-[#FFFC0080] shadow-lg focus:ring-[#FFFC00]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 focus:ring-gray-400'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
              Setting up...
            </div>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
