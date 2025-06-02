const SimulationModel = require("../models/mongodb/simulations");
const axios = require("axios");
require("dotenv").config(); //para usar el .env despues
// const API_KEY = "7NONLRJ6ARKI0BA4";
// const API_KEY = "4NCHFPILY0107FYG";
const API_KEY = "HJ168GZFTJ5G77U5";

async function SimulateMomentum(body) {
  // const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = req || {};
  const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = body;

  console.log(body);
  const numR = Math.floor(Math.random() * 1000).toString();
  //GENERAR ID pa' la estrategia
  const idStrategy = (symbol, usuario) => {
    const date = new Date();
    const timestamp = date.toISOString().slice(0, 10);
    const user = (usuario || "").toString()[0] || "U";
    return `${symbol}-${timestamp}-${user}-${numR}`;
  };
  //Datos Estaticos para la respuesta
  const SIMULATIONID = idStrategy(SYMBOL, USERID);
  const SIMULATIONNAME = "Estrategia de Momentum-" + numR;
  const STRATEGYID = "MOM";
  console.log(SIMULATIONID);
  // Validación del body.
  const missingParams = [];
  if (!SYMBOL) missingParams.push("SYMBOL");
  if (!STARTDATE) missingParams.push("STARTDATE");
  if (!ENDDATE) missingParams.push("ENDDATE");
  if (AMOUNT === undefined || AMOUNT <= 0) missingParams.push("AMOUNT");
  if (!USERID) missingParams.push("USERID");
  if (!Array.isArray(SPECS) || SPECS.length === 0) missingParams.push("SPECS");
  if (missingParams.length > 0) {
    return {
      message: `FALTAN PARÁMETROS REQUERIDOS: ${missingParams.join(", ")}.`,
    };
  }
  // ||||||| <---Usos de la API
  const APIURL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;
  // const response = await axios.get(APIURL);
  // const data = response.data["Time Series (Daily)"]; // objeto por fechas
  // VAlidar que la api retorne datos
  let response;
  try {
    response = await axios.get(APIURL);
  } catch (error) {
    return {
      status: 500,
      message: "Error al obtener datos del mercado: " + error.message,
    };
  }

  const data = response.data["Time Series (Daily)"];
  if (!data) {
    return {
      status: 500,
      message: "Datos no disponibles para el símbolo solicitado.",
    };
  }

  const parsedData = Object.entries(data).map(([date, values]) => ({
    DATE: date,
    OPEN: parseFloat(values["1. open"]),
    HIGH: parseFloat(values["2. high"]),
    LOW: parseFloat(values["3. low"]),
    CLOSE: parseFloat(values["4. close"]),
    VOLUME: parseFloat(values["5. volume"]),
  }));

  //filtrar por fecha
  function filtrarPorFecha(data, startDate, endDate) {
    return data.filter((item) => {
      let itemdate = new Date(item.DATE).toISOString().slice(0, 10);
      return itemdate >= startDate && itemdate <= endDate;
    });
  }
  
  function calculateEMA(data, period, key = "CLOSE") {
    const k = 2 / (period + 1);
    let emaArray = [];
    let emaPrev =
      data.slice(0, period).reduce((sum, d) => sum + d[key], 0) / period; // SMA inicial

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        emaArray.push(null); // no hay suficiente data
      } else if (i === period - 1) {
        emaArray.push(emaPrev);
      } else {
        const price = data[i][key];
        emaPrev = price * k + emaPrev * (1 - k);
        emaArray.push(emaPrev);
      }
    }
    return emaArray;
  }

  function calculateRSI(data, period, key = "CLOSE") {
    let gains = [];
    let losses = [];
    let rsiArray = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i][key] - data[i - 1][key];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    rsiArray = Array(period).fill(null); // Sin RSI para primeros periodos

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      if (avgLoss === 0) {
        rsiArray.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        rsiArray.push(rsi);
      }
    }

    // rsiArray se calcula desde el índice 1, pero la longitud debe coincidir con data
    rsiArray.unshift(null); // Ajustamos para que sea la misma longitud que data
    return rsiArray;
  }

  function calculateADX(
    data,
    period,
    keyHigh = "HIGH",
    keyLow = "LOW",
    keyClose = "CLOSE"
  ) {
    // Implementación simplificada de ADX

    let tr = [];
    let plusDM = [];
    let minusDM = [];

    for (let i = 1; i < data.length; i++) {
      const high = data[i][keyHigh];
      const low = data[i][keyLow];
      const prevHigh = data[i - 1][keyHigh];
      const prevLow = data[i - 1][keyLow];
      const prevClose = data[i - 1][keyClose];

      const highLow = high - low;
      const highPrevClose = Math.abs(high - prevClose);
      const lowPrevClose = Math.abs(low - prevClose);
      const trueRange = Math.max(highLow, highPrevClose, lowPrevClose);
      tr.push(trueRange);

      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    }

    // suavizado asi bien suave
    function smooth(values, period) {
      let smoothed = [];
      let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
      smoothed[period - 1] = sum;
      for (let i = period; i < values.length; i++) {
        smoothed[i] = smoothed[i - 1] - smoothed[i - 1] / period + values[i];
      }
      return smoothed;
    }

    const smoothedTR = smooth(tr, period);
    const smoothedPlusDM = smooth(plusDM, period);
    const smoothedMinusDM = smooth(minusDM, period);

    let plusDI = [];
    let minusDI = [];
    let dx = [];

    for (let i = period - 1; i < smoothedTR.length; i++) {
      plusDI[i] = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
      minusDI[i] = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
      dx[i] =
        (Math.abs(plusDI[i] - minusDI[i]) / (plusDI[i] + minusDI[i])) * 100;
    }

    let adx = [];
    // Primer ADX es promedio de primeros periodos DX
    let initialADX =
      dx.slice(period, period * 2 - 1).reduce((a, b) => a + b, 0) / period;
    for (let i = 0; i < period * 2 - 1; i++) adx.push(null);
    adx.push(initialADX);

    for (let i = period * 2; i < dx.length; i++) {
      const val = (adx[adx.length - 1] * (period - 1) + dx[i]) / period;
      adx.push(val);
    }

    // Ajustar longitud para que coincida con data.length
    while (adx.length < data.length) adx.unshift(null);

    return adx;
  }

  function CalcularIndicadores(parsedData, SPECS) {
    // Valores por defecto si faltan o no tienen VALUE
    const defaults = {
      LONG: 21,
      SHORT: 50,
      RSI: 14,
      ADX: 14,
    };

    // Construir mapa validando VALUE y usando default si no está o es inválido
    const specMap = SPECS.reduce((acc, curr) => {
      const ind = curr.INDICATOR;
      const val =
        typeof curr.VALUE === "number" && !isNaN(curr.VALUE)
          ? curr.VALUE
          : defaults[ind];
      acc[ind] = val !== undefined ? val : defaults[ind];
      return acc;
    }, {});
    //Validacion si falto algun indicador
    const emaShortPeriod = specMap["SHORT"] || defaults.SHORT;
    const emaLongPeriod = specMap["LONG"] || defaults.LONG;
    const rsiPeriod = specMap["RSI"] || defaults.RSI;
    const adxPeriod = specMap["ADX"] || defaults.ADX;
    parsedData.sort((a, b) => new Date(a.DATE) - new Date(b.DATE));
    //se calculan los indicadores
    const emaShort = calculateEMA(parsedData, emaShortPeriod);
    const emaLong = calculateEMA(parsedData, emaLongPeriod);
    const rsi = calculateRSI(parsedData, rsiPeriod);
    const adx = calculateADX(parsedData, adxPeriod);

    return parsedData.map((item, i) => ({
      DATE: new Date(item.DATE).toISOString().slice(0, 10),
      SHORT: emaShort[i],
      LONG: emaLong[i],
      RSI: rsi[i],
      ADX: adx[i],
    }));
  }
  //Calcular los indicadores con todo el historico pq require fechas atras y q hueva filtrar chido
  const calculoIndicadores = CalcularIndicadores(parsedData, SPECS);
  //Los indicadores filtrados por fechas indicadoresFiltrados
  const indicadoresFiltrados = filtrarPorFecha(
    calculoIndicadores,
    STARTDATE,
    ENDDATE
  );
  //El priceHistory filtrado por fecha priceHistoryFiltrado
  const priceHistoryFiltrado = filtrarPorFecha(parsedData, STARTDATE, ENDDATE);
  //console.log(indicadoresFiltrados);
  //console.log(priceHistoryFiltrado);

  //constuir el chart_data ✅
  function ChartData(priceHistoryFiltrado, indicadoresFiltrados) {
    return priceHistoryFiltrado.map((precio) => {
      const fecha = new Date(precio.DATE).toISOString().slice(0, 10);
      const ind = indicadoresFiltrados.find((i) => i.DATE === fecha) || {};

      return {
        DATE: fecha,
        OPEN: precio.OPEN,
        HIGH: precio.HIGH,
        LOW: precio.LOW,
        CLOSE: precio.CLOSE,
        VOLUME: precio.VOLUME,
        INDICATORS: [
          { INDICATOR: "short_ma", VALUE: ind.SHORT ?? null },
          { INDICATOR: "long_ma", VALUE: ind.LONG ?? null },
          { INDICATOR: "rsi", VALUE: ind.RSI ?? null },
          { INDICATOR: "adx", VALUE: ind.ADX ?? null },
        ],
      };
    });
  }

  const chartData = ChartData(priceHistoryFiltrado, indicadoresFiltrados);
  //console.log(chartData);

  //✅
  //Comprobar que dias se cumple con las condiciones de los indicadores y generar las señales
  function simularEstrategiaTrading(
    indicadoresFiltrados,
    historialpricesFiltrado
  ) {
    const señales = [];

    for (let i = 1; i < indicadoresFiltrados.length; i++) {
      const anterior = indicadoresFiltrados[i - 1];
      const actual = indicadoresFiltrados[i];

      const priceDia = historialpricesFiltrado.find(
        (price) =>
          new Date(price.DATE).toISOString().slice(0, 10) ===
          new Date(actual.DATE).toISOString().slice(0, 10)
      );
      if (!priceDia) continue;

      const precio = priceDia.CLOSE;
      const volumenAnterior = historialpricesFiltrado[i - 1]?.VOLUME || 0;
      const volumenActual = priceDia.VOLUME;

      const adxFuerte = actual.ADX > 25;
      const rsiModerado = actual.RSI > 55 && actual.RSI < 75;
      const rsiAlto = actual.RSI > 65;
      const rsiBajo = actual.RSI < 50;
      const cruceAlcista = actual.SHORT > actual.LONG;
      const cruceBajista =
        anterior.SHORT > anterior.LONG && actual.SHORT < actual.LONG;
      const volumenCreciente = volumenActual > volumenAnterior;
      const volumenSignificativo = volumenActual > volumenAnterior * 1.5;
      const volumenDebil = volumenActual < volumenAnterior * 0.8;
      const precioDebajoMAs = precio < actual.SHORT && precio < actual.LONG;
      const adxDebil = actual.ADX < 20;

      // 🟢 Señales BUY más detalladas
      if (cruceAlcista && rsiModerado && adxFuerte && volumenCreciente) {
        señales.push({
          DATE: actual.DATE,
          TYPE: "buy",
          PRICE: precio,
          REASONING:
            "BUY: Cruce alcista confirmado con EMA corta sobre larga, RSI entre 55-75 indicando momentum saludable, ADX fuerte (>25) mostrando tendencia y volumen creciente.",
        });
      }
      if (rsiAlto && adxFuerte && volumenSignificativo) {
        señales.push({
          DATE: actual.DATE,
          TYPE: "buy",
          PRICE: precio,
          REASONING:
            "BUY: RSI alto (>65) sugiriendo fuerte momentum, ADX fuerte (>25) indicando tendencia clara, volumen >50% superior al día anterior.",
        });
      }
      if (adxFuerte && cruceAlcista && volumenSignificativo && rsiAlto) {
        señales.push({
          DATE: actual.DATE,
          TYPE: "buy",
          PRICE: precio,
          REASONING:
            "BUY: Confirmación total de tendencia: cruce alcista, ADX >25, volumen 50% superior y RSI alto (>65).",
        });
      }

      // 🔴 Señales SELL más detalladas
      const condicionesSell = [
        {
          cond: cruceBajista,
          desc: "cruce bajista (EMA corta por debajo de EMA larga)",
        },
        { cond: precioDebajoMAs, desc: "precio por debajo de medias móviles" },
        { cond: rsiBajo, desc: "RSI bajo (<50), señal de debilidad" },
        { cond: adxDebil, desc: "ADX débil (<20), tendencia sin fuerza" },
        { cond: volumenDebil, desc: "volumen <80% del día anterior" },
      ];

      const motivos = condicionesSell.filter((c) => c.cond).map((c) => c.desc);
      if (motivos.length >= 3) {
        señales.push({
          DATE: actual.DATE,
          TYPE: "sell",
          PRICE: precio,
          REASONING: `SELL: ${motivos.join(", ")}.`,
        });
      }

      if (actual.RSI < 40 && adxDebil && !cruceAlcista) {
        señales.push({
          DATE: actual.DATE,
          TYPE: "sell",
          PRICE: precio,
          REASONING:
            "SELL: RSI muy bajo (<40) confirmando debilidad, ADX débil (<20) sin tendencia clara y sin cruce alcista.",
        });
      }
      if (cruceBajista && volumenDebil) {
        señales.push({
          DATE: actual.DATE,
          TYPE: "sell",
          PRICE: precio,
          REASONING:
            "SELL: Cruce bajista y volumen debilitado (<80% del día anterior) sugiriendo pérdida de momentum.",
        });
      }
    }
    return { SEÑALES: señales };
  }

  //✅ Aplicar la estrategia los dias de las señales
  //Vender primero lo primero que se compro, no vender hasta que haya comprado
  //✅ Generar el resumen financiero
  function calcularResumenFinanciero(señales, PHF, capitalInicial) {
    let lotes = []; // [{ cantidad, price, fecha }]
    let efectivo = capitalInicial;
    const señalesEjecutadas = [];

    let totalComprado = 0;
    let totalVendido = 0;
    let costoTotalComprado = 0;
    let gananciaReal = 0;

    for (const señal of señales) {
      const { DATE, TYPE, PRICE, REASONING } = señal;

      if (TYPE === "buy") {
        const acciones = +(efectivo / PRICE).toFixed(6);
        if (acciones > 0) {
          efectivo -= acciones * PRICE;
          lotes.push({
            cantidad: acciones,
            price: PRICE,
            fecha: new Date(DATE),
          });

          totalComprado += acciones;
          costoTotalComprado += acciones * PRICE;

          señalesEjecutadas.push({
            DATE,
            TYPE,
            PRICE,
            REASONING,
            SHARES: acciones,
          });
        }
      } else if (TYPE === "sell") {
        let totalAcciones = lotes.reduce((sum, lote) => sum + lote.cantidad, 0);
        let accionesVendidas = 0;
        if (totalAcciones > 0) {
          let accionesAVender = totalAcciones;

          let ingreso = 0;
          let costoVenta = 0;

          lotes.sort((a, b) => a.fecha - b.fecha); // FIFO

          for (let i = 0; i < lotes.length && accionesAVender > 0; i++) {
            const lote = lotes[i];
            const cantidad = Math.min(lote.cantidad, accionesAVender);
            ingreso += cantidad * PRICE;
            costoVenta += cantidad * lote.price;
            lote.cantidad -= cantidad;
            accionesAVender -= cantidad;
            accionesVendidas += cantidad;
          }

          lotes = lotes.filter((l) => l.cantidad > 0); // Eliminar lotes vacíos
          efectivo += ingreso;

          totalVendido += accionesVendidas;
          gananciaReal += ingreso - costoVenta;
        }
        señalesEjecutadas.push({
          DATE,
          TYPE,
          PRICE,
          REASONING,
          SHARES: accionesVendidas,
        });
      }
    }

    const accionesRestantes = lotes.reduce(
      (sum, lote) => sum + lote.cantidad,
      0
    );
    // Obtener price de cierre del último día
    const priceFinal = PHF.length > 0 ? PHF[PHF.length - 1].CLOSE : 0;

    const resumen = {
      TOTAL_BOUGHT_UNITS: +totalComprado.toFixed(4),
      TOTAL_SOLD_UNITS: +totalVendido.toFixed(4),
      REMAINING_UNITS: +(totalComprado - totalVendido).toFixed(4),
      FINAL_CASH: +efectivo.toFixed(2),
      FINAL_VALUE: +(
        priceFinal !== null ? accionesRestantes * priceFinal : 0
      ).toFixed(2),
      FINAL_BALANCE: +(
        efectivo + (priceFinal !== null ? accionesRestantes * priceFinal : 0)
      ).toFixed(2),
      REAL_PROFIT: +gananciaReal.toFixed(2),
    };

    return {
      SUMMARY: resumen,
      SIGNALS: señalesEjecutadas,
    };
  }

  //REVISAR SI ESTA BIEN ESTAS COSAS
  const resultadoSimulacion = simularEstrategiaTrading(
    indicadoresFiltrados,
    priceHistoryFiltrado
  );
  const resumen = calcularResumenFinanciero(
    resultadoSimulacion.SEÑALES,
    priceHistoryFiltrado,
    AMOUNT
  );

  //detail row

  //resultado de la simulacion
  const simulacion = {
    SIMULATIONID,
    USERID,
    STRATEGYID,
    SIMULATIONNAME,
    SYMBOL,
    INDICATORS: SPECS,
    AMOUNT,
    STARTDATE,
    ENDDATE,
    SIGNALS: resumen.SIGNALS,
    SUMMARY: resumen.SUMMARY,
    CHART_DATA: chartData,
    DETAIL_ROW: {
      ACTIVED: true,
      DELETED: false,
      DETAIL_ROW_REG: [
        {
          CURRENT: true,
          REGDATE: new Date().toISOString().slice(0, 10), // Formato "YYYY-MM-DD"
          REGTIME: new Date().toTimeString().slice(0, 8), // Formato "HH:MM:SS"
          REGUSER: USERID,
        },
      ],
    },
  };

  try {
    const nuevaSimulacion = new SimulationModel(simulacion);
    await nuevaSimulacion.save();
    console.log("Simulacion guardada en la base de datos.");
    //console.log(nuevaSimulacion);
  } catch (error) {
    return {
      status: 500,
      message: error.message,
    };
  }

  return {
    simulacion,
  };
} //SImulacion Momentum

