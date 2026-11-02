import Ticket from '../models/Ticket.js';
import Message from '../models/Message.js';
import Book from '../models/Book.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toAuthorTicket, toPublicMessage } from '../utils/serializers.js';
import { classifyTicket } from '../services/ai/classifier.js';

const isAdmin = (req) => req.user.role === 'admin';

const populateTicket = (q) =>
  q.populate('book', 'title status').populate('author', 'name authorCode email').populate('assignedTo', 'name');

// Authors get a 404 (not 403) for other people's tickets so ids can't be probed.
export async function findTicketFor(req) {
  const filter = { _id: req.params.id };
  if (!isAdmin(req)) filter.author = req.user.authorId;
  const ticket = await populateTicket(Ticket.findOne(filter));
  if (!ticket) throw new HttpError(404, 'Ticket not found');
  return ticket;
}

export const createTicket = asyncHandler(async (req, res) => {
  const { bookId, subject, description, attachments } = req.body;
  if (bookId) {
    const owned = await Book.exists({ _id: bookId, author: req.user.authorId });
    if (!owned) throw new HttpError(400, 'The selected book is not on your account');
  }
  const ticket = await Ticket.create({
    author: req.user.authorId,
    book: bookId || null,
    subject,
    description,
    attachments,
  });
  res.status(201).json({ ticket: toAuthorTicket(ticket) });

  // Fire-and-forget: the author never waits on the AI. classifyTicket never throws.
  classifyTicket(ticket.id);
});

export const listTickets = asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    const tickets = await Ticket.find({ author: req.user.authorId }).sort({ createdAt: -1 }).populate('book', 'title');
    return res.json({ tickets: tickets.map(toAuthorTicket) });
  }

  const { status, category, priority, assigned, from, to, page, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assigned === 'me') filter.assignedTo = req.user.id;
  if (assigned === 'unassigned') filter.assignedTo = null;
  if (from || to) filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  // Unresolved first, then most urgent, then oldest: the top of the queue is what needs attention.
  const [tickets, total] = await Promise.all([
    populateTicket(Ticket.find(filter).sort({ isActive: -1, priorityRank: 1, createdAt: 1 }).skip((page - 1) * limit).limit(limit)).lean(),
    Ticket.countDocuments(filter),
  ]);
  res.json({ tickets, total, page, limit });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await findTicketFor(req);
  const messageFilter = { ticket: ticket._id, ...(isAdmin(req) ? {} : { isInternal: false }) };
  const messages = await Message.find(messageFilter).sort({ createdAt: 1 }).lean();

  if (isAdmin(req)) return res.json({ ticket, messages });
  res.json({ ticket: toAuthorTicket(ticket), messages: messages.map(toPublicMessage) });
});

export const addMessage = asyncHandler(async (req, res) => {
  const ticket = await findTicketFor(req);
  const admin = isAdmin(req);
  if (ticket.status === 'Closed') throw new HttpError(409, 'This ticket is closed. Please open a new ticket.');

  const isInternal = admin && Boolean(req.body.isInternal); // authors can never write internal notes
  const message = await Message.create({
    ticket: ticket._id,
    sender: req.user.id,
    senderRole: req.user.role,
    senderName: req.user.name,
    body: req.body.body,
    isInternal,
  });

  // Status workflow: first public admin reply -> In Progress; author reply on a resolved ticket reopens it.
  if (admin && !isInternal && ticket.status === 'Open') ticket.status = 'In Progress';
  if (!admin && ticket.status === 'Resolved') ticket.status = 'Open';
  ticket.markModified('updatedAt');
  await ticket.save();

  res.status(201).json({ message });
});
