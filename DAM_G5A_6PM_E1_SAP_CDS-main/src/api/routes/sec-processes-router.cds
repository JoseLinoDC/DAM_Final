using { sec as mysec } from '../models/security/sec-labels';

@impl: 'src/api/controllers/sec-processes-controller.js'

service LabelsRoute @(path:'/api/security/label') {

    entity labels as projection on mysec.Labels;

    // -----------------------------------------------Labels-----------------------------------------------
    @Core.Description: 'Obtener todas las etiquetas'
    @path: 'getAllLabels'
    function getAllLabels()
    returns array of labels;

    @Core.Description: 'Obtener etiqueta por LABELID'
    @path: 'getLabelById/:labelid'
    function getLabelById(labelid: String)
    returns labels;

    @Core.Description: 'Crear nueva etiqueta'
    @path: 'createLabel'
    action createLabel(label: labels)
    returns labels;

    @Core.Description: 'Actualizar etiqueta'
    @path: 'updateLabel'
    action updateLabel(labelid: String, label: labels)
    returns labels;


    @Core.Description: 'Desactivar etiqueta (borrado lógico)'
    @path: 'deactivateLabel'
    action deactivateLabel(labelid: String)
    returns labels;

    @Core.Description: 'Activar etiqueta (borrado lógico)'
    @path: 'ActivateLabel'
    action ActivateLabel(labelid: String)
    returns labels;

    @Core.Description: 'Eliminar etiqueta (borrado físico)'
    @path: 'deleteLabel'
    action deleteLabel(labelid: String)
    returns String;


}
