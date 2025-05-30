const priceHistorySchema = require('../models/MongoDB/prices_history');
const { calculateRSI, calculateMACD } = require('../utils/technicalIndicators'); // puedes moverlos a utils


async function GetAllPricesHistory(req) {
  try {
    let prices_history = await priceHistorySchema.find().lean(); 
    return prices_history;
  } catch (error) {
    return error;
  }
}

async function calculateIndicators(req) {
  const { symbol, timeframe, interval, indicators } = req.data;

  if (!symbol || !timeframe || !interval || !indicators) {
    console.error('Faltan parámetros:', { symbol, timeframe, interval, indicators });
    throw new Error('Faltan parámetros requeridos.');
  }

  //console.log('Indicadores solicitados:', indicators);

  try {
    const data = await priceHistorySchema.find({ symbol }).sort({ date: 1 }).lean();

    if (!data || data.length === 0) {
      throw new Error('No se encontraron datos históricos para el símbolo especificado.');
    }

    const closePrices = data.map(entry => entry.last);
    //console.log('Cantidad de precios:', closePrices.length);
    //console.log('Primeros 5 precios:', closePrices.slice(0, 5));


    let resultIndicators = {};

    if (indicators.includes('RSI')) {
      resultIndicators.RSI = calculateRSI(closePrices);
    }

    if (indicators.includes('MACD')) {
      const { macd } = calculateMACD(closePrices);
      resultIndicators.MACD = macd;
    }

    return {
      symbol,
      timeframe,
      interval,
      calculatedIndicators: resultIndicators,
    };

  } catch (error) {
    console.error('Error al calcular indicadores:', error);
    throw new Error('Hubo un error al calcular los indicadores.');
  }
}

module.exports = {  GetAllPricesHistory, calculateIndicators };