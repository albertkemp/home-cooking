'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";

type MealData = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  servings: number;
  servingsSold: number;
  startDate: string | null;
  endDate: string | null;
  images: { url: string }[];
};

export default function EditMealForm({ mealId }: { mealId: string }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [servings, setServings] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchMealData = async () => {
      try {
        const response = await fetch(`/api/meals/${mealId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch meal data");
        }
        const data: MealData = await response.json();
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price.toString());
        setAvailable(data.available);
        setServings((data.servings || 1).toString());
        setStartDate(data.startDate || "");
        setEndDate(data.endDate || "");
        setImageUrl(data.images?.[0]?.url || null);
      } catch (error) {
        console.error("Error fetching meal data:", error);
        setError("Failed to load meal data");
      } finally {
        setLoading(false);
      }
    };

    fetchMealData();
  }, [mealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const response = await fetch(`/api/meals/${mealId}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update meal");
      }

      const responseData = await response.json();
      console.log("PATCH Response:", responseData);
      console.log("Image URL in response:", responseData.images?.[0]?.url);

      router.push("/cook/dashboard");
    } catch (error) {
      console.error("Error updating meal:", error);
      setError("Failed to update meal");
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Meal</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="servings" className="block text-sm font-medium text-gray-700">
            Servings (optional)
          </label>
          <input
            type="number"
            id="servings"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min="1"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Number of servings available for this meal
          </p>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="datetime-local"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 opacity-50 cursor-not-allowed"
            disabled
          />
          <p className="mt-1 text-sm text-gray-500 italic">
            This feature is currently unavailable
          </p>
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="datetime-local"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 opacity-50 cursor-not-allowed"
            disabled
          />
          <p className="mt-1 text-sm text-gray-500 italic">
            This feature is currently unavailable
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <ImageUpload
            type="food"
            onUploadComplete={handleImageUpload}
            currentImageUrl={imageUrl}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
            Available for order
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
} 