/// ---------RESTO DE ESTRATEGIAS ------

async function simulateSupertrend(body) {
  console.log(body);

  try {
    const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = body;

    if (!SYMBOL || !STARTDATE || !ENDDATE || !AMOUNT || !USERID) {
      throw new Error(
        "FALTAN PARÁMETROS REQUERIDOS EN EL CUERPO DE LA SOLICITUD: 'SYMBOL', 'STARTDATE', 'ENDDATE', 'AMOUNT', 'USERID'."
      );
    }

    if (new Date(ENDDATE) < new Date(STARTDATE)) {
      throw new Error(
        "La fecha de fin  no puede ser anterior a la fecha de inicio."
      );
    }

    // Verificar si AMOUNT es numérico
    if (isNaN(AMOUNT) || typeof AMOUNT !== "number" || AMOUNT <= 0) {
      throw new Error("El monto a invertir debe ser una cantidad válida.");
    }

    //METODO PARA ASIGNAR UN ID A LA SIMULACION BASADO EN LA FECHA
    const generateSimulationId = (SYMBOL) => {
      const date = new Date();
      const timestamp = date.toISOString().replace(/[^0-9]/g, "");
      const random = Math.floor(Math.random() * 10000);
      return `${SYMBOL}_${timestamp}_${random}`;
    };

    const SIMULATIONID = generateSimulationId(SYMBOL);
    const SIMULATIONNAME = "Estrategia Supertrend + MA";
    const STRATEGYID = "idST";

    //Se buscan los identificadores en SPECS
    const MALENGTH =
      parseInt(
        SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "ma_length")?.VALUE
      ) || 20;
    const ATR_PERIOD =
      parseInt(
        SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "atr")?.VALUE
      ) || 10;
    const MULT =
      parseFloat(
        SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "mult")?.VALUE
      ) || 2.0;
    const RR =
      parseFloat(
        SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "rr")?.VALUE
      ) || 1.5;

    if (isNaN(MALENGTH) || isNaN(ATR_PERIOD) || isNaN(MULT) || isNaN(RR)) {
      throw new Error(
        "Los parámetros para la simulación deben ser valores numéricos."
      );
    }
    if (MALENGTH <= 0 || ATR_PERIOD <= 0 || MULT <= 0 || RR <= 0) {
      throw new Error(
        "Los parámetros para la simulación deben ser mayores a 0."
      );
    }

    //Se realiza la consulta de los historicos a AlphaVantage
    // const apiKey = process.env.ALPHA_VANTAGE_KEY || "demo";
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;
    const resp = await axios.get(apiUrl);

    const rawTs = resp.data["Time Series (Daily)"];
    if (!rawTs) throw new Error("Respuesta inválida de AlphaVantage");

    //Ordena las fechas de forma cronológica
    const allDatesSorted = Object.keys(rawTs).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    //Ajusta el indice de inicio
    const extendedStartIndex =
      allDatesSorted.findIndex((d) => d >= STARTDATE) -
      Math.max(MALENGTH, ATR_PERIOD);
    const adjustedStartIndex = extendedStartIndex >= 0 ? extendedStartIndex : 0; //Si no hay suficientes datos históricos, se inicia desde el primer dato disponible.

    //Filtra y mapea los precios
    const prices = allDatesSorted
      .slice(adjustedStartIndex) //Toma las fechas desde adjustedStartIndex
      .filter((date) => date <= ENDDATE) //Filtra fechas posteriores a ENDDATE
      .map((date) => ({
        //Convierte cada fecha en un objeto con los datos de precio
        DATE: date,
        OPEN: +rawTs[date]["1. open"],
        HIGH: +rawTs[date]["2. high"],
        LOW: +rawTs[date]["3. low"],
        CLOSE: +rawTs[date]["4. close"],
        VOLUME: +rawTs[date]["5. volume"],
      }));

    //Formula para calcular la Media Móvil Simple (SMA)
    const sma = (arr, len) =>
      arr.map((_, i) =>
        i >= len - 1
          ? arr.slice(i - len + 1, i + 1).reduce((a, b) => a + b, 0) / len
          : null
      );

    //Formula para calcular el Average True Range (ATR)

    const atr = (arr, period) => {
      const result = Array(arr.length).fill(null);
      const trValues = []; // Array para almacenar los TR

      for (let i = 1; i < arr.length; i++) {
        const high = arr[i].HIGH;
        const low = arr[i].LOW;
        const prevClose = arr[i - 1].CLOSE;

        // Calcula el TR y lo guarda en el array
        const tr = Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low - prevClose)
        );
        trValues.push(tr);

        // Calcula el ATR cuando hay suficientes datos
        if (i >= period) {
          const startIdx = i - period;
          const atr =
            trValues.slice(startIdx, i).reduce((a, b) => a + b, 0) / period;
          result[i] = atr;
        } else {
          result[i] = null;
        }
      }

      return result;
    };
    const closes = prices.map((p) => p.CLOSE); //Se almacena el array de precios de cierre
    const ma = sma(closes, MALENGTH); //Se almacena el array de MA calculado
    const atrVals = atr(prices, ATR_PERIOD); //Se almacena el array de ATR calculado

    let position = null;
    const signals = [];
    let cash = parseFloat(AMOUNT);
    let shares = 0;
    let realProfit = 0;
    const chartData = [];

    for (let i = MALENGTH; i < prices.length; i++) {
      if (prices.length < MALENGTH) {
        throw new Error("No hay suficientes datos para la simulación.");
      }

      const bar = prices[i];
      const close = bar.CLOSE;
      const trendUp = close > ma[i];
      const trendDown = close < ma[i];
      const stopDistance = atrVals[i] * MULT;
      const profitDistance = stopDistance * RR;

      let currentSignal = null;
      let reasoning = null;
      let profitLoss = 0;
      let sharesTransacted = 0;

      // 🟢 BUY - Reglas más descriptivas y específicas
      if (!position && cash > 0) {
        if (trendUp && closes[i - 1] < ma[i - 1]) {
          const invest = cash * 1;
          shares = invest / close;
          cash -= invest;
          position = {
            entryPrice: close,
            stop: close - stopDistance,
            limit: close + profitDistance,
          };
          currentSignal = "buy";
          reasoning =
            "BUY: Cruce alcista (precio cruzando por encima de MA), confirmando cambio de tendencia al alza y estableciendo stop-loss y objetivo de ganancias.";
          sharesTransacted = shares;
        } else if (trendUp && atrVals[i] > atrVals[i - 1]) {
          const invest = cash * 0.5;
          shares = invest / close;
          cash -= invest;
          position = {
            entryPrice: close,
            stop: close - stopDistance,
            limit: close + profitDistance,
          };
          currentSignal = "buy";
          reasoning =
            "BUY: Confirmación de tendencia alcista y aumento de volatilidad (ATR creciente), indicando mayor momentum alcista.";
          sharesTransacted = shares;
        } else if (
          trendUp &&
          ma[i] > ma[i - 1] &&
          atrVals[i] > atrVals[i - 1]
        ) {
          const invest = cash * 0.7;
          shares = invest / close;
          cash -= invest;
          position = {
            entryPrice: close,
            stop: close - stopDistance,
            limit: close + profitDistance,
          };
          currentSignal = "buy";
          reasoning =
            "BUY: MA creciente, ATR creciente y precio por encima de MA, combinación fuerte de tendencia alcista sostenida y aumento de volatilidad.";
          sharesTransacted = shares;
        }
      }

      // 🔴 SELL - Reglas más detalladas y condiciones combinadas
      else if (position) {
        if (close >= position.limit) {
          const soldShares = shares;
          cash += soldShares * close;
          profitLoss = (close - position.entryPrice) * soldShares;
          realProfit += profitLoss;
          currentSignal = "sell";
          reasoning =
            "SELL: Objetivo de ganancias alcanzado (precio >= límite). Venta para asegurar beneficios.";
          sharesTransacted = soldShares;
          shares = 0;
          position = null;
        } else if (close <= position.stop) {
          const soldShares = shares;
          cash += soldShares * close;
          profitLoss = (close - position.entryPrice) * soldShares;
          realProfit += profitLoss;
          currentSignal = "sell";
          reasoning =
            "SELL: Activación de stop-loss (precio <= stop), protegiendo el capital contra mayores pérdidas.";
          sharesTransacted = soldShares;
          shares = 0;
          position = null;
        } else if (trendDown && atrVals[i] > atrVals[i - 1]) {
          const soldShares = shares;
          cash += soldShares * close;
          profitLoss = (close - position.entryPrice) * soldShares;
          realProfit += profitLoss;
          currentSignal = "sell";
          reasoning =
            "SELL: Confirmación de tendencia bajista (precio debajo de MA) y aumento de volatilidad (ATR creciente), anticipando corrección o reversión.";
          sharesTransacted = soldShares;
          shares = 0;
          position = null;
        } else if (
          trendDown &&
          close < ma[i - 1] &&
          atrVals[i] > atrVals[i - 1]
        ) {
          const soldShares = shares;
          cash += soldShares * close;
          profitLoss = (close - position.entryPrice) * soldShares;
          realProfit += profitLoss;
          currentSignal = "sell";
          reasoning =
            "SELL: Tendencia bajista consolidada (precio debajo de MA y MA decreciente), ATR creciente, indicando posible cambio de ciclo.";
          sharesTransacted = soldShares;
          shares = 0;
          position = null;
        }
      }

      // Registro de señal
      if (currentSignal) {
        signals.push({
          DATE: bar.DATE,
          TYPE: currentSignal,
          PRICE: parseFloat(close.toFixed(2)),
          REASONING: reasoning,
          SHARES: parseFloat(sharesTransacted.toFixed(15)),
          PROFIT: parseFloat(profitLoss.toFixed(2)),
        });
      }

      // Registro de datos para el gráfico
      chartData.push({
        ...bar,
        INDICATORS: [
          { INDICATOR: "ma", VALUE: parseFloat((ma[i] ?? 0).toFixed(2)) },
          { INDICATOR: "atr", VALUE: parseFloat((atrVals[i] ?? 0).toFixed(2)) },
        ],
      });
    }

    // Calcular métricas finales
    const finalValue = shares * prices.at(-1).CLOSE;
    const finalBalance = cash + finalValue;
    const percentageReturn = ((finalBalance - AMOUNT) / AMOUNT) * 100;

    const summary = {
      TOTAL_BOUGHT_UNITS: parseFloat(
        signals
          .filter((s) => s.TYPE === "buy")
          .reduce((a, s) => a + s.SHARES, 0)
          .toFixed(5)
      ),
      TOTAL_SOLD_UNITS: parseFloat(
        signals
          .filter((s) => s.TYPE === "sell")
          .reduce((a, s) => a + s.SHARES, 0)
          .toFixed(5)
      ),
      REMAINING_UNITS: parseFloat(shares.toFixed(5)),
      FINAL_CASH: parseFloat(cash.toFixed(2)),
      FINAL_VALUE: parseFloat(finalValue.toFixed(2)),
      FINAL_BALANCE: parseFloat(finalBalance.toFixed(2)),
      REAL_PROFIT: parseFloat(realProfit.toFixed(2)),
      PERCENTAGE_RETURN: parseFloat(percentageReturn.toFixed(2)),
    };

    const detailRow = {
      ACTIVED: true,
      DELETED: false,
      DETAIL_ROW_REG: [
        {
          CURRENT: true,
          REGDATE: new Date().toISOString().slice(0, 10),
          REGTIME: new Date().toLocaleTimeString("es-ES", { hour12: false }),
          REGUSER: USERID,
        },
      ],
    };

    const simulacion = {
      SIMULATIONID,
      USERID,
      STRATEGYID,
      SIMULATIONNAME,
      SYMBOL,
      INDICATORS: SPECS,
      AMOUNT: parseFloat(AMOUNT.toFixed(2)),
      SUMMARY: summary,
      STARTDATE,
      ENDDATE,
      SIGNALS: signals,
      CHART_DATA: chartData,
      DETAIL_ROW: detailRow,
    };

    try {
      const nuevaSimulacion = new SimulationModel(simulacion);
      await nuevaSimulacion.save();
      console.log("Simulacion guardada en la base de datos.");
      //console.log(nuevaSimulacion);
      return simulacion;
    } catch (error) {
      return {
        status: 500,
        message: error.message,
      };
    }
  } catch (error) {
    console.error("Error en simulación de Supertrend + MA:", error);
    throw error;
  }
}

