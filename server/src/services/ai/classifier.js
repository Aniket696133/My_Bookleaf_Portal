import { z } from 'zod';
import Ticket from '../../models/Ticket.js';
import { CATEGORIES, PRIORITIES, PRIORITY_RANK } from '../../constants.js';
import { complete } from './client.js';
import { CLASSIFIER_SYSTEM, buildClassifierUser } from './prompts.js';

const resultSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  reasoning: z.string().max(300).optional().default(''),
});

function parseModelJson(text) {
  const match = text.match(/\{[\s\S]*\}/); // tolerate stray prose / code fences
  if (!match) throw new Error('No JSON in model output');
  return resultSchema.parse(JSON.parse(match[0]));
}

/**
 * Classifies a ticket (category + priority). Never throws: on failure the ticket keeps
 * aiStatus='failed' so admins can classify manually or retry. Admin overrides are never overwritten.
 */
export async function classifyTicket(ticketId, { force = false } = {}) {
  const ticket = await Ticket.findById(ticketId).populate('book', 'title status');
  if (!ticket) return null;
  if (ticket.aiStatus === 'done' && !force) return ticket;

  try {
    const { text } = await complete({
      system: CLASSIFIER_SYSTEM,
      user: buildClassifierUser(ticket, ticket.book),
      maxTokens: 120, // tiny JSON answer; ticket text only, no KB needed
    });
    const result = parseModelJson(text);

    // Guardrail from KB policy: ISBN errors are always at least High priority.
    if (result.category === 'ISBN & Metadata Issues' && PRIORITY_RANK[result.priority] > PRIORITY_RANK.High) {
      result.priority = 'High';
    }

    // Re-read so we don't clobber an admin override made while the AI call was in flight.
    const fresh = await Ticket.findById(ticketId);
    if (fresh.categorySource !== 'admin') {
      fresh.category = result.category;
      fresh.categorySource = 'ai';
    }
    if (fresh.prioritySource !== 'admin') {
      fresh.priority = result.priority;
      fresh.prioritySource = 'ai';
    }
    fresh.aiReasoning = result.reasoning;
    fresh.aiStatus = 'done';
    return await fresh.save();
  } catch (err) {
    console.error('[ai] classification failed for', ticketId, err.message);
    ticket.aiStatus = 'failed';
    return await ticket.save();
  }
}
