import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fs_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('fs_user');
    if (stored && token) setUser(JSON.parse(stored));
  }, [token]);

  const api = axios.create({ baseURL: '/api' });

  const login = async (email, password) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('fs_token', data.token);
      localStorage.setItem('fs_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      return true;
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed');
      return false;
    } finally { setLoading(false); }
  };

  const register = async (username, email, password) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('fs_token', data.token);
      localStorage.setItem('fs_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      return true;
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed');
      return false;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_user');
    setUser(null); setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
