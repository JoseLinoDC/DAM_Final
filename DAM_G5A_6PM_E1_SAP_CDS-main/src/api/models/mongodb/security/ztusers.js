const mongoose = require('mongoose');

/**
 * ESQUEMA PARA COLECCIÓN ZTUsers
 * 
 * Archivos CDS relacionados:
 * - sec-users.cds: Contiene la definición principal de Users
 * - sec-roles.cds: Proporciona la estructura de ROLES (asociación)
 * - common.cds: Proporciona la estructura DETAIL_ROW (auditoría)
 */

const userSchema = new mongoose.Schema({
    // ==============================================
    // ESTRUCTURA PRINCIPAL (sec-users.cds)
    // ==============================================
    USERID: { type: String, required: true, unique: true },             // <- sec-users.cds (campo clave)
    PASSWORD: { type: String },                         // <- sec-users.cds
    USERNAME: { type: String },                         // <- sec-users.cds
    ALIAS: { type: String }, // <- sec-users.cds
    FIRSTNAME: { type: String },                        // <- sec-users.cds
    LASTNAME: { type: String },                         // <- sec-users.cds

    // Formato DD.MM.YYYY
    BIRTHDAYDATE: { type: String },                                     // <- sec-users.cds 
    COMPANYID: { type: String },                        // <- sec-users.cds
    COMPANYNAME: { type: String },                      // <- sec-users.cds
    COMPANYALIAS: { type: String },                                     // <- sec-users.cds
    CEDIID: { type: String },                                           // <- sec-users.cds
    EMPLOYEEID: { type: String },                                       // <- sec-users.cds

    // Validación básica de email
    EMAIL: { type: String, match: /^\S+@\S+\.\S+$/ },   // <- sec-users.cds
    PHONENUMBER: { type: String },                                      // <- sec-users.cds
    EXTENSION: { type: String, default: "" },                           // <- sec-users.cds
    DEPARTMENT: { type: String },                                       // <- sec-users.cds
    FUNCTION: { type: String },                                         // <- sec-users.cds
    STREET: { type: String },                                           // <- sec-users.cds
    POSTALCODE: { type: Number },                                       // <- sec-users.cds
    CITY: { type: String },                                             // <- sec-users.cds
    REGION: { type: String, default: "" },                              // <- sec-users.cds
    STATE: { type: String },                                            // <- sec-users.cds
    COUNTRY: { type: String },                                          // <- sec-users.cds
    AVATAR: { type: String, default: "" },                              // <- sec-users.cds
    ROLES: [{
        ROLEID: { type: String },                       // <- sec-roles.cds (asociación)
        ROLEIDSAP: { type: String, default: "" }                        // <- sec-roles.cds
    }],                                                                 // <- sec-users.cds (array de UserRoles)

    // ==============================================
    // ESTRUCTURA DE AUDITORÍA (common.cds)
    // ==============================================
    DETAIL_ROW: {                                           // <- common.cds (AuditDetail)
        ACTIVED: { type: Boolean, default: true },          // <- common.cds
        DELETED: { type: Boolean, default: false },         // <- common.cds
        DETAIL_ROW_REG: [{                                  // <- common.cds (AuditDetailReg)
            CURRENT: { type: Boolean, required: true },     // <- common.cds
            REGDATE: { type: Date, required: true },        // <- common.cds
            REGTIME: { type: Date, required: true },        // <- common.cds
            REGUSER: { type: String, required: true }       // <- common.cds
        }]
    }
});

// Índices para optimización
userSchema.index({ USERID: 1 }, { unique: true }); // Índice único para USERID
userSchema.index({ EMAIL: 1 }); // Índice para búsqueda por email
userSchema.index({ COMPANYID: 1 }); // Índice para búsqueda por compañía

module.exports = mongoose.model(
    'ZTUsers',     // Nombre del modelo
    userSchema,    // Esquema definido
    'ZTUsers'      // Nombre de la colección en MongoDB
);