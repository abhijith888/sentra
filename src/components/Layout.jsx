import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-shell">
      <aside className="layout-sidebar">
        <div className="layout-brand">Sentra</div>
        <nav className="layout-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'layout-link active' : 'layout-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => isActive ? 'layout-link active' : 'layout-link'}>
            Users
          </NavLink>
          <NavLink to="/roles" className={({ isActive }) => isActive ? 'layout-link active' : 'layout-link'}>
            Roles & Permissions
          </NavLink>
          <NavLink to="/audit" className={({ isActive }) => isActive ? 'layout-link active' : 'layout-link'}>
            Audit Log
          </NavLink>
        </nav>
        <div className="layout-footer">
          <div className="layout-user">
            <span className="layout-avatar">{user?.name?.[0] || 'A'}</span>
            <div>
              <div className="layout-user-name">{user?.name || 'Admin'}</div>
              <div className="layout-user-role">{user?.role || 'Admin'}</div>
            </div>
          </div>
          <button className="layout-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="layout-content">{children}</main>
    </div>
  );
};

export default Layout;
