using { sec.AuditDetail } from './common';

namespace sec;

entity Roles {
  key ROLEID          : String(50);
      ROLENAME        : String(100);
      DESCRIPTION     : String(200);
      ACTIVO          : Boolean default true;
      ELIMINADO       : Boolean default false;
      CURRENT         : Boolean default true;
      FechaRegistro   : Date    @cds.default: $now;
      HoraRegistro    : Time    @cds.default: $now;
      UsuarioRegistro : String(100);
      DETAIL_ROW      : Composition of one AuditDetail;

      // Sin 'on' — CDS lo infiere por la FK en RolePrivileges
      PRIVILEGES      : Composition of many RolePrivileges;
}

entity RolePrivileges {
  key ROLEID      : Association to Roles;
  key PROCESSID   : String(50);
  key PRIVILEGEID : String(50);
}

entity UserRoles {
  key USERID : String(20);
  key ROLEID : Association to Roles;
}
