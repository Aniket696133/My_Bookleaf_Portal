import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import MyBooks from './pages/author/MyBooks.jsx';
import SubmitTicket from './pages/author/SubmitTicket.jsx';
import MyTickets from './pages/author/MyTickets.jsx';
import TicketQueue from './pages/admin/TicketQueue.jsx';
import TicketDetail from './pages/admin/TicketDetail.jsx';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/books'} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute role="author" />}>
            <Route path="/books" element={<MyBooks />} />
            <Route path="/tickets/new" element={<SubmitTicket />} />
            <Route path="/tickets" element={<MyTickets />} />
          </Route>
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<TicketQueue />} />
            <Route path="/admin/tickets/:id" element={<TicketDetail />} />
          </Route>
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
