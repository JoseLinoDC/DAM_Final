namespace inv;

//************************ESTREATEGIAS********************** */
entity strategies {
    key STRATEGY_ID               : String;
        USER_ID                   : String;
        TYPE                      : String;       // Ej: 'iron_condor'
        UNDERLYING                : String;       // Ej: 'SPY'
        OPENED_AT                 : DateTime;
        CLOSED_AT                 : DateTime;

        POSITIONS : {
            CALL_CREDIT_SPREAD : {
                SHORT_CALL      : Integer;
                LONG_CALL       : Integer;
            };
            PUT_CREDIT_SPREAD : {
                SHORT_PUT       : Integer;
                LONG_PUT        : Integer;
            };
        };

        PREMIUM_COLLECTED         : Decimal(10,2);

        RISK_INDICATORS_SNAPSHOT : {
            VIX                  : Decimal(5,2);
            RSI                  : Integer;
            PUT_CALL_RATIO       : Decimal(4,2);
        };

        NOTES                    : String;
};

//*************************USUARIOS ************************ */
entity Users {
  key idUser    : String(36);         //"user-001"
      name      : String(100);
      email     : String(255);
      createdAt : Timestamp;
      wallet    : Association to one Wallet;
}

entity Wallet {
  key id        : UUID;
      balance   : Decimal(15,2);
      currency  : String(3);
      movements : Composition of many Movements on movements.wallet = $self;
}

entity Movements {
  key movementId : String(36);
      wallet      : Association to Wallet;
      date        : Timestamp;
      type        : String(20);  //'deposit', 'trade', 'fee'
      amount      : Decimal(15,2);
      description : String(255);
}

//********************** SIMULACION ************************ */

entity Simulation {
  key idSimulation       : String(36);           // Ej: "AAPL_2024-01-01"
      idUser             : String(36);
      idStrategy         : String(10);           // Ej: "IRON"
      simulationName     : String(100);
      symbol             : String(10);           // Ej: "AAPL"
      startDate          : Date;
      endDate            : Date;
      amount             : Decimal(15,2);        // Siempre en USD
      specs              : String(100);          // Ej: "SHORT:50&LONG:200"
      result             : Decimal(15,2);
      percentageReturn   : Decimal(5,2);
      signals            : Composition of many Signals on signals.simulation = $self;
      detailRow          : Composition of many DetailRows on detailRow.simulation = $self;
}
entity Signals {
  key ID                 : UUID;
      simulation         : Association to Simulation;
      date               : Timestamp;
      type               : String(10);           // 'buy' | 'sell'
      price              : Decimal(10,2);
      reasoning          : String(255);
}
entity DetailRows {
  key ID                 : UUID;
      simulation         : Association to Simulation;
      ACTIVED            : Boolean;
      DELETED            : Boolean;
      detailRowReg       : Composition of many DetailRowRegs on detailRowReg.detailRow = $self;
}
entity DetailRowRegs {
  key ID                 : UUID;
      detailRow          : Association to DetailRows;
      CURRENT            : Boolean;
      REGDATE            : Timestamp;
      REGTIME            : Timestamp;
      REGUSER            : String(100);
}

//************************** PARA PRICES_HISTORY *****************8 */
entity PRICES_HISTORY {
    key CONTRACT_ID         : String;
        SYMBOL              : String;
        EXPIRATION          : Date;
        STRIKE              : Decimal(10,2);
        TYPE                : String;  // 'call' o 'put'
        LAST                : Decimal(10,2);
        MARK                : Decimal(10,2);
        BID                 : Decimal(10,2);
        BID_SIZE            : Integer;
        ASK                 : Decimal(10,2);
        ASK_SIZE            : Integer;
        VOLUME              : Integer;
        OPEN_INTEREST       : Integer;
        DATE                : Date;
        IMPLIED_VOLATILITY  : Decimal(10,5);
        DELTA               : Decimal(10,5);
        GAMMA               : Decimal(10,5);
        THETA               : Decimal(10,5);
        VEGA                : Decimal(10,5);
        RHO                 : Decimal(10,5);
}

