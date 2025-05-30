//sec-catalog-controller.js
const cds = require('@sap/cds');
const {
  GetAllCatalogs,
  GetCatalogByLabelId,
  GetCatalogByParams,
  AddCatalog,
  UpdateCatalog,
  DeleteLogicCatalog,
  DeletePhysicalCatalog,
} = require('../services/security-catalog-service');

class CatalogController extends cds.ApplicationService {
  async init() {
    //obtener catalogos
    this.on('getAllCatalogs', async (req) => {
      return await GetAllCatalogs(req);
    });
    //obtener catalogos por labelid
    this.on('getCatalogByLabelId', async (req) => {
      return await GetCatalogByLabelId(req);
    });
    //obtener catalogos con params
    this.on('getCatalogByParams', async (req) => {
      return await GetCatalogByParams(req);
    });
     //Añadir nuevo catalogo
    this.on('addCatalog', async req => {
      return await AddCatalog(req);
    });
     //Editar Catalogo
    this.on("updateCatalog", async (req) => {
      return await UpdateCatalog({ data: req.data.catalog });
    });
     //Delete Logico
    this.on("deleteLogicCatalog", async req => {
      return await DeleteLogicCatalog(req);
    });
     //Delete Fisico
    this.on("deletePhysicalCatalog", async req => {
      return await DeletePhysicalCatalog(req);
    });

    await super.init();
  }
}

module.exports = CatalogController;
