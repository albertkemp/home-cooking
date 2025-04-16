'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// Add animation keyframes
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

// Define a more specific type for the meals fetched on the browse page
type BrowseFoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  availableDate: string | null;
  cook: {
    id: string;
    name: string;
  };
  images: {
    url: string;
  }[];
  startDate?: string;
  endDate?: string;
};

// Define a cart item type
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export default function BrowsePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [meals, setMeals] = useState<BrowseFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderLoadingId, setOrderLoadingId] = useState<string | null>(null); // Track loading state per button
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null); // Track success state per button
  const [orderError, setOrderError] = useState<string | null>(null); // Separate error state for ordering
  const [searchQuery, setSearchQuery] = useState(''); // Add search query state
  const [cart, setCart] = useState<CartItem[]>([]); // Shopping cart state
  const [isCartOpen, setIsCartOpen] = useState(false); // Cart visibility state

  useEffect(() => {
    // Redirect if not logged in - adjust if public browsing is allowed
    // if (status === "unauthenticated") {
    //   router.push("/login");
    // }
    if (status === "authenticated" || status === "unauthenticated") { // Fetch meals when session status is known
      fetchBrowseMeals();
    }
  }, [status]); // Rerun effect when status changes

  useEffect(() => {
    // Clear order success message after 3 seconds
    if (orderSuccessId) {
      const timer = setTimeout(() => {
        setOrderSuccessId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [orderSuccessId]);

  const fetchBrowseMeals = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("Browse Client: Fetching meals from /api/browse/meals");
      const res = await fetch('/api/browse/meals');
      const data = await res.json();
      console.log("Browse Client: Fetched meals:", data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch meals');
      }

      setMeals(data);
    } catch (error: any) {
      console.error("Browse Client: Error fetching meals:", error);
      setError(error.message || 'An error occurred while fetching meals');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = (meal: BrowseFoodItem) => {
    if (!meal.available) return;
    
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex(item => item.id === meal.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, {
          id: meal.id,
          name: meal.name,
          price: meal.price,
          quantity: 1,
          image: meal.images && meal.images.length > 0 ? meal.images[0].url : undefined
        }];
      }
    });
    
    // Open cart when adding items
    setIsCartOpen(true);
  };
  
  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };
  
  // Update item quantity in cart
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };
  
  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setOrderLoadingId('checkout');
    setOrderError(null);
    setOrderSuccessId(null);

    if (!session) {
      alert("Please create an account or login to place an order.");
      setOrderLoadingId(null);
      return;
    }

    try {
      console.log(`Browse Client: Placing order with ${cart.length} items`);
      
      // Prepare order items
      const orderItems = cart.map(item => ({
        foodItemId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          total: cartTotal
        }),
      });

      const data = await res.json();
      console.log("Browse Client: Order response:", data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      console.log(`Browse Client: Order placed successfully`);
      setOrderSuccessId('checkout');
      
      // Clear cart after successful order
      setCart([]);
      
      // Close cart after successful order
      setIsCartOpen(false);
      
    } catch (error: any) {
      console.error("Browse Client: Error placing order:", error);
      setOrderError(error.message || 'An error occurred while placing the order.');
    } finally {
      setOrderLoadingId(null);
    }
  };

  // Function to determine availability status and button text
  const getAvailabilityInfo = (meal: BrowseFoodItem) => {
    const now = new Date();
    
    if (!meal.available) {
      return {
        status: "Unavailable",
        buttonText: "Order Now",
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
          buttonText: "Preorder Now",
          statusClass: "bg-yellow-100 text-yellow-800",
          timeRange: `Available from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`
        };
      } else if (now >= startDate && now <= endDate) {
        return {
          status: "Available",
          buttonText: "Order Now",
          statusClass: "bg-green-100 text-green-800",
          timeRange: `Available until ${endDate.toLocaleString()}`
        };
      } else {
        return {
          status: "Unavailable",
          buttonText: "Order Now",
          statusClass: "bg-red-100 text-red-800",
          timeRange: null
        };
      }
    }

    return {
      status: "Available",
      buttonText: "Order Now",
      statusClass: "bg-green-100 text-green-800",
      timeRange: null
    };
  };

  // Filter meals based on search query
  const filteredMeals = meals.filter(meal => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      meal.name.toLowerCase().includes(query) || 
      meal.description.toLowerCase().includes(query) ||
      meal.cook.name.toLowerCase().includes(query)
    );
  });

  if (status === "loading" || loading) {
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Browse Available Meals</h1>
          
          {/* Cart Button */}
          <div className="relative">
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-shadow"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">{cart.length > 0 ? cart.length : 'Cart'}</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
            
            {/* Cart Dropdown */}
            {isCartOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 animate-fade-in">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Your Cart</h3>
                  
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Your cart is empty</p>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center py-3 border-b border-gray-100">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="h-12 w-12 object-cover rounded mr-3" />
                            )}
                            <div className="flex-grow">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center">
                              <button 
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <span className="mx-2 w-6 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="ml-3 text-red-500 hover:text-red-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between mb-3">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold">${cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <button
                          onClick={handleCheckout}
                          disabled={orderLoadingId === 'checkout'}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                          {orderLoadingId === 'checkout' ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            'Checkout'
                          )}
                        </button>
                        
                        {orderSuccessId === 'checkout' && (
                          <div className="mt-2 text-sm text-green-600 text-center">
                            Order placed successfully!
                          </div>
                        )}
                        
                        {orderError && orderError.includes('checkout') && (
                          <div className="mt-2 text-sm text-red-600 text-center">
                            {orderError}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
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
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {/* Display general order error if any */}
        {orderError && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
             Order Error: {orderError}
           </div>
         )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.length === 0 && !loading && !error ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">No meals available at the moment.</p>
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">No meals match your search.</p>
            </div>
          ) : (
            filteredMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                {meal.images && meal.images.length > 0 ? (
                  <img
                    src={meal.images[0].url}
                    alt={meal.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{meal.name}</h3>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityInfo(meal).statusClass}`}>
                        {getAvailabilityInfo(meal).status}
                      </span>
                      {getAvailabilityInfo(meal).timeRange && (
                        <p className="mt-1 text-sm text-gray-500">
                          {getAvailabilityInfo(meal).timeRange}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{meal.description}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    By{' '}
                    <Link
                      href={`/cooks/${meal.cook.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {meal.cook.name}
                    </Link>
                  </p>
                  <p className="text-lg font-bold text-gray-800 mb-4">${meal.price.toFixed(2)}</p>
                </div>
                <div className="p-4 pt-0">
                  {(() => {
                    const availabilityInfo = getAvailabilityInfo(meal);
                    return (
                      <button
                        onClick={() => addToCart(meal)}
                        disabled={!meal.available || orderLoadingId === meal.id}
                        className={`w-full px-4 py-3 rounded font-semibold text-white transition-colors duration-200 ${
                          !meal.available
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        }`}
                      >
                        {orderLoadingId === meal.id ? 'Processing...' : 'Add to Cart'}
                      </button>
                    );
                  })()}
                  {orderSuccessId === meal.id && (
                    <div className="mt-2 text-sm text-green-600">
                      Added to cart!
                    </div>
                  )}
                  {orderError && orderError.includes(meal.id) && (
                    <div className="mt-2 text-sm text-red-600">
                      {orderError.replace(meal.id, '').trim()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 