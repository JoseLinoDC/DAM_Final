sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageBox",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    DateFormat,
    MessageBox,
    VizFrame,
    FlattenedDataset,
    FeedItem
  ) {
    "use strict";

    const API_INVERSIONES_URL_BASE =
      "http://localhost:3333/api/security/inversions/getAllSimulations";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.investments.Investments",
      {
        _oResourceBundle: null,
        _bSidebarExpanded: true,
        _sSidebarOriginalSize: "380px",
        _simulationsLoaded: false,

        /**
         * Lifecycle hook that is called when the controller is initialized.
         * Initializes models, sets default dates, and configures event delegates.
         */
        onInit: function () {
          // 1. Initialize Symbol Model (static data for now)
          this._initSymbolModel();

          // 2. Initialize Price Data Model (empty for now)
          this.getView().setModel(
            new JSONModel({
              values: [],
              filteredCount: 0,
              selectedCount: 0,
              filters: {
                dateRange: null,
                investmentRange: [0, 10000],
                profitRange: [-100, 100],
              },
            }),
            "historyModel"
          );

          this.getView().setModel(
            new JSONModel({
              strategies: [],
              allStrategies: [],
              filteredCount: 0,
              selectedCount: 0,
              minAmount: 0,
              maxAmount: 10000,
              filters: {
                dateRange: null,
                investmentRange: [0, 10000],
                profitRange: [-100, 100],
              },
            }),
            "historyModel"
          );

          this._loadSimulations();

          // 3. Add event delegate for VizFrame configuration after rendering
          this.getView().addEventDelegate({
            onAfterRendering: this._onViewAfterRendering.bind(this),
          });

          // 4. Initialize ViewModel for UI state (e.g., selected tab)
          var oViewModel = new sap.ui.model.json.JSONModel({
            selectedTab: "table",
          });
          this.getView().setModel(oViewModel, "viewModel");

          // 5. Initialize Strategy Analysis Model
          var oStrategyAnalysisModelData = {
            balance: 50000,
            stock: 1,
            longSMA: 200,
            shortSMA: 50,
            rsi: 14, // Default RSI value
            startDate: null,
            endDate: null,
            controlsVisible: false,
            // Campos específicos para la estrategia Momentum
            shortEMA: 21, // Default EMA corta
            longEMA: 50, // Default EMA larga
            rsiMomentum: 14, // Default RSI periodo para Momentum
            adxMomentum: 14, // Default ADX periodo para Momentum
            // Para IronCondor
            width: 5,
            premium: 2,
            rsiPeriod: 14,
            rsiMin: 40,
            rsiMax: 60,
            volThreshold: 100,
            expiryDays: 5,

            strategies: [
              { key: "", text: "Seleccione una estrategia" },
              { key: "MACrossover", text: "MA Crossover" },
              { key: "Reversión Simple", text: "Reversión Simple" },
              { key: "Supertrend", text: "Supertrend" },
              { key: "Momentum", text: "Momentum" },
              { key: "IronCondor", text: "Iron Condor" },
            ],

            // IMPORTANT: Initialize as an ARRAY of strings for VizFrame FeedItem
            chartMeasuresFeed: ["PrecioCierre", "Señal BUY", "Señal SELL"],
          };

          var oStrategyAnalysisModel = new JSONModel(
            oStrategyAnalysisModelData
          );

          this.getView().setModel(
            oStrategyAnalysisModel,
            "strategyAnalysisModel"
          );

          // 6. Initialize Investment History Model
          this.getView().setModel(
            new JSONModel({
              strategies: [
                {
                  date: new Date(2024, 4, 15),
                  strategyName: "Moving Average Crossover 1",
                  symbol: "AAPL",
                  result: 2500.5,
                  status: "Completado",
                },
                {
                  date: new Date(2024, 4, 16),
                  strategyName: "Moving Average Crossover 2",
                  symbol: "TSLA",
                  result: -1200.3,
                  status: "Completado",
                },
                {
                  date: new Date(2024, 4, 17),
                  strategyName: "Moving Average Crossover 3",
                  symbol: "MSFT",
                  result: 3400.8,
                  status: "En Proceso",
                },
                {
                  date: new Date(2024, 4, 18),
                  strategyName: "Moving Average Crossover 4",
                  symbol: "AMZN",
                  result: 1850.0,
                  status: "Completado",
                },
                {
                  date: new Date(2024, 4, 19),
                  strategyName: "Moving Average Crossover 5",
                  symbol: "GOOGL",
                  result: 2100.4,
                  status: "En Proceso",
                },
                {
                  date: new Date(2024, 4, 20),
                  strategyName: "Moving Average Crossover 6",
                  symbol: "NFLX",
                  result: -800.2,
                  status: "Completado",
                },
                {
                  date: new Date(2024, 4, 21),
                  strategyName: "Moving Average Crossover 7",
                  symbol: "NVDA",
                  result: 3900.9,
                  status: "Completado",
                },
                {
                  date: new Date(2024, 4, 22),
                  strategyName: "Moving Average Crossover 8",
                  symbol: "META",
                  result: 1500.1,
                  status: "En Proceso",
                },
              ],
              filteredCount: 0,
              selectedCount: 0,
              filters: {
                dateRange: null,
                investmentRange: [0, 10000],
                profitRange: [-100, 100],
              },
            }),
            "historyModel"
          );

          // 7. Initialize Strategy Result Model
          var oStrategyResultModel = new JSONModel({
            hasResults: false,
            chart_data: [],
            signals: [],
            date_from: null,
            date_to: null,
            moving_averages: { short: null, long: null },
            signals: [],
            chart_data: [], // Initialize as empty array
            result: null,
            // Propiedades para el resumen de simulación (ahora vienen de la API)
            simulationName: "",
            symbol: "",
            startDate: null,
            endDate: null,
            TOTAL_BOUGHT_UNITS: 0,
            TOTAL_SOLD_UNITS: 0,
            REMAINING_UNITS: 0,
            FINAL_CASH: 0,
            FINAL_VALUE: 0,
            FINAL_BALANCE: 0,
            REAL_PROFIT: 0,
            PERCENTAGE_RETURN: 0, // Nueva propiedad
            chartMeasuresFeed: ["PrecioCierre", "Señal BUY", "Señal SELL"],
          });
          this.getView().setModel(oStrategyResultModel, "strategyResultModel");

          var aTestChartData = [
            {
              DATE_GRAPH: new Date(2024, 4, 1),
              DATE: "2024-05-01",
              OPEN: 100,
              HIGH: 110,
              LOW: 95,
              CLOSE: 105,
              VOLUME: 1000,
              SHORT_MA: 102,
              LONG_MA: 98,
              RSI: 55,
              SMA: 100,
              MA: 101,
              ATR: 2.5,
              BUY_SIGNAL: 105,
              SELL_SIGNAL: null,
              INDICATORS_TEXT:
                "SMA Corta: 102, SMA Larga: 98, RSI: 55, SMA: 100, MA: 101, ATR: 2.5",
              SIGNALS: "ACCIÓN BUY",
              RULES: "RAZÓN Test Buy",
              SHARES: 10,
              type: "buy",
              price: 105,
              reasoning: "Test Buy",
            },
            {
              DATE_GRAPH: new Date(2024, 4, 2),
              DATE: "2024-05-02",
              OPEN: 106,
              HIGH: 112,
              LOW: 104,
              CLOSE: 110,
              VOLUME: 1200,
              SHORT_MA: 104,
              LONG_MA: 99,
              RSI: 60,
              SMA: 102,
              MA: 103,
              ATR: 2.7,
              BUY_SIGNAL: null,
              SELL_SIGNAL: 110,
              INDICATORS_TEXT:
                "SMA Corta: 104, SMA Larga: 99, RSI: 60, SMA: 102, MA: 103, ATR: 2.7",
              SIGNALS: "ACCIÓN SELL",
              RULES: "RAZÓN Test Sell",
              SHARES: 5,
              type: "sell",
              price: 110,
              reasoning: "Test Sell",
            },
            {
              DATE_GRAPH: new Date(2024, 4, 3),
              DATE: "2024-05-03",
              OPEN: 111,
              HIGH: 115,
              LOW: 109,
              CLOSE: 113,
              VOLUME: 900,
              SHORT_MA: 106,
              LONG_MA: 100,
              RSI: 65,
              SMA: 104,
              MA: 105,
              ATR: 2.9,
              BUY_SIGNAL: null,
              SELL_SIGNAL: null,
              INDICATORS_TEXT:
                "SMA Corta: 106, SMA Larga: 100, RSI: 65, SMA: 104, MA: 105, ATR: 2.9",
              SIGNALS: "SIN ACCIÓN",
              RULES: "SIN RAZÓN",
              SHARES: 0,
              type: "",
              price: 0,
              reasoning: "",
            },
          ];

          oStrategyResultModel.setProperty("/chart_data", aTestChartData);
          oStrategyResultModel.setProperty("/signals", [
            {
              DATE: "2024-05-01",
              TYPE: "buy",
              PRICE: 105,
              REASONING: "Test Buy",
            },
            {
              DATE: "2024-05-02",
              TYPE: "sell",
              PRICE: 110,
              REASONING: "Test Sell",
            },
          ]);
          oStrategyResultModel.setProperty("/hasResults", true);

          // 8. Set default date range for analysis
          this._setDefaultDates();

          // 9. Load ResourceBundle for i18n texts
          var oI18nModel = this.getOwnerComponent().getModel("i18n");
          if (oI18nModel) {
            try {
              var oResourceBundle = oI18nModel.getResourceBundle();
              if (
                oResourceBundle &&
                typeof oResourceBundle.getText === "function"
              ) {
                this._oResourceBundle = oResourceBundle;
                oStrategyAnalysisModel.setProperty("/strategies", [
                  {
                    key: "",
                    text: this._oResourceBundle.getText(
                      "selectStrategyPlaceholder"
                    ),
                  },
                  {
                    key: "MACrossover",
                    text: this._oResourceBundle.getText(
                      "movingAverageCrossoverStrategy"
                    ),
                  },
                  {
                    key: "Reversión Simple",
                    text: this._oResourceBundle.getText(
                      "movingAverageReversionSimpleStrategy"
                    ),
                  },
                  {
                    key: "Supertrend",
                    text: this._oResourceBundle.getText(
                      "movingAverageSupertrendStrategy"
                    ),
                  },
                  {
                    key: "Momentum",
                    text: this._oResourceBundle.getText(
                      "movingAverageMomentumStrategy"
                    ),
                  },
                  {
                    key: "IronCondor",
                    text: this._oResourceBundle.getText("ironCondorStrategy"),
                  },
                ]);
                console.log("Textos de i18n cargados correctamente.");
              } else {
                throw new Error("ResourceBundle no válido");
              }
            } catch (error) {
              console.error("Error al cargar ResourceBundle:", error);
              oStrategyAnalysisModel.setProperty("/strategies", [
                { key: "", text: "Error i18n: Seleccione..." },
                { key: "MACrossover", text: "Error i18n: Cruce Medias..." },
                {
                  key: "Reversión Simple",
                  text: "Error i18n: Reversion Simple...",
                },
                { key: "Supertrend", text: "Error i18n: Supertrend" },
                { key: "Momentum", text: "Error i18n: Momentum" }, // Añadido
                { key: "IronCondor", text: "Error i18n: Iron Condor" },
              ]);
            }
          } else {
            console.error(
              "Modelo i18n no encontrado. Usando textos por defecto."
            );
            oStrategyAnalysisModel.setProperty("/strategies", [
              { key: "", text: "No i18n: Seleccione..." },
              { key: "MACrossover", text: "No i18n: Cruce Medias..." },
              { key: "Reversión Simple", text: "No i18n: Reversion Simple..." },
              { key: "Supertrend", text: "No i18n: Supertrend" },
              { key: "Momentum", text: "No i18n: Momentum" }, // Añadido
              { key: "IronCondor", text: "No i18n: Iron Condor" },
            ]);
          }

          // 10. Store original sidebar size
          var oSidebarLayoutData = this.byId("sidebarLayoutData");
          if (oSidebarLayoutData) {
            this._sSidebarOriginalSize = oSidebarLayoutData.getSize();
          } else {
            var oSidebarVBox = this.byId("sidebarVBox");
            if (oSidebarVBox && oSidebarVBox.getLayoutData()) {
              this._sSidebarOriginalSize = oSidebarVBox
                .getLayoutData()
                .getSize();
            }
          }

          // 11. Call function to initialize chart measures feed based on initial strategy
          this._updateChartMeasuresFeed();
        },

        /**
         * Event handler for tab selection.
         * @param {sap.ui.base.Event} oEvent The event object
         */
        onTabSelect: function (oEvent) {
          var sKey = oEvent.getParameter("key");
          this.getView()
            .getModel("viewModel")
            .setProperty("/selectedTab", sKey);
        },

        /**
         * Event handler for after rendering of the view.
         * Configures the VizFrame once it's rendered.
         * @private
         */
        _onViewAfterRendering: function () {
          this._configureChart();
        },

        /**
         * Initializes the symbol model with static data.
         * @private
         */
        _initSymbolModel: function () {
          const oSymbolModel = new JSONModel({
            symbols: [
              { symbol: "TSLA", name: "Tesla" },
              { symbol: "AAPL", name: "Apple" },
              { symbol: "MSFT", name: "Microsoft" },
              { symbol: "IBM", name: "IBM" },
              { symbol: "AMZN", name: "Amazon" },
              { symbol: "GOOGL", name: "Alphabet (Google)" },
              { symbol: "NFLX", name: "Netflix" },
              { symbol: "NVDA", name: "NVIDIA" },
              { symbol: "META", name: "Meta Platforms" },
            ],
          });
          this.getView().setModel(oSymbolModel, "symbolModel");
        },

        /**
         * Configures the properties of the VizFrame.
         * @private
         */
        _configureChart: function () {
          const oVizFrame = this.byId("idVizFrame");
          if (!oVizFrame) {
            console.warn(
              "Función _configureChart: VizFrame con ID 'idVizFrame' no encontrado en este punto del ciclo de vida."
            );
            return;
          }

          oVizFrame.setVizProperties({
            plotArea: {
              dataLabel: { visible: false },
              window: {
                start: null,
                end: null,
              },
            },
            valueAxis: {
              title: { text: "Precio (USD)" }, // Generalize title as it will show various measures
            },
            timeAxis: {
              title: { text: "Fecha" },
              levels: ["day", "month", "year"],
              label: {
                formatString: "dd/MM/yy",
              },
            },
            title: {
              text: "Análisis de Precios e Indicadores",
            },
            legend: {
              visible: true,
            },
            toolTip: {
              visible: true,
              formatString: "#,##0.00",
            },
            interaction: {
              zoom: {
                enablement: "enabled",
              },
              selectability: {
                mode: "single",
              },
            },
          });
          console.log(
            "Propiedades de VizFrame configuradas para permitir zoom."
          );
        },

        /**
         * Sets default start and end dates for the analysis.
         * @private
         */
        _setDefaultDates: function () {
          var oStrategyAnalysisModel = this.getView().getModel(
            "strategyAnalysisModel"
          );
          var oToday = new Date();
          oStrategyAnalysisModel.setProperty("/endDate", new Date(oToday));
          var oStartDate = new Date(oToday);
          oStartDate.setMonth(oStartDate.getMonth() - 6);
          oStrategyAnalysisModel.setProperty(
            "/startDate",
            new Date(oStartDate)
          );
        },

        /**
         * Event handler for strategy selection change.
         * Updates visible controls and chart measures.
         * @param {sap.ui.base.Event} oEvent The event object
         */
        onStrategyChange: function (oEvent) {
          const oView = this.getView();
          const oStrategyAnalysisModel = oView.getModel(
            "strategyAnalysisModel"
          );
          const sSelectedKey = oEvent.getParameter("selectedItem").getKey();

          // Actualizar el estado de los controles visibles
          oStrategyAnalysisModel.setProperty(
            "/controlsVisible",
            !!sSelectedKey
          );
          oStrategyAnalysisModel.setProperty("/strategyKey", sSelectedKey);

          // Lógica para establecer SPECS por defecto según la estrategia seleccionada
          let defaultSpecs = [];
          switch (sSelectedKey) {
            case "Momentum":
              defaultSpecs = [
                { INDICATOR: "shortEMA", VALUE: 21 },
                { INDICATOR: "longEMA", VALUE: 50 },
                { INDICATOR: "rsiMomentum", VALUE: 14 },
                { INDICATOR: "adxMomentum", VALUE: 14 },
              ];
              break;

            case "idST":
              defaultSpecs = [
                { INDICATOR: "MA_LENGTH", VALUE: 20 },
                { INDICATOR: "ATR", VALUE: 10 },
                { INDICATOR: "MULT", VALUE: 2.0 },
                { INDICATOR: "RR", VALUE: 1.5 },
              ];
              break;
            case "STRATEGY_001":
              defaultSpecs = [
                { INDICATOR: "RSI", VALUE: 14 },
                { INDICATOR: "SMA", VALUE: 5 },
              ];
              break;
            case "IdCM":
              defaultSpecs = [
                { INDICATOR: "SHORT_MA", VALUE: 50 },
                { INDICATOR: "LONG_MA", VALUE: 200 },
              ];
              break;
            case "IC":
              defaultSpecs = [
                { INDICATOR: "WIDTH", VALUE: 5 },
                { INDICATOR: "PREMIUM", VALUE: 2 },
                { INDICATOR: "RSI_PERIOD", VALUE: 14 },
                { INDICATOR: "RSI_MIN", VALUE: 30 },
                { INDICATOR: "RSI_MAX", VALUE: 70 },
                { INDICATOR: "VOL_THRESHOLD", VALUE: 100000 },
                { INDICATOR: "EXPIRY_DAYS", VALUE: 5 },
              ];
              break;
            default:
              defaultSpecs = [];
              break;
          }

          // Establecer SPECS predeterminados en el modelo para que el usuario pueda editarlos
          oStrategyAnalysisModel.setProperty("/specs", defaultSpecs);

          // Actualizar el gráfico o cualquier otro componente dependiente
          this._updateChartMeasuresFeed();
        },

        /**
         * Event handler for running the analysis.
         * Makes an API call to get simulation data and updates models.
         * It also triggers the update of chart measures feed after data is loaded.
         */
        onRunAnalysisPress: function () {
          const oView = this.getView();
          const oStrategyModel = oView.getModel("strategyAnalysisModel");
          const oResultModel = oView.getModel("strategyResultModel");
          const oVizFrame = this.byId("idVizFrame");
          const sSymbol = oView.byId("symbolSelector").getSelectedKey();

          // Validación de selección de estrategia y símbolo
          if (!oStrategyModel.getProperty("/strategyKey")) {
            MessageBox.warning("Seleccione una estrategia");
            return;
          }
          if (!sSymbol) {
            MessageBox.warning("Seleccione un símbolo (ej: AAPL)");
            return;
          }

          // Mapeo de nombres de estrategia a rutas de API
          const strategyMap = {
            MACrossover: "macrossover",
            ReversiónSimple: "reversionsimple",
            SuperTrend: "supertrend",
            Momentum: "momentum",
            IronCondor: "ironcondor",
          };

          let apiStrategyName =
            strategyMap[oStrategyModel.getProperty("/strategyKey")] ||
            "supertrend"; // fallback a supertrend

          // Construcción del SPECS según la estrategia seleccionada
          const getSpecs = (strategy) => {
            switch (strategy) {
              case "supertrend":
                return [
                  {
                    INDICATOR: "ma_length",
                    VALUE: oStrategyModel.getProperty("/longSMA") || 20,
                  },
                  {
                    INDICATOR: "atr",
                    VALUE: oStrategyModel.getProperty("/atr") || 10,
                  },
                  {
                    INDICATOR: "mult",
                    VALUE: oStrategyModel.getProperty("/mult") || 2.0,
                  },
                  {
                    INDICATOR: "rr",
                    VALUE: oStrategyModel.getProperty("/rr") || 1.5,
                  },
                ];
              case "momentum":
                return [
                  {
                    INDICATOR: "SHORT_EMA",
                    VALUE: oStrategyModel.getProperty("/shortEMA") || 21,
                  },
                  {
                    INDICATOR: "LONG_EMA",
                    VALUE: oStrategyModel.getProperty("/longEMA") || 50,
                  },
                  {
                    INDICATOR: "RSI",
                    VALUE: oStrategyModel.getProperty("/rsiMomentum") || 14,
                  },
                  {
                    INDICATOR: "ADX",
                    VALUE: oStrategyModel.getProperty("/adxMomentum") || 14,
                  },
                ];
              case "ironcondor":
                return [
                  {
                    INDICATOR: "WIDTH",
                    VALUE: oStrategyModel.getProperty("/width") || 5,
                  },
                  {
                    INDICATOR: "PREMIUM",
                    VALUE: oStrategyModel.getProperty("/premium") || 2,
                  },
                  {
                    INDICATOR: "RSI_PERIOD",
                    VALUE: oStrategyModel.getProperty("/rsiPeriod") || 14,
                  },
                  {
                    INDICATOR: "RSI_MIN",
                    VALUE: oStrategyModel.getProperty("/rsiMin") || 40,
                  },
                  {
                    INDICATOR: "RSI_MAX",
                    VALUE: oStrategyModel.getProperty("/rsiMax") || 60,
                  },
                  {
                    INDICATOR: "VOL_THRESHOLD",
                    VALUE:
                      oStrategyModel.getProperty("/volThreshold") || 100000,
                  },
                  {
                    INDICATOR: "EXPIRY_DAYS",
                    VALUE: oStrategyModel.getProperty("/expiryDays") || 5,
                  },
                ];
              case "reversionsimple":
              case "macrossover":
                return [
                  {
                    INDICATOR: "SHORT_MA",
                    VALUE: oStrategyModel.getProperty("/shortSMA") || 50,
                  },
                  {
                    INDICATOR: "LONG_MA",
                    VALUE: oStrategyModel.getProperty("/longSMA") || 200,
                  },
                ];
              default:
                return []; // fallback a lista vacía
            }
          };

          const SPECS = getSpecs(apiStrategyName);

          // Construcción del objeto request
          const oRequestBody = {
            SIMULATION: {
              SYMBOL: sSymbol,
              STARTDATE: this.formatDate(
                oStrategyModel.getProperty("/startDate")
              ),
              ENDDATE: this.formatDate(oStrategyModel.getProperty("/endDate")),
              AMOUNT: oStrategyModel.getProperty("/stock") || 1,
              USERID: "usuarioPrueba",
              SPECS: SPECS,
            },
          };

          // console.log("Enviando solicitud con:", oRequestBody);

          fetch(
            `http://localhost:3333/api/security/inversions/simulation?strategy=${apiStrategyName}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(oRequestBody),
            }
          )
            .then((response) =>
              response.ok ? response.json() : Promise.reject(response)
            )
            .then((data) => {
              const simulationData = data.value?.[0]?.simulacion;

              if (!simulationData) {
                MessageBox.warning("No se recibieron datos de la simulación.");
                return;
              }

              // Extraer datos sin procesar
              const chartData = Array.isArray(simulationData.CHART_DATA) ? simulationData.CHART_DATA : [];
              const signals = Array.isArray(simulationData.SIGNALS) ? simulationData.SIGNALS : [];

              // Ahora tienes acceso directo a ellos para cualquier uso adicional


              const aChartData = this._prepareTableData(chartData, signals);
              const oSummary = simulationData.SUMMARY || {};

              oResultModel.setData({
                hasResults: true,
                chart_data: aChartData,
                signals: signals,
                result: oSummary.REAL_PROFIT || 0,
                simulationName: simulationData.SIMULATIONNAME || apiStrategyName,
                symbol: sSymbol,
                startDate: oStrategyModel.getProperty("/startDate"),
                endDate: oStrategyModel.getProperty("/endDate"),
                TOTAL_BOUGHT_UNITS: oSummary.TOTAL_BOUGHT_UNITS || 0,
                TOTAL_SOLD_UNITS: oSummary.TOTAL_SOLD_UNITS || 0,
                REMAINING_UNITS: oSummary.REMAINING_UNITS || 0,
                FINAL_CASH: oSummary.FINAL_CASH || 0,
                FINAL_VALUE: oSummary.FINAL_VALUE || 0,
                FINAL_BALANCE: oSummary.FINAL_BALANCE || 0,
                REAL_PROFIT: oSummary.REAL_PROFIT || 0,
                PERCENTAGE_RETURN: oSummary.PERCENTAGE_RETURN || 0,
              });

              oResultModel.refresh(true);

              if (oVizFrame) {
                oVizFrame.setModel(oResultModel, "strategyResultModel");
                oVizFrame.invalidate();
              }

              MessageToast.show(
                `Se añadieron $${(oSummary.REAL_PROFIT || 0).toFixed(
                  2
                )} a tu balance.`
              );
            })
            .catch((error) => {
              console.error("Error:", error);
              MessageBox.error("Error al obtener datos de simulación");
            });
        },

        /**
         * Helper function to format a Date object to "YYYY-MM-DD" string.
         * Made public for use in XML view bindings.
         * @param {Date} oDate The date object to format.
         * @returns {string|null} The formatted date string or null if input is not a Date.
         */
        formatDate: function (oDate) {
          return oDate
            ? DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" }).format(
                oDate
              )
            : null;
        },

        /**
         * Helper function to format the count of signals by type.
         * @param {Array} aSignals The array of signal objects.
         * @param {string} sType The type of signal to count ('buy', 'sell', 'stop_loss').
         * @returns {number} The count of signals of the specified type.
         */
        formatSignalCount: function (aSignals, sType) {
          if (!Array.isArray(aSignals)) {
            return 0;
          }
          return aSignals.filter((signal) => signal.TYPE === sType).length;
        },

        /**
         * Helper function to format the count of stop loss signals.
         * @param {Array} aSignals The array of signal objects.
         * @returns {number} The count of stop loss signals.
         */
        formatStopLossCount: function (aSignals) {
          if (!Array.isArray(aSignals)) {
            return 0;
          }
          return aSignals.filter((signal) => signal.TYPE === "stop_loss")
            .length;
        },

        /**
         * Helper function to determine the ObjectStatus state based on signal type.
         * @param {string} sType The type of signal ('buy', 'sell', 'stop_loss').
         * @returns {string} The ObjectStatus state ('Success', 'Error', 'Warning', 'None').
         */
        formatSignalState: function (sType) {
          if (sType === "buy") {
            return "Success";
          } else if (sType === "sell") {
            return "Error";
          } else if (sType === "stop_loss") {
            return "Warning";
          }
          return "None";
        },

        /**
         * Helper function to format a signal price.
         * @param {number} fPrice The price of the signal.
         * @returns {string} The formatted price string.
         */
        formatSignalPrice: function (fPrice) {
          return fPrice ? fPrice.toFixed(2) + " USD" : "N/A";
        },

        /**
         * Helper function to prepare raw API data for both table and VizFrame.
         * Ensures dates are Date objects for the chart and numeric values are parsed.
         * @param {Array} aData Raw data from API (e.g., CHART_DATA).
         * @param {Array} aSignals Signal data from API.
         * @returns {Array} Transformed data suitable for binding.
         * @private
         */
        _prepareTableData: function (aData, aSignals) {
          if (!Array.isArray(aData)) return [];

          return aData.map((oItem) => {
            const signal =
              (aSignals || []).find((s) => {
                const signalDate = this._parseDate(s.DATE);
                const itemDate = this._parseDate(oItem.DATE);
                return (
                  signalDate &&
                  itemDate &&
                  signalDate.getTime() === itemDate.getTime()
                );
              }) || {};

            const dateObject = this._parseDate(oItem.DATE);

            // 🔥 Extraer y mapear todos los indicadores dinámicos (RSI y más)
            const dynamicIndicators = {};
            if (Array.isArray(oItem.INDICATORS)) {
              oItem.INDICATORS.forEach((ind) => {
                if (ind.INDICATOR && ind.VALUE != null) {
                  dynamicIndicators[ind.INDICATOR.toUpperCase()] = parseFloat(
                    ind.VALUE
                  );
                }
              });
            }

            return {
              DATE_GRAPH: dateObject,
              DATE: dateObject ? this.formatDate(dateObject) : null,
              OPEN: parseFloat(oItem.OPEN) || 0,
              HIGH: parseFloat(oItem.HIGH) || 0,
              LOW: parseFloat(oItem.LOW) || 0,
              CLOSE: parseFloat(oItem.CLOSE) || 0,
              VOLUME: parseFloat(oItem.VOLUME) || 0,
              ...dynamicIndicators, // 🔥 Incluir todos los indicadores
              BUY_SIGNAL:
                signal.TYPE === "buy" ? parseFloat(oItem.CLOSE) : null,
              SELL_SIGNAL:
                signal.TYPE === "sell" ? parseFloat(oItem.CLOSE) : null,
              INDICATORS_TEXT:
                Object.entries(dynamicIndicators)
                  .map(([k, v]) => `${k}: ${v.toFixed(2)}`)
                  .join(", ") || "N/A",
              SIGNALS: signal.TYPE
                ? "ACCIÓN " + signal.TYPE.toUpperCase()
                : "SIN ACCIÓN",
              RULES: signal.REASONING
                ? "RAZÓN " + signal.REASONING
                : "SIN RAZÓN",
              SHARES: signal.SHARES || 0,
              type: signal.TYPE || "",
              price: signal.PRICE || 0,
              reasoning: signal.REASONING || "",
            };
          });
        },

        /**
         * Dynamically updates the list of measures displayed on the VizFrame's value axis.
         * This function is called onInit and when the strategy changes.
         * @private
         */

        //Modifica el feed de medidas del gráfico según la estrategia seleccionada
        //para evitar estar cambiando el dataset y feeds cada vez que se cambia la estrategia
        _updateChartMeasuresFeed: function () {
          this._buildDynamicDataset();

          const oStrategyResultModel = this.getView().getModel(
            "strategyResultModel"
          );
          const aChartData =
            oStrategyResultModel.getProperty("/chart_data") || [];

          let aAvailableFields = [];
          if (aChartData.length > 0) {
            const availableKeys = Object.keys(aChartData[0]).filter(
              (f) => f !== "DATE_GRAPH" && f !== "DATE" && f !== "VOLUME"
            );

            // 🔥 Incluye siempre estos campos más los indicadores dinámicos encontrados
            const mandatoryFields = ["OPEN", "CLOSE", "HIGH", "LOW"];
            aAvailableFields = [
              ...new Set([...mandatoryFields, ...availableKeys]),
            ];
          } else {
            aAvailableFields = ["OPEN", "CLOSE", "HIGH", "LOW"];
          }

          this.getView()
            .getModel("strategyAnalysisModel")
            .setProperty("/chartMeasuresFeed", aAvailableFields);
        },

        _buildDynamicDataset: function () {
          const oVizFrame = this.byId("idVizFrame");
          const oStrategyResultModel = this.getView().getModel(
            "strategyResultModel"
          );
          const aChartData =
            oStrategyResultModel.getProperty("/chart_data") || [];

          if (!oVizFrame) {
            console.warn("VizFrame no encontrado");
            return;
          }

          oVizFrame.removeAllFeeds();
          oVizFrame.destroyDataset();

          if (aChartData.length === 0) {
            console.warn("No hay datos para mostrar en la gráfica.");
            return;
          }

          // 🔥 Determinar todas las claves dinámicas (indicadores) más los campos base
          const aBaseKeys = ["OPEN", "HIGH", "LOW", "CLOSE"];
          const aDynamicKeys = new Set();

          aChartData.forEach((item) => {
            Object.keys(item).forEach((key) => {
              if (
                ![
                  "DATE_GRAPH",
                  "DATE",
                  "VOLUME",
                  "BUY_SIGNAL",
                  "SELL_SIGNAL",
                  "INDICATORS_TEXT",
                  "SIGNALS",
                  "RULES",
                  "SHARES",
                  "type",
                  "price",
                  "reasoning",
                ].includes(key)
              ) {
                aDynamicKeys.add(key);
              }
            });
          });

          const aAllKeys = [...new Set([...aBaseKeys, ...aDynamicKeys])];

          const aMeasureDefs = aAllKeys.map(
            (key) =>
              new sap.viz.ui5.data.MeasureDefinition({
                name: key,
                value: `{${key}}`,
              })
          );

          const oDataset = new sap.viz.ui5.data.FlattenedDataset({
            data: { path: "strategyResultModel>/chart_data" },
            dimensions: [
              new sap.viz.ui5.data.DimensionDefinition({
                name: "Fecha",
                value: "{DATE_GRAPH}",
                dataType: "date",
              }),
            ],
            measures: aMeasureDefs,
          });

          oVizFrame.setDataset(oDataset);

          oVizFrame.addFeed(
            new sap.viz.ui5.controls.common.feeds.FeedItem({
              uid: "timeAxis",
              type: "Dimension",
              values: ["Fecha"],
            })
          );

          oVizFrame.addFeed(
            new sap.viz.ui5.controls.common.feeds.FeedItem({
              uid: "valueAxis",
              type: "Measure",
              values: aAllKeys,
            })
          );

          oVizFrame.setVizProperties({
            plotArea: { dataLabel: { visible: false } },
            legend: { visible: true },
            title: { text: "Análisis de Precios e Indicadores" },
            valueAxis: { title: { text: "Precio / Indicadores" } },
            timeAxis: {
              title: { text: "Fecha" },
              levels: ["day", "month", "year"],
              label: { formatString: "dd/MM/yy" },
            },
          });

          oVizFrame.invalidate();
        },

        /**
         * Event handler for refreshing chart data.
         * Triggers a new analysis run with the current symbol.
         */
        onRefreshChart: function () {
          const oVizFrame = this.byId("idVizFrame");
          const oStrategyResultModel = this.getView().getModel(
            "strategyResultModel"
          );

          if (!oStrategyResultModel.getProperty("/hasResults")) {
            MessageToast.show("No hay resultados para actualizar el gráfico.");
            return;
          }

          // Refresca solo el VizFrame con los datos actuales
          this._updateChartMeasuresFeed();

          if (oVizFrame) {
            oVizFrame.invalidate(); // Esto fuerza el re-renderizado del gráfico
            MessageToast.show("Gráfico actualizado con los datos actuales.");

            this._loadSimulations(); // Esta línea recargará simulaciones y resumen
          } else {
            MessageToast.show("No se pudo encontrar el gráfico.");
          }
        },

        /**
         * Event handler for data point selection on the VizFrame.
         * Updates the ViewModel with selected point's data.
         * @param {sap.ui.base.Event} oEvent The event object
         */

        //Esta función maneja la selección de un punto de datos en el gráfico
        //y muestra un popover con los detalles del punto seleccionado.
        //El popover muestra la fecha, el valor alto (HIGH) y el número de fila del punto seleccionado.
        //El popover se reutiliza si ya existe, actualizando su contenido en lugar de crear uno nuevo.
        //El popover se muestra cerca del punto seleccionado en el gráfico.
        onDataPointSelect: function (oEvent) {
          const oData = oEvent.getParameter("data");
          console.log("Datos seleccionados:", oData);

          if (oData && oData.length > 0) {
            const oSelectedData = oData[0];
            const sFecha = new Date(oSelectedData.data.Fecha);
            const sMeasureName = oSelectedData.data.measureNames; // <- Medida seleccionada
            const fValue = oSelectedData.data[sMeasureName]; // <- Valor dinámico
            const iRowNumber = oSelectedData.data._context_row_number;

            if (!this._oDataPointPopover) {
              this._oDataPointPopover = new sap.m.Popover({
                title: "Detalles del Punto",
                content: [
                  new sap.m.VBox({
                    items: [
                      new sap.m.Text({
                        text: "Fecha: " + sFecha.toLocaleDateString(),
                      }),
                      new sap.m.Text({ text: sMeasureName + ": " + fValue }),
                      new sap.m.Text({ text: "Fila: " + iRowNumber }),
                    ],
                  }),
                ],
                placement: sap.m.PlacementType.Auto,
                showHeader: true,
              });
              this.getView().addDependent(this._oDataPointPopover);
            } else {
              const oVBox = this._oDataPointPopover.getContent()[0];
              oVBox.removeAllItems();
              oVBox.addItem(
                new sap.m.Text({
                  text: "Fecha: " + sFecha.toLocaleDateString(),
                })
              );
              oVBox.addItem(
                new sap.m.Text({ text: sMeasureName + ": " + fValue })
              );
              oVBox.addItem(new sap.m.Text({ text: "Fila: " + iRowNumber }));
            }

            const oDomRef = oSelectedData.target;
            this._oDataPointPopover.openBy(oDomRef);
          } else {
            console.warn("No se seleccionaron datos.");
          }
        },

        /**
         * Event handler for showing investment history popover.
         * @param {sap.ui.base.Event} oEvent The event object
         */

        onHistoryPress: async function (oEvent) {
          if (!this._oHistoryPopover) {
            this._oHistoryPopover = sap.ui.xmlfragment(
              "com.invertions.sapfiorimodinv.view.investments.fragments.InvestmentHistoryPanel",
              this
            );
            this.getView().addDependent(this._oHistoryPopover);

            const oTable = this.byId("strategyTable");
            if (oTable) {
              const oBinding = oTable.getBinding("items");
              if (oBinding) {
                oBinding.refresh(true); // Esto forzará el refresco de los items
                console.log("✅ Tabla actualizada con la nueva simulación.");
              } else {
                console.warn("⚠️ No se encontró binding en la tabla.");
              }
            }
          }

          try {
            const response = await fetch(
              "http://localhost:3333/api/security/inversions/getAllSimulations"
            );
            if (!response.ok) throw new Error("Error en la solicitud");

            const result = await response.json();

            // Normaliza el array de simulaciones
            const simulations = Array.isArray(result)
              ? result
              : result.data || result.simulations || result.value || [];

            // Mapea los datos a la estructura que espera la tabla
            const strategies = simulations.map((item) => ({
              strategyName: item.SIMULATIONNAME || item.strategyName || "",
              details: {
                STRATEGY: item.STRATEGYID || item.IDSTRATEGY || "",
                STARTDATE: item.STARTDATE
                  ? new Date(item.STARTDATE?.$date || item.STARTDATE)
                  : null,
                ENDDATE: item.ENDDATE
                  ? new Date(item.ENDDATE?.$date || item.ENDDATE)
                  : null,
              },
              symbol: item.SYMBOL || "",
              amount: item.AMOUNT || 0,
              result:
                item.SUMMARY?.FINAL_BALANCE ??
                item.SUMMARY?.FINALBALANCE ??
                item.SUMMARY?.REALPROFIT ??
                0,
              _fullRecord: item,
            }));

            // Calculo para el rango de inversión del historial de estrategias simuladas
            const amounts = strategies.map((s) => s.amount || 0);
            const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
            const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 10000;

            // Calculo para el rango de rentabilidad del historial de estrategias simuladas
            const profits = strategies.map((s) => s.result || 0);
            const minProfit = profits.length > 0 ? Math.min(...profits) : 0;
            const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;

            // Asegúrate que el valor inicial del slider sea el rango completo
            const oData = {
              strategies,
              allStrategies: strategies.slice(),
              filteredCount: strategies.length,
              isDeleteMode: false,
              selectedCount: 0,
              minAmount: minAmount,
              maxAmount: maxAmount,
              filters: {
                dateRange: null,
                investmentRange: [minAmount, maxAmount],
                profitRange: [minProfit, maxProfit],
              },
            };
            // ...existing code...

            const oModel = new sap.ui.model.json.JSONModel(oData);
            this.getView().setModel(oModel, "historyModel");

            if (this._oHistoryPopover.isOpen()) {
              this._oHistoryPopover.close();
              return;
            }
            this._oHistoryPopover.openBy(oEvent.getSource());
          } catch (err) {
            MessageToast.show("Error al obtener simulaciones");
            console.error(err);
          }
        },

        onLoadStrategy: function () {
          // Busca la tabla directamente en el core
          const oTable = sap.ui.getCore().byId("historyTable");
          if (!oTable) {
            MessageToast.show("Tabla de historial no encontrada.");
            return;
          }

          const aSelectedItems = oTable.getSelectedItems();
          if (!aSelectedItems || aSelectedItems.length === 0) {
            MessageToast.show("Seleccione una estrategia para cargar.");
            return;
          }

          const oSelectedContext =
            aSelectedItems[0].getBindingContext("historyModel");
          if (!oSelectedContext) {
            MessageToast.show(
              "No se pudo obtener el contexto del seleccionado."
            );
            return;
          }

          const oSelectedStrategy = oSelectedContext.getObject();
          if (!oSelectedStrategy || !oSelectedStrategy._fullRecord) {
            MessageToast.show(
              "No se encontró el registro completo de la simulación."
            );
            return;
          }

          // Carga la simulación en la gráfica y resumen
          this._loadSimulationData(oSelectedStrategy._fullRecord);

          // Cierra el popover de historial si está abierto
          if (this._oHistoryPopover && this._oHistoryPopover.isOpen()) {
            this._oHistoryPopover.close();
          }

          MessageToast.show("Simulación cargada.");
        },

        /**
         * Toggles the visibility of advanced filters in the history popover.
         */
        onToggleAdvancedFilters: function () {
          if (!this._oHistoryPopover) return;

          const oPanel = sap.ui.getCore().byId("advancedFiltersPanel"); // Access panel from core if it's not a direct child of the view

          if (oPanel) {
            oPanel.setVisible(!oPanel.getVisible());
          } else {
            console.warn("Advanced filters panel not found.");
          }
        },

        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------
        /**
         * Carga las simulaciones desde la API
         * @private
         */
        _loadSimulations: async function () {
          try {
            const res = await fetch(API_INVERSIONES_URL_BASE);
            const data = await res.json();
            const simulations = data.value || [];

            const historyData = simulations.map((sim) => ({
              date: new Date(sim.START_DATE),
              strategyName: sim.IDSTRATEGY,
              symbol: sim.SYMBOL,
              result: sim.SUMMARY?.REAL_PROFIT ?? 0,
              _fullRecord: sim,
            }));

            // Calcular resumen general
            let totalInitialCash = 0;
            let totalBought = 0;
            let totalSold = 0;
            let totalFinalBalance = 0;
            let totalProfit = 0;
            let totalPercentage = 0;

            simulations.forEach((sim) => {
              const summary = sim.SUMMARY || {};
              totalInitialCash += 50000; // o el valor inicial definido
              totalBought += summary.TOTAL_BOUGHT_UNITS || 0;
              totalSold += summary.TOTAL_SOLD_UNITS || 0;
              totalFinalBalance += summary.FINAL_BALANCE || 0;
              totalProfit += summary.REAL_PROFIT || 0;
              totalPercentage += summary.PERCENTAGE_RETURN || 0;
            });

            const historySummary = {
              totalSimulations: simulations.length,
              totalInitialCash: totalInitialCash,
              totalBought: totalBought,
              totalSold: totalSold,
              totalFinalBalance: totalFinalBalance,
              totalProfit: totalProfit,
              totalPercentage:
                simulations.length > 0
                  ? (totalPercentage / simulations.length).toFixed(2)
                  : 0,
            };

            this.getView().setModel(
              new JSONModel({ values: historyData }),
              "historyModel"
            );
            this.getView().setModel(
              new JSONModel(historySummary),
              "historySummaryModel"
            );

            const amounts = historyData.map((item) => item.amount || 0);
            const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
            const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 10000;

            // Actualizar modelo
            const oModel = this.getView().getModel("historyModel");
            oModel.setProperty("/strategies", historyData);
            oModel.setProperty("/allStrategies", historyData);
            oModel.setProperty("/filteredCount", historyData.length);
            oModel.setProperty("/minAmount", minAmount);
            oModel.setProperty("/maxAmount", maxAmount);
            oModel.setProperty("/filters/investmentRange", [
              minAmount,
              maxAmount,
            ]);

            this.getView()
              .getModel("historyModel")
              .setData({
                values: historyData,
                filteredCount: simulations.length,
                selectedCount: 0,
                filters: {
                  dateRange: null,
                  investmentRange: [0, 10000],
                  profitRange: [-100, 100],
                },
              });

            // Si hay simulaciones, puedes cargar la primera en el gráfico
            if (simulations.length > 0) {
              this._loadSimulationData(simulations[0]);
            }
          } catch (e) {
            console.error("Error cargando simulaciones:", e);
            MessageBox.error("Error al cargar el historial de simulaciones");
          }
        },

        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------

        formatShares: function (value) {
          if (isNaN(value)) {
            return "-";
          }
          return Math.round(value); // Puedes usar Math.floor(value) o Math.ceil(value) si prefieres
        },

        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //Muestra el historial de datos de simulación una empresa específica
        onSymbolChange: async function (oEvent) {
          const sSelectedSymbol = oEvent.getSource().getSelectedKey();
          if (!sSelectedSymbol) {
            MessageToast.show("Por favor, selecciona un símbolo.");
            return;
          }

          // Puedes hacer fetch aquí si quieres obtener datos actualizados:
          try {
            const response = await fetch(
              "http://localhost:3333/api/security/inversions/getAllSimulations"
            );
            if (!response.ok) throw new Error("Error en la solicitud");
            const result = await response.json();
            const simulations = result.value || [];

            // Filtrar por símbolo seleccionado
            const simulationsForSymbol = simulations.filter(
              (sim) => sim.SYMBOL === sSelectedSymbol
            );

            if (simulationsForSymbol.length === 0) {
              MessageToast.show(
                `No se encontraron simulaciones para ${sSelectedSymbol}`
              );
              return;
            }

            // Opcional: puedes tomar la simulación más reciente
            const latestSim = simulationsForSymbol.reduce((prev, current) => {
              const prevDate = new Date(prev.ENDDATE || prev.END_DATE);
              const currentDate = new Date(current.ENDDATE || current.END_DATE);
              return currentDate > prevDate ? current : prev;
            });

            // Preparar datos para la tabla y gráfico
            const aChartData = this._prepareTableData(
              latestSim.CHART_DATA || [],
              latestSim.SIGNALS || []
            );
            const oStrategyResultModel = this.getView().getModel(
              "strategyResultModel"
            );
            const summary = latestSim.SUMMARY || {};

            oStrategyResultModel.setProperty("/hasResults", true);
            oStrategyResultModel.setProperty("/chart_data", aChartData);
            oStrategyResultModel.setProperty(
              "/signals",
              latestSim.SIGNALS || []
            );
            oStrategyResultModel.setProperty(
              "/result",
              summary.REAL_PROFIT ?? summary.REALPROFIT ?? 0
            );
            oStrategyResultModel.setProperty(
              "/simulationName",
              latestSim.SIMULATIONNAME
            );
            oStrategyResultModel.setProperty("/symbol", latestSim.SYMBOL);
            oStrategyResultModel.setProperty(
              "/startDate",
              new Date(latestSim.STARTDATE)
            );
            oStrategyResultModel.setProperty(
              "/endDate",
              new Date(latestSim.ENDDATE)
            );
            oStrategyResultModel.setProperty(
              "/TOTAL_BOUGHT_UNITS",
              summary.TOTAL_BOUGHT_UNITS ?? 0
            );
            oStrategyResultModel.setProperty(
              "/TOTAL_SOLD_UNITS",
              summary.TOTAL_SOLD_UNITS ?? 0
            );
            oStrategyResultModel.setProperty(
              "/REMAINING_UNITS",
              summary.REMAINING_UNITS ?? 0
            );
            oStrategyResultModel.setProperty(
              "/FINAL_CASH",
              summary.FINAL_CASH ?? 0
            );
            oStrategyResultModel.setProperty(
              "/FINAL_VALUE",
              summary.FINAL_VALUE ?? 0
            );
            oStrategyResultModel.setProperty(
              "/FINAL_BALANCE",
              summary.FINAL_BALANCE ?? 0
            );
            oStrategyResultModel.setProperty(
              "/REAL_PROFIT",
              summary.REAL_PROFIT ?? 0
            );
            oStrategyResultModel.setProperty(
              "/PERCENTAGE_RETURN",
              summary.PERCENTAGE_RETURN ?? 0
            );
            oStrategyResultModel.refresh(true);

            // Actualiza el dataset del VizFrame
            this._buildDynamicDataset();

            MessageToast.show(
              `Historial para ${sSelectedSymbol} cargado correctamente.`
            );
          } catch (err) {
            console.error(err);
            MessageToast.show(
              "Error al obtener historial para el símbolo seleccionado."
            );
          }
        },

        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //---------------------------------------------------------------------------------------------------------------------------------------------------------------------
        /**
         * Carga los datos de una simulación específica en el gráfico
         * @param {Object} oSimulation Datos de la simulación
         * @private
         */

        /**
         * Carga los datos de una simulación específica en el gráfico
         * @param {Object} oSimulation Datos de la simulación
         * @private
         */
        _loadSimulationData: async function (oSimulation) {
          const oStrategyResultModel = this.getView().getModel(
            "strategyResultModel"
          );
          oStrategyResultModel.refresh(true);

          let simulationData = oSimulation;

          if (oSimulation && oSimulation.SIMULATIONID) {
            try {
              const response = await fetch(
                `http://localhost:3333/api/security/inversions/getSimulationById?simulationId=${encodeURIComponent(
                  oSimulation.SIMULATIONID
                )}`
              );
              if (!response.ok)
                throw new Error("No se pudo obtener la simulación");
              const result = await response.json();
              simulationData = Array.isArray(result) ? result[0] : result;
            } catch (e) {
              MessageToast.show("Error al cargar la simulación seleccionada");
              console.error(e);
              return;
            }
          }

          const aChartData = this._prepareTableData(
            simulationData.CHART_DATA || [],
            simulationData.SIGNALS || []
          );
          const summary = simulationData.SUMMARY || {};

          // Actualizar modelo
          oStrategyResultModel.setProperty("/hasResults", true);
          oStrategyResultModel.setProperty("/chart_data", aChartData);
          oStrategyResultModel.setProperty(
            "/signals",
            simulationData.SIGNALS || []
          );
          oStrategyResultModel.setProperty(
            "/result",
            summary.REAL_PROFIT ?? summary.REALPROFIT ?? 0
          );
          oStrategyResultModel.setProperty(
            "/simulationName",
            simulationData.SIMULATIONNAME
          );
          oStrategyResultModel.setProperty("/symbol", simulationData.SYMBOL);
          oStrategyResultModel.setProperty(
            "/startDate",
            new Date(simulationData.STARTDATE)
          );
          oStrategyResultModel.setProperty(
            "/endDate",
            new Date(simulationData.ENDDATE)
          );
          oStrategyResultModel.setProperty(
            "/TOTAL_BOUGHT_UNITS",
            summary.TOTAL_BOUGHT_UNITS ?? 0
          );
          oStrategyResultModel.setProperty(
            "/TOTAL_SOLD_UNITS",
            summary.TOTAL_SOLD_UNITS ?? 0
          );
          oStrategyResultModel.setProperty(
            "/REMAINING_UNITS",
            summary.REMAINING_UNITS ?? 0
          );
          oStrategyResultModel.setProperty(
            "/FINAL_CASH",
            summary.FINAL_CASH ?? 0
          );
          oStrategyResultModel.setProperty(
            "/FINAL_VALUE",
            summary.FINAL_VALUE ?? 0
          );
          oStrategyResultModel.setProperty(
            "/FINAL_BALANCE",
            summary.FINAL_BALANCE ?? 0
          );
          oStrategyResultModel.setProperty(
            "/REAL_PROFIT",
            summary.REAL_PROFIT ?? 0
          );
          oStrategyResultModel.setProperty(
            "/PERCENTAGE_RETURN",
            summary.PERCENTAGE_RETURN ?? 0
          );
          oStrategyResultModel.refresh(true);

          // Construir el dataset dinámico y actualizar feeds
          this._buildDynamicDataset();

          // MessageToast.show(
          //   `Datos de simulación cargados para ${simulationData.SIMULATIONNAME}`
          // );
        },

        _parseDate: function (dateValue) {
          // Si ya es un objeto Date, devolverlo directamente
          if (dateValue instanceof Date) {
            return dateValue;
          }

          // Si es string ISO con timezone (ej: "2024-01-02T00:00:00.000Z")
          if (typeof dateValue === "string" && dateValue.includes("T")) {
            return new Date(dateValue);
          }

          // Si es string con solo fecha (ej: "2024-01-02")
          if (
            typeof dateValue === "string" &&
            dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
          ) {
            return new Date(dateValue);
          }

          // Si no coincide con ningún formato conocido
          console.warn("Formato de fecha no reconocido:", dateValue);
          return null;
        },

        _extractIndicators: function (aIndicators) {
          const result = {
            values: {},
            textParts: [],
          };

          if (Array.isArray(aIndicators)) {
            aIndicators.forEach((indicator) => {
              const value = parseFloat(indicator.VALUE) || 0;
              // Mapea nombres de indicadores para consistencia
              const indicatorKey = indicator.INDICATOR.toLowerCase();
              result.values[indicatorKey.toUpperCase()] = value; // Ej: 'sma' -> 'SMA'
              result.textParts.push(
                `${indicatorKey.toUpperCase()}: ${value.toFixed(2)}`
              );
            });
          }

          result.text = result.textParts.join(", ") || "N/A";
          return result;
        },

        onDeleteSelected: async function () {
          const oModel = this.getView().getModel("historyModel");
          const aSelectedIds = oModel.getProperty("/selectedIds") || [];

          if (aSelectedIds.length === 0) {
            MessageToast.show(
              "Selecciona al menos una simulación para eliminar."
            );
            return;
          }

          // Confirmación
          MessageBox.confirm(
            `¿Seguro que deseas eliminar ${aSelectedIds.length} simulación(es)?`,
            {
              onClose: async (sAction) => {
                if (sAction === MessageBox.Action.OK) {
                  try {
                    const response = await fetch(
                      "http://localhost:3333/api/security/inversions/deleteSimulations",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ simulationIds: aSelectedIds }),
                      }
                    );
                    const result = await response.json();
                    console.log("Respuesta backend:", result);
                    if (
                      result.success === true ||
                      (result.value && result.value.success === true)
                    ) {
                      MessageToast.show(
                        "Simulaciones eliminadas correctamente."
                      );
                      // Recarga el historial
                      this.onHistoryPress();
                    } else {
                      MessageBox.error(
                        "No se pudieron eliminar las simulaciones."
                      );
                    }
                  } catch (e) {
                    MessageBox.error("Error al eliminar simulaciones.");
                    // console.error(e);
                  }
                }
              },
            }
          );
        },

        onSelectionChange: function (oEvent) {
          const oTable = oEvent.getSource();
          const aSelectedItems = oTable.getSelectedItems();
          const oModel = this.getView().getModel("historyModel");

          // Obtén los SIMULATIONID de los seleccionados
          const aSelectedIds = aSelectedItems
            .map(
              (item) =>
                item.getBindingContext("historyModel").getObject()._fullRecord
                  ?.SIMULATIONID
            )
            .filter(Boolean);

          oModel.setProperty("/selectedIds", aSelectedIds);
          oModel.setProperty("/selectedCount", aSelectedIds.length);

          // Mostrar en consola los IDs seleccionados
          console.log("Simulaciones seleccionadas:", aSelectedIds);
        },

        /*
          HISTORIAL DE ESTRATEGIAS SIMULADAS
        */

        //Función para la barra de busqueda del historial de estrategias simuladas
        onSearch: function (oEvent) {
          const sQuery =
            oEvent.getParameter("query") ??
            oEvent.getParameter("newValue") ??
            "";
          const oModel = this.getView().getModel("historyModel");
          const aAllStrategies =
            oModel.getProperty("/allStrategies") ||
            oModel.getProperty("/strategies") ||
            [];

          if (!sQuery) {
            oModel.setProperty("/filteredCount", aAllStrategies.length);
            oModel.setProperty("/strategies", aAllStrategies);
            return;
          }

          const sLowerQuery = sQuery.toLowerCase();

          const aFiltered = aAllStrategies.filter((item) => {
            const name = (item.strategyName || "").toLowerCase();
            const symbol = (item.symbol || "").toLowerCase();
            return name.includes(sLowerQuery) || symbol.includes(sLowerQuery);
          });

          oModel.setProperty("/filteredCount", aFiltered.length);
          oModel.setProperty("/strategies", aFiltered);
        },

        // Filtro para el rango de fechas del historial de estrategias simuladas
        onFilterChange: function (oEvent) {
          const oModel = this.getView().getModel("historyModel");
          const aAllStrategies = oModel.getProperty("/allStrategies") || [];

          // 1. Calcular los rangos reales basados en TODOS los datos
          const amounts = aAllStrategies.map((item) => item.amount || 0);
          const minPossibleAmount =
            amounts.length > 0 ? Math.min(...amounts) : 0;
          const maxPossibleAmount =
            amounts.length > 0 ? Math.max(...amounts) : 10000;

          const profits = aAllStrategies.map((item) => item.result || 0);
          const minProfit = profits.length > 0 ? Math.min(...profits) : 0;
          const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;

          // 2. Obtener el rango de inversión del slider
          let aInvestmentRange;
          if (
            oEvent &&
            oEvent.getSource &&
            oEvent.getSource().getId &&
            oEvent.getSource().getId().includes("investmentRangeFilter")
          ) {
            aInvestmentRange = oEvent.getParameter("range");
            if (!Array.isArray(aInvestmentRange)) {
              aInvestmentRange = [minPossibleAmount, maxPossibleAmount];
            }
          } else {
            aInvestmentRange = oModel.getProperty(
              "/filters/investmentRange"
            ) || [minPossibleAmount, maxPossibleAmount];
          }

          // 3. Obtener el rango de rentabilidad del slider
          let aProfitRange = oModel.getProperty("/filters/profitRange") || [
            minProfit,
            maxProfit,
          ];
          if (
            oEvent &&
            oEvent.getSource &&
            oEvent.getSource().getId &&
            oEvent.getSource().getId().includes("profitRangeFilter")
          ) {
            aProfitRange = oEvent.getParameter("range");
            if (!Array.isArray(aProfitRange)) {
              aProfitRange = [minProfit, maxProfit];
            }
          }

          // 4. Validar límites de inversión
          aInvestmentRange = [
            Math.max(minPossibleAmount, aInvestmentRange[0]),
            Math.min(maxPossibleAmount, aInvestmentRange[1]),
          ];

          // 5. Validar rango mínimo de inversión (1000 unidades)
          const MIN_RANGE = 1000;
          if (aInvestmentRange[1] - aInvestmentRange[0] < MIN_RANGE) {
            if (aInvestmentRange[1] - MIN_RANGE >= minPossibleAmount) {
              aInvestmentRange[0] = aInvestmentRange[1] - MIN_RANGE;
            } else if (aInvestmentRange[0] + MIN_RANGE <= maxPossibleAmount) {
              aInvestmentRange[1] = aInvestmentRange[0] + MIN_RANGE;
            } else {
              aInvestmentRange = [minPossibleAmount, maxPossibleAmount];
            }
          }

          // 6. Validar límites de rentabilidad
          aProfitRange = [
            Math.max(minProfit, aProfitRange[0]),
            Math.min(maxProfit, aProfitRange[1]),
          ];

          // 7. Actualizar el modelo con los nuevos valores de rango y límites
          oModel.setProperty("/minAmount", minPossibleAmount);
          oModel.setProperty("/maxAmount", maxPossibleAmount);
          oModel.setProperty("/filters/investmentRange", aInvestmentRange);
          oModel.setProperty("/minProfit", minProfit);
          oModel.setProperty("/maxProfit", maxProfit);
          oModel.setProperty("/filters/profitRange", aProfitRange);

          // 8. Filtrar los datos
          const oDateRange = sap.ui.getCore().byId("dateRangeFilter");
          const oDateValue = oDateRange?.getDateValue();
          const oSecondDateValue = oDateRange?.getSecondDateValue();

          const aFiltered = aAllStrategies.filter((item) => {
            const start = item.details?.STARTDATE;
            const end = item.details?.ENDDATE;
            const amount = item.amount || 0;
            const result = item.result || 0;
            const profitOk =
              result >= aProfitRange[0] && result <= aProfitRange[1];

            // Filtro de fechas
            let dateOk = true;
            if (oDateValue && oSecondDateValue) {
              dateOk =
                start instanceof Date &&
                end instanceof Date &&
                end >= oDateValue &&
                start <= oSecondDateValue;
            }

            // Filtro de monto
            const amountOk =
              amount >= aInvestmentRange[0] && amount <= aInvestmentRange[1];

            return dateOk && amountOk && profitOk;
          });

          // 9. Actualizar la vista
          oModel.setProperty("/filteredCount", aFiltered.length);
          oModel.setProperty("/strategies", aFiltered);
        },

        onCloseHistoryPopover: function () {
          if (this._oHistoryPopover && this._oHistoryPopover.isOpen()) {
            this._oHistoryPopover.close();
          }

          // Restablecer filtros y búsqueda a valores predeterminados
          const oModel = this.getView().getModel("historyModel");
          if (oModel) {
            // Restaurar estrategias filtradas a todas
            const aAllStrategies = oModel.getProperty("/allStrategies") || [];
            oModel.setProperty("/strategies", aAllStrategies);
            oModel.setProperty("/filteredCount", aAllStrategies.length);
            oModel.setProperty("/selectedCount", 0);
            oModel.setProperty("/selectedIds", []);
            oModel.setProperty("/isDeleteMode", false);

            // Restaurar filtros a sus valores iniciales
            oModel.setProperty("/filters", {
              dateRange: null,
              investmentRange: [
                oModel.getProperty("/minAmount") || 0,
                oModel.getProperty("/maxAmount") || 10000,
              ],
              profitRange: [
                oModel.getProperty("/minProfit") || 0,
                oModel.getProperty("/maxProfit") || 0,
              ],
            });

            // Limpiar búsqueda
            const oSearchField = sap.ui.getCore().byId("searchField1");
            if (oSearchField) {
              oSearchField.setValue("");
            }

            // Limpiar filtros avanzados
            const oDateRange = sap.ui.getCore().byId("dateRangeFilter");
            if (oDateRange) {
              oDateRange.setDateValue(null);
              oDateRange.setSecondDateValue(null);
            }
            const oInvestmentSlider = sap.ui
              .getCore()
              .byId("investmentRangeFilter");
            if (oInvestmentSlider) {
              oInvestmentSlider.setValue([
                oModel.getProperty("/minAmount") || 0,
                oModel.getProperty("/maxAmount") || 10000,
              ]);
            }
            const oProfitSlider = sap.ui.getCore().byId("profitRangeFilter");
            if (oProfitSlider) {
              oProfitSlider.setValue([
                oModel.getProperty("/minProfit") || 0,
                oModel.getProperty("/maxProfit") || 0,
              ]);
            }

            // Ocultar panel de filtros avanzados
            const oPanel = sap.ui.getCore().byId("advancedFiltersPanel");
            if (oPanel) {
              oPanel.setVisible(false);
            }
          }
        },
      }
    );
  }
);
