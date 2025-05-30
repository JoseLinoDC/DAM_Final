const cds = require('@sap/cds');
const {
  GetAllRoles,
  GetRoleById,
  addOne,
  DeleteRoleById,
  UpdateRoleById,
  deleteLogicRole
} = require('../services/sec-roles-service');

class RolesClass extends cds.ApplicationService {
  async init() {
    this.on('getall',     GetAllRoles);
    this.on('getitem',    req => {
      const id = req.data.ID;
      if (!id) throw cds.error(400, 'Falta el parámetro ID');
      return GetRoleById(id);
    });
    this.on('addOne',     addOne);
    this.on('deleteItem', DeleteRoleById);
    this.on('updateItem', UpdateRoleById);
    this.on('deleteLogic', deleteLogicRole);
    return super.init();
  }
}

module.exports = RolesClass;
