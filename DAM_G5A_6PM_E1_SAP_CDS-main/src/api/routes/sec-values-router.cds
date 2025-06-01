// src/api/routes/sec-values-router.cds
using { sec as mysec } from '../models/security/sec-values';

@impl: 'src/api/controllers/sec-values-controller.js'

service ValuesRoute @(path:'/api/security/values') {

    entity values as projection on mysec.Values;

    // -----------------------------------------------Values-----------------------------------------------
    @Core.Description: 'Obtener todos los valores'
    @path: 'getAllValues'
    function getAllValues()            returns array of values;

    @Core.Description: 'Obtener valor por VALUEID'
    @path: 'view/:valueid'
    function getValueById(valueid: String) returns values;

    @Core.Description: 'Obtener valores por LABELID'
    @path: 'view/:labelid'
    function getLabelById(labelid: String) returns array of values;

    @Core.Description: 'Obtener valores por COMPANYID'
    @path: 'view/:companyid'
    function getCompanyById(companyid: String) returns array of values;

    @Core.Description: 'Obtener departamentos por sucursal'
    @path: 'getBranchesWithDepartments'
    function getBranchesWithDepartments(companyid: String) returns array of values;

    @Core.Description: 'Crear nuevo valor'
    @path: 'view'
    action view(value: values)         returns values;

    @Core.Description: 'Actualizar valor por VALUEID'
    @path: 'updateValue'
    action updateValue(valueid: String, value: values) returns values;

    @Core.Description: 'Desactivar valor (borrado lógico)'
    @path: 'deactivateValue'
    action deactivateValue(valueid: String, reguser: String) returns values;

    @Core.Description: 'Activar valor (revertir borrado lógico)'
    @path: 'activateValue'
    action activateValue(valueid: String, reguser: String)   returns values;

    @Core.Description: 'Eliminar valor (borrado físico)'
    @path: 'deleteview'
    action deleteview(valueid: String)    returns String;
}
