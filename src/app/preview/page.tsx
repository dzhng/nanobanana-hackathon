'use client';

import { useEffect, useState } from 'react';
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
import { getTempImage, saveGeneratedImage } from '@/utils/storage';

const GifDurationMs = 1000;

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempId = searchParams.get('tempId');
  const uri = tempId ? getTempImage(tempId) : searchParams.get('uri');
  const { userSettings, refreshSavedImages } = useApp();
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

  // Handle morphing gif transition
  useEffect(() => {
    if (generationResult && !showFinalImage) {
      const timer = setTimeout(() => {
        setShowFinalImage(true);
      }, GifDurationMs);
      return () => clearTimeout(timer);
    }
  }, [generationResult, showFinalImage]);

  // Fetch reference styles
  useEffect(() => {
    const fetchReferences = async () => {
      console.log('Preview page - userSettings:', userSettings);
      console.log('Preview page - tempId:', tempId);
      console.log('Preview page - uri:', uri);
      console.log('Preview page - uri length:', uri?.length || 0);

      if (!userSettings) {
        console.log('No user settings found, redirecting to onboarding');
        router.replace('/onboarding');
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
          sex: userSettings.sex,
          ethnicity: userSettings.ethnicity,
          maxRecords: 100,
        });

        const data = await getReferenceStyles({
          sex: userSettings.sex,
          ethnicity: userSettings.ethnicity,
          maxRecords: 100,
        });

        console.log('Received reference styles:', data.length);

        // Sort by hair color: same hair color first, then others
        const sortedData = data.sort((a, b) => {
          const userHairColor = userSettings.haircolor;
          const scoreA = a.haircolor === userHairColor ? 1 : 0;
          const scoreB = b.haircolor === userHairColor ? 1 : 0;

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return a.haircolor.localeCompare(b.haircolor);
        });

        setReferences(sortedData);
        console.log('Reference styles set successfully');
      } catch (error) {
        console.error('Failed to fetch reference styles:', error);
        setError('Failed to load hairstyle options. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [router, userSettings, uri, tempId]);

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

  if (!uri) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-lg text-gray-500">No image provided</p>
          <button
            onClick={() => router.back()}
            className="text-primary mt-4 hover:underline"
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
          className="bg-secondary hover:bg-secondary/80 rounded-lg px-4 py-3 transition-colors"
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
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Before</h3>
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
                <h3 className="mb-3 text-lg font-semibold text-gray-900">After</h3>
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

      {/* Reference Style Selector */}
      <div className="mt-8 h-48 bg-gray-100">
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
                      ? 'border-primary shadow-lg'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="relative h-36 w-28">
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
          className={`max-w-48 flex-1 rounded-lg px-4 py-3 font-semibold transition-colors ${
            generating || !selectedReference
              ? 'cursor-not-allowed bg-gray-400 text-gray-600'
              : 'bg-primary hover:bg-primary/90 text-black'
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
