import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/HttpError.js';
import { findTicketFor } from './tickets.controller.js';
import { classifyTicket } from '../services/ai/classifier.js';
import { generateDraft } from '../services/ai/drafter.js';
import { AiUnavailableError } from '../services/ai/client.js';

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await findTicketFor(req);
  const { status, category, priority, assignedTo } = req.body;

  if (status) ticket.status = status;
  if (category) {
    ticket.category = category;
    ticket.categorySource = 'admin'; // override is remembered so AI retries never overwrite it
  }
  if (priority) {
    ticket.priority = priority;
    ticket.prioritySource = 'admin';
  }
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo === 'me' ? req.user.id : null;

  await ticket.save();
  const updated = await findTicketFor(req);
  res.json({ ticket: updated });
});

// Retry AI classification (e.g. after an outage). Admin overrides are preserved.
export const reclassifyTicket = asyncHandler(async (req, res) => {
  await findTicketFor(req);
  await classifyTicket(req.params.id, { force: true });
  const ticket = await findTicketFor(req);
  if (ticket.aiStatus === 'failed') {
    throw new HttpError(503, 'AI classification is unavailable right now. You can set the category and priority manually.');
  }
  res.json({ ticket });
});

export const draftReply = asyncHandler(async (req, res) => {
  await findTicketFor(req);
  try {
    const draft = await generateDraft(req.params.id);
    res.json({ draft });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      throw new HttpError(503, 'AI drafting is unavailable right now. You can write the reply manually.');
    }
    throw err;
  }
});
