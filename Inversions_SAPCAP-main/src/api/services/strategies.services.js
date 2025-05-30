//************* SERVICIO PARA MONGO DB */
const strategiesSchema = require('../models/MongoDB/strategies');
const { v4: uuidv4 } = require('uuid');

async function GetAllStrategies(req) {
  try {
    let strategie = await strategiesSchema.find().lean(); 
    return strategie;
  } catch (error) {
    return error;
  }
}

async function CreateIronCondorStrategy(req) {
  try {
    const {
      userId,
      type,
      symbol,
      startDate,
      endDate,
      legs
    } = req.data;

    // Contar estrategias existentes
    const count = await strategiesSchema.countDocuments();

    // Generar nuevo ID formateado con ceros
    const strategyId = `strat-${String(count + 1).padStart(3, '0')}`;

    if (!userId || !type || !symbol || !startDate || !endDate || !legs || legs.length !== 4) {
      throw new Error('Datos incompletos o incorrectos');
    }

    // Asignar strikes según el tipo y posición
    const strategy = {
      STRATEGY_ID: strategyId,
      USER_ID: userId,
      TYPE: type,
      UNDERLYING: symbol,
      OPENED_AT: new Date(startDate),
      CLOSED_AT: new Date(endDate),
      POSITIONS: {
        CALL_CREDIT_SPREAD: {
          SHORT_CALL: legs.find(l => l.type === 'call' && l.position === 'short')?.strike,
          LONG_CALL: legs.find(l => l.type === 'call' && l.position === 'long')?.strike
        },
        PUT_CREDIT_SPREAD: {
          SHORT_PUT: legs.find(l => l.type === 'put' && l.position === 'short')?.strike,
          LONG_PUT: legs.find(l => l.type === 'put' && l.position === 'long')?.strike
        }
      },
      PREMIUM_COLLECTED: 0,
      RISK_INDICATORS_SNAPSHOT: {
        VIX: 0,
        RSI: 0,
        PUT_CALL_RATIO: 0
      },
      NOTES: ""
    };

    await newStrategy.save();

    return {
      strategyId: strategyId,
      status: "created"
    };

  } catch (error) {
    throw new Error(`Error al crear la estrategia: ${error.message}`);
  }
}

async function GetStrategiesByUser(req) {
  try {
    // Obtener el USER_ID desde el cuerpo de la solicitud (req.data)
    const { USER_ID } = req.data; // Asumiendo que el body es { "USER_ID": "user-001" }

    if (!USER_ID) {
      throw new Error("El ID de usuario no fue proporcionado.");
    }

    // Buscar estrategias por el userId
    const strategies = await strategiesSchema.find({ USER_ID }).lean();
    
    return strategies;
  } catch (error) {
    throw new Error(`Error al obtener las estrategias: ${error.message}`);
  }
}


module.exports = { GetAllStrategies, CreateIronCondorStrategy, GetStrategiesByUser };