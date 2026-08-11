
using { sap.capire.nfa as db } from '../db/schema';
service NFAService 

{
  entity NFA                        as projection on db.NFA;
  entity ProcurementOverview        as projection on db.ProcurementOverview;
  entity MaterialHistory            as projection on db.MaterialHistory;
  entity SourcingVendorEvaluation   as projection on db.SourcingVendorEvaluation;
  entity CommercialSummary          as projection on db.CommercialSummary;
  entity FinalisedTermsConditions   as projection on db.FinalisedTermsConditions;
  entity OrganisationOther          as projection on db.OrganisationOther;
  entity EKKO_PurchaseOrder_Header  as projection on db.EKKO_PurchaseOrder_Header;
  entity EKPO_PurchaseOrder_Item    as projection on db.EKPO_PurchaseOrder_Item;
  entity attachments                as projection on db.ProcurementOverview.attachments;


    action generatePDF(
    ID : UUID
) returns LargeBinary;

  action searchExistingNFA(
    nfaNumber : String
  ) returns {
    NFA                      : Association to NFA;
    ProcurementOverview      : Association to ProcurementOverview;
    MaterialHistory          : Association to MaterialHistory;
    SourcingVendorEvaluation : Association to SourcingVendorEvaluation;
    CommercialSummary        : Association to CommercialSummary;
    FinalisedTermsConditions : Association to FinalisedTermsConditions;
    OrganisationOther        : Association to OrganisationOther;
    PurchaseOrderHeader      : Association to EKKO_PurchaseOrder_Header;
    PurchaseOrderItem        : Association to EKPO_PurchaseOrder_Item;
    Attachments              : Association to many attachments;
  };

type ProcurementResponse {
    procurementName : String;
    aribaSourcingEventRef : String;
    procurementRoute : String;
    procurementStrategy : String;
    expenseCategory : String;
    procurementObjectives : String;
    procurementBackground : String;
    numberOfVendorsSelected : Integer;
    totalValueOfProcurement : Decimal(15,2);
    currency : String(10);
}


action getProcurementDetails(
    eventId : String
) returns ProcurementResponse;
type SubmitResponse {
    message : String;
    nfaID : UUID;
    procurementID : UUID;
}

type DocumentImportResponse {
    documentId   : String;
    status       : Integer;
    errorMessage : String;
}

action importDocument(
    action                      : String,
    contents                    : LargeBinary,
    documentId                  : String,
    documentName                : String,
    onBehalfUserId              : String,
    onBehalfUserPasswordAdapter : String,
    workspaceId                 : String,
    partition                   : String,
    variant                     : String
) returns DocumentImportResponse;

action submitNFA(
    data : LargeString
) returns SubmitResponse;

}