async function reversionSimple(body) {
  console.log(body);
  //Permite que la simulación se ejecute tanto en un entorno de simulación como en un entorno real.
  //Si se está ejecutando en un entorno de simulación, usa req.SIMULATION; de lo contrario, usa req directamente.
  try {
    // Adaptado para soportar distintos formatos (SIMULATION, req.body, o req directo)
    const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = body;
    console.log("Simulación Reversión Simple:", body);
    if (!SYMBOL || !STARTDATE || !ENDDATE || AMOUNT === undefined || !USERID) {
      throw new Error(
        "FALTAN PARÁMETROS REQUERIDOS EN EL CUERPO DE LA SOLICITUD: 'SYMBOL', 'STARTDATE', 'ENDDATE', 'AMOUNT', 'USERID'."
      );
    }

    // Genera un ID de simulación único.
    // Usamos Date y Math.random() como alternativa a crypto.randomUUID()
    // si el entorno no soporta Node.js crypto module directamente.
    const generateSimulationId = (symbol) => {
      const date = new Date();
      const timestamp = date.toISOString().replace(/[^0-9]/g, ""); // Formato YYYYMMDDTHHMMSSsssZ
      const random = Math.floor(Math.random() * 10000);
      return `${symbol}_${timestamp}_${random}`;
    };

    const SIMULATIONID = generateSimulationId(SYMBOL);
    const SIMULATIONNAME = "Estrategia de Reversión Simple"; // Nombre de la estrategia
    const STRATEGYID = "STRATEGY_001"; // Ajustado a "IdCM" según el formato deseado

    // Extracción de los períodos para RSI y SMA de las especificaciones, con valores por defecto.
    // CORRECCIÓN: Usar 'INDICATOR' en lugar de 'KEY' para encontrar los indicadores.
    const RSI_INDICATOR = SPECS?.find(
      (IND) => IND.INDICATOR?.toLowerCase() === "rsi"
    );
    const SMA_INDICATOR = SPECS?.find(
      (IND) => IND.INDICATOR?.toLowerCase() === "sma"
    );

    const RSI_PERIOD = parseInt(RSI_INDICATOR?.VALUE) || 14;
    const SMA_PERIOD = parseInt(SMA_INDICATOR?.VALUE) || 5;

    // Configuración de la API de Alpha Vantage.
    // Asegúrate de tener 'axios' importado en tu entorno (ej. const axios = require('axios'); o import axios from 'axios';)
    // const APIKEY = "demo"; // Clave API de demostración, considera usar una clave real y segura para producción.
    const APIURL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;

    // Realiza la solicitud HTTP para obtener datos históricos.
    const RESPONSE = await axios.get(APIURL);
    const OPTIONSDATA = RESPONSE.data["Time Series (Daily)"];

    // Verifica si se obtuvieron datos históricos.
    if (!OPTIONSDATA || Object.keys(OPTIONSDATA).length === 0) {
      throw new Error(
        "NO SE ENCONTRARON DATOS DE PRECIOS HISTÓRICOS PARA EL SÍMBOLO PROPORCIONADO."
      );
    }

    // Calcula el número de días de "buffer" necesarios para los cálculos de indicadores.
    const BUFFER_DAYS = Math.max(SMA_PERIOD, RSI_PERIOD);

    // Ordena todas las fechas disponibles de los datos históricos.
    const ALL_DATES_SORTED = Object.keys(OPTIONSDATA).sort(
      (A, B) => new Date(A) - new Date(B)
    );

    // Encuentra el índice de inicio ajustado para incluir el buffer de días.
    const EXTENDED_START_INDEX =
      ALL_DATES_SORTED.findIndex((DATE) => DATE >= STARTDATE) - BUFFER_DAYS;

    const ADJUSTED_START_INDEX =
      EXTENDED_START_INDEX >= 0 ? EXTENDED_START_INDEX : 0;

    // Filtra y mapea los precios relevantes para la simulación, incluyendo el buffer.
    const FILTERED_PRICES = ALL_DATES_SORTED.slice(ADJUSTED_START_INDEX)
      .filter((DATE) => DATE <= ENDDATE) // Filtra hasta la fecha de fin
      .map((DATE) => ({
        DATE,
        OPEN: parseFloat(OPTIONSDATA[DATE]["1. open"]),
        HIGH: parseFloat(OPTIONSDATA[DATE]["2. high"]),
        LOW: parseFloat(OPTIONSDATA[DATE]["3. low"]),
        CLOSE: parseFloat(OPTIONSDATA[DATE]["4. close"]),
        VOLUME: parseFloat(OPTIONSDATA[DATE]["5. volume"]),
      }));

    // Verifica si hay suficientes datos para calcular los indicadores.
    if (FILTERED_PRICES.length < BUFFER_DAYS) {
      throw new Error(
        "NO HAY SUFICIENTES DATOS HISTÓRICOS PARA CALCULAR LA ESTRATEGIA CON LOS PERÍODOS ESPECIFICADOS."
      );
    }

    /**
     * Calcula el Simple Moving Average (SMA) para una serie de datos.
     * @param {Array<object>} DATA - Arreglo de objetos de precios con una propiedad 'CLOSE'.
     * @param {number} PERIOD - Período del SMA.
     * @returns {Array<number|null>} - Arreglo de valores SMA o null si no hay suficientes datos.
     */
    const CALCULATE_SMA = (DATA, PERIOD) => {
      const SMA_VALUES = [];
      for (let I = 0; I < DATA.length; I++) {
        if (I < PERIOD - 1) {
          SMA_VALUES.push(null); // No hay suficientes datos para el cálculo inicial
        } else {
          const SUM = DATA.slice(I - PERIOD + 1, I + 1).reduce(
            (ACC, VAL) => ACC + VAL.CLOSE,
            0
          );
          SMA_VALUES.push(SUM / PERIOD);
        }
      }
      return SMA_VALUES;
    };

    // Calcula los valores SMA para los precios filtrados.
    const SMA_VALUES = CALCULATE_SMA(FILTERED_PRICES, SMA_PERIOD);

    // Calcula los valores RSI.
    const RSI_VALUES = [];
    for (let I = 0; I < FILTERED_PRICES.length; I++) {
      if (I < RSI_PERIOD) {
        RSI_VALUES.push(null); // No hay suficientes datos para el cálculo inicial del RSI
        continue;
      }

      let GAINS = 0;
      let LOSSES = 0;
      // Calcula las ganancias y pérdidas para el período RSI.
      for (let J = I - RSI_PERIOD + 1; J <= I; J++) {
        if (J > 0) {
          const CHANGE =
            FILTERED_PRICES[J].CLOSE - FILTERED_PRICES[J - 1].CLOSE;
          if (CHANGE > 0) GAINS += CHANGE;
          else LOSSES -= CHANGE;
        }
      }

      // Calcula el promedio de ganancias y pérdidas.
      const AVG_GAIN = GAINS / RSI_PERIOD;
      const AVG_LOSS = LOSSES / RSI_PERIOD;

      // Calcula el Relative Strength (RS) y el RSI.
      const RS =
        AVG_LOSS === 0 ? (AVG_GAIN === 0 ? 0 : 100) : AVG_GAIN / AVG_LOSS;
      const RSI = 100 - 100 / (1 + RS);
      RSI_VALUES.push(parseFloat(RSI.toFixed(2)));
    }

    // Variables para la simulación de la estrategia.
    const SIGNALS = [];
    let UNITS_HELD = 0; // Unidades del activo en posesión
    let CASH = parseFloat(AMOUNT); // Capital disponible
    let TOTAL_BOUGHT_UNITS = 0; // Total de unidades compradas a lo largo de la simulación
    let TOTAL_SOLD_UNITS = 0; // Total de unidades vendidas a lo largo de la simulación
    const BOUGHT_PRICES = []; // Registro de compras para cálculo FIFO
    let REAL_PROFIT = 0; // Ganancia/pérdida realizada
    const NEW_CHART_DATA = []; // Datos para la visualización en un gráfico (modificado)

    // Bucle principal de la simulación, iterando sobre los precios filtrados.
    // Bucle principal de la simulación, iterando sobre los precios filtrados.
    for (let I = 0; I < FILTERED_PRICES.length; I++) {
      const {
        DATE,
        OPEN,
        HIGH,
        LOW,
        CLOSE: PRICE,
        VOLUME,
      } = FILTERED_PRICES[I];

      if (
        new Date(DATE) < new Date(STARTDATE) ||
        new Date(DATE) > new Date(ENDDATE)
      )
        continue;

      const SMA = SMA_VALUES[I];
      const RSI = RSI_VALUES[I];

      let CURRENT_SIGNAL_TYPE = null;
      let CURRENT_REASONING = null;
      let UNITS_TRANSACTED = 0;
      let PROFIT_LOSS = 0;

      // 🟢 Señales BUY mejoradas con descripciones detalladas
      if (PRICE < SMA * 0.98 && CASH > 0) {
        const INVESTMENT_AMOUNT = CASH * 0.5;
        UNITS_TRANSACTED = INVESTMENT_AMOUNT / PRICE;
        CASH -= UNITS_TRANSACTED * PRICE;
        UNITS_HELD += UNITS_TRANSACTED;
        TOTAL_BOUGHT_UNITS += UNITS_TRANSACTED;
        BOUGHT_PRICES.push({ DATE, PRICE, UNITS: UNITS_TRANSACTED });

        CURRENT_SIGNAL_TYPE = "buy";
        CURRENT_REASONING = `BUY: Precio por debajo del 98% de SMA (precio: ${PRICE.toFixed(
          2
        )}, SMA: ${SMA?.toFixed(
          2
        )}), sugiriendo oportunidad por reversión alcista. RSI: ${RSI?.toFixed(
          2
        )}.`;
      } else if (RSI < 30 && CASH > 0) {
        const INVESTMENT_AMOUNT = CASH * 0.3;
        UNITS_TRANSACTED = INVESTMENT_AMOUNT / PRICE;
        CASH -= UNITS_TRANSACTED * PRICE;
        UNITS_HELD += UNITS_TRANSACTED;
        TOTAL_BOUGHT_UNITS += UNITS_TRANSACTED;
        BOUGHT_PRICES.push({ DATE, PRICE, UNITS: UNITS_TRANSACTED });

        CURRENT_SIGNAL_TYPE = "buy";
        CURRENT_REASONING = `BUY: RSI muy bajo (<30), señal de sobreventa indicando potencial rebote alcista. Precio: ${PRICE.toFixed(
          2
        )}, RSI: ${RSI?.toFixed(2)}.`;
      } else if (PRICE < SMA * 0.99 && RSI < 35 && CASH > 0) {
        const INVESTMENT_AMOUNT = CASH * 0.4;
        UNITS_TRANSACTED = INVESTMENT_AMOUNT / PRICE;
        CASH -= UNITS_TRANSACTED * PRICE;
        UNITS_HELD += UNITS_TRANSACTED;
        TOTAL_BOUGHT_UNITS += UNITS_TRANSACTED;
        BOUGHT_PRICES.push({ DATE, PRICE, UNITS: UNITS_TRANSACTED });

        CURRENT_SIGNAL_TYPE = "buy";
        CURRENT_REASONING = `BUY: Precio cercano al 99% de SMA y RSI <35, combinación que sugiere reversión con baja sobreventa.`;
      }

      // 🔴 Señales SELL mejoradas con descripciones detalladas
      else if (PRICE > SMA * 1.02 && UNITS_HELD > 0) {
        const UNITS_TO_SELL = UNITS_HELD * 0.25;
        const REVENUE = UNITS_TO_SELL * PRICE;
        CASH += REVENUE;
        UNITS_HELD -= UNITS_TO_SELL;
        TOTAL_SOLD_UNITS += UNITS_TO_SELL;
        UNITS_TRANSACTED = UNITS_TO_SELL;

        let SOLD_UNITS_COUNTER = UNITS_TO_SELL;
        let COST_OF_SOLD_UNITS = 0;
        let UNITS_REMOVED_FROM_BOUGHT = [];

        for (let J = 0; J < BOUGHT_PRICES.length; J++) {
          if (SOLD_UNITS_COUNTER <= 0) break;
          const PURCHASE = BOUGHT_PRICES[J];
          const UNITS_FROM_THIS_PURCHASE = Math.min(
            PURCHASE.UNITS,
            SOLD_UNITS_COUNTER
          );
          COST_OF_SOLD_UNITS += UNITS_FROM_THIS_PURCHASE * PURCHASE.PRICE;
          SOLD_UNITS_COUNTER -= UNITS_FROM_THIS_PURCHASE;
          BOUGHT_PRICES[J].UNITS -= UNITS_FROM_THIS_PURCHASE;
          if (BOUGHT_PRICES[J].UNITS <= 0) UNITS_REMOVED_FROM_BOUGHT.push(J);
        }
        for (let K = UNITS_REMOVED_FROM_BOUGHT.length - 1; K >= 0; K--) {
          BOUGHT_PRICES.splice(UNITS_REMOVED_FROM_BOUGHT[K], 1);
        }

        const AVG_PURCHASE_PRICE = COST_OF_SOLD_UNITS / UNITS_TO_SELL;
        PROFIT_LOSS = (PRICE - AVG_PURCHASE_PRICE) * UNITS_TO_SELL;
        REAL_PROFIT += PROFIT_LOSS;

        CURRENT_SIGNAL_TYPE = "sell";
        CURRENT_REASONING = `SELL: Precio por encima del 102% SMA (precio: ${PRICE.toFixed(
          2
        )}, SMA: ${SMA?.toFixed(
          2
        )}), sugiriendo toma de beneficios o reversión bajista. RSI: ${RSI?.toFixed(
          2
        )}.`;
      } else if (RSI > 70 && UNITS_HELD > 0) {
        const UNITS_TO_SELL = UNITS_HELD * 0.5;
        const REVENUE = UNITS_TO_SELL * PRICE;
        CASH += REVENUE;
        UNITS_HELD -= UNITS_TO_SELL;
        TOTAL_SOLD_UNITS += UNITS_TO_SELL;
        UNITS_TRANSACTED = UNITS_TO_SELL;

        let SOLD_UNITS_COUNTER = UNITS_TO_SELL;
        let COST_OF_SOLD_UNITS = 0;
        let UNITS_REMOVED_FROM_BOUGHT = [];

        for (let J = 0; J < BOUGHT_PRICES.length; J++) {
          if (SOLD_UNITS_COUNTER <= 0) break;
          const PURCHASE = BOUGHT_PRICES[J];
          const UNITS_FROM_THIS_PURCHASE = Math.min(
            PURCHASE.UNITS,
            SOLD_UNITS_COUNTER
          );
          COST_OF_SOLD_UNITS += UNITS_FROM_THIS_PURCHASE * PURCHASE.PRICE;
          SOLD_UNITS_COUNTER -= UNITS_FROM_THIS_PURCHASE;
          BOUGHT_PRICES[J].UNITS -= UNITS_FROM_THIS_PURCHASE;
          if (BOUGHT_PRICES[J].UNITS <= 0) UNITS_REMOVED_FROM_BOUGHT.push(J);
        }
        for (let K = UNITS_REMOVED_FROM_BOUGHT.length - 1; K >= 0; K--) {
          BOUGHT_PRICES.splice(UNITS_REMOVED_FROM_BOUGHT[K], 1);
        }

        const AVG_PURCHASE_PRICE = COST_OF_SOLD_UNITS / UNITS_TO_SELL;
        PROFIT_LOSS = (PRICE - AVG_PURCHASE_PRICE) * UNITS_TO_SELL;
        REAL_PROFIT += PROFIT_LOSS;

        CURRENT_SIGNAL_TYPE = "sell";
        CURRENT_REASONING = `SELL: RSI sobrecomprado (>70), indicando alta probabilidad de retroceso. Precio: ${PRICE.toFixed(
          2
        )}, RSI: ${RSI?.toFixed(2)}.`;
      } else if (PRICE > SMA * 1.03 && RSI > 65 && UNITS_HELD > 0) {
        const UNITS_TO_SELL = UNITS_HELD * 0.6;
        const REVENUE = UNITS_TO_SELL * PRICE;
        CASH += REVENUE;
        UNITS_HELD -= UNITS_TO_SELL;
        TOTAL_SOLD_UNITS += UNITS_TO_SELL;
        UNITS_TRANSACTED = UNITS_TO_SELL;

        let SOLD_UNITS_COUNTER = UNITS_TO_SELL;
        let COST_OF_SOLD_UNITS = 0;
        let UNITS_REMOVED_FROM_BOUGHT = [];

        for (let J = 0; J < BOUGHT_PRICES.length; J++) {
          if (SOLD_UNITS_COUNTER <= 0) break;
          const PURCHASE = BOUGHT_PRICES[J];
          const UNITS_FROM_THIS_PURCHASE = Math.min(
            PURCHASE.UNITS,
            SOLD_UNITS_COUNTER
          );
          COST_OF_SOLD_UNITS += UNITS_FROM_THIS_PURCHASE * PURCHASE.PRICE;
          SOLD_UNITS_COUNTER -= UNITS_FROM_THIS_PURCHASE;
          BOUGHT_PRICES[J].UNITS -= UNITS_FROM_THIS_PURCHASE;
          if (BOUGHT_PRICES[J].UNITS <= 0) UNITS_REMOVED_FROM_BOUGHT.push(J);
        }
        for (let K = UNITS_REMOVED_FROM_BOUGHT.length - 1; K >= 0; K--) {
          BOUGHT_PRICES.splice(UNITS_REMOVED_FROM_BOUGHT[K], 1);
        }

        const AVG_PURCHASE_PRICE = COST_OF_SOLD_UNITS / UNITS_TO_SELL;
        PROFIT_LOSS = (PRICE - AVG_PURCHASE_PRICE) * UNITS_TO_SELL;
        REAL_PROFIT += PROFIT_LOSS;

        CURRENT_SIGNAL_TYPE = "sell";
        CURRENT_REASONING = `SELL: Precio >103% de SMA y RSI>65, alta probabilidad de retroceso.`;
      }

      if (CURRENT_SIGNAL_TYPE) {
        SIGNALS.push({
          DATE,
          TYPE: CURRENT_SIGNAL_TYPE,
          PRICE: parseFloat(PRICE.toFixed(2)),
          REASONING: CURRENT_REASONING,
          SHARES: parseFloat(UNITS_TRANSACTED.toFixed(15)),
          PROFIT: parseFloat(PROFIT_LOSS.toFixed(2)),
        });
      }

      // Gráfico
      NEW_CHART_DATA.push({
        DATE,
        OPEN: parseFloat(OPEN.toFixed(2)),
        HIGH: parseFloat(HIGH.toFixed(2)),
        LOW: parseFloat(LOW.toFixed(2)),
        CLOSE: parseFloat(PRICE.toFixed(2)),
        VOLUME: parseFloat(VOLUME.toFixed(0)),
        INDICATORS: [
          { INDICATOR: "sma", VALUE: parseFloat((SMA ?? 0).toFixed(2)) },
          { INDICATOR: "rsi", VALUE: parseFloat((RSI ?? 0).toFixed(2)) },
        ],
      });
    }

    // Calcula el valor final de las unidades restantes.
    let FINAL_VALUE = 0;
    const lastPriceData = FILTERED_PRICES[FILTERED_PRICES.length - 1];
    if (lastPriceData && UNITS_HELD > 0) {
      FINAL_VALUE = UNITS_HELD * lastPriceData.CLOSE; // Usar el precio de cierre del último día
    }

    // Calcula el balance final y el porcentaje de retorno.
    const FINAL_BALANCE_CALCULATED = CASH + FINAL_VALUE;
    const PERCENTAGE_RETURN =
      ((FINAL_BALANCE_CALCULATED - AMOUNT) / AMOUNT) * 100;

    // Objeto SUMMARY con los cálculos finales.
    const SUMMARY = {
      TOTAL_BOUGHT_UNITS: parseFloat(TOTAL_BOUGHT_UNITS.toFixed(5)),
      TOTAL_SOLD_UNITS: parseFloat(TOTAL_SOLD_UNITS.toFixed(5)),
      REMAINING_UNITS: parseFloat(UNITS_HELD.toFixed(5)),
      FINAL_CASH: parseFloat(CASH.toFixed(2)),
      FINAL_VALUE: parseFloat(FINAL_VALUE.toFixed(2)),
      FINAL_BALANCE: parseFloat(FINAL_BALANCE_CALCULATED.toFixed(2)),
      REAL_PROFIT: parseFloat(REAL_PROFIT.toFixed(2)),
      PERCENTAGE_RETURN: parseFloat(PERCENTAGE_RETURN.toFixed(2)),
    };

    // Objeto DETAIL_ROW (información de registro).
    const detailRow = {
      ACTIVED: true,
      DELETED: false,
      DETAIL_ROW_REG: [
        {
          CURRENT: true,
          REGDATE: new Date().toISOString().slice(0, 10),
          REGTIME: new Date().toLocaleTimeString("es-ES", { hour12: false }),
          REGUSER: USERID,
        },
      ],
    };

    // Retorna los resultados finales de la simulación con la nueva estructura.

    const simulacion = {
      SIMULATIONID,
      USERID,
      STRATEGYID,
      SIMULATIONNAME,
      SYMBOL,
      INDICATORS: { value: SPECS },
      AMOUNT: parseFloat(AMOUNT.toFixed(2)),
      STARTDATE,
      ENDDATE,
      SIGNALS,
      SUMMARY,
      CHART_DATA: NEW_CHART_DATA,
      DETAIL_ROW: detailRow,
    };

    try {
      const nuevaSimulacion = new SimulationModel(simulacion);
      await nuevaSimulacion.save();
      console.log("Simulacion guardada en la base de datos.");
      //console.log(nuevaSimulacion);
    } catch (error) {
      return {
        status: 500,
        message: error.message,
      };
    }

    return {
      simulacion,
    };
  } catch (ERROR) {
    // Manejo de errores, imprime el mensaje de error y lo relanza.
    console.error("ERROR EN LA FUNCIÓN REVERSION_SIMPLE:", ERROR.message);
    throw ERROR;
  }
}
// MUCHO CODIGO

