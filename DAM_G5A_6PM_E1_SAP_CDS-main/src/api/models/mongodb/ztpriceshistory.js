const mongoose = require('mongoose');

const priceshistoryschema = new mongoose.Schema({
    ID: {type: Number, required: true},
    DATE: {type: String},
    OPEN: {type: Number},
    HIGH: {type: Number},
    LOW: {type: Number},
    CLOSE: {type: Number},
    VOLUME: {type: Number}
});

module.exports = mongoose.model(
    'ZTPRICESHISTORY',
    priceshistoryschema,
    'ZTPRICESHISTORY'
);