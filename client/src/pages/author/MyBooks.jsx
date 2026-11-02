import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client.js';
import { date, money } from '../../utils/format.js';

function BookCard({ b }) {
  const inProduction = !b.publicationDate;
  return (
    <article className="card book">
      <div className="book-head">
        <div>
          <h3>{b.title}</h3>
          <p className="muted">{b.genre} · ISBN {b.isbn}</p>
        </div>
        <span className={`badge ${inProduction ? 'status-in-progress' : 'status-resolved'}`}>{b.status}</span>
      </div>

      {inProduction ? (
        <p className="muted">
          This book is still in production, so there are no sales or royalties yet. We email you at each stage.
        </p>
      ) : (
        <>
          <dl className="grid">
            <div><dt>Published</dt><dd>{date(b.publicationDate)}</dd></div>
            <div><dt>MRP</dt><dd>{money(b.mrp)}</dd></div>
            <div><dt>Copies sold</dt><dd>{b.copiesSold}</dd></div>
            <div><dt>Royalty earned</dt><dd>{money(b.royaltyEarned)}</dd></div>
            <div><dt>Royalty paid</dt><dd>{money(b.royaltyPaid)}</dd></div>
            <div><dt>Royalty pending</dt><dd>{money(b.royaltyPending)}</dd></div>
          </dl>
          <p className="muted">
            {b.lastRoyaltyPayoutDate ? `Last payout: ${date(b.lastRoyaltyPayoutDate)}` : 'No payouts yet'}
            {b.availableOn.length ? ` · Available on ${b.availableOn.join(', ')}` : ''}
          </p>
        </>
      )}
    </article>
  );
}

export default function MyBooks() {
  const [books, setBooks] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/books').then((r) => setBooks(r.data.books)).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!books) return <p className="muted">Loading your books…</p>;

  return (
    <>
      <div className="row between">
        <h1>My books</h1>
        <Link className="btn" to="/tickets/new">Raise a query</Link>
      </div>
      {books.length === 0 ? <p className="muted">No books on your account yet.</p> : books.map((b) => <BookCard key={b._id} b={b} />)}
    </>
  );
}
