import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api/client.js';

export default function SubmitTicket() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/books').then((r) => setBooks(r.data.books)).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/tickets', {
        bookId: bookId || null,
        subject,
        description,
        // Upload is UI-only for now: we record file names/sizes, not the files themselves.
        attachments: files.map((f) => ({ name: f.name, size: f.size })),
      });
      navigate('/tickets');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="card narrow">
      <h1>Raise a support query</h1>
      <form onSubmit={submit} className="stack">
        <label>
          Which book is this about?
          <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">General / Account Level</option>
            {books.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
          </select>
        </label>
        <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} required /></label>
        <label>
          Describe the issue
          <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <label>
          Attachments (optional)
          <input type="file" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 5))} />
          <span className="muted small">File upload is coming soon; for now share photos by replying to our email.</span>
        </label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Submit query'}</button>
      </form>
    </div>
  );
}
