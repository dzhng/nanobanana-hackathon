'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getReferenceStyles, generateHairstyle, ReferenceStyle } from '@/utils/api';
import { saveGeneratedImage, getTempImage } from '@/utils/storage';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/components/Toast';

const GifDurationMs = 1000;

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempId = searchParams.get('tempId');
  const uri = tempId ? getTempImage(tempId) : searchParams.get('uri');
  const { userSettings, refreshSavedImages } = useApp();
  const { showToast } = useToast();
  
  const [references, setReferences] = useState<ReferenceStyle[]>([]);
  const [selectedReference, setSelectedReference] = useState<ReferenceStyle | null>(null);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">No image provided</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-primary hover:underline"
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
      <div className="absolute left-4 top-16 z-10">
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-secondary px-4 py-3 transition-colors hover:bg-secondary/80"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex-1 pt-20">
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

            {/* Show final generated image */}
            {showFinalImage && generationResult?.generatedImage && (
              <Image
                src={generationResult.generatedImage}
                alt="Generated hairstyle"
                fill
                className="object-cover"
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
          </div>
        </div>
      </div>

      {/* Reference Style Selector */}
      <div className="h-48 bg-gray-100 mt-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading styles...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500 text-center px-4">{error}</div>
          </div>
        ) : references.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">No reference styles found</div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto">
            <div className="flex gap-3 p-4 h-full">
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
      <div className="flex items-center justify-center gap-4 p-6 bg-white/80">
        {/* Save button - only show if we have a generated image */}
        {generationResult?.generatedImage && (
          <button
            onClick={handleSaveImage}
            disabled={saving}
            className={`flex-1 max-w-32 rounded-lg px-4 py-3 font-semibold transition-colors ${
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
          className={`flex-1 max-w-48 rounded-lg px-4 py-3 font-semibold transition-colors ${
            generating || !selectedReference
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-primary text-black hover:bg-primary/90'
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

