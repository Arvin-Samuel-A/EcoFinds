import React from 'react';

export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex space-x-2 overflow-x-auto py-2 px-4">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition 
            ${selected === cat ? 'bg-pink-500 text-white drop-shadow-neon' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}