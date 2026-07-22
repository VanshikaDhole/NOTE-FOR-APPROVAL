
using { sap.capire.nfa as db } from '../db/schema';
service NFAService 

{
  entity ProcurementOverview        as projection on db.ProcurementOverview;
  entity MaterialHistory            as projection on db.MaterialHistory;
  entity SourcingVendorEvaluation   as projection on db.SourcingVendorEvaluation;
  entity CommercialSummary          as projection on db.CommercialSummary;
  entity FinalisedTermsConditions   as projection on db.FinalisedTermsConditions;
  entity OrganisationOther          as projection on db.OrganisationOther;
  entity EKKO_PurchaseOrder_Header  as projection on db.EKKO_PurchaseOrder_Header;
  entity EKPO_PurchaseOrder_Item    as projection on db.EKPO_PurchaseOrder_Item;
  entity attachments                as projection on db.ProcurementOverview.attachments;
}