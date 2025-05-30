namespace inv;

entity PriceHistory {
    key symbol    : String;
        name      : String;
        assetType : String;
        interval  : String;
        timezone  : String;

        data      : array of {
            DATE   : DateTime;
            OPEN   : Decimal(15, 4);
            HIGH   : Decimal(15, 4);
            LOW    : Decimal(15, 4);
            CLOSE  : Decimal(15, 4);
            VOLUME : Integer;
        };
}


entity strategy {
    key ID          : String;
        NAME        : String;
        DESCRIPTION : String;

        INDICATORS  : array of {
            ID          : String;
            NAME        : String;
            DESCRIPTION : String;
        };

        DETAILSROW  : array of {
            ACTIVED        : Boolean default true;
            DELETED        : Boolean default false;
            DETAIL_ROW_REG : array of {
                CURRENT : Boolean;
                REGDATE : DateTime;
                REGTIME : DateTime;
                REGUSER : String;
            };
        };
};

type Decimal9_2 : Decimal(9, 2);

/* Subentidad: Signals
entity Signal {
    parent    : Association to Simulations;
    date      : DateTime;
    type      : String;
    price     : Decimal9_2;
    reasoning : String;
}

// Subentidad: auditoria
entity userdetailrow {
    ACTIVED        : Boolean;
    DELETED        : Boolean;
    DETAIL_ROW_REG : Composition of many userrowreg;
}

entity userrowreg {
    CURRENT : Boolean;
    REGDATE : DateTime;
    REGTIME : DateTime;
    REGUSER : String;
    parent  : Association to userdetailrow;
}

// Entidad principal: Simulación
entity Simulations {
    key idSimulation     : String;
        idUser           : String;
        idStrategy       : String;
        simulationName   : String;
        symbol           : String;
        startDate        : DateTime;
        endDate          : DateTime;
        amount           : Decimal9_2;
        specs            : String;
        signals          : Composition of many Signal;
        result           : Decimal9_2;
        percentageReturn : Decimal9_2;
        DETAIL_ROW       : Composition of one userdetailrow;
}*/

entity indicatores {
    key _id       : UUID;
        symbol    : String;
        name      : String;
        strategy  : String;
        assetType : String;
        interval  : String;
        timezone  : String;
        data      : LargeString;
}


entity symbols {
    key symbol    : String;
        name      : String;
        exchange  : String;
        assetType : String;
};


//Nuevo esquema de simulacion
// ENTIDADES
entity SIMULATION {
    key SIMULATIONID   : String;
        USERID         : String;
        STRATEGYID     : String;
        SIMULATIONNAME : String;
        SYMBOL         : String;
        STARTDATE      : Date;
        ENDDATE        : Date;
        AMOUNT         : Decimal(10, 2);
        SPECS          : array of INDICATOR;
        SIGNALS        : array of SIGNAL;
        SUMMARY        : SUMMARY; // OBJETO DE RESUMEN
        CHART_DATA     : array of CHARTDATA; // DATOS PARA EL GRÁFICO
        DETAIL_ROW     : array of DETAILROW; // DETALLES DE REGISTRO
}

// TIPO PARA LAS SEÑALES DE COMPRA/VENTA
type SIGNAL {
    DATE      : Date; // FORMATO "YYYY-MM-DD"
    TYPE      : String;
    PRICE     : Decimal(10, 2);
    REASONING : String;
    SHARES    : Decimal(18, 15); // ALTA PRECISIÓN
}

// TIPO PARA EL OBJETO DE RESUMEN
type SUMMARY {
    TOTAL_BOUGHT_UNITS : Decimal(18, 4);
    TOTAL_SOLD_UNITS   : Decimal(18, 4);
    REMAINING_UNITS    : Decimal(18, 4);
    FINAL_CASH         : Decimal(10, 2);
    FINAL_VALUE        : Decimal(10, 2);
    FINAL_BALANCE      : Decimal(10, 2);
    REAL_PROFIT        : Decimal(10, 2);
    PERCENTAGE_RETURN  : Decimal(18, 15); // ALTA PRECISIÓN
}

// TIPO PARA LOS DATOS DEL GRÁFICO
type CHARTDATA {
    DATE       : DateTime; // FORMATO ISO 8601
    OPEN       : Decimal(10, 2);
    HIGH       : Decimal(10, 2);
    LOW        : Decimal(10, 2);
    CLOSE      : Decimal(10, 2);
    VOLUME     : Integer;
    INDICATORS : array of INDICATOR; // ARRAY DE INDICADORES
}

// TIPO PARA LOS INDICADORES DENTRO DE CHARTDATA
type INDICATOR {
    INDICATOR : String;
    VALUE     : Decimal(18, 15); // ALTA PRECISIÓN
}

// TIPO PARA EL DETALLE DE LA FILA (DETAIL_ROW)
type DETAILROW {
    ACTIVED        : Boolean;
    DELETED        : Boolean;
    DETAIL_ROW_REG : array of DETAILROWREG;
}

// TIPO PARA LOS REGISTROS DENTRO DE DETAIL_ROW_REG
type DETAILROWREG {
    CURRENT : Boolean;
    REGDATE : DateTime;
    REGTIME : String; // "HH:MM:SS"
    REGUSER : String;
}
