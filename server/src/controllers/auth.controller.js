import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Author from '../models/Author.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email / wrong password: don't reveal which accounts exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const author = user.role === 'author' ? await Author.findOne({ user: user._id }) : null;
  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.name, authorId: author?.id ?? null },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
