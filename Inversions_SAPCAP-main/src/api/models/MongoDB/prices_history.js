const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  contractID:          { type: String, required: true, unique: true },
  symbol:              { type: String, required: true },
  expiration:          { type: Date, required: true },
  strike:              { type: Number, required: true },
  type:                { type: String, enum: ['call', 'put'], required: true },
  last:                { type: Number, required: true },
  mark:                { type: Number, required: true },
  bid:                 { type: Number, required: true },
  bid_size:            { type: Number, required: true },
  ask:                 { type: Number, required: true },
  ask_size:            { type: Number, required: true },
  volume:              { type: Number, required: true },
  open_interest:       { type: Number, required: true },
  date:                { type: Date, required: true },
  implied_volatility:  { type: Number, required: true },
  delta:               { type: Number, required: true },
  gamma:               { type: Number, required: true },
  theta:               { type: Number, required: true },
  vega:                { type: Number, required: true },
  rho:                 { type: Number, required: true }
});

module.exports = mongoose.model('PRICES_HISTORY', priceHistorySchema, 'PRICES_HISTORY');
