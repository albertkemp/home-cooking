'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function SearchInput() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for meals or cooks..."
          className="w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
} 