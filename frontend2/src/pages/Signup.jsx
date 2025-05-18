import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await signup({ name: form.name, username: form.username, email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-900 bg-opacity-80 p-8 rounded-2xl shadow-neon backdrop-blur-sm">
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-6">
          Sign Up
        </h2>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <label className="block mb-2">
          <span className="text-gray-300">Full Name</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            className="mt-1 block w-full rounded-md bg-gray-800 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>

        <label className="block mb-2">
          <span className="text-gray-300">Username</span>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            placeholder="Create a username"
            className="mt-1 block w-full rounded-md bg-gray-800 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>

        <label className="block mb-2">
          <span className="text-gray-300">Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            className="mt-1 block w-full rounded-md bg-gray-800 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>

        <label className="block mb-2">
          <span className="text-gray-300">Password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            className="mt-1 block w-full rounded-md bg-gray-800 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-300">Confirm Password</span>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            className="mt-1 block w-full rounded-md bg-gray-800 border-none p-2 text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="w-full py-2 rounded-full font-semibold bg-pink-500 hover:bg-pink-600 transition drop-shadow-neon text-white"
        >
          Sign Up
        </button>

        <p className="text-center text-gray-400 text-sm mt-4">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-pink-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
