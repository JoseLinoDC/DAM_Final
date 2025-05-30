/* NO USAR DE MOMENTO */





const technicalindicators = require('technicalindicators');
const { fetchHistoricalOptions } = require('../models/MongoDB/alphavantage');

// Función para calcular los indicadores
async function calculateIndicators(symbol, indicators) {
    // Verificación de que los indicadores no estén vacíos
    if (!indicators || indicators.length === 0) {
        throw new Error('No se proporcionaron indicadores.');
    }

    // Paso 1: Obtener los precios históricos
    const prices = await fetchHistoricalOptions(symbol);

    // Verificación de que se recibieron los precios
    if (!prices || prices.length === 0) {
        throw new Error('No se encontraron precios históricos para el símbolo proporcionado.');
    }

    const priceValues = prices.map(p => parseFloat(p.last));  // Extracción de los valores de 'last' (cierre)
    const result = [];

    // Iteramos sobre los indicadores solicitados
    for (let indicator of indicators) {
        let indicatorData = [];

        if (indicator.startsWith('SHORT:') || indicator.startsWith('LONG:')) {
            const period = parseInt(indicator.split(':')[1]);

            // Verificación para evitar valores invalidos de period
            if (isNaN(period)) {
                throw new Error(`Periodo inválido para el indicador ${indicator}`);
            }

            const ema = technicalindicators.EMA.calculate({
                period,
                values: priceValues
            });

            indicatorData = ema.map((value, index) => ({
                date: prices[index].date,
                [`EMA_${period}`]: value
            }));
        }

        if (indicator === 'RSI') {
            const rsi = technicalindicators.RSI.calculate({
                period: 14,
                values: priceValues
            });

            indicatorData = rsi.map((value, index) => ({
                date: prices[index].date,
                RSI: value
            }));
        }

        if (indicator === 'MACD') {
            const macd = technicalindicators.MACD.calculate({
                values: priceValues,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9
            });

            indicatorData = macd.map((value, index) => ({
                date: prices[index].date,
                MACD: value.MACD,
                MACDSignal: value.signal,
                MACDHistogram: value.histogram
            }));
        }

        result.push({ [indicator]: indicatorData });
    }

    return result;
}

module.exports = {
    calculateIndicators
};
