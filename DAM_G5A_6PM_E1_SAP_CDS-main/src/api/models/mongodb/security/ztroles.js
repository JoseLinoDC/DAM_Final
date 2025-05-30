const mongoose = require('mongoose');

/**
 * ESQUEMA PARA COLECCIÓN ZTRoles
 *
 * Archivos CDS relacionados:
 * - sec-roles.cds: Contiene la definición principal de Roles
 * - common.cds: Proporciona la estructura DETAIL_ROW (auditoría)
 */

// Subesquema para auditoría de registros individuales
const auditDetailRowSchema = new mongoose.Schema({
  CURRENT:    { type: Boolean, required: true, default: true },
  REGDATE:    { type: Date,    default: Date.now },
  REGTIME:    { type: String,  default: () => new Date().toTimeString().split(' ')[0] },
  REGUSER:    { type: String,  required: true }
}, { _id: false });

// Subesquema para el bloque de auditoría completo
const auditDetailSchema = new mongoose.Schema({
  ACTIVO:           { type: Boolean, default: true },
  ELIMINADO:        { type: Boolean, default: false },
  DETAIL_ROW_REG:   [ auditDetailRowSchema ]
}, { _id: false });

// Subesquema para la relación de privilegios
const privilegeSchema = new mongoose.Schema({
  PROCESSID:   { type: String, required: true },
  PRIVILEGEID: { type: String, required: true }
}, { _id: false });

// Esquema principal de Roles
const roleSchema = new mongoose.Schema({
  // Campos principales (sec-roles.cds)
  ROLEID:           { type: String, required: true, unique: true },
  ROLENAME:         { type: String, required: true },
  DESCRIPTION:      { type: String, required: true },

  // Array de privilegios (RolePrivileges)
  PRIVILEGES:       [ privilegeSchema ],

  // Campos de auditoría propios (sec-roles.cds)
  ACTIVO:           { type: Boolean, default: true },
  ELIMINADO:        { type: Boolean, default: false },
  CURRENT:          { type: Boolean, default: true },
  FechaRegistro:    { type: Date,    default: Date.now },
  HoraRegistro:     { type: String,  default: () => new Date().toTimeString().split(' ')[0] },
  UsuarioRegistro:  { type: String,  required: true },

  // Bloque de auditoría completo (common.cds)
  DETAIL_ROW:       auditDetailSchema
}, {
  collection: 'ZTRoles',
  timestamps: false // Usamos nuestro propio sistema de auditoría
});

// Índices para optimización
roleSchema.index({ ROLEID: 1 }, { unique: true });
roleSchema.index({ ROLENAME: 1 });

module.exports = mongoose.model('ZTRoles', roleSchema, 'ZTRoles');
