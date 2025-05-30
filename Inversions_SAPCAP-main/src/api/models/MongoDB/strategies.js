const mongoose = require('mongoose');

const strategyCatalogSchema = new mongoose.Schema({
  COMPANYID: { type: Number, required: true },
  CEDIID: { type: Number, required: true },
  LABELID: { type: String, required: true },
  VALUEPAID: { type: String, default: '' },
  VALUEID: { type: String, required: true }, // Ej: 'IDIRON'
  VALUE: { type: String, required: true },   // Ej: 'Iron Condor'
  ALIAS: { type: String },
  SEQUENCE: { type: Number },
  IMAGE: { type: String },
  DESCRIPTION: { type: String },

  DETAIL_ROW: {
    ACTIVED: { type: Boolean, default: true },
    DELETED: { type: Boolean, default: false },
    DETAIL_ROW_REG: [
      {
        CURRENT: { type: Boolean, default: true },
        REGDATE: { type: Date },
        REGTIME: { type: Date },
        REGUSER: { type: String }
      }
    ]
  }

}, {
  collection: 'STRATEGIES'
});

module.exports = mongoose.model('STRATEGIES', strategyCatalogSchema);
