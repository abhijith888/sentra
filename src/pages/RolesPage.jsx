import { useState } from 'react';
import './RolesPage.css';

const initialRoles = [
  { id: 'admin', name: 'Admin', description: 'Full access, delete-protected', users: 1 },
  { id: 'manager', name: 'Manager', description: 'Manage users, view roles', users: 2 },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access', users: 5 }
];

const permissionGroups = {
  Users: [
    { id: 'users.view', label: 'users.view', hint: 'See the user list' },
    { id: 'users.create', label: 'users.create', hint: 'Invite / add users' },
    { id: 'users.edit', label: 'users.edit', hint: 'Edit users & assign roles' },
    { id: 'users.delete', label: 'users.delete', hint: 'Deactivate users' }
  ],
  Roles: [
    { id: 'roles.view', label: 'roles.view', hint: 'See roles' },
    { id: 'roles.manage', label: 'roles.manage', hint: 'Create/edit roles & permissions' },
    { id: 'permissions.view', label: 'permissions.view', hint: 'See permission catalogue' }
  ],
  Audit: [
    { id: 'audit.view', label: 'audit.view', hint: 'Read the audit log' }
  ]
};

function RolesPage({ currentUserRole = 'admin' }) {
  const [roles, setRoles] = useState(initialRoles);
  const [activeRoleId, setActiveRoleId] = useState(initialRoles[1].id);

  // Case-insensitive check handles both 'Admin' and 'admin'
  const isAdmin = currentUserRole?.toString().toLowerCase() === 'admin';

  // Modal State for New Role
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [grants, setGrants] = useState({
    admin: Object.fromEntries(Object.values(permissionGroups).flat().map((p) => [p.id, true])),
    manager: {
      'users.view': true,
      'users.create': true,
      'users.edit': false,
      'users.delete': true,
      'roles.view': true,
      'roles.manage': false,
      'permissions.view': true,
      'audit.view': false
    },
    viewer: {
      'users.view': true,
      'users.create': false,
      'users.edit': false,
      'users.delete': false,
      'roles.view': true,
      'roles.manage': false,
      'permissions.view': true,
      'audit.view': false
    }
  });

  const togglePermission = (roleId, permId) => {
    if (!isAdmin) return;

    setGrants((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [permId]: !prev[roleId][permId] }
    }));
  };

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim() || !isAdmin) return;

    const roleId = newRoleName.toLowerCase().replace(/\s+/g, '_');
    const newRoleObj = {
      id: roleId,
      name: newRoleName,
      description: newRoleDesc || 'Custom application role',
      users: 0
    };

    setRoles((prev) => [...prev, newRoleObj]);

    // Give default read-only permissions to newly created role
    setGrants((prev) => ({
      ...prev,
      [roleId]: {
        'users.view': true,
        'users.create': false,
        'users.edit': false,
        'users.delete': false,
        'roles.view': true,
        'roles.manage': false,
        'permissions.view': true,
        'audit.view': false
      }
    }));

    setActiveRoleId(roleId);
    setNewRoleName('');
    setNewRoleDesc('');
    setShowModal(false);
  };

  const activeRole = roles.find((r) => r.id === activeRoleId) || roles[0];

  return (
    <div className="roles-page">
      {/* Banner warning only for non-admins */}
      {!isAdmin && (
        <div style={{ padding: '10px 16px', marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '14px' }}>
          <strong>View Only Mode:</strong> You are viewing roles and permissions in read-only mode. Only administrators can create roles or modify permissions.
        </div>
      )}

      <div className="roles-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="roles-sub">Changes apply immediately and are written to the audit log</p>
        </div>
        
        {isAdmin && (
          <div>
            <button className="button-primary" onClick={() => setShowModal(true)}>
              + New role
            </button>
          </div>
        )}
      </div>

      <div className="roles-body">
        <aside className="roles-list-card">
          {roles.map((r) => (
            <div
              key={r.id}
              className={`role-item ${r.id === activeRoleId ? 'active' : ''}`}
              onClick={() => setActiveRoleId(r.id)}
            >
              <div className="role-item-left">
                <div className="role-name">{r.name}</div>
                <div className="role-desc">{r.description}</div>
              </div>
              <div className="role-count">{r.users} users</div>
            </div>
          ))}
        </aside>

        <section className="roles-panel">
          <div className="roles-panel-header">
            <h2>{activeRole.name}</h2>
            <div className="roles-panel-desc">{activeRole.description}</div>
          </div>

          <div className="permissions-grid">
            {Object.entries(permissionGroups).map(([groupName, perms]) => (
              <div className="perm-group" key={groupName}>
                <div className="perm-group-title">{groupName}</div>
                <div className="perm-group-list">
                  {perms.map((p) => (
                    <label 
                      className={`perm-item ${grants[activeRoleId]?.[p.id] ? 'granted' : ''}`} 
                      key={p.id}
                      style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: !isAdmin ? 0.8 : 1 }}
                    >
                      <input
                        type="checkbox"
                        checked={!!grants[activeRoleId]?.[p.id]}
                        disabled={!isAdmin}
                        onChange={() => togglePermission(activeRoleId, p.id)}
                      />
                      <div className="perm-meta">
                        <div className="perm-label">{p.label}</div>
                        <div className="perm-hint">{p.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CREATE NEW ROLE MODAL */}
      {showModal && isAdmin && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-title">Create New Role</div>
            <form onSubmit={handleAddRole}>
              <div className="modal-row" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Role Name</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Content Editor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-row" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Can edit and publish articles"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="button-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button-primary">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesPage;