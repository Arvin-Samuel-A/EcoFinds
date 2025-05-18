import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, token, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', bio: '', avatarUrl: '' });
  const [message, setMessage] = useState('');

  // Populate form with existing profile data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.profile?.bio || '',
        avatarUrl: user.profile?.avatarUrl || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.REACT_APP_API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          profile: {
            bio: form.bio,
            avatarUrl: form.avatarUrl
          }
        })
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      updateUser(updated);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 mb-6">
        Edit Profile
      </h1>

      {message && (
        <p className="mb-4 text-center text-sm text-pink-300">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-gray-300">Full Name</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-gray-300">Bio</span>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-gray-300">Avatar URL</span>
          <input
            type="url"
            name="avatarUrl"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
            className="mt-1 block w-full rounded-md bg-gray-800 p-2 text-gray-100 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 transition drop-shadow-neon text-white font-semibold"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}