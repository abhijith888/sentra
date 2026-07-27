import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import Login from './pages/Login';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import AuditPage from './pages/AuditPage';

// Shared Loading Component for screen transitions
const FullScreenLoader = () => (
  <div style={styles.loadingScreen}>
    <div style={styles.spinner}>Loading...</div>
  </div>
);

// Guard for authenticated routes — Allows ANY authenticated user access
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Strict check: Reject if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { role, isAuthenticated, loading } = useAuth();

  // Keep screen clean until AuthContext finishes reading local storage
  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      {/* Redirect logged-in users away from /login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Main Protected Routes — Accessible to ALL logged-in accounts */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage currentUserRole={role} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <RolesPage currentUserRole={role} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />

      {/* Root & Catch-all Fallback Routes */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontFamily: 'sans-serif'
  },
  spinner: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0d9488'
  }
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;