// Función auxiliar para calcular stop-loss
// function findStopLoss(type, data, currentIndex) {
//   const lookback = 20;
//   const startIndex = Math.max(0, currentIndex - lookback);
//   const slice = data.slice(startIndex, currentIndex);

//   if (type === "buy") {
//     const minLow = Math.min(...slice.map((d) => d.price_history.low));
//     return minLow * 0.99;
//   } else {
//     const maxHigh = Math.max(...slice.map((d) => d.price_history.high));
//     return maxHigh * 1.01;
//   }
// }

function calculateMovingAverageData(
  history,
  startDate,
  endDate,
  shortPeriod,
  longPeriod
) {
  const result = [];
  const signals = [];

  // Calcular medias móviles
  for (let i = 0; i < history.length; i++) {
    const item = history[i];

    if (i < longPeriod - 1) {
      result.push({ ...item, short_ma: null, long_ma: null });
      continue;
    }

    const shortSlice = history.slice(i - shortPeriod + 1, i + 1);
    const longSlice = history.slice(i - longPeriod + 1, i + 1);

    const shortMa =
      shortSlice.reduce((sum, d) => sum + d.close, 0) / shortPeriod;
    const longMa = longSlice.reduce((sum, d) => sum + d.close, 0) / longPeriod;

    result.push({ ...item, short_ma: shortMa, long_ma: longMa });

    if (i < longPeriod) continue;

    const prevShort = result[i - 1].short_ma;
    const prevLong = result[i - 1].long_ma;

    // 🟢 Señales BUY
    if (prevShort <= prevLong && shortMa > longMa) {
      signals.push({
        date: item.date,
        type: "buy",
        price: item.close,
        reasoning: `BUY: Cruce alcista confirmado. La media corta (${shortMa.toFixed(
          2
        )}) cruzó por encima de la media larga (${longMa.toFixed(
          2
        )}), indicando cambio positivo en tendencia.`,
      });
    } else if (shortMa > longMa && item.close > item.open) {
      signals.push({
        date: item.date,
        type: "buy",
        price: item.close,
        reasoning: `BUY: Media corta por encima de la media larga y cierre alcista (cierre > apertura), confirmando tendencia de recuperación.`,
      });
    }

    // 🔴 Señales SELL
    if (prevShort >= prevLong && shortMa < longMa) {
      signals.push({
        date: item.date,
        type: "sell",
        price: item.close,
        reasoning: `SELL: Cruce bajista confirmado. La media corta (${shortMa.toFixed(
          2
        )}) cruzó por debajo de la media larga (${longMa.toFixed(
          2
        )}), indicando posible corrección o reversión.`,
      });
    } else if (shortMa < longMa && item.close < item.open) {
      signals.push({
        date: item.date,
        type: "sell",
        price: item.close,
        reasoning: `SELL: Media corta por debajo de la media larga y cierre bajista (cierre < apertura), confirmando debilitamiento de tendencia.`,
      });
    } else if (shortMa < longMa && item.close < shortMa) {
      signals.push({
        date: item.date,
        type: "sell",
        price: item.close,
        reasoning: `SELL: Precio por debajo de la media corta (${shortMa.toFixed(
          2
        )}), confirmando posible presión vendedora adicional.`,
      });
    }
  }

  return { priceData: result, signals };
}

