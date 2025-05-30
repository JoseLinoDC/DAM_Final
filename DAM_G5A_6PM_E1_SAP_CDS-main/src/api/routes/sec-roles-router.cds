using { sec as myrol } from '../models/security/sec-roles';

@impl: 'src/api/controllers/sec-roles-controller.js'
service RolesRouter @(path : '/api/security/rol') {
  @readonly: false
  entity roles as projection on myrol.Roles;

  @Core.Description: 'GET all roles'
  @path: 'getall'
  function getall() returns array of roles;

  @Core.Description: 'GET role by ID'
  @path: 'getitem'
  function getitem(ID: String) returns roles;

  @Core.Description: 'AddOne role item'
  @path: 'addOne'
  action addOne(roles: roles) returns roles;

  @Core.Description: 'DELETE role by ID'
  @path: 'deleteItem'
  action deleteItem(ROLEID: String) returns roles;

  @Core.Description: 'UPDATE role by ID'
  @path: 'updateItem'
  action updateItem(roles: roles) returns roles;

  @Core.Description: 'DELETE logic (soft delete) by ROLEID'
  @path: 'deleteLogic'
  action deleteLogic(ROLEID: String) returns roles;
}
