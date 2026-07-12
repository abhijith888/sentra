import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import './AuditPage.css';

const initialEvents = [
  { timestamp: '2026-07-12 23:25', actor: 'abi@gmail.com', action: 'role.update', detail: 'Added users.view to Manager' },
  { timestamp: '2026-07-12 23:25', actor: 'abi@gmail.com', action: 'role.update', detail: 'Removed users.edit from Manager' },
  { timestamp: '2026-07-12 23:25', actor: 'abi@gmail.com', action: 'role.update', detail: 'Removed users.view from Manager' },
  { timestamp: '2026-07-12 23:06', actor: 'abi@gmail.com', action: 'user.register', detail: 'Self-registered abi@gmail.com (Viewer)' },
  { timestamp: '2026-07-03 09:12', actor: 'priya@sentra.dev', action: 'auth.login', detail: 'Signed in from 103.21.44.8' },
  { timestamp: '2026-07-02 17:35', actor: 'priya@sentra.dev', action: 'role.update', detail: 'Added users.delete to Manager' },
  { timestamp: '2026-07-01 12:00', actor: 'system@sentra', action: 'user.delete', detail: 'Deleted user test@example.com' },
  { timestamp: '2026-06-30 08:42', actor: 'admin@sentra', action: 'permissions.view', detail: 'Viewed permission catalogue' }
];

function AuditPage() {
  const [events] = useState(initialEvents);
  const [filter, setFilter] = useState('All actions');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    if (filter === 'All actions') return events;
    return events.filter((e) => e.action === filter);
  }, [events, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  function exportToExcel() {
    const sheetData = filtered.map((e) => ({ Timestamp: e.timestamp, Actor: e.actor, Action: e.action, Detail: e.detail }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit');
    XLSX.writeFile(wb, 'audit-log.xlsx');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p>Append-only record of every sensitive action</p>
        </div>
        <div className="page-actions">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option>All actions</option>
            {[...new Set(events.map((ev) => ev.action))].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="button-primary" onClick={exportToExcel}>Export to Excel</button>
        </div>
      </div>

      <div className="table-panel audit-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>ACTOR</th>
              <th>ACTION</th>
              <th>DETAIL</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, idx) => (
              <tr key={item.timestamp + item.action + idx}>
                <td className="muted">{item.timestamp}</td>
                <td><strong>{item.actor}</strong></td>
                <td><span className="tag">{item.action}</span></td>
                <td>{item.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <div className="pager-info">Showing {Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)} of {filtered.length}</div>
          <div className="pager-controls">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span className="pager-page">{page} / {pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditPage;
