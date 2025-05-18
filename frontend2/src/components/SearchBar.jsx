import React, { useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center bg-gray-700 rounded-full px-4 py-2 max-w-md mx-auto">
      <HiOutlineSearch className="text-gray-400 text-xl mr-2" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search EcoFinds"
        className="bg-transparent flex-grow text-gray-100 placeholder-gray-500 focus:outline-none"
      />
    </form>
  );
}