import mongoose from 'mongoose';
import { CATEGORIES, PRIORITIES, PRIORITY_RANK, STATUSES } from '../constants.js';

const ticketSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null }, // null = General / Account Level
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: [{ name: String, size: Number, _id: false }], // metadata only (UI-only upload)

    status: { type: String, enum: STATUSES, default: 'Open' },
    isActive: { type: Boolean, default: true }, // derived from status, used for queue sorting

    category: { type: String, enum: [...CATEGORIES, null], default: null },
    categorySource: { type: String, enum: ['ai', 'admin', 'none'], default: 'none' },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    priorityRank: { type: Number, default: PRIORITY_RANK.Medium },
    prioritySource: { type: String, enum: ['ai', 'admin', 'none'], default: 'none' },
    aiReasoning: String,
    aiStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    draft: { text: String, generatedAt: Date, model: String, inputTokens: Number, outputTokens: Number },
  },
  { timestamps: true }
);

// Keep derived fields consistent whichever code path changes status/priority.
ticketSchema.pre('save', function (next) {
  this.isActive = !['Resolved', 'Closed'].includes(this.status);
  this.priorityRank = PRIORITY_RANK[this.priority];
  next();
});

ticketSchema.index({ author: 1, createdAt: -1 });
ticketSchema.index({ isActive: -1, priorityRank: 1, createdAt: 1 });

export default mongoose.model('Ticket', ticketSchema);
