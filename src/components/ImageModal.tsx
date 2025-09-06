'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageModalProps {
  image: {
    id: string;
    uri: string;
    timestamp: number;
  } | null;
  onClose: () => void;
}

export default function ImageModal({ image, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (image) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [image, onClose]);

  if (!image) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="flex h-screen w-screen items-center justify-center p-2">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-100 rounded-full bg-black p-2 text-white transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Image */}
          <div className="relative h-[90vh] w-[90vw] overflow-hidden rounded-lg bg-black">
            <Image
              src={image.uri}
              alt="Generated hairstyle"
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Image info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform text-center text-white">
            <div className="text-sm text-gray-300">
              {new Date(image.timestamp).toLocaleDateString()} at{' '}
              {new Date(image.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 z-50 bg-transparent"
        onClick={handleBackdropClick}
      />
    </>
  );
}
