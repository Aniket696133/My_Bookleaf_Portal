import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client.js';
import usePolling from '../../hooks/usePolling.js';
import { StatusBadge } from '../../components/Badges.jsx';
import Thread from '../../components/Thread.jsx';
import { dateTime } from '../../utils/format.js';

export default function MyTickets() {
  const [tickets, setTickets] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  // Near-real-time: list every 8s, open ticket every 5s (admin replies appear without a refresh).
  usePolling(async () => setTickets((await api.get('/tickets')).data.tickets), 8000);
  usePolling(async () => {
    if (!selectedId) return;
    const { data } = await api.get(`/tickets/${selectedId}`);
    setDetail(data);
  }, 5000, [selectedId]);

  async function sendReply(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/tickets/${selectedId}/messages`, { body: reply });
      setReply('');
      setDetail((await api.get(`/tickets/${selectedId}`)).data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (!tickets) return <p className="muted">Loading your tickets…</p>;
  if (tickets.length === 0) {
    return (
      <div className="card empty">
        <h2>No tickets yet</h2>
        <p className="muted">Questions about royalties, ISBNs, printing or your book's status? We're here to help.</p>
        <Link className="btn" to="/tickets/new">Raise your first query</Link>
      </div>
    );
  }

  const t = detail?.ticket;
  return (
    <div className="split">
      <aside>
        <h1>My tickets</h1>
        {tickets.map((x) => (
          <button key={x._id} className={`list-item ${x._id === selectedId ? 'active' : ''}`} onClick={() => { setSelectedId(x._id); setDetail(null); }}>
            <div className="row between"><strong>{x.subject}</strong><StatusBadge status={x.status} /></div>
            <span className="muted small">{x.book?.title || 'General / Account Level'} · {dateTime(x.createdAt)}</span>
          </button>
        ))}
      </aside>

      <section>
        {!selectedId && <p className="muted">Select a ticket to see the conversation.</p>}
        {selectedId && !t && <p className="muted">Loading…</p>}
        {t && (
          <div className="card">
            <div className="row between">
              <h2>{t.subject}</h2>
              <StatusBadge status={t.status} />
            </div>
            <p className="muted small">{t.book?.title || 'General / Account Level'} · opened {dateTime(t.createdAt)}</p>
            <div className="original">{t.description}</div>
            <h3>Replies</h3>
            <Thread messages={detail.messages} viewerRole="author" />
            {t.status === 'Closed' ? (
              <p className="muted">This ticket is closed. Please open a new query if you need more help.</p>
            ) : (
              <form onSubmit={sendReply} className="stack">
                <textarea rows={3} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} required />
                {error && <div className="alert error">{error}</div>}
                <button className="btn">Send reply</button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
