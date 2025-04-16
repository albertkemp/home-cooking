'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';

// Type for orders displayed on this page
type EaterOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    foodItem: {
      name: string;
      cookId: string; // Maybe link to cook's profile later?
    };
  }[];
};

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<EaterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login"); // Redirect if not logged in
    } else if (status === "authenticated") {
      fetchMyOrders();
    }
  }, [status, router]);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("MyOrders Client: Fetching orders from /api/my-orders");
      const res = await fetch('/api/my-orders');
      const data = await res.json();
      console.log("MyOrders Client: Fetched orders:", data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch your orders');
      }

      setOrders(data);
    } catch (error: any) {
      console.error("MyOrders Client: Error fetching orders:", error);
      setError(error.message || 'An error occurred while fetching your orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
        console.log(`MyOrders Client: Attempting to cancel order ${orderId}`);
        const res = await fetch(`/api/orders/${orderId}`, { // Assuming DELETE /api/orders/:id
            method: 'DELETE',
        });

        const data = await res.json();
        console.log("MyOrders Client: Cancel response:", data);

        if (!res.ok) {
            throw new Error(data.message || 'Failed to cancel order');
        }

        // Update the order status in the local state
        setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status: 'CANCELLED' } : order
        ));
        console.log(`MyOrders Client: Order ${orderId} cancelled successfully`);

    } catch (error: any) {
        console.error(`MyOrders Client: Error cancelling order ${orderId}:`, error);
        setError(error.message || 'An error occurred while cancelling the order.'); // Show error
    } finally {
        setCancellingOrderId(null);
    }
};


  if (status === "loading" || loading) {
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
          <h1 className="text-3xl font-bold">My Orders</h1>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none border-0 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 rounded-lg shadow-sm 
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 
                transition-colors duration-200"
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending Orders</option>
              <option value="COMPLETED">Completed Orders</option>
              <option value="CANCELLED">Cancelled Orders</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">You haven't placed any orders yet.</p>
            <Link href="/browse" className="mt-4 inline-block text-blue-600 hover:underline">
              Browse meals
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders
              .filter(order => statusFilter === 'ALL' || order.status === statusFilter)
              .sort((a, b) => {
                // First, sort by status priority
                const statusPriority = {
                  'PENDING': 0,
                  'COMPLETED': 1,
                  'CANCELLED': 2
                };
                const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
                                 statusPriority[b.status as keyof typeof statusPriority];
                
                // If status is the same, sort by date (newest first)
                if (statusDiff === 0) {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
                return statusDiff;
              })
              .map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 border-b pb-3">
                  <div>
                    <span className="font-semibold text-lg">Order ID: {order.id.substring(0, 8)}...</span>
                    <p className="text-sm text-gray-500">Placed: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span 
                    className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' 
                    }`}
                  >
                    {order.status.toLowerCase()}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-md font-medium mb-2">Items:</h4>
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity} x {item.foodItem.name}</span>
                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center border-t pt-3">
                  <p className="font-semibold text-lg mb-2 sm:mb-0">Total: ${order.total.toFixed(2)}</p>
                  {order.status === 'PENDING' && ( // Only show Cancel button for Pending orders
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className={`px-4 py-2 rounded font-semibold text-white text-sm transition-colors duration-200 
                        ${cancellingOrderId === order.id
                          ? 'bg-gray-400 cursor-wait'
                          : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                      {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 