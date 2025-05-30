# Getting Started

Welcome to your new project for class NoSQL.

It contains these folders and files, following our recommended project layout create in SAP CAP:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`frontend/` | your frontend
`src/` | your service models and code go here
`.env` | your variables of entorn for Mongo DB
`package.json` | project metadata and configuration
`readme.md` | this getting started guide
`server.js` | this main project

File or Folder src | Purpose
---------|----------
`api/` | content for structure backend
`config/` | your conection to Mongo DB

File or Folder api | Purpose
---------|----------
`controllers/` | your controllers
`models/` | your schemas of Mongo DB and entity for SAP CAP
`routes/` | your routes of the project
`services/` | your servicies of project


## URL

http://localhost:3020/api/inv

## ENDPOINTS Usuarios

Endpoint | URL | Body | Finish | Creator | Description
---------|----------|---------|---------|---------|---------
`GET`  |  /api/inv/GetAllUsers | none | Yes | Kennby| Todos los usuarios
`GET`  |  /api/inv/GetUserById | {"USER_ID": "user-001"} | Yes| Kennby| Un solo  usuarios
`POST`  |  /api/inv/CreateUser | {"name": "nombre", "email": "correo"} | Yes| Jesus | Nuevo usuario

## ENDPOINTS Estrategias

Endpoint | URL | Body | Finish | Creator | Description
---------|----------|---------|---------|---------|---------
`GET`  |  /api/inv/GetAllStrategies | none | Yes| Kennby| Todos las estrategias
`POST` | /api/inv/CreateIronCondorStrategy | {"userId": "user-001", "type": "IronCondor","symbol":"AMZN", "startDate": "2025-05-01", "endDate": "2025-06-01", "legs": [ { "type": "Call","position": "Sell", "strike": 120 }, { "type": "Call", "position": "Buy", "strike": 125 }, { "type": "Put", "position": "Sell", "strike": 110 }, { "type": "Put", "position": "Buy", "strike": 105 }]} | Yes| Pedro| Nueva estrategia



## ENDPOINTS Simulacion

Endpoint | URL | Body | Finish | Creator | Description
---------|----------|---------|---------|---------|---------
`GET`  |  /api/inv/GetAllSimulation | none | Yes| Kennby| Todas las simulaciones
`GET`  |  /api/inv/GetAllPricesHistory | none | Yes| Kennby | Todos los precios historicos
`POST` |  /api/inv/CalculateIndicators?symbol=AMZN&timeframe=6months&interval=1d | {"symbol":"AMZN","timeframe": "1months","interval": "6d", "indicators": ["RSI", "MACD"]} | Yes| Kennby | Mostrando Indicadores
`POST`  |  /api/inv/SimulateIronCondor | {"symbol": "AMZN","entryDate": "2025-05-15","expiryDate": "2025-06-15","shortCallStrike": 110,"longCallStrike": 115,"shortPutStrike": 90,"longPutStrike": 85,"idUser": "user-002","amount": 10000,"startDate": "2025-05-15", "endDate":"2025-06-15","simulationName": "Iron Condor AMZN", "idStrategy": "IronCondor"  }" | Yes | Pedro/Jesus | comenzar la simulacion usando la estrategia seleccionada
`GET`  |  /api/inv/getSimulation?id=1234 | {"USER_ID": "user-001"} | Yes| Kennby | solo las simulacion por usuario
`POST`  |  /api/inv/UpdateSimulationName | {"idSimulation": "APPL_2023-03-15","newName": "Iron condor v2"} | YES| Pedro | editar solo el nombre
`PUT`  |  /api/inv/DeleteSimulation | {"id": "4e92de0e-aacf-463e-bb20-f40e8c3cf007"}| YES | Jesus | eliminar la simulacion


