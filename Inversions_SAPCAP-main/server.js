const express = require('express'); 
const cds = require('@sap/cds'); 
const cors = require('cors') 
const router = express.Router(); 
const mongoose = require('./src/config/conectionToMongoDB'); 
const dotenvx = require ('./src/config/dotenvxConfig'); 

module.exports = async (o) => { 
    let app = express(); 
    app.express = express; 
    try { 
    app.use(express.json({limit:'500kb'})); 
    app.use(cors()); 
    app.use('/api', router); 
    /* app.get('/', (req, res) => { 
    res.end('SAP CDS está en ejecución...${req.url}');
    }); */ 
    o.app = app; 
    o.app.httpServer = await cds.server(o); 
    } catch (error) { 
    console.error('Error starting server:', error); 
    process.exit(1); 
    } 
return o.app.httpServer; 
};