const ZTLabels = require('../models/mongodb/security/ztlabels');

// Obtener todas las etiquetas
async function GetAllLabels(req) {
    try {
        const { labelid, active, section } = req.req.query;
        const filter = {};

        if (labelid) filter.LABELID = labelid;
        if (active !== undefined) filter['DETAIL_ROW.ACTIVED'] = active === 'true';
        if (section) filter.SECTION = section;

        // console.log("Filtro aplicado:", filter);

        const result = await ZTLabels.find(filter)
            .select('-DETAIL_ROW.DETAIL_ROW_REG')
            .lean();

        // console.log("Número de resultados:", result.length);

        return result;
    } catch (error) {
        throw new Error(`Error al obtener etiquetas: ${error.message}`);
    }
}


// Obtener una etiqueta por ID
async function GetLabelById(req) {
  try {
    const labelid = req.data?.labelid || req.req.query.labelid;

    const label = await ZTLabels.findOne({
      LABELID: labelid,
      'DETAIL_ROW.DELETED': false
    }).lean();

    if (!label) throw new Error('Etiqueta no encontrada');
    return label;
  } catch (error) {
    throw new Error(`Error al buscar etiqueta: ${error.message}`);
  }
}


// Crear una nueva etiqueta
async function createLabel(req) {
    try {
        const newLabel = req.req.body.label;

        if (!newLabel || !newLabel.LABELID || !newLabel.LABEL) {
            throw new Error('Datos de etiqueta incompletos');
        }

        const exists = await ZTLabels.findOne({ LABELID: newLabel.LABELID });
        if (exists) {
            throw new Error('El LABELID ya está registrado');
        }

        const auditEntry = {
            CURRENT: true,
            REGDATE: new Date(),
            REGTIME: new Date(),
            REGUSER: newLabel.LABELID || 'system'
        };

        const labelToCreate = {
            ...newLabel,
            DETAIL_ROW: {
                ACTIVED: true,
                DELETED: false,
                DETAIL_ROW_REG: [auditEntry]
            }
        };

        const result = await ZTLabels.insertMany([labelToCreate], { ordered: true });
        return JSON.parse(JSON.stringify(result));
    } catch (error) {
        if (error.code === 11000) {
            error.message = 'El LABELID ya existe';
        }
        throw error;
    }
}


// Actualizar una etiqueta existente
async function UpdateLabel(req) {
    const { labelid, label } = req.data;

    if (!labelid) {
        throw new Error('Parámetro "labelid" es requerido');
    }

    const existing = await ZTLabels.findOne({ LABELID: labelid });
    if (!existing) {
        throw new Error(`La etiqueta con ID "${labelid}" no existe. No se puede actualizar.`);
    }

    await ZTLabels.updateOne({ LABELID: labelid }, { $set: label });
    return await ZTLabels.findOne({ LABELID: labelid }).lean();
}

// Desactivar una etiqueta
async function DeactivateLabel(req) {
  try {
    const labelid = req.data.labelid || req.req.params.labelid || req.req.query.labelid;
    const reguser = req.req.body?.REGUSER || 'system';

    const auditEntry = {
      CURRENT: true,
      REGDATE: new Date(),
      REGTIME: new Date(),
      REGUSER: reguser
    };

    const updatedLabel = await ZTLabels.findOneAndUpdate(
      { LABELID: labelid },
      {
        $set: { 'DETAIL_ROW.ACTIVED': false },
        $push: { 'DETAIL_ROW.DETAIL_ROW_REG': auditEntry }
      },
      { new: true }
    ).lean();

    if (!updatedLabel) {
      throw new Error('Etiqueta no encontrada');
    }

    return updatedLabel;
  } catch (error) {
    throw new Error(`Error al desactivar etiqueta: ${error.message}`);
  }
}

async function ActivateLabel(req) {
  try {
    const labelid = req.data.labelid || req.req.params.labelid || req.req.query.labelid;
    const reguser = req.req.body?.REGUSER || 'system';

    const auditEntry = {
      CURRENT: true,
      REGDATE: new Date(),
      REGTIME: new Date(),
      REGUSER: reguser
    };

    const updatedLabel = await ZTLabels.findOneAndUpdate(
      { LABELID: labelid },
      {
        $set: { 'DETAIL_ROW.ACTIVED': true },
        $push: { 'DETAIL_ROW.DETAIL_ROW_REG': auditEntry }
      },
      { new: true }
    ).lean();

    if (!updatedLabel) {
      throw new Error('Etiqueta no encontrada');
    }

    return updatedLabel;
  } catch (error) {
    throw new Error(`Error al activar etiqueta: ${error.message}`);
  }
}



// Eliminar una etiqueta (eliminación permanente)
async function deleteLabel(req) {
    try {
        const labelid = req.req.params.labelid || req.req.query.labelid || req.data.labelid;
        const deletedLabel = await ZTLabels.findOneAndDelete({ LABELID: labelid });

        if (!deletedLabel) {
            throw new Error('Etiqueta no encontrada');
        }

        return { message: 'Etiqueta eliminada permanentemente' };
    } catch (error) {
        throw new Error(`Error al eliminar etiqueta: ${error.message}`);
    }
}


module.exports = {
    GetAllLabels,
    GetLabelById,
    createLabel,
    UpdateLabel,
    DeactivateLabel,
    deleteLabel,
    ActivateLabel
};
