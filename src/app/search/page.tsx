import { prisma } from "@/lib/db/prisma";
import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@heroicons/react/24/solid";
import type { User, Review, FoodItem } from "@/generated/prisma";

interface SearchPageProps {
  searchParams: { q: string };
}

type CookWithRelations = User & {
  images: { url: string }[];
  reviewsReceived: Review[];
};

type MealWithRelations = FoodItem & {
  images: { url: string }[];
  reviews: Review[];
  cook: User & {
    images: { url: string }[];
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";

  // Search for cooks and meals
  const [cooks, meals] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
        role: 'COOK',
      },
      include: {
        images: true,
        reviewsReceived: true,
      },
    }),
    prisma.foodItem.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        images: true,
        cook: {
          include: {
            images: true,
          },
        },
        reviews: true,
      },
    }),
  ]) as [CookWithRelations[], MealWithRelations[]];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Search Results for "{query}"</h1>

      {/* Cooks Section */}
      {cooks.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Cooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cooks.map((cook: CookWithRelations) => {
              const averageRating = cook.reviewsReceived.length
                ? cook.reviewsReceived.reduce((acc: number, review: Review) => acc + review.rating, 0) / cook.reviewsReceived.length
                : 0;

              return (
                <Link
                  key={cook.id}
                  href={`/cooks/${cook.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16">
                      {cook.images[0] ? (
                        <Image
                          src={cook.images[0].url}
                          alt={cook.name || "Cook"}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl text-gray-400">
                            {(cook.name || "?").charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{cook.name}</h3>
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-gray-600">
                          {averageRating ? averageRating.toFixed(1) : "No reviews"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {cook.bio && (
                    <p className="mt-4 text-gray-600 text-sm line-clamp-2">{cook.bio}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Meals Section */}
      {meals.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Meals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal: MealWithRelations) => {
              const averageRating = meal.reviews.length
                ? meal.reviews.reduce((acc: number, review: Review) => acc + review.rating, 0) / meal.reviews.length
                : 0;

              return (
                <Link
                  key={meal.id}
                  href={`/meals/${meal.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48">
                    {meal.images[0] ? (
                      <Image
                        src={meal.images[0].url}
                        alt={meal.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{meal.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-gray-600">
                          {averageRating ? averageRating.toFixed(1) : "No reviews"}
                        </span>
                      </div>
                      <span className="text-orange-600 font-semibold">
                        ${meal.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6">
                        {meal.cook.images[0] ? (
                          <Image
                            src={meal.cook.images[0].url}
                            alt={meal.cook.name || "Cook"}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">
                              {(meal.cook.name || "?").charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">{meal.cook.name}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {cooks.length === 0 && meals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
} 