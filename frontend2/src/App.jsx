import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
import AuthRoutes from './routes/AuthRoutes.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { useAuth } from './hooks/useAuth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth/*" element={<AuthRoutes />} />
      <Route
        path="/*"
        element={user ? <AppRoutes /> : <Navigate to="/auth/login" replace />}
      />
    </Routes>
  );
}