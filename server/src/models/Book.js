import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true, index: true },
    bookCode: { type: String, required: true, unique: true }, // e.g. BK001
    title: { type: String, required: true },
    isbn: String,
    genre: String,
    publicationDate: { type: Date, default: null }, // null while in production
    status: { type: String, required: true },
    mrp: { type: Number, default: null },
    royaltyPerCopy: { type: Number, default: null },
    copiesSold: { type: Number, default: 0 },
    royaltyEarned: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    printPartner: { type: String, default: null },
    availableOn: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Book', bookSchema);
