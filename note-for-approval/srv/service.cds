
using { sap.capire.nfa as db } from '../db/schema';
//@path: '/nfa'
service NFAService 

{
  entity ProcurementOverview      as projection on db.ProcurementOverview;
  entity MaterialHistory          as projection on db.MaterialHistory;
  entity SourcingVendorEvaluation as projection on db.SourcingVendorEvaluation;
  entity CommercialSummary        as projection on db.CommercialSummary;
  entity FinalisedTermsConditions as projection on db.FinalisedTermsConditions;
  entity OrganisationOther        as projection on db.OrganisationOther;
}