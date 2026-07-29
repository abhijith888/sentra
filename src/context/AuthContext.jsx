import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Base URL setup: Localhost-ൽ 'http://127.0.0.1:8000' എടുക്കും, Render-ൽ തനിയെ relative path എടുക്കും.
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : '';

  // Read stored credentials ONCE when the app mounts
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('sentra_user');

      if (storedToken && savedUser) {
        setToken(storedToken);
        setUser(JSON.parse(savedUser));
      } else {
        // Clean partial or corrupted state
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('sentra_user');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.warn('Failed to parse cached user session:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('sentra_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login method accepts identifier (username or email) and password
  const login = async (identifier, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const message =
          errorData.detail ||
          (Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : 'Invalid email or password.');

        logout();
        return { success: false, message };
      }

      const data = await response.json();

      if (data.access && data.user) {
        localStorage.setItem('token', data.access);
        setToken(data.access);

        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        localStorage.setItem('sentra_user', JSON.stringify(data.user));
        setUser(data.user);

        return { success: true };
      }

      logout();
      return { success: false, message: 'Invalid server response structure.' };
    } catch (error) {
      console.error('Login error:', error);
      logout();
      return { success: false, message: error.message };
    }
  };

  // Register method to persist new accounts directly to backend
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to create account.';

        if (typeof errorData === 'object' && errorData !== null) {
          const firstKey = Object.keys(errorData)[0];
          const val = errorData[firstKey];
          errorMessage = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
        return { success: false, message: errorMessage };
      }

      return await login(userData.email || userData.username, userData.password);
    } catch (error) {
      console.error('Registration error:', error);
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

  // Derive normalized role string ('Admin', 'Viewer', etc.)
  const rawRole = user?.role || (user?.is_superuser ? 'Admin' : 'Viewer');
  const role = typeof rawRole === 'string' 
    ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() 
    : 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);