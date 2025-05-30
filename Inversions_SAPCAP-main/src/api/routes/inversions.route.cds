    using {inv as myinv} from '../models/inversions_mongo';

    @impl: 'src/api/controllers/inversions.controllers.js'

    service inversionsRoute @(path: '/api/inv/pruebas') {
        entity users         as projection on myinv.Users;
        entity strategies    as projection on myinv.strategies;
        entity simulation    as projection on myinv.Simulation;
        entity priceshistory as projection on myinv.PRICES_HISTORY;

        //******************* Users ***********************************
        @Core.Description: 'get-all-users'
        @path            : 'GetAllUsers'
        function GetAllUsers()                                     returns array of users;

        @Core.Description: 'get-one-user'
        @path            : 'GetUserById'
        function GetUserById(USER_ID : String)                     returns users;

        @Core.Description: 'create new user'
        @path            : 'CreateUser'
        action   CreateUser(name : String,
                            email : String)                        
                            returns users;

        //****************** Strategies *******************************
        @Core.Description: 'get-all-strategies'
        @path            : 'GetAllStrategies'
        function GetAllStrategies()                                returns array of strategies;

        @Core.Description: 'create-strategy-Iron-Condor'
        @path            : 'CreateIronCondorStrategy'
        action   CreateIronCondorStrategy(userId : String,
                                        type : String,
                                        symbol : String,
                                        startDate : Date,
                                        endDate : Date,
                                        legs : many {
            type       : String;
            position   : String;
            strike     : Integer;
        })                                                         returns {
            strategyId : String;
            status     : String;
        };

        @Core.Description: 'Get strategies by user ID'
        @path            : 'GetStrategiesByUser'
        function GetStrategiesByUser(USER_ID : String)             returns array of strategies;

        //****************** Simulation *******************************
        @Core.Description: 'get-all-simulations'
        @path            : 'GetAllSimulation'
        function GetAllSimulation()                                returns array of simulation;

    @Core.Description: 'get-simulations-by-user'
    @path            : 'GetSimulationsByUserId'
    function GetSimulationsByUserId(USER_ID : String)                     returns simulation;
        @Core.Description: 'get-simulations-by-user'
        @path            : 'GetSimulatonByUserId'
        function GetSimulatonByUserId(USER_ID : String)                     returns simulation;

        @Core.Description: 'Simula una estrategia Iron Condor'
        @path: 'SimulateIronCondor'
        action SimulateIronCondor(
            symbol: String,
            entryDate: Date,
            expiryDate: Date,
            shortCallStrike: Decimal(10,2),
            longCallStrike: Decimal(10,2),
            shortPutStrike: Decimal(10,2),
            longPutStrike: Decimal(10,2),
            idUser: String,
            amount: Integer,             // Campo amount agregado
            startDate: Date,             // Campo startDate agregado
            endDate: Date,               // Campo endDate agregado
            simulationName: String,      // Campo simulationName agregado
            idStrategy: String           // Campo idStrategy agregado
        ) returns {
            signal: String;
            netCredit: Decimal(10,2);
            maxLoss: Decimal(10,2);
            maxProfit: Decimal(10,2);
            riskRewardRatio: Decimal(10,2);
            percentageReturn: Decimal(5,2);
            saved: Boolean;
            simulationId: String;
        };
        // Update a simulation name by ID
        @Core.Description: 'Update simulation name by ID'
        @path: 'UpdateSimulationName'
        action UpdateSimulationName(
            idSimulation: String,
            newName: String
        ) returns {
            message: String;
        };



        //****************** Nuevo: Obtener Opciones Históricas *******************************
        @Core.Description: 'Get Historical Options '
        @path            : 'GetAllPricesHistory'
        function GetAllPricesHistory()                             returns array of priceshistory;

        //****************** Nuevo: Calcular Indicadores *******************************
        @Core.Description: 'Calculate investment indicators'
        @path: 'CalculateIndicators'
        action CalculateIndicators(
            symbol: String,
            timeframe: String,
            interval: String,
            indicators: array of String
        ) returns {
            symbol: String;
            timeframe: String;
            interval: String;
            calculatedIndicators: {
                RSI: Decimal(5,2);
                MACD: Decimal(5,2);
            }
        };
        // Delete a simulation by ID
        @path: 'deleteSimulation'
        action DeleteSimulation(id: String) returns {
            idSimulation: String;
            status: String;
        };
    }
