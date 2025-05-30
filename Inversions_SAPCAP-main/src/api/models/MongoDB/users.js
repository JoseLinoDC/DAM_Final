const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  movementId: { type: String, required: true },
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'trade', 'fee'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String }
}, { _id: false });

const walletSchema = new mongoose.Schema({
  balance: { type: Number, required: true },
  currency: { type: String, required: true },
  movements: [movementSchema]
}, { _id: false });

const usersSchema = new mongoose.Schema({
  idUser: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, required: true },
  wallet: { type: walletSchema, required: true }
});

module.exports = mongoose.model(
    'USERS', 
    usersSchema,
    'USERS'
);