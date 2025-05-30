const cds = require('@sap/cds');
const {
    SimulateMomentum,
    simulateSupertrend,
    reversionSimple,
    SimulateMACrossover,
    getAllSimulations
} = require("../services/inv-simulation-service");

class InversionsRoute extends cds.ApplicationService {
    async init() {
        this.on("simulation", async (req) => {
            try {
                // Extraer 'strategy' de los query params y datos del body

                const { strategy } = req?.req?.query || {};
                const body = req?.req?.body?.SIMULATION || {}; // Aquí está todo el body

                // Validaciones
                if (!strategy) {
                    throw new Error(
                        "Falta el parámetro requerido: 'strategy' en los query parameters."
                    );
                }
                if (Object.keys(body).length === 0) {
                    throw new Error(
                        "El cuerpo de la solicitud no puede estar vacío. Se esperan parámetros de simulación."
                    );
                }

                // Switch para manejar diferentes estrategias
                switch (strategy.toLowerCase()) {
                    case "reversionsimple":
                        return await reversionSimple(body);
                    case "momentum":
                        return await SimulateMomentum(body);
                    case "supertrend":
                        return await simulateSupertrend(body);
                    case "macrossover":
                        return await SimulateMACrossover(body);
                    default:
                        throw new Error(`Estrategia no reconocida: ${strategy}`);
                }
            } catch (error) {
                console.error("Error en el controlador de simulación:", error);
                // Retorna un objeto de error que el framework pueda serializar a JSON.
                return {
                    ERROR: true,
                    MESSAGE:
                        error.message || "Error al procesar la solicitud de simulación.",
                };
            }
        });

        this.on("getAllSimulations", async (req) => {
            try {
                const simulations = await getAllSimulations();
                return simulations;
            } catch (error) {
                return {
                    ERROR: true,
                    MESSAGE: error.message || "Error al obtener simulaciones.",
                };
            }
        });

        return await super.init();
    }
}

module.exports = InversionsRoute;