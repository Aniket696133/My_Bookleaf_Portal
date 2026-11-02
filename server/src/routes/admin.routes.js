import { Router } from 'express';
import { updateTicket, reclassifyTicket, draftReply } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateTicketSchema } from './schemas.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.patch('/tickets/:id', validate(updateTicketSchema), updateTicket);
router.post('/tickets/:id/classify', reclassifyTicket);
router.post('/tickets/:id/draft', draftReply);

export default router;
