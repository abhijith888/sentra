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

function RolesPage() {
  const [roles] = useState(initialRoles);
  const [activeRoleId, setActiveRoleId] = useState(roles[1].id);

  // For demo purposes, permission state is local and initialized differently per role
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
    setGrants((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [permId]: !prev[roleId][permId] }
    }));
  };

  const activeRole = roles.find((r) => r.id === activeRoleId) || roles[0];

  return (
    <div className="roles-page">
      <div className="roles-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="roles-sub">Changes apply immediately and are written to the audit log</p>
        </div>
        <div>
          <button className="button-primary">+ New role</button>
        </div>
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
                    <label className={`perm-item ${grants[activeRoleId]?.[p.id] ? 'granted' : ''}`} key={p.id}>
                      <input
                        type="checkbox"
                        checked={!!grants[activeRoleId]?.[p.id]}
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
    </div>
  );
}

export default RolesPage;
