import { Router } from 'express';
import { createTicket, listTickets, getTicket, addMessage } from '../controllers/tickets.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTicketSchema, messageSchema, listTicketsQuerySchema } from './schemas.js';

const router = Router();
router.use(authenticate); // every ticket route requires a valid token

router.post('/', requireRole('author'), validate(createTicketSchema), createTicket);
router.get('/', validate(listTicketsQuerySchema, 'query'), listTickets); // role decides own vs all
router.get('/:id', getTicket);
router.post('/:id/messages', validate(messageSchema), addMessage);

export default router;
