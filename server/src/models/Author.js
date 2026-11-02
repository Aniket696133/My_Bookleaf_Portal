import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    authorCode: { type: String, required: true, unique: true }, // e.g. AUTH001
    name: { type: String, required: true },
    email: String,
    phone: String,
    city: String,
    joinedDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Author', authorSchema);
