const cds = require('@sap/cds');

const {
    GetAllLabels,
    GetLabelById,
    createLabel,
    UpdateLabel,
    DeactivateLabel,
    deleteLabel,
    ActivateLabel
} = require('../services/sec-processes-service');

class LabelsController extends cds.ApplicationService {

    async init() {

        this.on('getAllLabels', async (req) => {
            try {
                return await GetAllLabels(req);
            } catch (error) {
                req.error(500, error.message);
            }
        });

        this.on('getLabelById', async (req) => {
            try {
                return await GetLabelById(req);
            } catch (error) {
                req.error(error.message.includes('no encontrada') ? 404 : 500, error.message);
            }
        });

        this.on('createLabel', async (req) => {
            try {
                return await createLabel(req);
            } catch (error) {
                req.error(error.message.includes('ya está') ? 400 : 500, error.message);
            }
        });

        this.on('updateLabel', async (req) => {
            try {
                return await UpdateLabel(req);
            } catch (error) {
                req.error(400, error.message);
            }
        });

        this.on('deactivateLabel', async (req) => {
            try {
                return await DeactivateLabel(req);
            } catch (error) {
                req.error(error.message.includes('no encontrada') ? 404 : 500, error.message);
            }
        });

        this.on('deleteLabel', async (req) => {
            try {
                return await deleteLabel(req);
            } catch (error) {
                req.error(error.message.includes('no encontrada') ? 404 : 500, error.message);
            }
        });

        this.on('ActivateLabel', async (req) => {
            try {
                return await ActivateLabel(req);
            } catch (error) {
                req.error(error.message.includes('no encontrada') ? 404 : 500, error.message);
            }
        });

        return await super.init();
    }
}

module.exports = LabelsController;
