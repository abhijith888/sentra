import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Safe fallback values for user details
  const displayName = user?.name || user?.username || user?.email || 'User';
  const displayRole = role || user?.role || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="layout-shell">
      <aside className="layout-sidebar">
        <div className="layout-brand">Sentra</div>
        <nav className="layout-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'layout-link active' : 'layout-link')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? 'layout-link active' : 'layout-link')}
          >
            Users
          </NavLink>
          <NavLink
            to="/roles"
            className={({ isActive }) => (isActive ? 'layout-link active' : 'layout-link')}
          >
            Roles & Permissions
          </NavLink>
          <NavLink
            to="/audit"
            className={({ isActive }) => (isActive ? 'layout-link active' : 'layout-link')}
          >
            Audit Log
          </NavLink>
        </nav>

        <div className="layout-footer">
          <div className="layout-user">
            <span className="layout-avatar">{avatarInitial}</span>
            <div>
              <div className="layout-user-name">{displayName}</div>
              <div className="layout-user-role">{displayRole}</div>
            </div>
          </div>
          <button className="layout-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
