const dotenvx = require('@dotenvx/dotenvx');
dotenvx.config();


module.exports = {
    HOST: 'localhost' || 'NO ENCONTRE VARIABE DE ENTORNO',
    PORT: 3333 || 'NO ENCONTRE PORT',
    API_URL: '/api/v1'  || '/api/v1',
    CONNECTION_STRING: 'mongodb+srv://jolidiazca:admin@damproyectofinal.cv5qana.mongodb.net/' || 'SIN Cadena de CONEXION A LA BD MONGO', 
    DATABASE: 'DB_Security'  || 'db_default',  
    DB_USER: 'jolidiazca'  || 'admin',  
    DB_PASSWORD: 'admin'   || 'admin', 
}

