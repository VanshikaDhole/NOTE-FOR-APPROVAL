using { cuid, managed } from '@sap/cds/common';
using { Attachments } from '@cap-js/attachments';

namespace sap.capire.nfa;
entity NFA : cuid, managed {
    nfaNumber        : String(30);
    title            : String(255);
    status           : String(30);
    procurement      : Composition of one ProcurementOverview
                        on procurement.nfa = $self;
    materialHistory  : Composition of one MaterialHistory
                        on materialHistory.nfa = $self;
    vendorEvaluation : Composition of one SourcingVendorEvaluation
                        on vendorEvaluation.nfa = $self;
    commercialSummary : Composition of one CommercialSummary
                        on commercialSummary.nfa = $self;
    finalisedTerms   : Composition of one FinalisedTermsConditions
                        on finalisedTerms.nfa = $self;
    organisation     : Composition of one OrganisationOther
                        on organisation.nfa = $self;
    poHeader         : Composition of one EKKO_PurchaseOrder_Header
                        on poHeader.nfa = $self;
    poItem           : Composition of one EKPO_PurchaseOrder_Item
                        on poItem.nfa = $self;
}

entity ProcurementOverview : cuid, managed {

    nfa                         : Association to NFA;
    procurementName             : String(255);
    aribaSourcingEventRef       : String(100);
    procurementObjectives       : LargeString;
    procurementBackground       : LargeString;
    procurementRoute            : String(40);
    procurementStrategy         : String(100);
    expenseCategory             : String(100);
    attachments                 : Composition of many Attachments;
}

entity MaterialHistory : cuid, managed {

    nfa                         : Association to NFA;
    materialCode                : String(40);
    materialDescription         : String(255);
    quantityProcured            : Decimal(15,3);
    awardedUnitPrice            : Decimal(15,2);
    lastPONumber                : String(20);
    lastPODate                  : Date;
    lastPOVendor                : String(255);
    lastPOValue                 : Decimal(15,2);
    lastPOUnitPrice             : Decimal(15,2);
    variancePercentVsLastPO     : Decimal(6,2);
    last6MonthsPurchaseQty      : Decimal(15,3);
    last6MonthsPurchaseValue    : Decimal(15,2);
    avgUnitPrice6Months         : Decimal(15,2);
    variancePercentVsAvg6Months : Decimal(6,2);
    consumption6Months          : Decimal(15,3);
    consumption12Months         : Decimal(15,3);
    avgMonthlyConsumptionRate   : Decimal(15,3);
    currentStock                : Decimal(15,3);
    stockCoverMonths            : Decimal(6,2);
    priceJustification          : LargeString;
}

entity SourcingVendorEvaluation : cuid, managed {

    nfa                         : Association to NFA;
    vendorsInvited              : Integer;
    vendorsResponded            : Integer;
    vendorsShortlisted          : LargeString;
    evaluationSummary           : String(255);
    numberOfVendorsSelected     : String(20);
    selectedVendorName          : String(255);
    selectedVendorCode          : String(40);
    awardJustification          : LargeString;
}

entity CommercialSummary : cuid, managed {

    nfa                         : Association to NFA;
    recommendations             : LargeString;
    totalValueOfProcurement     : Decimal(17,2);
    currency                    : String(3);
    securedSavings              : String(60);
    costIncrease                : String(60);
}
entity FinalisedTermsConditions : cuid, managed {

    nfa                         : Association to NFA;
    paymentTerms                : String(100);
    milestone                   : LargeString;
    performanceBond             : LargeString;
    warranty                    : LargeString;
    termsOfDelivery             : LargeString;
    incoterms                   : String(10);
    liquidatedDamages           : LargeString;
    applicableTaxes             : LargeString;
}
entity OrganisationOther : cuid, managed {

    nfa                         : Association to NFA;
    purchasingGroup             : String(20);
    companyCode                 : String(100);
    otherConditions             : LargeString;
    supportingDocuments         : LargeString;
}

entity EKKO_PurchaseOrder_Header : cuid, managed {

    nfa                 : Association to NFA;
    client              : String(3);
    purchasingDocument  : String(10);
    companyCode         : String(4);
    documentCategory    : String(1);
    documentType        : String(4);
    control             : String(1);
    deletionIndicator   : String(1);
    status              : String(2);
    itemInterval        : String(5);
    lastItem            : String(5);
    supplier            : String(10);
    language            : String(1);
    paymentTerms        : String(4);
    paymentInDays1      : Integer;
    paymentInDays2      : Integer;
    paymentInDays3      : Integer;
}
entity EKPO_PurchaseOrder_Item : cuid, managed {

    nfa                    : Association to NFA;
    client                 : String(3);
    purchasingDocument     : String(10);
    item                   : String(5);
    documentItem           : String(32);
    deletionIndicator      : String(1);
    origin                 : String(1);
    shortText              : String(40);
    material               : String(40);
    externalMaterial       : String(40);
    companyCode            : String(4);
    plant                  : String(4);
    storageLocation        : String(4);
    trackingNumber         : String(10);
    materialGroup          : String(9);
    infoRecord             : String(10);
    supplierMaterialNumber : String(35);
    targetQuantity         : Decimal(13,3);
    purchaseOrderQuantity  : Decimal(13,3);
    orderUnit              : String(3);
}