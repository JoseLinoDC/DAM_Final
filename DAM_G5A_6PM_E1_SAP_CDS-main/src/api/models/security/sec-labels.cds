using {sec.AuditDetail} from './common';

namespace sec;

entity Labels {
    key LABELID     : String(50);
        LABEL       : String(100);
        INDEX       : String(100);
        COLLECTION  : String(100);
        SECTION     : String(50);
        SEQUENCE    : Integer;
        IMAGE       : String(255);
        DESCRIPTION : String(200);
        
        DETAIL_ROW  : Composition of one AuditDetail;
}