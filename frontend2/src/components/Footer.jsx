import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 mt-auto">
      <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
        <p className="mb-2">© {new Date().getFullYear()} EcoFinds. All rights reserved.</p>
        <p>
          Crafted with <span className="text-pink-400">❤</span> in the future.
        </p>
      </div>
    </footer>
  );
}
