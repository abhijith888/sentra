import { useMemo, useState, useEffect } from 'react';
import './UsersPage.css';

const initialUsers = [
  {
    name: 'Abhijith',
    email: 'abi@gmail.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2026-07-12 23:06'
  },
  {
    name: 'Arun Nair',
    email: 'arun@sentra.dev',
    role: 'Manager',
    status: 'Active',
    lastLogin: '2026-07-03 08:47'
  },
  {
    name: 'Dev Menon',
    email: 'dev@sentra.dev',
    role: 'Viewer',
    status: 'Inactive',
    lastLogin: '2026-07-02 11:05'
  },
  {
    name: 'Fatima K',
    email: 'fatima@sentra.dev',
    role: 'Viewer',
    status: 'Active',
    lastLogin: '2026-06-28 14:21'
  }
];

const roleOptions = ['All roles', 'Admin', 'Manager', 'Viewer'];
const statusOptions = ['All statuses', 'Active', 'Inactive'];

function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All roles');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [showModal, setShowModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Viewer');
  const [users, setUsers] = useState(initialUsers);

  // Load live users from Django API on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/v1/users/', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setUsers(data);
          }
        }
      } catch (error) {
        console.warn('Backend API offline or unreachable, using local mock data:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = selectedRole === 'All roles' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'All statuses' || user.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [search, selectedRole, selectedStatus, users]);

  const handleCreateUser = async () => {
    if (!newFullName.trim() || !newEmail.trim()) return;

    const newUserPayload = {
      username: newFullName.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newFullName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'Active',
      lastLogin: 'Never'
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newUserPayload),
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers((prev) => [createdUser, ...prev]);
      } else {
        // Fallback to local state if API returns error
        setUsers((prev) => [newUserPayload, ...prev]);
      }
    } catch (error) {
      console.warn('Backend reach failed during create user, adding locally:', error);
      setUsers((prev) => [newUserPayload, ...prev]);
    }

    setShowModal(false);
    setNewFullName('');
    setNewEmail('');
    setNewRole('Viewer');
  };

  const toggleStatus = (email) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.email === email
          ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
          : user
      )
    );
  };

  // Trigger Django REST Framework OpenPyXL export endpoint
  const handleExportUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/export/', {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('API export failed:', error);
      alert('Failed to download export file from server.');
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Users</h1>
          <p className="users-subtitle">{filteredUsers.length} of {users.length} users match</p>
        </div>
      </div>

      <div className="users-toolbar">
        <div className="users-toolbar-left">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            {roleOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select className="filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="users-actions">
          <button type="button" className="button-secondary" onClick={handleExportUsers}>
            Export to Excel
          </button>
          <button type="button" className="button-primary" onClick={() => setShowModal(true)}>
            + Add user
          </button>
        </div>
      </div>

      <div className="users-table-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.email}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{user.name ? user.name.split(' ').map((part) => part[0]).join('') : 'U'}</div>
                    <div className="user-details">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-pill ${user.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastLogin || 'Never'}</td>
                <td>
                  <button className="action-btn action-edit" type="button">Edit</button>
                  <button
                    className={`action-btn ${user.status === 'Active' ? 'action-deactivate' : 'action-activate'}`}
                    type="button"
                    onClick={() => toggleStatus(user.email)}
                  >
                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <div>Showing {filteredUsers.length} of {users.length} users</div>
          <div>1 / 1</div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-title">Add user</div>
            <div className="modal-row">
              <label>Full name</label>
              <input
                className="modal-input"
                placeholder="Jane Cooper"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <label>Email</label>
              <input
                className="modal-input"
                placeholder="jane@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <label>Roles</label>
              <div className="role-buttons">
                {['Admin', 'Manager', 'Viewer'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-button ${newRole === role ? 'active' : ''}`}
                    onClick={() => setNewRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="button-primary" onClick={handleCreateUser}>Create user</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;