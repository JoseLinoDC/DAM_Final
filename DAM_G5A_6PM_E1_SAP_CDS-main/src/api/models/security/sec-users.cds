using {sec.UserRoles} from './sec-roles';
using {sec.AuditDetail} from './common';

namespace sec;

entity Users {
    key USERID       : String(20);
        PASSWORD     : String(100) default '';
        USERNAME     : String(100);
        ALIAS        : String(20);
        FIRSTNAME    : String(50);
        LASTNAME     : String(50);
        BIRTHDAYDATE : String(10);
        AVATAR       : String(255) default '';
        COMPANYID    : String(30);
        COMPANYNAME  : String(100);
        COMPANYALIAS : String(10);
        CEDIID       : String(20);
        EMPLOYEEID   : String(20);
        EMAIL        : String(100);
        PHONENUMBER  : String(20);
        EXTENSION    : String(10) default '';
        DEPARTMENT   : String(100);
        FUNCTION     : String(100);
        STREET       : String(200);
        POSTALCODE   : Integer;
        CITY         : String(50);
        REGION       : String(50) default '';
        STATE        : String(50);
        COUNTRY      : String(50);

        ROLES        : Association to many UserRoles
                           on ROLES.USERID = USERID;
        DETAIL_ROW   : Composition of one AuditDetail;
}

// Definir vista de usuarios con roles expandidos
entity UsersWithRoles as select from Users {
    *,
    ROLES
};