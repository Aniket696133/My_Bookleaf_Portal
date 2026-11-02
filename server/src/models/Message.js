import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['author', 'admin'], required: true },
    senderName: { type: String, required: true },
    body: { type: String, required: true, trim: true },
    isInternal: { type: Boolean, default: false }, // internal notes are admin-only
  },
  { timestamps: true }
);

messageSchema.index({ ticket: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
