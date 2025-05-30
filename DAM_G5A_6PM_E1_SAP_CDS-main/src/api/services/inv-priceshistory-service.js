const ztpriceshistory = require('../models/mongodb/ztpriceshistory');

async function GetAllPricesHistory(req) {
    try {
        const IdPrice = parseInt(req.req.query?.IdPrice);
        const IniVolume = parseFloat(req.req.query?.IniVolume);
        const EndVolume = parseFloat(req.req.query?.EndVolume);
        let pricesHistory;

        if (IdPrice >= 0) {

            pricesHistory = await ztpriceshistory.findOne({ ID: IdPrice }).lean();

        } else if (IniVolume >= 0 && EndVolume >= 0) {

            pricesHistory = await ztpriceshistory.find({
                VOLUME: { $gte: IniVolume, $lte: EndVolume }
            }).lean();

        } else {

            pricesHistory = await ztpriceshistory.find().lean();

        }

        return (pricesHistory);

    } catch (error) {
        return error;
    } finally {

    }
};

async function AddOnePriceHistory(req) {
    try {
        const newPrice = req.req.body.prices;
        let pricesHistory;

        pricesHistory = await ztpriceshistory.insertMany(newPrice, { order: true });

        return (JSON.parse(JSON.stringify(pricesHistory)));

    } catch (error) {
        return error;
    } finally {

    }
};

async function UpdateOnePriceHistory(req) {
    try {
        const updatedPrice = req.req.body.prices;
        const IdPrice = parseInt(req.req.query.IdPrice);

        if (!IdPrice) {
            throw new Error("El campo 'ID' es obligatorio para actualizar un registro.");
        }

        let pricesHistory = await ztpriceshistory.findOneAndUpdate(
            { ID: IdPrice },
            updatedPrice,
            { new: true, upsert: false }
        );

        if (!pricesHistory) { throw new Error(`No se encontró un registro con ID: ${IdPrice}`); }

        return {
            message: `Registro actualizado correctamente.`,
            pricesHistory: JSON.parse(JSON.stringify(pricesHistory))
        };
    } catch (error) {
        return error;
    }
}

async function DeleteOnePriceHistory(req) {
    try {
        const IdPrice = parseInt(req.req.query.IdPrice);

        if (!IdPrice) { throw new Error("El campo 'IdPrice' es obligatorio para eliminar un registro."); }

        const pricesHistory = await ztpriceshistory.findOneAndDelete({ ID: IdPrice });

        if (pricesHistory.deletedCount === 0) { throw new Error(`No se encontró un registro con ID: ${IdPrice}`); }

        return {
            message: `Registro eliminado correctamente.`,
            pricesHistory: JSON.parse(JSON.stringify(pricesHistory))
        };


    } catch (error) {
        return { error: error.message };
    }
}

module.exports = {
    GetAllPricesHistory,
    AddOnePriceHistory,
    UpdateOnePriceHistory,
    DeleteOnePriceHistory
};