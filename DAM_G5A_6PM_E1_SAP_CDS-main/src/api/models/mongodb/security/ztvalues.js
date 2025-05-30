const mongoose = require('mongoose');

/**
 * ESQUEMA PARA COLECCIÓN ZTValues
 * 
 * Archivos CDS relacionados:
 * - sec-values.cds: Contiene la definición principal de Values
 * - sec-labels.cds: Proporciona la relación con LABELID
 * - common.cds: Proporciona la estructura DETAIL_ROW (auditoría)
 */

const valueSchema = new mongoose.Schema({
    // ==============================================
    // ESTRUCTURA PRINCIPAL (sec-values.cds)
    // ==============================================
    COMPANYID: { type: String, default: "" },      // Opcional según sec-values.cds
    LABELID:   { type: String, required: true },     // Relación con sec-labels.cds
    VALUEID:   { type: String, required: true },     // Identificador único (clave)
    VALUE:     { type: String, required: true },     // Texto de presentación
    ALIAS:     { type: String, default: "" },      // Alias corto
    SEQUENCE:  { type: Number, default: 0 },         // Secuencia (opcional según sec-values.cds)
    IMAGE:     { type: String, default: "" },      // URL o ruta de imagen
    DESCRIPTION: { type: String, default: "" },    // Descripción
    VALUEPAID: { type: String, default: "" },      // Identificador secundario

    // ==============================================
    // ESTRUCTURA DE AUDITORÍA (common.cds)
    // ==============================================
    DETAIL_ROW: {
        ACTIVED:     { type: Boolean, default: true },
        DELETED:     { type: Boolean, default: false },
        DETAIL_ROW_REG: [{
            CURRENT: { type: Boolean, required: true },
            REGDATE: { type: Date,    required: true },
            REGTIME: { type: Date,    required: true },
            REGUSER: { type: String,  required: true }
        }]
    }
}, {
    collection: 'ZTValues',
    timestamps: false // Usamos nuestro propio sistema de auditoría
});

// Índices para optimización
valueSchema.index({ LABELID: 1, VALUEID: 1 }, { unique: true }); // Índice compuesto único
valueSchema.index({ VALUE: 1 });    // Índice para búsqueda por nombre de valor
valueSchema.index({ SEQUENCE: 1 }); // Índice para ordenamiento

module.exports = mongoose.model(
    'ZTValues',     // Nombre del modelo
    valueSchema,    // Esquema definido
    'ZTValues'      // Nombre de la colección en MongoDB
);
