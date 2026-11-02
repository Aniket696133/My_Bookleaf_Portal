import Book from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Authors only ever get books where author === their own id (taken from the JWT, never from the client).
export const listMyBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({ author: req.user.authorId }).sort({ bookCode: 1 }).lean();
  res.json({ books });
});
