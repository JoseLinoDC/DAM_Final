/* NO USAR DE MOMENTO */




const axios = require('axios');

const API_KEY = '9BIPPPBV4TA9MZGE';

async function fetchHistoricalOptions(symbol) {
  const url = `https://www.alphavantage.co/query?function=HISTORICAL_OPTIONS&symbol=${symbol}&apikey=${API_KEY}`;

  try {
    const response = await axios.get(url);
    console.log('[AlphaVantage] Full response:', JSON.stringify(response.data, null, 2));

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return []; // Para que el controlador no se caiga
    }
  } catch (error) {
    console.error('[AlphaVantage] Error:', error.message);
    return [];
  }
}

module.exports = { fetchHistoricalOptions };