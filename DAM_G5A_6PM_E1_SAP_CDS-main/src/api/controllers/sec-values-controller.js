// src/api/controllers/sec-values-controller.js
const cds = require('@sap/cds');
const {
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
} = require('../services/sec-values-service');

class SecurityValuesController extends cds.ApplicationService {
  async init() {
    this.on('getAllValues',    req => GetAllValues(req));
    
    this.on('getValueById',    req => GetValueById(req));
    
    this.on('getLabelById',    req => GetLabelById(req));
    
    this.on('getCompanyById',  req => GetCompanyById(req));

    this.on('getBranchesWithDepartments', req => GetBranchesWithDepartments(req));

    this.on('view',            req => view(req));
    
    this.on('updateValue',     req => UpdateValue(req));

    this.on('deactivateValue', async (req) => {
      try { return await DeactivateValue(req); }
      catch(e){ req.error(e.message.includes('no encontrado')?404:500, e.message); }
    });

    this.on('activateValue', async (req) => {
      try { return await ActivateValue(req); }
      catch(e){ req.error(e.message.includes('no encontrado')?404:500, e.message); }
    });

    this.on('deleteview', async (req) => {
      try { return await deleteview(req); }
      catch(e){ req.error(e.message.includes('no encontrado')?404:500, e.message); }
    });

    return super.init();
  }
}

module.exports = SecurityValuesController;
