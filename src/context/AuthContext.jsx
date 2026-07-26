import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Load initial token state
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Load saved user session safely on page reloads
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sentra_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.warn('Failed to parse cached user session:', e);
        localStorage.removeItem('sentra_user'); // Clean up corrupt cache
        return null;
      }
    }
    return null;
  });

  // Login method accepts identifier (username or email) and password
  const login = async (identifier, password) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send identifier ONLY under `username` to prevent 400 Bad Request field conflicts
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Parse detail or standard DRF non_field_errors array
        const message =
          errorData.detail ||
          (Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : 'Invalid credentials');
        throw new Error(message);
      }

      const data = await response.json();

      // Store JWT Tokens
      if (data.access) {
        localStorage.setItem('token', data.access);
        setToken(data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

      // Store User Payload returned from Backend serializer
      if (data.user) {
        localStorage.setItem('sentra_user', JSON.stringify(data.user));
        setUser(data.user);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('sentra_user');
  };

  // Derive active user role with a clean fallback chain
  const role = user?.role || (user?.is_superuser ? 'Admin' : 'Viewer');

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);