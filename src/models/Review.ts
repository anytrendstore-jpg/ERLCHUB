import mongoose from 'mongoose';

interface IReview {
  name?: string;
  rating: number; 
  comment: string;
  tag: 'Comunidad' | 'Tienda' | 'Hub Coins';
  userId?: string;
  username?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new mongoose.Schema<IReview>({
  name: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  tag: {
    type: String,
    required: true,
    enum: ['Comunidad', 'Tienda', 'Hub Coins']
  },
  userId: {
    type: String,
    required: false
  },
  username: {
    type: String,
    required: false,
    trim: true
  },
  avatar: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

ReviewSchema.index({ tag: 1, rating: -1, createdAt: -1 });
ReviewSchema.index({ userId: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);