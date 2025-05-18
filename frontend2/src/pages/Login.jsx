import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-800 bg-opacity-80 p-8 rounded-2xl shadow-neon">
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-6">
          Login
        </h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <label className="block mb-2">
          <span className="text-gray-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md bg-gray-700 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>
        <label className="block mb-4">
          <span className="text-gray-300">Password</span>
          <input
            type="password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md bg-gray-700 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="w-full py-2 rounded-full font-semibold bg-pink-500 hover:bg-pink-600 transition drop-shadow-neon text-white"
        >
          Login
        </button>
        <p className="text-center text-gray-400 text-sm mt-4">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-pink-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
