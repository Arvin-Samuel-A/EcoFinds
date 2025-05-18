import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="w-full py-4 px-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 drop-shadow-neon">
          EcoFinds
        </Link>
        <nav className="space-x-6">
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `text-lg font-medium hover:text-pink-400 transition ${isActive ? 'text-pink-400 drop-shadow-neon' : 'text-gray-300'}`
            }
          >
            Products
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `text-lg font-medium hover:text-pink-400 transition ${isActive ? 'text-pink-400 drop-shadow-neon' : 'text-gray-300'}`
            }
          >
            Cart
          </NavLink>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-lg font-medium hover:text-pink-400 transition ${isActive ? 'text-pink-400 drop-shadow-neon' : 'text-gray-300'}`
            }
          >
            Dashboard
          </NavLink>
        </nav>
      </div>
    </header>
  );
}