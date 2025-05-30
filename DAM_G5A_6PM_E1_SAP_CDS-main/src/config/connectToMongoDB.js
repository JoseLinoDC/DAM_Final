const mongoose = require('mongoose');
const dotenvXConfig = require ('./dotenvXConfig'); 

(async () => { 
    try { 
        const db = await mongoose.connect(dotenvXConfig.CONNECTION_STRING, { 
            dbName: dotenvXConfig.DATABASE 
        }); 
        console.log('Database is connected to: ', db.connection.name); 
    } catch (error) { 
        console.log('Error: ', error); 
    } 
})();