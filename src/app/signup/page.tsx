'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER', // Default role
    address: '',
    bio: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!formData.email || !formData.password || !formData.name || !formData.role || !formData.address) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      console.log("Signup Client: Sending registration data:", formData);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Signup Client: Registration response:", data);

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration successful
      setSuccess(true);
      console.log("Signup Client: Registration successful");
      // Optionally clear form or redirect
      // router.push('/login'); // Redirect to login page after successful signup

    } catch (error: any) {
      console.error("Signup Client: Registration error:", error);
      setError(error.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> Account created. Please <Link href="/api/auth/signin" className='font-medium text-blue-600 hover:text-blue-500'>log in</Link>.</span>
            </div>
          )}

          {!success && (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="address" className="sr-only">Address</label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Your street address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1 mt-3">Account type</label>
                <select
                  id="role"
                  name="role"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="USER">I want to order food (User)</option>
                  <option value="COOK">I want to sell food (Cook)</option>
                </select>
              </div>
              {formData.role === 'COOK' && (
                <div className="pt-4">
                   <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Cook Bio (Optional)</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Tell eaters about yourself and your cooking style!"
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          )}

          {!success && (
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          )}
        </form>
        {!success && (
            <p className="mt-2 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/api/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Log in
                </Link>
            </p>
        )}
      </div>
    </div>
  );
} 