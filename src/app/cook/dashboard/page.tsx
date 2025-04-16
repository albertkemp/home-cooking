'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Add animation keyframes
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

type FoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  images: {
    id: string;
    url: string;
  }[];
  availableDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

type CookOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  eater: {
    name: string | null;
    email: string | null;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    foodItem: {
      name: string;
    };
  }[];
};

export default function CookDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [meals, setMeals] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<CookOrder[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorMeals, setErrorMeals] = useState('');
  const [errorOrders, setErrorOrders] = useState('');
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "COOK") {
      router.push("/browse");
    } else if (status === "authenticated") {
      fetchMeals();
      fetchCookOrders();
    }
  }, [status, session, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.meal-menu-container')) {
        setActiveMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchMeals = async () => {
    setLoadingMeals(true);
    setErrorMeals('');
    try {
      console.log("Cook Client: Fetching meals");
      const res = await fetch('/api/meals');
      const data = await res.json();
      console.log("Cook Client: Fetched meals:", data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch meals');
      }
      
      setMeals(data);
    } catch (error: any) {
      console.error("Cook Client: Error fetching meals:", error);
      setErrorMeals(error.message || 'An error occurred while fetching meals');
    } finally {
      setLoadingMeals(false);
    }
  };

  const fetchCookOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders('');
    try {
      console.log("Cook Client: Fetching orders from /api/cook/orders");
      const res = await fetch('/api/cook/orders');
      const data = await res.json();
      console.log("Cook Client: Fetched orders:", data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      
      setOrders(data);
    } catch (error: any) {
      console.error("Cook Client: Error fetching orders:", error);
      setErrorOrders(error.message || 'An error occurred while fetching orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    console.log("Client: Attempting to delete meal with ID:", mealId);
    if (!confirm('Are you sure you want to delete this meal? This action cannot be undone.')) {
      console.log("Client: Delete cancelled by user");
      return;
    }

    setDeletingMealId(mealId);
    try {
      console.log("Client: Sending DELETE request for meal ID:", mealId);
      const res = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });

      console.log("Client: Delete response status:", res.status);
      const data = await res.json();
      console.log("Client: Delete response data:", data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete meal');
      }

      setMeals(meals.filter(meal => meal.id !== mealId));
      setSuccessMessage('Meal deleted successfully');
      console.log("Client: Meal deleted successfully");
    } catch (error: any) {
      console.error("Client: Error deleting meal:", error);
      setErrorMeals(error.message || 'An error occurred while deleting the meal');
    } finally {
      setDeletingMealId(null);
      setActiveMenuId(null);
    }
  };

  const handleEditMeal = (mealId: string) => {
    console.log("Client: Navigating to edit page for meal ID:", mealId);
    router.push(`/cook/meals/edit/${mealId}`);
  };

  const toggleMenu = (mealId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Client: Toggling menu for meal ID:", mealId);
    setActiveMenuId(activeMenuId === mealId ? null : mealId);
  };

  const cycleAvailability = async (meal: FoodItem) => {
    setUpdatingAvailabilityId(meal.id);
    try {
      if (meal.available) {
        // If available, make it unavailable
        await setUnavailable(meal.id);
      } else {
        // If unavailable, make it available
        await setAvailable(meal.id);
      }
    } finally {
      setUpdatingAvailabilityId(null);
    }
  };

  const handleMarkOrderDone = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    setErrorOrders('');
    try {
      console.log(`Cook Client: Marking order ${orderId} as COMPLETED`);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      const data = await res.json();
      console.log("Cook Client: Update order response:", data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setOrders(orders.filter(order => order.id !== orderId));
      setSuccessMessage('Order marked as completed!');
      console.log(`Cook Client: Order ${orderId} marked as done.`);

    } catch (error: any) {
      console.error(`Cook Client: Error marking order ${orderId} as done:`, error);
      setErrorOrders(error.message || 'An error occurred while updating the order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Function to determine availability status
  const getAvailabilityStatus = (meal: FoodItem) => {
    const now = new Date();
    
    if (!meal.available) {
      return {
        status: "Unavailable",
        statusClass: "bg-red-100 text-red-800",
        timeRange: null
      };
    }

    if (meal.startDate && meal.endDate) {
      const startDate = new Date(meal.startDate);
      const endDate = new Date(meal.endDate);
      
      if (now < startDate) {
        return {
          status: "Available Soon",
          statusClass: "bg-yellow-100 text-yellow-800",
          timeRange: `Available from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`
        };
      } else if (now >= startDate && now <= endDate) {
        return {
          status: "Available",
          statusClass: "bg-green-100 text-green-800",
          timeRange: `Available until ${endDate.toLocaleString()}`
        };
      } else {
        return {
          status: "Unavailable",
          statusClass: "bg-red-100 text-red-800",
          timeRange: null
        };
      }
    }

    return {
      status: "Available",
      statusClass: "bg-green-100 text-green-800",
      timeRange: null
    };
  };

  // Function to set meal to available with no time range
  const setAvailable = async (mealId: string) => {
    try {
      const formData = new FormData();
      formData.append("available", "true");
      formData.append("name", meals.find(m => m.id === mealId)?.name || "");
      formData.append("description", meals.find(m => m.id === mealId)?.description || "");
      formData.append("price", meals.find(m => m.id === mealId)?.price.toString() || "0");

      const res = await fetch(`/api/meals/${mealId}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update meal availability');
      }

      setMeals(meals.map(meal => 
        meal.id === mealId 
          ? { ...meal, available: true, availableDate: null } 
          : meal
      ));
      
      setSuccessMessage('Meal set to Available');
    } catch (error: any) {
      console.error("Client: Error updating meal availability:", error);
      setErrorMeals(error.message || 'An error occurred while updating meal availability');
    }
  };

  // Function to set meal to unavailable
  const setUnavailable = async (mealId: string) => {
    try {
      const formData = new FormData();
      formData.append("available", "false");
      formData.append("name", meals.find(m => m.id === mealId)?.name || "");
      formData.append("description", meals.find(m => m.id === mealId)?.description || "");
      formData.append("price", meals.find(m => m.id === mealId)?.price.toString() || "0");

      const res = await fetch(`/api/meals/${mealId}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update meal availability');
      }

      setMeals(meals.map(meal => 
        meal.id === mealId 
          ? { ...meal, available: false, availableDate: null } 
          : meal
      ));
      
      setSuccessMessage('Meal set to Unavailable');
    } catch (error: any) {
      console.error("Client: Error updating meal availability:", error);
      setErrorMeals(error.message || 'An error occurred while updating meal availability');
    }
  };

  // Filter meals based on search query
  const filteredMeals = meals.filter(meal => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      meal.name.toLowerCase().includes(query) || 
      meal.description.toLowerCase().includes(query)
    );
  });

  if (status === "loading" || loadingMeals || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <style jsx global>{fadeInAnimation}</style>
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Cook Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Menu</h2>
              <button
                onClick={() => router.push('/cook/meals/new')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 text-sm cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add New Item
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 focus:shadow-xl transition-all duration-300 bg-white shadow-sm hover:shadow"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 opacity-0 group-focus-within:opacity-100 animate-fade-in"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {errorMeals && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorMeals}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            {meals.length === 0 ? (
              <p className="text-gray-600">No meals added yet.</p>
            ) : filteredMeals.length === 0 ? (
              <p className="text-gray-600">No meals match your search.</p>
            ) : (
              <div className="space-y-4">
                {[...filteredMeals]
                  .sort((a, b) =>
                    a.available === b.available ? 0 : a.available ? -1 : 1
                  )
                  .map((meal) => (
                  <div key={meal.id} className="border-b pb-4">
                    {meal.images && meal.images.length > 0 && (
                      <div className="mb-4">
                        <img
                          src={meal.images[0].url}
                          alt={meal.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{meal.name}</h3>
                        <p className="text-sm text-gray-600">{meal.description}</p>
                        <p className="text-sm font-medium">${meal.price.toFixed(2)}</p>
                        {meal.available && meal.availableDate && (
                          <p className="text-sm text-blue-600 mt-1">
                            {(() => {
                              console.log("Dashboard: availableDate:", meal.availableDate);
                              // Check if the description contains a start date
                              const startDateMatch = meal.description.match(/\[Start: (.*?)\]/);
                              if (startDateMatch) {
                                const startDate = startDateMatch[1];
                                const endDate = new Date(meal.availableDate);
                                return `Available from ${startDate} to ${endDate.toLocaleString()}`;
                              }
                              // If no start date in description, treat as a single date
                              return `Available from ${new Date(meal.availableDate).toLocaleString()}`;
                            })()}
                          </p>
                        )}
                        <div className="mt-2">
                          <button
                            onClick={() => cycleAvailability(meal)}
                            disabled={updatingAvailabilityId === meal.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityStatus(meal).statusClass} hover:opacity-75 transition-opacity cursor-pointer`}
                          >
                            {updatingAvailabilityId === meal.id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </span>
                            ) : (
                              getAvailabilityStatus(meal).status
                            )}
                          </button>
                          {getAvailabilityStatus(meal).timeRange && (
                            <p className="mt-1 text-sm text-gray-500">
                              {getAvailabilityStatus(meal).timeRange}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="relative meal-menu-container">
                        <button
                          onClick={(e) => toggleMenu(meal.id, e)}
                          className="text-gray-500 hover:text-gray-700 p-2 cursor-pointer"
                          title="Options"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {activeMenuId === meal.id && (
                          <div 
                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Client: Edit button clicked for meal ID:", meal.id);
                                  handleEditMeal(meal.id);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Client: Delete button clicked for meal ID:", meal.id);
                                  handleDeleteMeal(meal.id);
                                }}
                                disabled={deletingMealId === meal.id}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
                              >
                                {deletingMealId === meal.id ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                    Deleting...
                                  </div>
                                ) : (
                                  'Delete'
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Pending Orders</h2>
            {errorOrders && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorOrders}
              </div>
            )}
            {orders.length === 0 ? (
              <p className="text-gray-600">No pending orders.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Order ID: {order.id.substring(0, 8)}...</span>
                      <span 
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' 
                        }`}
                      >
                        {order.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Eater: {order.eater.name || order.eater.email || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Placed: {new Date(order.createdAt).toLocaleString()}</p>
                    <div className="mt-2 pt-2 border-t">
                      <h4 className="text-sm font-medium mb-1">Items:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity} x {item.foodItem.name} (@ ${item.price.toFixed(2)} each)
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-right font-semibold mt-2">Total: ${order.total.toFixed(2)}</p>
                    
                    <div className="mt-4 pt-4 border-t text-right">
                      <button
                        onClick={() => handleMarkOrderDone(order.id)}
                        disabled={updatingOrderId === order.id}
                        className={`px-4 py-2 rounded text-white font-semibold text-sm transition-colors duration-200 cursor-pointer 
                          ${updatingOrderId === order.id
                            ? 'bg-gray-400 cursor-wait'
                            : 'bg-green-500 hover:bg-green-600'
                          }`}
                      >
                        {updatingOrderId === order.id ? 'Updating...' : 'Mark as Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 