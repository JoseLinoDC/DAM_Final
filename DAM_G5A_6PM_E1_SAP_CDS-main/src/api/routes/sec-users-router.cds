using { sec as mysec } from '../models/security/sec-users';

@impl: 'src/api/controllers/sec-users-controller.js'

service SecurityRoute @(path:'/api/security/users') {
    
    entity users as projection on mysec.Users;

    @Core.Description: 'Obtener todos los usuarios'
    @path: 'users'
    function getAllUsers()
    returns array of users;

    @Core.Description: 'Obtener usuario por ID'
    @path: 'users/:userid'
    function getUserById(userid: String)
    returns users;

    @Core.Description: 'Crear nuevo usuario'
    @path: 'createuser'
    action createUser(user: users)
    returns users;

    @Core.Description: 'update-one-user'
    @path : 'updateone'
    action updateone(
        @Core.Description: 'Datos del usuario a actualizar' user: users
    ) returns users;

    @Core.Description: 'Desactivar usuario (borrado lógico)'
    @path: 'deleteusers'
    action deleteusers(
        @Core.Description: 'ID del usuario a desactivar' USERID: String
    ) returns users;

    @Core.Description: 'Eliminar usuario físicamente de la base de datos'
    @path: 'physicalDeleteUser'
    action physicalDeleteUser(
        @Core.Description: 'ID del usuario a eliminar' userid: String
    ) returns String;

    @Core.Description: 'Activar usuario (borrado lógico)'
    @path: 'activateusers'
    action activateusers(
        @Core.Description: 'ID del usuario a desactivar' USERID: String
    ) returns users;

}