// 1.- Importación de las librerías
const cds = require('@sap/cds');

// 2.- Importar el servicio
const {
    GetAllUsers,
    GetUserById,
    CreateUser,
    UpdateOneUser,
    DeactivateUser,
    DeletePhysicalUser,
    ActivateUser
} = require('../services/sec-users-service');

// 3.- Estructura principal de la clase de controller
class SecurityUsersController extends cds.ApplicationService {

    // 4.- Inicializarlo de manera asincrona
    async init() {
        // Obtener todos los usuarios
        this.on('getAllUsers', async (req) => {
            try {
                const users = await GetAllUsers(req);
                return users;
            } catch (error) {
                req.error(500, error.message);
            }
        });

        // Obtener usuario por ID
        this.on('getUserById', async (req) => {
            try {
                const user = await GetUserById(req);
                return user;
            } catch (error) {
                req.error(error.message.includes('no encontrado') ? 404 : 500, error.message);
            }
        });

        // Crear nuevo usuario
        this.on('createUser', async (req) => {
            try {
                const newUser = await CreateUser(req);
                return newUser;
            } catch (error) {
                req.error(error.message.includes('ya está en uso') ? 400 : 500, error.message);
            }
        });
        

        //Actualizar un usuario
        this.on('updateone', async (req) => {
            try {
                const result = await UpdateOneUser(req);
                return result;
            } catch (error) {
                const status = error.message.includes('No se encontró') ? 404 : 400;
                req.error(status, error.message);
            }
        });

        //Eliminar usuario (lógico)
        this.on('deleteusers', async (req) => {
            try {
                const result = await DeactivateUser(req);
                return result;
            } catch (error) {
                const status = error.message.includes('no encontrado') ? 404 : 500;
                req.error(status, error.message);
            }
        });

        this.on('activateusers', async (req) => {
            try {
                const result = await ActivateUser(req);
                return result;
            } catch (error) {
                const status = error.message.includes('no encontrado') ? 404 : 500;
                req.error(status, error.message);
            }
        });

        //Eliminar usuario (fisico)
        this.on('physicalDeleteUser', async (req) => {
            try {
                const userid = req.req.query.userid;
                if (!userid) {
                    return req.error(400, 'Se requiere el parámetro userid');
                }
        
                const result = await DeletePhysicalUser(req);
                return result;
            } catch (error) {
                console.error('Error en physicalDeleteUser:', error);
                const status = error.message.includes('no encontrado') ? 404 : 500;
                req.error(status, error.message);
            }
        });
    }
}

module.exports = SecurityUsersController;