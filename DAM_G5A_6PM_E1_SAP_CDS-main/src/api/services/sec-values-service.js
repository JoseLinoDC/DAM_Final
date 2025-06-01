// src/api/services/sec-values-service.js
const Values = require('../models/mongodb/security/ztvalues');

async function GetAllValues(req) {
  try {
    const { valueid, category } = req.req.query;
    const filter = { 'DETAIL_ROW.DELETED': false };
    if (valueid) filter.VALUEID = valueid;
    // Ya no filtramos por ACTIVED
    if (category) filter.CATEGORY = category;
    return await Values.find(filter)
      .select('-DETAIL_ROW.DETAIL_ROW_REG')
      .lean();
  } catch (e) {
    throw new Error(`Error al obtener valores: ${e.message}`);
  }
}

async function GetValueById(req) {
  try {
    const valueid = req.req.params.valueid || req.req.query.valueid;
    const value = await Values.findOne({ VALUEID: valueid, 'DETAIL_ROW.DELETED': false }).lean();
    if (!value) throw new Error('Valor no encontrado');
    return value;
  } catch (e) {
    throw new Error(`Error al buscar valor: ${e.message}`);
  }
}

async function GetLabelById(req) {
  try {
    const labelid = req.req.params.labelid || req.req.query.labelid;
    const labels = await Values.find({
      LABELID: labelid,
      // 'DETAIL_ROW.DELETED': false
    }).lean();

    return labels || [];

  } catch (e) {

    console.error(`Error al buscar valores: ${e.message}`);
    return [];
  }
}

async function GetCompanyById(req) {
  try {
    const companyid = req.req.params.companyid || req.req.query.companyid;
    const comps = await Values.find({ COMPANYID: companyid, 'DETAIL_ROW.DELETED': false }).lean();
    if (!comps.length) throw new Error(`No se encontraron compañías con COMPANYID: ${companyid}`);
    return comps;
  } catch (e) {
    throw new Error(`Error al buscar compañías: ${e.message}`);
  }
}

async function GetBranchesWithDepartments(req) {
  try {
    const { companyid } = req.req.query;
    if (!companyid) throw new Error('Falta el parámetro companyid');

    // Buscar sucursales
    const sucursales = await Values.find({
      COMPANYID: companyid,
      LABELID: "IdSucursales",
      'DETAIL_ROW.DELETED': false
    }).lean();

    // Para cada sucursal, buscar sus departamentos
    for (const sucursal of sucursales) {
      const valuePaid = `IdSucursales-${sucursal.VALUEID}`; // <-- Aquí el fix
      const Departamentos = await Values.find({
        COMPANYID: companyid,
        LABELID: "IdCedis",
        VALUEPAID: valuePaid,
        'DETAIL_ROW.DELETED': false
      }).lean();
      sucursal.Departamentos = Departamentos;
    }

    return sucursales;
  } catch (e) {
    throw new Error(`Error al buscar sucursales y departamentos: ${e.message}`);
  }
}

//Crear un nuevo valor
async function view(req) {
  try {
    const { value } = req.data;
    if (!value || !value.VALUEID) throw new Error('Datos de valor incompletos');

    // if (!value.VALUEPAID) throw new Error('El parámetro "VALUEPAID" (sucursal) es requerido');

    const existing = await Values.findOne({ VALUEID: value.VALUEID });
    if (existing) throw new Error('El VALUEID ya está registrado');

    const audit = { CURRENT: true, REGDATE: new Date(), REGTIME: new Date(), REGUSER: value.VALUEID };
    const toCreate = {
      ...value,
      DETAIL_ROW: { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [audit] }
    };

    const [created] = await Values.insertMany([toCreate], { ordered: true });

    return created.toObject();
  } catch (e) {
    if (e.code === 11000) e.message = 'El VALUEID ya existe';
    throw new Error(`Error al crear valor: ${e.message}`);
  }
}


async function UpdateValue(req) {
  const { valueid, value } = req.data;
  if (!valueid) throw new Error('El parámetro "valueid" es requerido');
  if (!await Values.findOne({ VALUEID: valueid })) throw new Error(`El valor con ID "${valueid}" no existe.`);
  const updated = await Values.findOneAndUpdate(
    { VALUEID: valueid },
    { $set: value },
    { new: true }
  ).lean();
  return updated;
}


async function DeactivateValue(req) {
  try {
    const { valueid, reguser } = req.data;
    if (!valueid) throw new Error('El parámetro "valueid" es requerido');
    const audit = { CURRENT: true, REGDATE: new Date(), REGTIME: new Date(), REGUSER: reguser || 'system' };
    const updated = await Values.findOneAndUpdate(
      { VALUEID: valueid },
      { 'DETAIL_ROW.ACTIVED': false, $push: { 'DETAIL_ROW.DETAIL_ROW_REG': audit } },
      { new: true }
    ).lean();
    if (!updated) throw new Error('Valor no encontrado');
    return updated;
  } catch (e) {
    throw new Error(`Error al desactivar valor: ${e.message}`);
  }
}

async function ActivateValue(req) {
  try {
    const { valueid, reguser } = req.data;
    if (!valueid) throw new Error('El parámetro "valueid" es requerido');
    const audit = { CURRENT: true, REGDATE: new Date(), REGTIME: new Date(), REGUSER: reguser || 'system' };
    const updated = await Values.findOneAndUpdate(
      { VALUEID: valueid },
      { 'DETAIL_ROW.ACTIVED': true, $push: { 'DETAIL_ROW.DETAIL_ROW_REG': audit } },
      { new: true }
    ).lean();
    if (!updated) throw new Error('Valor no encontrado');
    return updated;
  } catch (e) {
    throw new Error(`Error al activar valor: ${e.message}`);
  }
}

async function deleteview(req) {
  try {
    const { valueid } = req.data;
    if (!valueid) throw new Error('El parámetro "valueid" es requerido');
    const del = await Values.findOneAndDelete({ VALUEID: valueid });
    if (!del) throw new Error('Valor no encontrado');
    return 'Valor eliminado permanentemente';
  } catch (e) {
    throw new Error(`Error al eliminar valor: ${e.message}`);
  }
}

module.exports = {
  GetAllValues,
  GetValueById,
  GetLabelById,
  GetCompanyById,
  GetBranchesWithDepartments,
  view,
  UpdateValue,
  DeactivateValue,
  ActivateValue,
  deleteview
};
