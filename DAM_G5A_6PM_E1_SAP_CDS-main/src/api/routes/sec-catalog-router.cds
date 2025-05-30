using { sec as mycatalogs } from '../models/security/sec-labels';

@impl: 'src/api/controllers/sec-catalog-controller.js'
service CatalogRoute @(path:'/api/security/catalog') {

  entity catalogs as projection on mycatalogs.Labels;

  @Core.Description: 'Obtener todos los catálogos'
  @path: 'getAllCatalogs'
  function getAllCatalogs() returns array of catalogs;

  @Core.Description: 'Obtener catálogo por LabelId'
  @path: 'getCatalogByLabelId'
  function getCatalogByLabelId(LabelId: String) returns catalogs;

  @Core.Description: 'Obtener catálogo por LabelId y ValueId'
  @path: 'getCatalogByParams'
  function getCatalogByParams(LabelId: String, ValueId: String) returns catalogs;

  @Core.Description: 'Agregar un nuevo catálogo'
  @path: 'addCatalog'
  action addCatalog(catalog: catalogs) returns catalogs;

  @Core.Description: 'Actualizar catálogo'
  @path: 'updateCatalog'
  action updateCatalog(catalog: catalogs) returns array of catalogs;
  
  @Core.Description: 'Borrado lógico de catálogo'
  @path: 'deleteLogicCatalog'
  action deleteLogicCatalog(LABELID: String) returns catalogs;

  @Core.Description: 'Eliminar catálogo físicamente'
  @path: 'deletePhysicalCatalog'
  action deletePhysicalCatalog(LABELID: String) returns catalogs;
}