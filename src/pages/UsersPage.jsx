import { useMemo, useState, useEffect, useCallback } from 'react';
import './UsersPage.css';

const initialUsers = [
  { id: 1, name: 'Abhijith', email: 'abi@gmail.com', role: 'Admin', status: 'Active', lastLogin: '2026-07-12 23:06' },
  { id: 2, name: 'Arun Nair', email: 'arun@sentra.dev', role: 'Manager', status: 'Active', lastLogin: '2026-07-03 08:47' },
  { id: 3, name: 'Dev Menon', email: 'dev@sentra.dev', role: 'Viewer', status: 'Inactive', lastLogin: '2026-07-02 11:05' },
  { id: 4, name: 'Fatima K', email: 'fatima@sentra.dev', role: 'Viewer', status: 'Active', lastLogin: '2026-06-28 14:21' }
];

const roleOptions = ['All roles', 'Admin', 'Manager', 'Viewer'];
const statusOptions = ['All statuses', 'Active', 'Inactive'];

// Helper to normalize DRF backend responses into UI fields
const normalizeUser = (u) => {
  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return {
    id: u.id,
    name: fullName || u.username || u.email?.split('@')[0] || 'User',
    username: u.username || u.email?.split('@')[0],
    email: u.email || '',
    role: u.role || (u.groups && u.groups[0]?.name) || (u.is_superuser ? 'Admin' : 'Viewer'),
    status: u.is_active !== undefined ? (u.is_active ? 'Active' : 'Inactive') : (u.status || 'Active'),
    lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : (u.lastLogin || 'Never'),
  };
};

function UsersPage({ currentUserRole = 'User' }) {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All roles');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState(initialUsers);

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('Viewer');

  // Add User State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Viewer');

  const isAdmin = currentUserRole?.toLowerCase() === 'admin';

  // Fetch Users from DRF Backend
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rawUsers = Array.isArray(data) ? data : data.results || [];
        if (rawUsers.length > 0) {
          setUsers(rawUsers.map(normalizeUser));
        }
      }
    } catch (error) {
      console.warn('Backend unreachable, using local mock state:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter Users
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

  // Open Edit Modal
  const handleStartEdit = (user) => {
    if (!isAdmin) return;
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'Viewer');
  };

  // Submit Edit to Backend
  const handleSaveEdit = async () => {
    if (!editingUser || !isAdmin) return;

    const nameParts = editName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: editEmail,
      role: editRole,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${editingUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedUser = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? normalizeUser(savedUser) : u))
        );
      } else {
        // Fallback local update if request returns non-200
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, name: editName, email: editEmail, role: editRole } : u))
        );
      }
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, name: editName, email: editEmail, role: editRole } : u))
      );
    }

    setEditingUser(null);
  };

  // Handle Add User
  const handleAddUser = async () => {
    if (!newFullName || !newEmail || !isAdmin) return;

    const nameParts = newFullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      username: newEmail.split('@')[0],
      first_name: firstName,
      last_name: lastName,
      email: newEmail,
      role: newRole,
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers((prev) => [...prev, normalizeUser(createdUser)]);
      } else {
        // Local state fallback
        const mockNewUser = {
          id: Date.now(),
          name: newFullName,
          email: newEmail,
          role: newRole,
          status: 'Active',
          lastLogin: 'Never',
        };
        setUsers((prev) => [...prev, mockNewUser]);
      }
    } catch (error) {
      const mockNewUser = {
        id: Date.now(),
        name: newFullName,
        email: newEmail,
        role: newRole,
        status: 'Active',
        lastLogin: 'Never',
      };
      setUsers((prev) => [...prev, mockNewUser]);
    }

    setNewFullName('');
    setNewEmail('');
    setNewRole('Viewer');
    setShowModal(false);
  };

  // Toggle Status with Backend Integration
  const toggleStatus = async (targetUser) => {
    if (!isAdmin) return;
    const nextIsActive = targetUser.status !== 'Active';
    const nextStatusText = nextIsActive ? 'Active' : 'Inactive';

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatusText } : u))
    );

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://127.0.0.1:8000/api/v1/users/${targetUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: nextIsActive }),
      });
    } catch (error) {
      console.warn('Backend update failed, kept local state change:', error);
    }
  };

  return (
    <div className="users-page">
      {!isAdmin && (
        <div style={{ padding: '10px 16px', marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '14px' }}>
          <strong>View Only Mode:</strong> Administrator privileges required to edit users.
        </div>
      )}

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
          {isAdmin && (
            <button type="button" className="button-primary" onClick={() => setShowModal(true)}>
              + Add user
            </button>
          )}
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
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{user.name ? user.name.split(' ').map((p) => p[0]).join('').toUpperCase() : 'U'}</div>
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
                <td>{user.lastLogin}</td>
                
                {isAdmin && (
                  <td>
                    <button 
                      className="action-btn action-edit" 
                      type="button" 
                      onClick={() => handleStartEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className={`action-btn ${user.status === 'Active' ? 'action-deactivate' : 'action-activate'}`}
                      type="button"
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD USER MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-title">Add New User</div>
            <div className="modal-row">
              <label>Full Name</label>
              <input
                className="modal-input"
                placeholder="Enter full name"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <label>Email Address</label>
              <input
                className="modal-input"
                type="email"
                placeholder="user@sentra.dev"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <label>Role</label>
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
              <button type="button" className="button-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" className="button-primary" onClick={handleAddUser}>
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-title">Edit User</div>
            <div className="modal-row">
              <label>Full Name</label>
              <input
                className="modal-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <label>Email</label>
              <input
                className="modal-input"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="modal-row">
              <label>Role</label>
              <div className="role-buttons">
                {['Admin', 'Manager', 'Viewer'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-button ${editRole === role ? 'active' : ''}`}
                    onClick={() => setEditRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <button type="button" className="button-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;