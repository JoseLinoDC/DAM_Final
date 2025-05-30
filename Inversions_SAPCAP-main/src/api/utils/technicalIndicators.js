function calculateRSI(closes, period = 7) {//GENERALMENTE 14 DIAS 
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  gains /= period;
  losses /= period;

  if (losses === 0) return 100;

  let rs = gains / losses;
  return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
}

function calculateEMA(values, period) {
  const k = 2 / (period + 1);
  let emaArray = [values[0]];

  for (let i = 1; i < values.length; i++) {
    const ema = values[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(ema);
  }

  return emaArray;
}

function calculateMACD(closes, shortPeriod = 12, longPeriod = 26) {
  if (closes.length < longPeriod) return { macd: null };

  const shortEMA = calculateEMA(closes, shortPeriod);
  const longEMA = calculateEMA(closes, longPeriod);

  const macdArray = shortEMA.map((val, idx) =>
    idx < longPeriod - 1 ? null : parseFloat((val - longEMA[idx]).toFixed(2))
  );

  const recentMacd = macdArray[macdArray.length - 1];
  return { macd: recentMacd };
}

module.exports = { calculateRSI, calculateMACD };
