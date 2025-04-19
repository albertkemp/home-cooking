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

  const handleUpload = async (file: File) => {
    console.log("ImageUpload: Starting upload process", { fileSize: file.size, fileType: file.type });
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (foodItemId) {
        formData.append('foodItemId', foodItemId);
      }

      console.log("ImageUpload: Sending request to /api/upload");
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log("ImageUpload: Received response", { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText 
      });

      // Check if the response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to get a more specific error message if possible
        let errorMessage = 'Failed to upload image';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // If not JSON, get the text content
            const textContent = await response.text();
            console.error('ImageUpload: Server returned non-JSON response:', textContent);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('ImageUpload: Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('ImageUpload: Server returned non-JSON response:', contentType);
        throw new Error('Server returned an invalid response format');
      }

      const data = await response.json();
      console.log("ImageUpload: Parsed response data", { data });
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.url) {
        throw new Error('No image URL returned from server');
      }

      console.log("ImageUpload: Upload successful, calling onUploadComplete");
      onUploadComplete(data.url);
    } catch (err) {
      console.error('ImageUpload: Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={isUploading}
        className="w-full h-full flex items-center justify-center"
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-2 text-sm text-white">Uploading...</span>
          </div>
        ) : currentImageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={currentImageUrl}
              alt="Current"
              fill
              className="object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-sm">Change image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="mt-2 text-sm text-white">Upload image</span>
          </div>
        )}
      </button>
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
}