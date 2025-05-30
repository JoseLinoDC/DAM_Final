//************* SERVICIO PARA MONGO DB */
const usersSchema = require('../models/MongoDB/users');

async function GetAllUsers(req) {
  try {
    let users = await usersSchema.find().lean(); 
    return users;
  } catch (error) {
    return error;
  }
}

async function GetUserById(req) {
  try {
    // Obtener el USER_ID desde el cuerpo de la solicitud (req.data)
    const { USER_ID } = req.data; // Asumiendo que el body es { "USER_ID": "user-001" }

    if (!USER_ID) {
      throw new Error("El ID de usuario no fue proporcionado.");
    }

    // Buscar el usuario por su ID en la base de datos
    const user = await usersSchema.findOne({ idUser: USER_ID }).lean();

    // Si no se encuentra el usuario, lanzar un error
    if (!user) {
      throw new Error(`No se encontró un usuario con el ID ${USER_ID}`);
    }

    // Retornar el usuario encontrado
    return user;

  } catch (error) {
    // Manejo de errores
    throw new Error(`Error al obtener el usuario por ID: ${error.message}`);
  }
}

//-----POST Users-----
//Funcion del siguiente usuario
async function getNextIdUser() {
  const last = await usersSchema
    .findOne({ idUser: /^user-/ })
    .sort({ idUser: -1 })
    .lean();
  let num = 1;
  if (last && last.idUser) {
    const m = last.idUser.match(/user-(\d+)$/);
    if (m) num = parseInt(m[1], 10) + 1;
  }
  return `user-${String(num).padStart(3, '0')}`;
}
//Funcion Post para crear un nuevo usuario
async function CreateUser(req) {
  const { name, email } = req.data;
  if (!name || !email) {
    const err = new Error('Faltan campos obligatorios: name y/o email');
    err.status = 400;
    throw err;
  }

  const idUser    = await getNextIdUser();
  const createdAt = new Date();
  const wallet    = { balance: 0, currency: 'USD', movements: [] };

  const userDoc = { idUser, name, email, createdAt, wallet };
  const user    = new usersSchema(userDoc);

  try {
    await user.save();
    return user.toObject();
  } catch (err) {
    if (err.code === 11000) {
      const dup = err.message.includes('email') ? 'email' : 'idUser';
      const e2 = new Error(`Ya existe un usuario con ese ${dup}`);
      e2.status = 409;
      throw e2;
    }
    throw err;
  }
}

module.exports = { GetAllUsers, GetUserById, CreateUser };