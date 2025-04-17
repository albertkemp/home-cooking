'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string) => void;
  type: 'profile' | 'food';
  foodItemId?: string;
  currentImageUrl?: string | null;
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  type,
  foodItemId,
  currentImageUrl,
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (foodItemId) {
        formData.append('foodItemId', foodItemId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned non-JSON response: ${contentType}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onUploadComplete(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only prevent default if we're inside a form
    if (e.currentTarget.closest('form')) {
      e.preventDefault();
    }
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {(previewUrl || currentImageUrl) ? (
        <div className="relative w-full h-full">
          <Image
            src={previewUrl || currentImageUrl || ''}
            alt="Uploaded image"
            fill
            className="object-cover rounded-lg"
          />
          <button
            onClick={handleClick}
            disabled={isUploading}
            className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 focus:outline-none"
            type="button"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 focus:outline-none"
          type="button"
        >
          {isUploading ? (
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-sm text-gray-500">
            {isUploading ? 'Uploading...' : 'Click to upload image'}
          </span>
        </button>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 