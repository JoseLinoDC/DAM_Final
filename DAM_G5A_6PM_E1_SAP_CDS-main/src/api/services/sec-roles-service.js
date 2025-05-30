const ZTRoles = require('../models/mongodb/security/ztroles');
const boom    = require('@hapi/boom');

async function GetAllRoles() {
  try {
    return await ZTRoles.find().lean();
  } catch (err) {
    throw boom.internal('Error al obtener los roles', err);
  }
}

async function GetRoleById(ID) {
  try {
    const role = await ZTRoles.findOne({ ROLEID: ID }).lean();
    if (!role) throw boom.notFound(`No se encontró el rol con ROLEID=${ID}`);
    return role;
  } catch (err) {
    throw boom.internal('Error al obtener el rol', err);
  }
}

async function addOne(req) {
  const rolesData = req.data.roles;
  if (!rolesData) {
    throw boom.badRequest('Cuerpo inválido: se esperaba objeto "roles"');
  }
  const { ROLEID, ROLENAME, DESCRIPTION, DETAIL_ROW, PRIVILEGES, ACTIVO } = rolesData;

  // Validaciones básicas
  if (!ROLEID || !ROLENAME || !DESCRIPTION) {
    throw boom.badRequest('Faltan campos obligatorios: ROLEID, ROLENAME o DESCRIPTION');
  }
  if (!Array.isArray(PRIVILEGES) || PRIVILEGES.length === 0) {
    throw boom.badRequest('Debes enviar al menos un elemento en PRIVILEGES');
  }
  PRIVILEGES.forEach((p, i) => {
    if (!p.PROCESSID || !p.PRIVILEGEID) {
      throw boom.badRequest(`PRIVILEGES[${i}] inválido: falta PROCESSID o PRIVILEGEID`);
    }
  });

  // Verificar duplicado
  const exists = await ZTRoles.findOne({ ROLEID }).lean();
  if (exists) {
    throw boom.conflict(`El rol con ROLEID=${ROLEID} ya existe`);
  }

  // Añadir usuario de registro
  const UsuarioRegistro = req.user?.id || req.user?.name || 'system';

  // Guardado y retorno de un POJO llano
  const roleDoc = new ZTRoles({
    ROLEID,
    ROLENAME,
    DESCRIPTION,
    ACTIVO: ACTIVO ?? true,
    DETAIL_ROW,
    PRIVILEGES,
    UsuarioRegistro
  });
  const saved = await roleDoc.save();
  return saved.toObject();
}

async function DeleteRoleById(req) {
  const { ROLEID } = req.data;
  if (!ROLEID) throw boom.badRequest('Falta parámetro ROLEID');

  const deleted = await ZTRoles.findOneAndDelete({ ROLEID }).lean();
  if (!deleted) throw boom.notFound(`No se encontró el rol con ROLEID=${ROLEID}`);
  return deleted;
}


//DELETE LOGICO
async function deleteLogicRole(req) {
  try {
    const { ROLEID } = req.data;
    if (!ROLEID) throw boom.badRequest("Falta el parámetro ROLEID");

    const now = new Date();

    // Paso 1: Desactivar el registro actual en el array DETAIL_ROW_REG
    await ZTRoles.updateOne(
      { ROLEID, "DETAIL_ROW.DETAIL_ROW_REG.CURRENT": true },
      {
        $set: {
          "DETAIL_ROW.DETAIL_ROW_REG.$.CURRENT": false
        }
      }
    );

    // Paso 2: Marcar el rol como eliminado y agregar nuevo registro de auditoría
    const updated = await ZTRoles.findOneAndUpdate(
      { ROLEID },
      {
        ACTIVO: false,
        ELIMINADO: true,
        CURRENT: false,
        "DETAIL_ROW.ACTIVO": false,
        "DETAIL_ROW.ELIMINADO": true,
        $push: {
          "DETAIL_ROW.DETAIL_ROW_REG": {
            CURRENT: true,
            REGDATE: now,
            REGTIME: now.toISOString().substring(11, 19),
            REGUSER: "admin"
          }
        }
      },
      { new: true }
    ).lean();

    if (!updated) throw boom.notFound(`No se encontró el registro con ROLEID=${ROLEID}`);

    return {
      message: "Rol marcado como eliminado (lógico)",
      updated,
    };

  } catch (error) {
    if (error.isBoom) throw error;
    throw boom.internal("Error en el borrado lógico del rol", error);
  }
}

async function UpdateRoleById(req) {
  const rolesData = req.data.roles;

  if (!rolesData) {
    throw boom.badRequest("Cuerpo inválido: se esperaba objeto 'roles'");
  }

  const { ROLEID, ROLENAME, DESCRIPTION, DETAIL_ROW, PRIVILEGES } = rolesData;

  if (!ROLEID) throw boom.badRequest('Falta parámetro ROLEID');

  // Validaciones de longitud
  if (ROLEID.length > 50)
    throw boom.badRequest('ROLEID supera 50 caracteres');
  if (ROLENAME.length > 100)
    throw boom.badRequest('ROLENAME supera 100 caracteres');
  if (DESCRIPTION.length > 200)
    throw boom.badRequest('DESCRIPTION supera 200 caracteres');

  // Validar privilegios
  if (!Array.isArray(PRIVILEGES) || PRIVILEGES.length === 0) {
    throw boom.badRequest('Debes enviar al menos un elemento en PRIVILEGES');
  }

  // Obtener el rol actual para conservar campos
  const existingRole = await ZTRoles.findOne({ ROLEID }).lean();
  if (!existingRole) throw boom.notFound(`No se encontró el rol con ROLEID=${ROLEID}`);

  // Usuario de modificación
  const UsuarioRegistro = req.user?.id || req.user?.name || 'system';

  const updated = await ZTRoles.findOneAndUpdate(
    { ROLEID },
    {
      ROLENAME,
      DESCRIPTION,
      PRIVILEGES,
      UsuarioRegistro: existingRole.UsuarioRegistro || UsuarioRegistro,
      FechaRegistro: existingRole.FechaRegistro || new Date().toISOString(),
      HoraRegistro: existingRole.HoraRegistro || new Date().toISOString(),
    },
    { new: true }
  ).lean();

  if (!updated) throw boom.notFound(`No se encontró el rol con ROLEID=${ROLEID}`);
  return updated;
}

module.exports = {
  UpdateRoleById
};

module.exports = {
  GetAllRoles,
  GetRoleById,
  addOne,
  DeleteRoleById,
  UpdateRoleById,
  deleteLogicRole
};
