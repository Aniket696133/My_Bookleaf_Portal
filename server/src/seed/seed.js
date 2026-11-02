// Usage: npm run seed   (wipes and re-creates all data from bookleaf_sample_data.json)
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Author from '../models/Author.js';
import Book from '../models/Book.js';
import Ticket from '../models/Ticket.js';
import Message from '../models/Message.js';

const AUTHOR_PASSWORD = 'Author@123';
const ADMIN = { email: 'admin@bookleaf.com', password: 'Admin@123', name: 'BookLeaf Support' };

const data = JSON.parse(fs.readFileSync(new URL('./bookleaf_sample_data.json', import.meta.url), 'utf8'));
const toDate = (v) => (v ? new Date(v) : null);

await connectDB();
await Promise.all([User, Author, Book, Ticket, Message].map((m) => m.deleteMany({})));

await User.create({ ...ADMIN, role: 'admin', passwordHash: await bcrypt.hash(ADMIN.password, 10) });

const authorHash = await bcrypt.hash(AUTHOR_PASSWORD, 10);
let bookCount = 0;
for (const a of data.authors) {
  const user = await User.create({ email: a.email, name: a.name, role: 'author', passwordHash: authorHash });
  const author = await Author.create({
    user: user._id, authorCode: a.author_id, name: a.name, email: a.email, phone: a.phone, city: a.city, joinedDate: toDate(a.joined_date),
  });
  const books = a.books.map((b) => ({
    author: author._id,
    bookCode: b.book_id,
    title: b.title,
    isbn: b.isbn,
    genre: b.genre,
    publicationDate: toDate(b.publication_date),
    status: b.status,
    mrp: b.mrp ?? null,
    royaltyPerCopy: b.author_royalty_per_copy ?? null,
    copiesSold: b.total_copies_sold ?? 0,
    royaltyEarned: b.total_royalty_earned ?? 0,
    royaltyPaid: b.royalty_paid ?? 0,
    royaltyPending: b.royalty_pending ?? 0,
    lastRoyaltyPayoutDate: toDate(b.last_royalty_payout_date),
    printPartner: b.print_partner ?? null,
    availableOn: b.available_on ?? [],
  }));
  await Book.insertMany(books);
  bookCount += books.length;
}

console.log(`Seeded ${data.authors.length} authors, ${bookCount} books, 1 admin.`);
console.log(`Admin: ${ADMIN.email} / ${ADMIN.password}`);
console.log(`Authors: <email from dataset> / ${AUTHOR_PASSWORD}  (e.g. priya.sharma@email.com)`);
await mongoose.disconnect();
