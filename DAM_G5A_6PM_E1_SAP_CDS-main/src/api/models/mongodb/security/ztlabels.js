const mongoose = require('mongoose');

/**
 * ESQUEMA PARA COLECCIÓN ZTTables
 * 
 * Archivos CDS relacionados:
 * - sec-labels.cds: Contiene la definición principal de Labels
 * - common.cds: Proporciona la estructura DETAIL_ROW (auditoría)
 * 
 */

const labelSchema = new mongoose.Schema({
    // ESTRUCTURA PRINCIPAL (sec-labels.cds)
    COMPANYID: { type: String, default: "0" },              // <- sec-labels.cds
    CEDIID: { type: String, default: "0" },                 // <- sec-labels.cds
    LABELID: { type: String, required: true },              // <- sec-labels.cds (campo clave)
    LABEL: { type: String, required: true },                // <- sec-labels.cds
    INDEX: { type: String },                                // <- sec-labels.cds
    COLLECTION: { type: String },                           // <- sec-labels.cds
    SECTION: { type: String },                              // <- sec-labels.cds
    SEQUENCE: { type: Number },                             // <- sec-labels.cds
    IMAGE: { type: String },                                // <- sec-labels.cds
    DESCRIPTION: { type: String },                          // <- sec-labels.cds

    // ESTRUCTURA DE AUDITORÍA (common.cds)
    DETAIL_ROW: {                                           // <- common.cds (AuditDetail)
        ACTIVED: { type: Boolean, default: true },          // <- common.cds
        DELETED: { type: Boolean, default: false },        // <- common.cds
        DETAIL_ROW_REG: [{                                  // <- common.cds (AuditDetailReg)
            CURRENT: { type: Boolean },                     // <- common.cds
            REGDATE: { type: Date },                        // <- common.cds
            REGTIME: { type: Date },                        // <- common.cds
            REGUSER: { type: String }                       // <- common.cds
        }]
    }
},{
    collection: 'ZTTables',
    timestamps: false // Usamos nuestro propio sistema de auditoría
});

module.exports = mongoose.model(
    'ZTLabels',     // Nombre del modelo
    labelSchema,    // Esquema definido
    'ZTLabels'      // Nombre de la colección en MongoDB
);