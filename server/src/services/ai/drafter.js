import Ticket from '../../models/Ticket.js';
import Book from '../../models/Book.js';
import Message from '../../models/Message.js';
import { complete } from './client.js';
import { classifyTicket } from './classifier.js';
import { CATEGORY_KEY, POLICIES, EXAMPLES } from './knowledgeBase.js';
import { DRAFT_SYSTEM, buildDraftUser } from './prompts.js';
import { describeBook, payoutCycleNote } from './royaltyFacts.js';

const HISTORY_LIMIT = 4; // only the latest public messages, not the whole thread

/** Generates (and stores) an AI draft reply. Throws AiUnavailableError if the LLM is down. */
export async function generateDraft(ticketId) {
  let ticket = await Ticket.findById(ticketId).populate('author', 'name').populate('book');
  if (ticket.aiStatus !== 'done') {
    await classifyTicket(ticketId); // draft quality depends on the category-specific KB slice
    ticket = await Ticket.findById(ticketId).populate('author', 'name').populate('book');
  }

  const key = CATEGORY_KEY[ticket.category] || 'general';
  const history = (
    await Message.find({ ticket: ticketId, isInternal: false }).sort({ createdAt: -1 }).limit(HISTORY_LIMIT).lean()
  ).reverse();

  // Book-level ticket -> that book only. Account-level -> one compact block per book.
  let bookContext;
  if (ticket.book) {
    bookContext = describeBook(ticket.book);
  } else {
    const books = await Book.find({ author: ticket.author._id }).lean();
    bookContext =
      'Account-level query. Author books:\n' + (books.map((b) => `- ${describeBook(b)}`).join('\n') || 'No books on file.');
  }
  if (key === 'royalty') bookContext += `\n${payoutCycleNote()}`;

  const { text, model, inputTokens, outputTokens } = await complete({
    system: DRAFT_SYSTEM,
    user: buildDraftUser({
      authorName: ticket.author.name,
      ticket,
      policy: POLICIES[key],
      example: EXAMPLES[key],
      bookContext,
      history,
    }),
    maxTokens: 500,
  });

  ticket.draft = { text, generatedAt: new Date(), model, inputTokens, outputTokens };
  await ticket.save();
  return ticket.draft;
}
