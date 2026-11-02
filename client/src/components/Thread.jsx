import { dateTime } from '../utils/format.js';

// Conversation view shared by the author and admin screens.
export default function Thread({ messages, viewerRole }) {
  if (!messages.length) return <p className="muted">No replies yet. The BookLeaf team will respond here.</p>;
  return (
    <div className="thread">
      {messages.map((m) => {
        const mine = m.senderRole === viewerRole;
        return (
          <div key={m._id} className={`msg ${mine ? 'mine' : 'theirs'} ${m.isInternal ? 'internal' : ''}`}>
            <div className="msg-meta">
              {m.isInternal ? 'Internal note · ' : ''}
              {m.senderRole === 'admin' ? `${m.senderName} (BookLeaf)` : m.senderName} · {dateTime(m.createdAt)}
            </div>
            <div className="msg-body">{m.body}</div>
          </div>
        );
      })}
    </div>
  );
}
