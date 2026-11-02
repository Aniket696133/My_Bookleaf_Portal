import { Router } from 'express';
import { listMyBooks } from '../controllers/books.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', authenticate, requireRole('author'), listMyBooks);
export default router;
