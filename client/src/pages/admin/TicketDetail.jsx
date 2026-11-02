import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../api/client.js';
import usePolling from '../../hooks/usePolling.js';
import { StatusBadge } from '../../components/Badges.jsx';
import Thread from '../../components/Thread.jsx';
import { CATEGORIES, PRIORITIES, STATUSES, dateTime } from '../../utils/format.js';

export default function TicketDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [aiError, setAiError] = useState('');
  const [error, setError] = useState('');
  const draftRequested = useRef(false);

  const load = async () => {
    const { data: d } = await api.get(`/tickets/${id}`);
    setData(d);
    return d;
  };

  async function requestDraft() {
    setDrafting(true);
    setAiError('');
    try {
      const { data: r } = await api.post(`/admin/tickets/${id}/draft`);
      setReply(r.draft.text);
      await load();
    } catch (e) {
      setAiError(errorMessage(e)); // AI down: admin simply writes the reply manually
    } finally {
      setDrafting(false);
    }
  }

  // On first open: show the stored draft, or generate one lazily (saves tokens on tickets never opened).
  useEffect(() => {
    load().then((d) => {
      if (draftRequested.current) return;
      draftRequested.current = true;
      if (d.ticket.draft?.text) setReply(d.ticket.draft.text);
      else requestDraft();
    }).catch((e) => setError(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep the conversation fresh (author replies) without touching the editor text.
  usePolling(async () => { if (draftRequested.current) await load(); }, 8000, [id]);

  async function patch(body) {
    try {
      const r = await api.patch(`/admin/tickets/${id}`, body);
      setData((d) => ({ ...d, ticket: r.data.ticket }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function send(isInternal) {
    const body = isInternal ? note : reply;
    if (!body.trim()) return;
    try {
      await api.post(`/tickets/${id}/messages`, { body, isInternal });
      if (isInternal) setNote(''); else setReply('');
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function retryClassification() {
    try {
      const r = await api.post(`/admin/tickets/${id}/classify`);
      setData((d) => ({ ...d, ticket: r.data.ticket }));
      setAiError('');
    } catch (e) {
      setAiError(errorMessage(e));
    }
  }

  if (error && !data) return <div className="alert error">{error}</div>;
  if (!data) return <p className="muted">Loading ticket…</p>;
  const { ticket: t, messages } = data;
  const src = (s) => (s === 'ai' ? 'AI suggestion' : s === 'admin' ? 'Set by admin' : 'Not set');

  return (
    <>
      <p><Link to="/admin">← Back to queue</Link></p>
      <div className="detail">
        <section>
          <div className="card">
            <div className="row between"><h1>{t.subject}</h1><StatusBadge status={t.status} /></div>
            <p className="muted small">
              {t.author?.name} ({t.author?.email}) · {t.book?.title || 'General / Account Level'} · opened {dateTime(t.createdAt)}
            </p>
            <div className="original">{t.description}</div>
            {t.attachments?.length > 0 && <p className="muted small">Attachments listed: {t.attachments.map((a) => a.name).join(', ')}</p>}
          </div>

          <div className="card">
            <h3>Conversation</h3>
            <Thread messages={messages} viewerRole="admin" />
          </div>

          <div className="card">
            <div className="row between">
              <h3>Reply to author</h3>
              <button className="btn ghost" onClick={requestDraft} disabled={drafting}>{drafting ? 'Drafting…' : 'Regenerate AI draft'}</button>
            </div>
            {aiError && <div className="alert warn">{aiError}</div>}
            {t.draft?.text && <p className="muted small">AI draft ({t.draft.model}). Review and edit before sending.</p>}
            <textarea rows={10} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={drafting ? 'Generating a draft…' : 'Write your reply…'} />
            <button className="btn" onClick={() => send(false)} disabled={!reply.trim()}>Send to author</button>
          </div>

          <div className="card">
            <h3>Internal notes</h3>
            <p className="muted small">Only the BookLeaf team can see these.</p>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" />
            <button className="btn ghost" onClick={() => send(true)} disabled={!note.trim()}>Add note</button>
          </div>
        </section>

        <aside>
          <div className="card stack">
            <h3>Manage</h3>
            {error && <div className="alert error">{error}</div>}
            <label>Status
              <select value={t.status} onChange={(e) => patch({ status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label>Category <span className="muted small">({src(t.categorySource)})</span>
              <select value={t.category || ''} onChange={(e) => patch({ category: e.target.value })}>
                {!t.category && <option value="">Unclassified</option>}
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Priority <span className="muted small">({src(t.prioritySource)})</span>
              <select value={t.priority} onChange={(e) => patch({ priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
            </label>
            {t.aiReasoning && <p className="muted small">AI reasoning: {t.aiReasoning}</p>}
            {t.aiStatus === 'failed' && (
              <div className="alert warn">AI classification failed. Set the category and priority manually or <button className="link" onClick={retryClassification}>retry</button>.</div>
            )}
            <div>
              <strong>Assigned to:</strong> {t.assignedTo?.name || 'Nobody'}
              <div className="row">
                <button className="btn ghost" onClick={() => patch({ assignedTo: 'me' })}>Assign to me</button>
                {t.assignedTo && <button className="btn ghost" onClick={() => patch({ assignedTo: null })}>Unassign</button>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
