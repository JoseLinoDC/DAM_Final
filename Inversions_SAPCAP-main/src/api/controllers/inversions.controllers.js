const cds = require('@sap/cds');
const {GetAllUsers,GetUserById, CreateUser } = require('../services/users.services')
const {GetAllStrategies, CreateIronCondorStrategy, GetStrategiesByUser} = require('../services/strategies.services')
const {GetAllSimulation, GetSimulationsByUserId, SimulateIronCondor, UpdateSimulationName, DeleteSimulationById} = require('../services/simulacion.services')
const {GetAllPricesHistory , calculateIndicators} = require('../services/priceshistory.services')


module.exports = class InversionsClass extends cds.ApplicationService {
    async init() {
      //****************** PARA USERS ***********************/
        // Evento para obtener todos los usuarios
        this.on('GetAllUsers', async (req) => {
            return await GetAllUsers(req);
        });

        // Evento para obtener un usuario
        this.on('GetUserById', async (req) => {
            return await GetUserById(req);
        });

        //****************** PARA STRATEGIES ***********************/
        this.on('GetAllStrategies', async (req) => {
            return await GetAllStrategies(req);
        });
        this.on('CreateIronCondorStrategy', async (req) => {
            return await CreateIronCondorStrategy(req);
        });
        this.on('GetStrategiesByUser', async (req) => {
            return await GetStrategiesByUser(req);
        });

        //****************** PARA SIMULATION ***********************/
        this.on('GetAllSimulation', async (req) => {
            return await GetAllSimulation(req);
        })
        // Evento para obtener las simulaciones de un usuario
        this.on('GetSimulationsByUserId', async (req) => {
            return await GetSimulationsByUserId(req);
        });
        // Evento para simular estrategia Iron Condor
        this.on('SimulateIronCondor', async (req) => {
          return await SimulateIronCondor(req);
        });
        // Evento para actualizar el nombre de una simulación
        this.on('UpdateSimulationName', async (req) => {
            return await UpdateSimulationName(req);
        });

        //****************** PARA OBTENER OPCIONES HISTÓRICAS ***********************/
        this.on('GetAllPricesHistory', async (req) => {
            return await GetAllPricesHistory(req);
        })

        //****************** PARA CALCULAR INDICADORES ***********************/
        this.on('CalculateIndicators', async (req) => {
           // console.log('Datos recibidos:', req.data);  // Esto te permitirá ver los datos antes de enviarlos al servicio
            return await calculateIndicators(req);
        });

      // Handler para crear usuario:
      this.on('CreateUser', async (req) => {
        try {
          const user = await CreateUser(req);
          // CAP responde con status 201 automáticamente en actions
          return user;
        } catch (err) {
          // errores custom con status
          if (err.status)  return req.reject(err.status,  err.message);
          return req.reject(500, err.message);
        }
      });

      // Handler para eliminar simulación por ID
      this.on('DeleteSimulation', async (req) => {
      const { id } = req.data;
      if (!id) return req.reject(400, 'Falta el parámetro "id"');
      return await DeleteSimulationById(id);
    });
  
      return super.init();
    }
};