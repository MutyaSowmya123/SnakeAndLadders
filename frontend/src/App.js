import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import GamePage from './pages/GamePage';

function AppInner() {
  const { user } = useAuth();
  return user ? <GamePage /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
