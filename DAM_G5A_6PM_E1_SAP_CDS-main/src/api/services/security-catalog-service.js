// src/api/services/security-catalog-service.js

const zttables = require('../models/mongodb/security/ztlabels');
const ztvalues = require('../models/mongodb/security/ztvalues');
const boom = require('@hapi/boom');

// Obtener todos los catálogos con sus valores relacionados
async function GetAllCatalogs(req) {
  try {
    const tables = await zttables.find().lean();
    const allResults = [];

    for (const table of tables) {
      const values = await ztvalues.find({ LABELID: table.LABELID }).lean();
      allResults.push({ ...table, VALUES: values });
    }

    return allResults;
  } catch (error) {
    console.error('[SERVICE] Error en GetAllCatalogs', error);
    return { error: error.message };
  }
}

// Obtener catálogo por LabelId
async function GetCatalogByLabelId(req) {
  try {
    const { LabelId } = req.req.query;
    const table = await zttables.findOne({ LABELID: LabelId }).lean();
    if (!table) return { error: 'Catálogo no encontrado' };

    const values = await ztvalues.find({ LABELID: LabelId }).lean();
    return { ...table, VALUES: values };
  } catch (error) {
    console.error('[SERVICE] Error en GetCatalogByLabelId', error);
    return { error: error.message };
  }
}

// Obtener valor específico por LabelId y ValueId
async function GetCatalogByParams(req) {
  try {
    const { LabelId, ValueId } = req.req.query;
    const table = await zttables.findOne({ LABELID: LabelId }).lean();
    if (!table) return { error: 'Catálogo no encontrado' };

    const value = await ztvalues.findOne({ LABELID: LabelId, VALUEID: ValueId }).lean();
    return { ...table, VALUES: value ? [value] : [] };
  } catch (error) {
    console.error('[SERVICE] Error en GetCatalogByParams', error);
    return { error: error.message };
  }
}
//Creamos categoria
async function AddCatalog(req) {
  try {
    const newCatalog = req.req.body.catalog; 
    let insertedCatalog;

    insertedCatalog = await zttables.insertMany(newCatalog, {
      order: true
    });

    return JSON.parse(JSON.stringify(insertedCatalog));
  } catch (error) {
    throw error;
  } finally {
  }
}
//Editamos una categoria existente
async function UpdateCatalog(req) {
  try {
    const {
      LABELID,
      LABEL,
      INDEX,
      COLLECTION,
      SECTION,
      SEQUENCE,
      IMAGE,
      DESCRIPTION,
      DETAIL_ROW
    } = req.data;

    if (!LABELID) throw boom.badRequest("Falta el parámetro LABELID");

    const updated = await zttables.findOneAndUpdate(
      { LABELID },
      {
        LABEL,
        INDEX,
        COLLECTION,
        SECTION,
        SEQUENCE,
        IMAGE,
        DESCRIPTION,
        DETAIL_ROW
      },
      { new: true }
    ).lean();

    if (!updated) throw boom.notFound(`No se encontró el registro con LABELID=${LABELID}`);

    return {
      message: "Catálogo actualizado correctamente",
      updated
    };
  } catch (error) {
    if (error.isBoom) throw error;
    throw boom.internal("Error al actualizar el catálogo", error);
  }
}
//DELETE LOGICO

async function DeleteLogicCatalog(req) {
  try {
    const { LABELID } = req.data;
    if (!LABELID) throw boom.badRequest("Falta el parámetro LABELID");

    const updated = await zttables.findOneAndUpdate(
      { LABELID },
      { "DETAIL_ROW.DELETED": true },
      { new: true }
    ).lean();

    if (!updated) throw boom.notFound(`No se encontró el registro con LABELID=${LABELID}`);

    return {
      message: "Catálogo marcado como eliminado (lógico)",
      updated,
    };
  } catch (error) {
    if (error.isBoom) throw error;
    throw boom.internal("Error en el borrado lógico del catálogo", error);
  }
}
//DELETE FISICO
async function DeletePhysicalCatalog(req) {
  try {
    const { LABELID } = req.data;
    if (!LABELID) throw boom.badRequest("Falta el parámetro LABELID");

    const deleted = await zttables.findOneAndDelete({ LABELID }).lean();
    if (!deleted) throw boom.notFound(`No se encontró el registro con LABELID=${LABELID}`);

    return {
      message: "Catálogo eliminado correctamente",
      deleted,
    };
  } catch (error) {
    if (error.isBoom) throw error;
    throw boom.internal("Error al eliminar el catálogo", error);
  }
}


module.exports = {
  GetAllCatalogs,
  GetCatalogByLabelId,
  GetCatalogByParams,
  AddCatalog,
  UpdateCatalog,
  DeleteLogicCatalog,
  DeletePhysicalCatalog,
};