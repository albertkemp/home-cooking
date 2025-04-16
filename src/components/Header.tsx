'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const isLoading = status === 'loading';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Brand Name - Updated */}
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          {/* Orange Pinpoint Icon SVG - Updated size */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-2xl font-bold">
            Home Cooking
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Always visible links */}
              {(!session || session?.user?.role !== 'COOK') && (
                <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">Home</Link>
              )}
              <Link href="/browse" className="text-gray-600 hover:text-gray-900 text-sm">Browse</Link>
              
              {/* Logged In Specific Links */} 
              {session && (
                <>
                  <Link href="/my-orders" className="text-gray-600 hover:text-gray-900 text-sm">My Orders</Link>
                  {userRole === 'COOK' && (
                     <Link href="/cook/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">Cook Dashboard</Link>
                  )}
                  
                  {/* My Account Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
                    >
                      <span>My Account</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link 
                          href="/account-settings" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Account Settings
                        </Link>
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Logged Out Specific Links */} 
              {!session && (
                <>
                  <Link href="/signup" className="text-gray-600 hover:text-gray-900 text-sm">Become a Cook</Link>
                  <Link href="/api/auth/signin" className="text-gray-600 hover:text-gray-900 text-sm">Login</Link>
                  <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm cursor-pointer">Sign Up</Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
} 