namespace inv;

entity priceshistory{
    key ID      : Integer;
        DATE    : DateTime;
        OPEN    : Decimal;
        HIGH    : Decimal;
        LOW     : Decimal;
        CLOSE   : Decimal;
        VOLUME  : Decimal;
}


entity strategies{
    key ID          : Integer;
        NAME        : String;
        DESCRIPTION : String;
        TIME        : Time;
        RISK        : Double;
}

