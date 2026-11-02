import { ZodError } from 'zod';
import { HttpError } from '../utils/HttpError.js';

export const notFound = (req, res, next) => next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Consistent error shape: { error: { message, details? } }
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({ error: { message: 'Validation failed', details } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { message: `Invalid value for ${err.path}` } });
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong on our side. Please try again.' } });
}
