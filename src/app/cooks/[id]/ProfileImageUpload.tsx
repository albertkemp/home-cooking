'use client';

import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import type { User } from "@/generated/prisma";
import { useSession } from "next-auth/react";

interface ProfileImageUploadProps {
  user: User | null;
  onImageUpdate?: (imageUrl: string) => void;
}

export function ProfileImageUpload({ user, onImageUpdate }: ProfileImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(user?.image || null);
  const { update: updateSession } = useSession();

  const handleImageUpload = async (url: string) => {
    setImageUrl(url);
    if (onImageUpdate) {
      onImageUpdate(url);
    }
    // Update the session to reflect the new image
    await updateSession();
  };

  return (
    <div className="relative group">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={user?.name || "Profile"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ImageUpload
          onUploadComplete={handleImageUpload}
          type="profile"
          currentImageUrl={imageUrl}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer"
        />
      </div>
    </div>
  );
} 