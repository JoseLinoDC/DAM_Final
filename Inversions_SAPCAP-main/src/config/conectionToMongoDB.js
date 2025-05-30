//Para conectarnos a la base de datos de Mongo DB 
const mongoose = require('mongoose'); 
const dotenvxconfig = require('./dotenvxConfig'); // Usa directamente el objeto exportado 
(async () => { 
    try { 
        const db = await mongoose.connect(dotenvxconfig.CONNECTION_STRING, { 
        dbName: dotenvxconfig.DATABASE 
    }); 
        console.log('Database is connected in MongoDB to: ', db.connection.name); 
    } catch (error) { 
        console.log('Error: ', error); 
    } 
})(); 

module.exports = mongoose; 