using{cuid, managed} from '@sap/cds/common';

namespace sap.capire.nfa;

entity ProcurementOverview : cuid, managed {
    procurementName              : String(255);  
    aribaSourcingEventRef        : String(100);  
    procurementObjectives        : LargeString;  
    procurementBackground        : LargeString;  
    procurementRoute             : String(40);    
    procurementStrategy          : String(100);  
    expenseCategory              : String(100);  
}
 
entity MaterialHistory : cuid, managed {
    materialCode                  : String(40);  
    materialDescription           : String(255);  
    quantityProcured              : Decimal(15,3);
    awardedUnitPrice              : Decimal(15,2);
    lastPONumber                  : String(20);    
    lastPODate                    : Date;          
    lastPOVendor                  : String(255);  
    lastPOValue                   : Decimal(15,2);
    lastPOUnitPrice               : Decimal(15,2);
    variancePercentVsLastPO       : Decimal(6,2);  
    last6MonthsPurchaseQty        : Decimal(15,3);
    last6MonthsPurchaseValue      : Decimal(15,2);
    avgUnitPrice6Months           : Decimal(15,2);
    variancePercentVsAvg6Months   : Decimal(6,2);  
    consumption6Months            : Decimal(15,3);
    consumption12Months           : Decimal(15,3);
    avgMonthlyConsumptionRate     : Decimal(15,3);
    currentStock                  : Decimal(15,3);
    stockCoverMonths              : Decimal(6,2);  
    priceJustification            : LargeString;  
}
 
entity SourcingVendorEvaluation : cuid, managed {
    vendorsInvited                 : Integer;      
    vendorsResponded               : Integer;      
    vendorsShortlisted             : LargeString;  
    evaluationSummary              : String(255);  
    numberOfVendorsSelected        : String(20);  
    selectedVendorName             : String(255);  
    selectedVendorCode             : String(40);  
    awardJustification             : LargeString;  
}
 
entity CommercialSummary : cuid, managed {
    recommendations                : LargeString;  
    totalValueOfProcurement        : Decimal(17,2);
    currency                       : String(3);    
    securedSavings                 : String(60);  
    costIncrease                   : String(60);    
}
 
entity FinalisedTermsConditions : cuid, managed {
    paymentTerms                   : String(100);  
    milestone                      : LargeString;
    performanceBond                : LargeString;
    warranty                       : LargeString;
    termsOfDelivery                : LargeString;
    incoterms                      : String(10);  
    liquidatedDamages              : LargeString;
    applicableTaxes                : LargeString;
}
 
entity OrganisationOther : cuid, managed {
    purchasingGroup                : String(20);  
    companyCode                    : String(100);
    otherConditions                : LargeString;  
    supportingDocuments            : LargeString;  
}