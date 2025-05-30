const express = require('express');
const cds = require('@sap/cds');
const cors = require('cors');
const router = express.Router();
const mongoose = require('./src/config/connectToMongoDB');
const dotenvXConfig = require('./src/config/dotenvXConfig');

module.exports = async (o) => {
    try{

        let app = express();
        app.express = express;

        app.use(express.json({limit: '500kb'}));
        app.use(cors());

        app.use('/api', router);

        // app.use(dotenvXConfig.API_URL,router);
        // app.get('/',(req,res)=>{
        //     res.end(`API de CDS esta en ejecucion ${req.url}`)
        // });
        
        o.app = app;
        o.app.httpServer = await cds.server(o);

        return  o.app.httpServer;

    }catch(error){
        console.error('Error starting server',error);
        process.exit(1);
    }
};