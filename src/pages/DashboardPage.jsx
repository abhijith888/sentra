const stats = [
  { label: 'Total Users', value: 7 },
  { label: 'Active', value: 6 },
  { label: 'Roles', value: 3 },
  { label: 'Audit Events', value: 9 }
];

const activity = [
  { date: '2026-07-12 23:06', type: 'user.register', message: 'Self-registered abi@gmail.com (Viewer)' },
  { date: '2026-07-03 09:12', type: 'auth.login', message: 'Signed in from 103.21.44.8' },
  { date: '2026-07-02 17:35', type: 'role.update', message: 'Added users.delete to Manager' },
  { date: '2026-07-02 17:31', type: 'user.update', message: 'Assigned Viewer role to Rahul Menon' }
];

function DashboardPage() {
  return (
    <div>
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Signed in as Admin — 8 of 8 permissions granted</p>
        </div>
      </header>

      <section className="dashboard-cards">
        {stats.map((item) => (
          <div key={item.label} className="dashboard-card">
            <div className="dashboard-card-label">{item.label}</div>
            <div className="dashboard-card-value">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="dashboard-activity">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2>Recent activity</h2>
            <a href="/audit" className="dashboard-link">View audit log →</a>
          </div>
          <div className="activity-list">
            {activity.map((item) => (
              <div key={item.date} className="activity-row">
                <div className="activity-date">{item.date}</div>
                <div className="activity-badge">{item.type}</div>
                <div className="activity-message">{item.message}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
