import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <header className="nav">
      <strong className="brand">BookLeaf</strong>
      <nav>
        {user.role === 'author' ? (
          <>
            <NavLink to="/books">My books</NavLink>
            <NavLink to="/tickets/new">New query</NavLink>
            <NavLink to="/tickets" end>My tickets</NavLink>
          </>
        ) : (
          <NavLink to="/admin">Ticket queue</NavLink>
        )}
      </nav>
      <div className="nav-user">
        <span>{user.name}</span>
        <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
      </div>
    </header>
  );
}
