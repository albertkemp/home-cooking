'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

export default function NewMealPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [servings, setServings] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "COOK") {
      router.push("/browse");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("available", available.toString());
      formData.append("servings", servings);
      if (startDate) formData.append("startDate", startDate);
      if (endDate) formData.append("endDate", endDate);
      if (imageUrl) formData.append("imageUrl", imageUrl);

      const response = await fetch("/api/meals", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create meal");
      }

      router.push("/cook/dashboard");
    } catch (err) {
      setError("Failed to create meal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Add New Meal</h1>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Meal Image
            </label>
            <div className="w-full h-48">
              <ImageUpload
                type="food"
                onUploadComplete={handleImageUpload}
                currentImageUrl={imageUrl || undefined}
                className="w-full h-full"
              />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Meal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Number of Servings (optional)
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many servings are available? The meal will automatically become unavailable when all servings are sold.
                </p>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Availability
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={available}
                      onChange={() => setAvailable(true)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Available</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={!available}
                      onChange={() => setAvailable(false)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">Unavailable</span>
                  </label>
                </div>
              </div>

              {available && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Add a time range (optional)
                    </label>
                    <div className="mt-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">From</label>
                        <input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm opacity-50 cursor-not-allowed"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1 italic">
                          This feature is currently unavailable
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">To</label>
                        <input
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm opacity-50 cursor-not-allowed"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1 italic">
                          This feature is currently unavailable
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Meal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 