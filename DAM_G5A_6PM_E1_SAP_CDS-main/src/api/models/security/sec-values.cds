using {sec.AuditDetail} from './common';
using {sec.Labels}      from './sec-labels';

namespace sec;

entity Values {
  key VALUEID     : String(50);
      COMPANYID   : String(50);  
      VALUE       : String(100);
      ALIAS       : String(10);
      SEQUENCE    : Integer;     
      IMAGE       : String(255);
      DESCRIPTION : String(200);
      VALUEPAID   : String(50);
      LABELID     : String(50);

      LABEL      : Association to Labels on LABEL.LABELID = LABELID;
      DETAIL_ROW : Composition of one AuditDetail;
}
