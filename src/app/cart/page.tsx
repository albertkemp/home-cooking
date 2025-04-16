'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { cart, removeFromCart, updateCartItemQuantity, cartTotal, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    setError(null);

    if (!session) {
      router.push('/login?redirect=/cart');
      return;
    }

    try {
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

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      clearCart();
      router.push('/my-orders');
      
    } catch (error: any) {
      setError(error.message || 'An error occurred while placing the order.');
    } finally {
      setIsCheckingOut(false);
    }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Browse our delicious meals and add them to your cart.</p>
            <Link
              href="/browse"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Meals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center p-4 border-b last:border-b-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg mr-4"
                      />
                    )}
                    <div className="flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-x">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${(cartTotal * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${(cartTotal * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 