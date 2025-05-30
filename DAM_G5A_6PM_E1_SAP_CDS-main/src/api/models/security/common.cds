namespace sec;

entity AuditDetail {
    ACTIVED : Boolean default true;
    DELETED : Boolean default false;
    DETAIL_ROW_REG : Composition of many AuditDetailReg;
}

entity AuditDetailReg {
    CURRENT  : Boolean;
    REGDATE  : Timestamp;
    REGTIME  : Timestamp;
    REGUSER  : String(20);
}