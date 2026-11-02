import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client.js';
import usePolling from '../../hooks/usePolling.js';
import { PriorityBadge, StatusBadge } from '../../components/Badges.jsx';
import { age, CATEGORIES, PRIORITIES, STATUSES } from '../../utils/format.js';

const STALE_DAYS = 2;

export default function TicketQueue() {
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', assigned: '', from: '', to: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  usePolling(async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    if (params.to) params.to = `${params.to}T23:59:59`; // include the whole end day
    try {
      setData((await api.get('/tickets', { params })).data);
      setError('');
    } catch (e) {
      setError(errorMessage(e));
    }
  }, 10000, [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const select = (k, label, options) => (
    <select value={filters[k]} onChange={set(k)} aria-label={label}>
      <option value="">{label}</option>
      {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>))}
    </select>
  );

  return (
    <>
      <h1>Ticket queue</h1>
      <div className="filters">
        {select('status', 'All statuses', STATUSES)}
        {select('category', 'All categories', CATEGORIES)}
        {select('priority', 'All priorities', PRIORITIES)}
        {select('assigned', 'Anyone', [{ v: 'me', l: 'Assigned to me' }, { v: 'unassigned', l: 'Unassigned' }])}
        <label className="inline">From <input type="date" value={filters.from} onChange={set('from')} /></label>
        <label className="inline">To <input type="date" value={filters.to} onChange={set('to')} /></label>
      </div>
      {error && <div className="alert error">{error}</div>}
      {!data ? <p className="muted">Loading tickets…</p> : data.tickets.length === 0 ? (
        <div className="card empty"><h2>No tickets match these filters</h2><p className="muted">Clear a filter or wait for new queries to arrive.</p></div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Priority</th><th>Subject</th><th>Author</th><th>Category</th><th>Status</th><th>Assignee</th><th>Age</th></tr>
          </thead>
          <tbody>
            {data.tickets.map((t) => {
              const stale = t.isActive && Date.now() - new Date(t.createdAt) > STALE_DAYS * 86400000;
              return (
                <tr key={t._id} className={t.isActive ? '' : 'done'}>
                  <td><PriorityBadge priority={t.priority} />{t.aiStatus === 'failed' && <span className="flag" title="AI classification failed">!</span>}</td>
                  <td><Link to={`/admin/tickets/${t._id}`}>{t.subject}</Link><div className="muted small">{t.book?.title || 'General / Account Level'}</div></td>
                  <td>{t.author?.name}</td>
                  <td>{t.category || <span className="muted">{t.aiStatus === 'pending' ? 'Classifying…' : 'Unclassified'}</span>}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t.assignedTo?.name || <span className="muted">Unassigned</span>}</td>
                  <td className={stale ? 'stale' : ''}>{age(t.createdAt)}{stale ? ' · overdue' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {data && <p className="muted small">{data.total} ticket(s). Unresolved tickets are listed first, most urgent then oldest.</p>}
    </>
  );
}
