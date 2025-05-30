sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (JSONModel, MessageToast) {
  "use strict";

  // const API_INVERSIONES_URL_BASE = "http://localhost:3333/api/security/inversions/getAllSimulations";
  const API_INVERSIONES_URL_BASE = "http://localhost:3020/api/inv/pruebas/GetAllSimulation";

  return {

    loadSimulations: async function (oView, modelName) {
      try {
        const res = await fetch(API_INVERSIONES_URL_BASE);
        const data = await res.json();
        const simulations = data.value || [];

        console.log("Simulaciones reales:", simulations);

        const values = simulations.map(sim => ({
          simulationName: sim.SIMULATIONNAME,
          strategyName: sim.IDSTRATEGY,
          symbol: sim.SYMBOL,
          rangeDate: `${sim.STARTDATE?.substring(0, 10)} - ${sim.ENDDATE?.substring(0, 10)}`,
          result: sim.SUMMARY?.REALPROFIT ?? 0,
          _fullRecord: sim
        }));

        oView.setModel(
          new JSONModel({
            values,
            filteredCount: Number(simulations.length)
          }),
          modelName
        );

      } catch (e) {
        console.error("Error cargando simulaciones ", e);
      }
    },

    loadSimulationsOnce: async function (oView) {
      if (this._simulationsLoaded) return;
      await this.loadSimulations(oView, "historyModel");
      this._simulationsLoaded = true;
    },
    
  };
});