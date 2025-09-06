'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { ArrowLeftIcon, CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { setTempImage } from '@/utils/storage';

export default function CapturePage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: facingMode,
  };

  const handleUserMedia = useCallback(() => {
    setHasPermission(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setHasPermission(false);
    setError(typeof error === 'string' ? error : 'Camera access denied');
  }, []);

  const capture = useCallback(async () => {
    if (!webcamRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      console.log('Capture page: Taking screenshot');
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        console.log('Capture page: Screenshot successful, navigating to preview');
        console.log('Capture page: Image URI length:', imageSrc.length);
        
        // Store image in session storage to avoid URL length limits
        const tempId = setTempImage(imageSrc);
        console.log('Capture page: Stored temp image with ID:', tempId);
        router.push(`/preview?tempId=${tempId}`);
      } else {
        console.error('Capture page: No image captured');
        setError('Failed to capture image. Please try again.');
      }
    } catch (error) {
      console.error('Capture page: Failed to capture image:', error);
      setError('Failed to capture image. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, router]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setHasPermission(false);
      setError('Camera permission denied');
    }
  }, []);

  if (hasPermission === false || error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Back Button */}
        <div className="absolute left-4 top-12 z-10 sm:top-16">
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-secondary p-2 transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:p-3"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Permission Request */}
        <div className="flex min-h-screen items-center justify-center px-4 sm:px-6">
          <div className="max-w-md text-center">
            <div className="mb-6">
              <CameraIcon className="mx-auto h-16 w-16 text-gray-400 sm:h-20 sm:w-20" />
            </div>
            <h2 className="mb-4 text-xl font-semibold text-black sm:text-2xl">
              Camera Access Required
            </h2>
            <p className="mb-6 text-md text-gray-600 sm:text-lg">
              We need access to your camera to take photos for hairstyle generation.
            </p>
            <button
              onClick={requestPermission}
              className="rounded-lg bg-primary px-6 py-3 text-lg font-semibold text-black transition-all duration-200 hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-8 sm:py-4 sm:text-xl"
            >
              Grant Permission
            </button>
            {error && (
              <p className="mt-4 text-sm text-red-600 sm:text-base">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="absolute left-4 top-12 z-10 sm:top-16">
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-secondary p-2 transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:p-3"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="w-full rounded-lg shadow-xl"
              style={{
                aspectRatio: '1',
                objectFit: 'cover',
              }}
              mirrored={facingMode === 'user'}
            />
          </div>
        </div>

        {/* Camera Controls */}
        <div className="bg-black/50 p-4 sm:p-6">
          <div className="flex items-center justify-between max-w-sm mx-auto sm:max-w-md">
            {/* Spacer */}
            <div className="w-10 sm:w-12" />

            {/* Capture Button */}
            <button
              onClick={capture}
              disabled={isCapturing}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-all duration-200 hover:scale-105 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:h-20 sm:w-20"
              aria-label="Take photo"
            >
              <div
                className={`h-12 w-12 rounded-full transition-colors sm:h-16 sm:w-16 ${
                  isCapturing ? 'bg-black' : 'bg-white'
                }`}
              />
            </button>

            {/* Flip Camera Button */}
            <button
              onClick={toggleCamera}
              className="rounded-lg bg-secondary p-2 transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:p-3"
              aria-label="Flip camera"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
