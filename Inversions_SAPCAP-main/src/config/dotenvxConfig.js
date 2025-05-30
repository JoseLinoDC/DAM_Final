const dotenvx = require('@dotenvx/dotenvx'); 
dotenvx.config(); 
module.exports = { 
//Variables de entorno para MongoDB 
HOST: process.env.HOST || 'NO ENCONTRE VARIABE DE ENTORNO', 
PORT: process.env.PORT || 'NO ENCONTRE PORT', 
API_URL: process.env.API_URL || '/api/v1', 
CONNECTION_STRING: process.env.CONNECTION_STRING || 
'mongodb://localhost:27017/?serverSelectionTimeoutMS=5000&connectTimeoutMS=10000', 
DATABASE: process.env.DATABASE || 'db_default',   
DB_USER: process.env.DB_USER || 'admin',   
DB_PASSWORD: process.env.DB_PASSWORD || 'admin' 
};