function parseSpecs(specsArray) {
  const defaults = { SHORT_MA: 50, LONG_MA: 200 };

  if (!Array.isArray(specsArray)) return defaults;

  const result = { ...defaults };

  specsArray.forEach((item) => {
    if (!item || !item.INDICATOR) return;

    const key = item.INDICATOR.toUpperCase();
    const value = parseInt(item.VALUE);

    if (!isNaN(value)) {
      if (key === "SHORT_MA" && value >= 5) {
        result.SHORT_MA = value;
      } else if (key === "LONG_MA" && value >= 20) {
        result.LONG_MA = value;
      }
    }
  });

  // Validar que SHORT_MA sea menor que LONG_MA
  if (result.SHORT_MA >= result.LONG_MA) {
    result.LONG_MA = result.SHORT_MA + 50;
  }

  return result;
}

async function SimulateMACrossover(body) {
  try {
    try {
      const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = body;
      // Validación de parámetros
      const requiredFields = [
        "SYMBOL",
        "STARTDATE",
        "ENDDATE",
        "AMOUNT",
        "USERID",
        "SPECS",
      ];
      const missingFields = requiredFields.filter((field) => !body[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Faltan campos requeridos en SIMULATION: ${missingFields.join(", ")}`
        );
      }

      // Obtener datos históricos
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
      const response = await axios.get(url);

      if (!response.data || !response.data["Time Series (Daily)"]) {
        throw new Error("Invalid data format from Alpha Vantage API");
      }

      const timeSeries = response.data["Time Series (Daily)"];

      // Procesar datos históricos
      let history = Object.entries(timeSeries)
        .map(([date, data]) => {
          if (!data || !data["4. close"]) {
            console.warn(`Datos incompletos para la fecha ${date}`);
            return null;
          }
          return {
            date: new Date(date),
            open: parseFloat(data["1. open"]),
            high: parseFloat(data["2. high"]),
            low: parseFloat(data["3. low"]),
            close: parseFloat(data["4. close"]),
            volume: parseInt(data["5. volume"]),
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => a.date - b.date);

      if (history.length === 0) {
        throw new Error("No valid historical data found");
      }

      // Parsear especificaciones
      const { SHORT_MA: shortMa, LONG_MA: longMa } = parseSpecs(SPECS);

      // Calcular medias móviles y señales
      const { priceData, signals } = calculateMovingAverageData(
        history,
        STARTDATE,
        ENDDATE,
        shortMa,
        longMa
      );

      // Simular transacciones
      let currentCash = AMOUNT;
      let sharesHeld = 0;
      let totalBought = 0;
      let totalSold = 0;

      const processedSignals = signals
        .map((signal) => {
          if (signal.type === "buy" && currentCash > 0) {
            const shares = currentCash / signal.price;
            sharesHeld += shares;
            totalBought += shares;
            currentCash = 0;

            return {
              DATE: signal.date,
              TYPE: "buy",
              PRICE: signal.price,
              REASONING: signal.reasoning,
              SHARES: shares,
            };
          } else if (signal.type === "sell" && sharesHeld > 0) {
            const proceeds = sharesHeld * signal.price;
            totalSold += sharesHeld;
            currentCash += proceeds;
            const shares = sharesHeld;
            sharesHeld = 0;

            return {
              DATE: signal.date,
              TYPE: "sell",
              PRICE: signal.price,
              REASONING: signal.reasoning,
              SHARES: shares,
            };
          }
          return null;
        })
        .filter(Boolean);

      // Cerrar posición final si queda algo abierto
      if (sharesHeld > 0) {
        const lastPrice = priceData[priceData.length - 1].close;
        const proceeds = sharesHeld * lastPrice;
        totalSold += sharesHeld;
        currentCash += proceeds;

        processedSignals.push({
          DATE: priceData[priceData.length - 1].date,
          TYPE: "sell",
          PRICE: lastPrice,
          REASONING: "Final position closed at end of period",
          SHARES: sharesHeld,
        });

        sharesHeld = 0;
      }

      // Calcular métricas finales
      const finalValue = sharesHeld * priceData[priceData.length - 1].close;
      const finalBalance = currentCash + finalValue;
      const profit = finalBalance - AMOUNT;
      const percentageReturn = (profit / AMOUNT) * 100;

      // Formatear datos para el gráfico
      const chartData = priceData.map((item) => ({
        DATE: item.date,
        OPEN: item.open,
        HIGH: item.high,
        LOW: item.low,
        CLOSE: item.close,
        VOLUME: item.volume,
        INDICATORS: [
          { INDICATOR: "short_ma", VALUE: item.short_ma },
          { INDICATOR: "long_ma", VALUE: item.long_ma },
        ],
      }));

      // Formatear SPECS como string
      const formattedSpecs = [
        { INDICATOR: "SHORT_MA", VALUE: shortMa },
        { INDICATOR: "LONG_MA", VALUE: longMa },
      ];

      // Crear objeto de simulación
      const simulationData = {
        SIMULATIONID: `${SYMBOL}_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .replace("T", "_")}`,
        USERID,
        STRATEGYID: "IdCM",
        SIMULATIONNAME: `MA Crossover ${shortMa}/${longMa}`,
        SYMBOL,
        STARTDATE: new Date(STARTDATE),
        ENDDATE: new Date(ENDDATE),
        AMOUNT,
        SIGNALS: processedSignals,
        SPECS: formattedSpecs,
        SUMMARY: {
          TOTAL_BOUGHT_UNITS: totalBought,
          TOTAL_SOLDUNITS: totalSold,
          REMAINING_UNITS: sharesHeld,
          FINAL_CASH: currentCash,
          FINAL_VALUE: finalValue,
          FINAL_BALANCE: finalBalance,
          REAL_PROFIT: profit,
          PERCENTAGE_RETURN: percentageReturn,
        },
        CHART_DATA: chartData,
        DETAIL_ROW: {
          ACTIVED: true,
          DELETED: false,
          DETAIL_ROW_REG: [
            {
              CURRENT: true,
              REGDATE: new Date(),
              REGTIME: new Date().toTimeString().split(" ")[0],
              REGUSER: USERID,
            },
          ],
        },
      };

      // Guardar en MongoDB

      try {
        const nuevaSimulacion = new SimulationModel(simulationData);
        await nuevaSimulacion.save();
        console.log("Simulacion guardada en la base de datos.");
        //console.log(nuevaSimulacion);
      } catch (error) {
        return {
          status: 500,
          message: error.message,
        };
      }
      return simulationData;
    } catch (e) {
      console.error("Error in SimulateMACrossover:", {
        message: e.message,
        stack: e.stack,
        inputBody: body,
      });
    }
  } catch (error) {
    console.error("Error in SimulateMACrossover:", error);
    throw new Error(`Simulacion fallida: ${error.message}`);
  }
}

// Función para calcular el RSI (Relative Strength Index) con un enfoque optimizado IronCondor
function calculateRSI2(data, period = 14) {
  const rsi = [];
  let gains = 0,
    losses = 0;
  for (let i = 1; i < data.length; i++) {
    const delta = data[i].CLOSE - data[i - 1].CLOSE;
    gains += delta > 0 ? delta : 0;
    losses += delta < 0 ? -delta : 0;
    if (i >= period) {
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push({ DATE: data[i].DATE, RSI: 100 - 100 / (1 + rs) });
      const prevDelta = data[i - period + 1].CLOSE - data[i - period].CLOSE;
      if (prevDelta > 0) gains -= prevDelta;
      else losses -= -prevDelta;
    } else {
      rsi.push({ DATE: data[i].DATE, RSI: null });
    }
  }
  return rsi;
}

//Simulacion IronCondor
async function SimulateIronCondor(simulation) {
  if (!simulation || typeof simulation !== "object") {
    throw new Error("Invalid or missing simulation data.");
  }
  const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = simulation;

  const numR = Math.floor(Math.random() * 1000).toString();
  const SIMULATIONID = `${SYMBOL}-${new Date().toISOString().slice(0, 10)}-${
    USERID[0]
  }-${numR}`;
  const SIMULATIONNAME = `Iron Condor-${numR}`;
  const STRATEGYID = "IC";

  const missingParams = [];
  if (!SYMBOL) missingParams.push("SYMBOL");
  if (!STARTDATE || isNaN(new Date(STARTDATE))) missingParams.push("STARTDATE");
  if (!ENDDATE || isNaN(new Date(ENDDATE))) missingParams.push("ENDDATE");
  if (new Date(STARTDATE) >= new Date(ENDDATE))
    missingParams.push("STARTDATE < ENDDATE");
  if (!AMOUNT || AMOUNT <= 0) missingParams.push("AMOUNT");
  if (!USERID) missingParams.push("USERID");
  if (!SPECS || !Array.isArray(SPECS)) missingParams.push("SPECS");

  if (missingParams.length > 0) {
    return { message: `FALTAN PARÁMETROS: ${missingParams.join(", ")}.` };
  }

  const specs = SPECS.reduce((acc, { INDICATOR, VALUE }) => {
    acc[INDICATOR.toUpperCase()] = Number(VALUE);
    return acc;
  }, {});

  const width = specs.WIDTH || 5;
  const premium = specs.PREMIUM || 2;
  const rsiPeriod = specs.RSI_PERIOD || 14;
  const rsiMin = specs.RSI_MIN || 30;
  const rsiMax = specs.RSI_MAX || 70;
  const volThreshold = specs.VOL_THRESHOLD || 100000;
  const expiryDays = specs.EXPIRY_DAYS || 5;

  const API_URL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;
  let response;
  try {
    response = await axios.get(API_URL);
  } catch (error) {
    return { message: "Error fetching market data: " + error.message };
  }

  const rawData = response.data["Time Series (Daily)"];
  if (!rawData) return { message: "Datos de mercado no disponibles." };

  const data = Object.entries(rawData)
    .map(([date, val]) => ({
      DATE: date,
      CLOSE: +val["4. close"],
      HIGH: +val["2. high"],
      LOW: +val["3. low"],
      VOLUME: +val["5. volume"],
    }))
    .sort((a, b) => new Date(a.DATE) - new Date(b.DATE));

  const inRangeData = data.filter(
    (d) => d.DATE >= STARTDATE && d.DATE <= ENDDATE
  );
  if (inRangeData.length === 0)
    return { message: "No hay datos en el rango especificado." };

  const rsiData = calculateRSI2(data, rsiPeriod);
  const rsiMap = Object.fromEntries(rsiData.map((d) => [d.DATE, d.RSI]));

  let totalProfit = 0,
    wins = 0,
    losses = 0;
  const trades = [];

  for (let i = 0; i < inRangeData.length - expiryDays; i++) {
    const day = inRangeData[i];
    const rsiVal = rsiMap[day.DATE];
    if (rsiVal === null || rsiVal < rsiMin || rsiVal > rsiMax) continue;
    if (day.VOLUME < volThreshold) continue;

    const price = day.CLOSE;
    const shortPut = price - width;
    const longPut = shortPut - width;
    const shortCall = price + width;
    const longCall = shortCall + width;
    const maxProfit = premium * 100;
    const maxLoss = width * 100 - maxProfit;

    const expiryIndex =
      i + expiryDays < inRangeData.length
        ? i + expiryDays
        : inRangeData.length - 1;
    const expiryPrice = inRangeData[expiryIndex].CLOSE;

    let tradeResult,
      outcome,
      reasoningExtra = "";
    if (expiryPrice > shortPut && expiryPrice < shortCall) {
      tradeResult = maxProfit;
      outcome = "WIN";
      wins++;
      reasoningExtra = "Precio dentro del rango establecido.";
    } else {
      tradeResult = -maxLoss;
      outcome = "LOSS";
      losses++;
      reasoningExtra =
        expiryPrice < shortPut
          ? "Rompió soporte inferior."
          : "Rompió resistencia superior.";
    }

    totalProfit += tradeResult;

    // SEÑALES ADICIONALES, REGLAS MÁS DETALLADAS
    if (rsiVal > 80) {
      trades.push({
        DATE: day.DATE,
        TYPE: "sell",
        PRICE: price,
        REASONING: `RSI muy alto (${rsiVal}), riesgo elevado de reversión bajista.`,
        SHARES: 0,
      });
    }
    if (rsiVal < 20) {
      trades.push({
        DATE: day.DATE,
        TYPE: "buy",
        PRICE: price,
        REASONING: `RSI muy bajo (${rsiVal}), oportunidad de rebote técnico alcista.`,
        SHARES: 0,
      });
    }
    if (day.VOLUME > volThreshold * 2) {
      trades.push({
        DATE: day.DATE,
        TYPE: "buy",
        PRICE: price,
        REASONING: `Volumen extremadamente alto (${day.VOLUME}), posible ruptura impulsiva y continuación.`,
        SHARES: 0,
      });
    }
    if (day.CLOSE > day.HIGH * 0.98) {
      trades.push({
        DATE: day.DATE,
        TYPE: "sell",
        PRICE: price,
        REASONING: `Cierre muy cerca del máximo del día (${day.CLOSE} vs ${day.HIGH}), posible presión vendedora al alza.`,
        SHARES: 0,
      });
    }
    if (day.CLOSE < day.LOW * 1.02) {
      trades.push({
        DATE: day.DATE,
        TYPE: "buy",
        PRICE: price,
        REASONING: `Cierre muy cerca del mínimo del día (${day.CLOSE} vs ${day.LOW}), posible soporte técnico relevante.`,
        SHARES: 0,
      });
    }
    if (day.VOLUME < volThreshold / 2) {
      trades.push({
        DATE: day.DATE,
        TYPE: "neutral",
        PRICE: price,
        REASONING: `Volumen muy bajo (${day.VOLUME}), posible falta de convicción o tendencia clara.`,
        SHARES: 0,
      });
    }
    if (rsiVal >= rsiMax - 5 && day.VOLUME > volThreshold) {
      trades.push({
        DATE: day.DATE,
        TYPE: "sell",
        PRICE: price,
        REASONING: `RSI cerca del límite superior y volumen elevado (${rsiVal}, ${day.VOLUME}), alerta de posible corrección bajista.`,
        SHARES: 0,
      });
    }
    if (rsiVal <= rsiMin + 5 && day.VOLUME > volThreshold) {
      trades.push({
        DATE: day.DATE,
        TYPE: "buy",
        PRICE: price,
        REASONING: `RSI cerca del límite inferior y volumen elevado (${rsiVal}, ${day.VOLUME}), posible confirmación de rebote alcista.`,
        SHARES: 0,
      });
    }

    trades.push({
      DATE: day.DATE,
      TYPE: "IronCondor",
      PRICE: price,
      REASONING: `Expiry: ${expiryPrice}, Result: ${outcome}. ${reasoningExtra}`,
      SHARES: 0,
    });
  }

  const FINAL_BALANCE = Number(AMOUNT) + totalProfit;
  const PERCENTAGE_RETURN =
    ((FINAL_BALANCE - Number(AMOUNT)) / Number(AMOUNT)) * 100;

  return {
    SIMULATIONID,
    USERID,
    STRATEGYID,
    SIMULATIONNAME,
    SYMBOL,
    STARTDATE,
    ENDDATE,
    AMOUNT,
    SPECS,
    SIGNALS: trades,
    SUMMARY: {
      TOTAL_BOUGHT_UNITS: 0,
      TOTAL_SOLD_UNITS: 0,
      REMAINING_UNITS: 0,
      FINAL_CASH: FINAL_BALANCE,
      FINAL_VALUE: 0,
      FINAL_BALANCE: FINAL_BALANCE,
      REAL_PROFIT: totalProfit,
      PERCENTAGE_RETURN: PERCENTAGE_RETURN,
    },
  };
}

/*-----------------------------------------------------------------------------------------------------------
  Consultas para traer informacion de las simulaciones
-----------------------------------------------------------------------------------------------------------*/

function formatDateToYYYYMMDD(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // yyyy-mm-dd
}

function recursivelyFormatDates(obj) {
  if (Array.isArray(obj)) {
    return obj.map(recursivelyFormatDates);
  } else if (obj && typeof obj === "object") {
    const formatted = {};
    for (const key in obj) {
      const value = obj[key];
      if (
        value instanceof Date ||
        (typeof value === "string" && !isNaN(Date.parse(value)))
      ) {
        formatted[key] = formatDateToYYYYMMDD(value);
      } else {
        formatted[key] = recursivelyFormatDates(value);
      }
    }
    return formatted;
  } else {
    return obj;
  }
}

async function getAllSimulations() {
  try {
    let simulation = await SimulationModel.find().lean();
    const formattedSimulations = simulation.map(recursivelyFormatDates);
    return formattedSimulations;
  } catch (err) {
    throw boom.internal("Error al obtener las simulaciones", err);
  }
}

async function getSimulationById(simulationId) {
  // Función para obtener una simulación por su ID
  try {
    const simulation = await SimulationModel.findOne({
      SIMULATIONID: simulationId,
    }).lean();
    if (!simulation) {
      return { ERROR: true, MESSAGE: "Simulación no encontrada." };
    }
    return simulation;
  } catch (err) {
    return { ERROR: true, MESSAGE: err.message };
  }
}

async function deleteSimulations(simulationIds) {
  try {
    const result = await SimulationModel.deleteMany({
      SIMULATIONID: { $in: simulationIds },
    });
    return result.deletedCount === simulationIds.length;
  } catch (error) {
    throw new Error("Error al eliminar simulaciones: " + error.message);
  }
}

module.exports = {
  SimulateMomentum,
  simulateSupertrend,
  reversionSimple,
  SimulateMACrossover,
  SimulateIronCondor,
  getAllSimulations,
  getSimulationById,
  deleteSimulations,
};
