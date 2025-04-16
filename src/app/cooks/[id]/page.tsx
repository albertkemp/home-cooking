'use client';

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/solid";
import type { User, Menu, FoodItem, Review } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileImageUpload } from "./ProfileImageUpload";
import { ReviewSection } from "./ReviewSection";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";

interface CookProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

type CookWithRelations = User & {
  menu: (Menu & {
    foodItems: (FoodItem & {
      images: { url: string }[];
    })[];
  })[];
  reviewsReceived: (Review & {
    reviewer: User;
  })[];
  images: { url: string }[];
};

type ReviewWithRelations = Review & {
  reviewer: User;
};

export default function CookProfilePage({ params }: CookProfilePageProps) {
  const router = useRouter();
  const { id: cookId } = use(params);
  const [cook, setCook] = useState<CookWithRelations | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cookData, sessionData] = await Promise.all([
          fetch(`/api/cooks/${cookId}`).then(res => res.json()),
          fetch('/api/auth/session').then(res => res.json())
        ]);
        
        setCook(cookData);
        setSession(sessionData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cookId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!cook || cook.role !== "COOK") {
    notFound();
  }

  const formattedReviews = cook.reviewsReceived || [];
  const averageRating =
    formattedReviews.reduce((acc, review) => acc + review.rating, 0) /
    (formattedReviews.length || 1);

  const hasUserReviewed = session?.user?.id
    ? formattedReviews.some((review) => review.reviewer.id === session.user.id)
    : false;

  const isOwnProfile = session?.user?.id === cook.id;

  const handleImageUpdate = (url: string) => {
    setCook(prev => prev ? { ...prev, image: url } : null);
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="relative w-32 h-32">
            {isOwnProfile ? (
              <ProfileImageUpload 
                user={cook}
                onImageUpdate={handleImageUpdate}
              />
            ) : (
              cook.images[0] ? (
                <Image
                  src={cook.images[0].url}
                  alt={cook.name || "Cook"}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">
                    {(cook.name || "?").charAt(0)}
                  </span>
                </div>
              )
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{cook.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold">
                {formattedReviews.length === 0 
                  ? "No reviews yet"
                  : `${averageRating.toFixed(1)} (${formattedReviews.length} ${formattedReviews.length === 1 ? 'review' : 'reviews'})`
                }
              </span>
            </div>
            <p className="text-gray-600 mb-4">{cook.bio || "No bio available"}</p>
            <ReviewSection 
              cookId={cook.id}
              hasUserReviewed={hasUserReviewed}
              isLoggedIn={!!session?.user}
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Menus</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cook.menu.map((menu) => (
            <div
              key={menu.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{menu.name}</h3>
                <p className="text-gray-600 mb-4">{menu.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  {menu.foodItems.map((item) => (
                    <div key={item.id} className="relative aspect-square">
                      {item.images[0] ? (
                        <Image
                          src={item.images[0].url}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">
          {formattedReviews.length === 0 
            ? "No reviews yet" 
            : formattedReviews.length === 1 
              ? 'Review' 
              : 'Reviews'
          }
        </h2>
        <div className="space-y-4">
          {formattedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <StarIcon className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">{review.rating}/5</span>
                <span className="text-gray-500">by {review.reviewer.name}</span>
              </div>
              {review.comment && (
                <p className="text-gray-600">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 