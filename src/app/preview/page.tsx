'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { useToast } from '@/components/Toast';
import { useApp } from '@/contexts/AppContext';
import {
  generateHairstyle,
  getReferenceStyles,
  ReferenceStyle,
} from '@/utils/api';
import {
  Ethnicity,
  getTempImage,
  HairColor,
  saveGeneratedImage,
  setUserSettings,
  Sex,
  UserSettings,
} from '@/utils/storage';

// Emoji options matching onboarding
type EmojiOption = {
  image: string;
  settings: UserSettings;
  label: string;
};

const emojiOptions: EmojiOption[] = [
  {
    image: '/images/emojis/female-brown.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
    label: 'Female • White • Brown Hair',
  },
  {
    image: '/images/emojis/female-asian.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'black' as HairColor,
      ethnicity: 'asian' as Ethnicity,
    },
    label: 'Female • Asian • Black Hair',
  },
  {
    image: '/images/emojis/female-blonde.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'blonde' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
    label: 'Female • White • Blonde Hair',
  },
  {
    image: '/images/emojis/female-black.png',
    settings: {
      sex: 'female' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'black' as Ethnicity,
    },
    label: 'Female • Black • Brown Hair',
  },
  {
    image: '/images/emojis/male-brown.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
    label: 'Male • White • Brown Hair',
  },
  {
    image: '/images/emojis/male-asian.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'black' as HairColor,
      ethnicity: 'asian' as Ethnicity,
    },
    label: 'Male • Asian • Black Hair',
  },
  {
    image: '/images/emojis/male-blonde.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'blonde' as HairColor,
      ethnicity: 'white' as Ethnicity,
    },
    label: 'Male • White • Blonde Hair',
  },
  {
    image: '/images/emojis/male-black.png',
    settings: {
      sex: 'male' as Sex,
      haircolor: 'brown' as HairColor,
      ethnicity: 'black' as Ethnicity,
    },
    label: 'Male • Black • Brown Hair',
  },
];

const GifDurationMs = 1000;

function PreviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempId = searchParams.get('tempId');
  const uri = tempId ? getTempImage(tempId) : searchParams.get('uri');
  const { userSettings, refreshSavedImages, refreshUserSettings } = useApp();
  const { showToast } = useToast();

  const [references, setReferences] = useState<ReferenceStyle[]>([]);
  const [selectedReference, setSelectedReference] =
    useState<ReferenceStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    generatedImage: string;
    morphingGif: string | null;
  } | null>(null);
  const [showFinalImage, setShowFinalImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local editable settings state
  const [editableSettings, setEditableSettings] = useState<UserSettings | null>(
    null,
  );

  // Handle morphing gif transition
  useEffect(() => {
    if (generationResult && !showFinalImage) {
      const timer = setTimeout(() => {
        setShowFinalImage(true);
      }, GifDurationMs);
      return () => clearTimeout(timer);
    }
  }, [generationResult, showFinalImage]);

  // Sync editable settings with user settings
  useEffect(() => {
    if (userSettings) {
      setEditableSettings(userSettings);
    }
  }, [userSettings]);

  // Fetch reference styles
  useEffect(() => {
    const fetchReferences = async () => {
      console.log('Preview page - editableSettings:', editableSettings);
      console.log('Preview page - tempId:', tempId);
      console.log('Preview page - uri:', uri);
      console.log('Preview page - uri length:', uri?.length || 0);

      if (!editableSettings) {
        if (!userSettings) {
          console.log('No user settings found, redirecting to onboarding');
          router.replace('/onboarding');
        }
        return;
      }

      if (!uri) {
        console.log('No image URI provided');
        setError('No image provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching reference styles with params:', {
          sex: editableSettings.sex,
          ethnicity: editableSettings.ethnicity,
          maxRecords: 100,
        });

        const data = await getReferenceStyles({
          sex: editableSettings.sex,
          ethnicity: editableSettings.ethnicity,
          maxRecords: 100,
        });

        console.log('Received reference styles:', data.length);

        // Sort by hair color: same hair color first, then others
        const sortedData = data.sort((a, b) => {
          const userHairColor = editableSettings.haircolor;
          const scoreA = a.haircolor === userHairColor ? 1 : 0;
          const scoreB = b.haircolor === userHairColor ? 1 : 0;

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return a.haircolor.localeCompare(b.haircolor);
        });

        setReferences(sortedData);
        setSelectedReference(null); // Clear selection when styles change
        console.log('Reference styles set successfully');
      } catch (error) {
        console.error('Failed to fetch reference styles:', error);
        setError('Failed to load hairstyle options. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [router, editableSettings, uri, tempId, userSettings]);

  // Generate hairstyle
  const handleGenerateImage = async () => {
    if (!selectedReference || !uri) return;

    setGenerating(true);
    setShowFinalImage(false);
    setGenerationResult(null);
    setError(null);

    try {
      // Convert data URI to File
      const response = await fetch(uri);
      const blob = await response.blob();
      const photoFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      // Fetch reference image and convert to File
      const referenceResponse = await fetch(selectedReference.imageUrl);
      const referenceBlob = await referenceResponse.blob();
      const referenceFile = new File([referenceBlob], 'reference.jpg', {
        type: 'image/jpeg',
      });

      // Generate the image
      const result = await generateHairstyle({
        originalImage: photoFile,
        referenceImages: [referenceFile],
        durationMs: GifDurationMs,
      });

      setGenerationResult(result);
    } catch (error) {
      console.error('Failed to generate image:', error);
      setError('Failed to generate hairstyle. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Save generated image
  const handleSaveImage = async () => {
    if (!generationResult?.generatedImage || saving) return;

    setSaving(true);
    try {
      saveGeneratedImage(generationResult.generatedImage);
      refreshSavedImages(); // Update context
      showToast('Image saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save image:', error);
      showToast('Failed to save image. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle emoji selection
  const handleEmojiSelection = (selectedOption: EmojiOption) => {
    setEditableSettings(selectedOption.settings);
    setUserSettings(selectedOption.settings);
    refreshUserSettings();
    showToast('Settings updated! ✨', 'success');
  };

  if (!uri) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg text-gray-500">No image provided</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-[#FFFC00] hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="absolute top-16 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-[#F3F4F6] px-4 py-3 transition-colors hover:bg-[#F3F4F680]"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex-1 pt-20">
        {/* Show side-by-side comparison when we have a generated result */}
        {showFinalImage && generationResult?.generatedImage ? (
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Before Image */}
              <div className="text-center">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  Before
                </h3>
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={uri}
                    alt="Original photo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* After Image */}
              <div className="text-center">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">
                  After
                </h3>
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={generationResult.generatedImage}
                    alt="Generated hairstyle"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single image view for original, morphing, or loading states */
          <div className="mx-auto max-w-md">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              {/* Show morphing gif during generation */}
              {generationResult?.morphingGif && !showFinalImage && (
                <Image
                  src={generationResult.morphingGif}
                  alt="Morphing animation"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}

              {/* Show original image when no generation in progress */}
              {!generationResult && (
                <Image
                  src={uri}
                  alt="Original photo"
                  fill
                  className="object-cover"
                />
              )}

              {/* Loading overlay during generation */}
              {generating && !generationResult?.morphingGif && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50">
                  <div className="flex flex-col items-center gap-4">
                    {/* Spinning loader */}
                    <div className="relative">
                      <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                      <div className="absolute inset-2 animate-ping rounded-full border-4 border-white/20"></div>
                    </div>

                    {/* Loading text */}
                    <div className="text-center text-white">
                      <p className="mb-2 text-lg font-semibold">
                        Generating your hairstyle
                      </p>
                      <p className="text-sm opacity-90">
                        This may take up to a minute...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Info Bar - Always Visible */}
      {editableSettings && (
        <div className="mt-6 border-t border-gray-200 bg-gray-50 px-4 py-4">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-black">
                  Choose your avatar ✨
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {emojiOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelection(option)}
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 sm:h-20 sm:w-20 ${
                      editableSettings.sex === option.settings.sex &&
                      editableSettings.ethnicity ===
                        option.settings.ethnicity &&
                      editableSettings.haircolor === option.settings.haircolor
                        ? 'border-3 border-[#FFFC00] shadow-lg'
                        : 'border-3 border-gray-200 hover:border-[#FFFC0080] hover:shadow-md'
                    }`}
                    aria-label={option.label}
                  >
                    <Image
                      src={option.image}
                      alt={option.label}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reference Style Selector */}
      <div className="h-48 bg-gray-100">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-500">Loading styles...</div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="px-4 text-center text-red-500">{error}</div>
          </div>
        ) : references.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-gray-500">No reference styles found</div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto">
            <div className="flex h-full gap-3 p-4">
              {references.map((reference, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedReference(reference)}
                  className={`flex-shrink-0 overflow-hidden rounded-xl border-4 transition-all ${
                    selectedReference?.imageUrl === reference.imageUrl
                      ? 'border-[#FFFC00] shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="relative h-full w-28">
                    <Image
                      src={reference.imageUrl}
                      alt={reference.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 bg-white/80 p-6">
        {/* Save button - only show if we have a generated image */}
        {generationResult?.generatedImage && (
          <button
            onClick={handleSaveImage}
            disabled={saving}
            className={`max-w-32 flex-1 rounded-lg px-4 py-3 font-semibold transition-colors ${
              saving
                ? 'bg-green-400 text-white'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}

        {/* Generate/Regenerate button */}
        <button
          onClick={handleGenerateImage}
          disabled={generating || !selectedReference}
          className={`h-[52px] w-full flex-1 rounded-lg px-4 py-2 font-semibold transition-colors ${
            generating || !selectedReference
              ? 'cursor-not-allowed bg-[#FFFC0060] text-gray-700'
              : 'bg-[#FFFC00] text-black hover:bg-[#FFFC00C0]'
          }`}
        >
          {generating
            ? generationResult?.morphingGif
              ? 'Transforming...'
              : 'Generating...'
            : generationResult?.generatedImage
              ? 'Regenerate'
              : 'Apply Style'}
        </button>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#FFFC004D] border-t-[#FFFC00]"></div>
              </div>
              <p className="text-lg text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <PreviewPageContent />
    </Suspense>
  );
}
