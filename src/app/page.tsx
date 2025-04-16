'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Sample Meal Data (replace with actual fetching if needed, but static for promo is fine)
const sampleMeals = [
  {
    id: 'sample1',
    name: 'Delicious Pasta Carbonara',
    description: 'Creamy pasta with pancetta and parmesan.',
    price: 14.50,
    imageUrl: 'https://static01.nyt.com/images/2021/02/14/dining/carbonara-horizontal/carbonara-horizontal-videoSixteenByNineJumbo1600-v2.jpg', // Placeholder image
    cookName: 'Chef Maria'
  },
  {
    id: 'sample2',
    name: 'Hearty Beef Stew',
    description: 'Slow-cooked beef with root vegetables.',
    price: 16.00,
    imageUrl: 'https://static01.nyt.com/images/2024/10/28/multimedia/beef-stew-mlfk/beef-stew-mlfk-mediumSquareAt3X.jpg', // Placeholder image
    cookName: 'Cook John'
  },
  {
    id: 'sample3',
    name: 'Fresh Garden Salad',
    description: 'Crisp greens with seasonal veggies and vinaigrette.',
    price: 9.00,
    imageUrl: 'https://www.recipetineats.com/tachyon/2021/08/Garden-Salad_47-SQ.jpg?resize=500%2C375', // Placeholder image
    cookName: 'Healthy Bites'
  }
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Optional: Redirect logged-in users away from the landing page
  useEffect(() => {
    if (status === 'authenticated') {
       // Redirect COOKs to their dashboard, EATERs to browse
       if (session.user.role === 'COOK') {
           router.replace('/cook/dashboard'); 
       } else {
           router.replace('/browse'); 
       }
    }
  }, [status, session, router]);
  
  // Show loading state while session status is being determined
  if (status === 'loading') {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
       </div>
     );
  }

  // Only render the landing page content if the user is not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="space-y-12 py-10">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Discover Delicious Homemade Meals</h1>
          <p className="text-lg text-gray-600 mb-6">Connect with talented local cooks and enjoy fresh, home-cooked food delivered to your door.</p>
          <div className="space-x-4">
            <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg cursor-pointer">Get Started</Link>
            <Link href="/browse" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold text-lg">Browse Meals</Link>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-12 bg-gray-50 rounded-lg">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">How Home Cooking Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div>
              {/* Add simple icons later if desired */} 
              <h3 className="text-xl font-semibold mb-2">1. Browse</h3>
              <p className="text-gray-600">Explore menus from various home cooks in your neighborhood.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">2. Order</h3>
              <p className="text-gray-600">Select your favorite dishes and place your order easily online.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3. Enjoy</h3>
              <p className="text-gray-600">Get fresh, delicious homemade food delivered or ready for pickup.</p>
            </div>
          </div>
        </section>

        {/* Featured Meals Section */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Taste What's Cooking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={meal.imageUrl}
                  alt={meal.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{meal.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">By {meal.cookName}</p>
                  <p className="text-sm text-gray-600 mb-3">{meal.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">${meal.price.toFixed(2)}</span>
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">Available Now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action - Become a Cook */}
        <section className="text-center py-12 bg-blue-50 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Share Your Culinary Talents?</h2>
          <p className="text-lg text-gray-600 mb-6">Join our community of home cooks and turn your passion into profit.</p>
          <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold text-lg">Become a Cook</Link>
        </section>

      </div>
    );
  }
  
  // If authenticated (and not redirected yet), render null or a minimal placeholder
  // This state should ideally be very short-lived due to the useEffect redirect.
  return null;
}
