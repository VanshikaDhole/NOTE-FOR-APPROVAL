
const cds = require("@sap/cds");
const { generatePDF } = require("./pdfService");
const { sendTestMail } = require("./emailService");

//console.log(ariba_doc);

const {
    getProcurementDetails,
    getSupplierInvitations,
    getBidSummary,
    getAwards,
    getItems
} = require("./integration/ariba");

module.exports = cds.service.impl(async function () {
    const ariba_doc = await cds.connect.to("Ariba");
    console.log(ariba_doc);
    const {
        NFA,
        ProcurementOverview,
        MaterialHistory,
        SourcingVendorEvaluation,
        CommercialSummary,
        FinalisedTermsConditions,
        OrganisationOther,
        EKKO_PurchaseOrder_Header,
        EKPO_PurchaseOrder_Item,
        attachments
    } = this.entities;

this.on("getProcurementDetails", async (req) => {
    try {
        const { eventId } = req.data;
        // Fetch Procurement Details
        const procurementDetails = await getProcurementDetails(eventId);
        // Fetch Supplier Invitations
        const supplierDetails = await getSupplierInvitations(eventId);
        // Fetch Bid Summary
        const bidSummary = await getBidSummary(eventId);
let awards = { numberOfVendorsSelected: 0 };
let items = { totalValueOfProcurement: 0, currency: "" };
try {
    awards = await getAwards(eventId);
    console.log("Awards Response:", awards);
} catch (e) {
    console.error("Awards Failed:", e.message);
}
try {
    items = await getItems(eventId);
    console.log("Items Response:", items);
} catch (e) {
    console.error("Items Failed:", e.message);
}
        // Return combined response
        console.log("Procurement:", procurementDetails);
        console.log("Supplier:", supplierDetails);
        console.log("Bid Summary:", bidSummary);
        return {
            procurementName: procurementDetails.procurementName,
            aribaSourcingEventRef: procurementDetails.aribaSourcingEventRef,
            procurementRoute: procurementDetails.procurementRoute,
            procurementStrategy: procurementDetails.procurementStrategy,
            expenseCategory: procurementDetails.expenseCategory,
            procurementObjectives: procurementDetails.procurementObjectives,
            procurementBackground: procurementDetails.procurementBackground,
            noOfVendorsInvited: supplierDetails.noOfVendorsInvited,
            vendorsResponded: bidSummary.vendorsResponded,
            numberOfVendorsSelected:awards.numberOfVendorsSelected,
            totalValueOfProcurement:items.totalValueOfProcurement,
            currency:items.currency
            
        };

    } catch (error) {
      console.error("Error fetching procurement details:", error);
        req.reject(500, error.message);
    }
});

this.on("submitNFA", async (req) => {

    const tx = cds.transaction(req);

    try {

        const data = JSON.parse(req.data.data);
        // Generate NFA Number
        const nfaNumber = `NFA-${Date.now()}`;
        // Create NFA
        const nfaID = cds.utils.uuid();

        await tx.run(
            INSERT.into(NFA).entries({
                ID: nfaID,
                nfaNumber: `NFA-${Date.now()}`,
                title: data.procurement.procurementName,
                status: "Submitted"
            })
        );
        const savedNFA = await tx.run(
        SELECT.one.from(NFA).where({ ID: nfaID })
        );

        console.log("Saved NFA:", savedNFA);

        // Procurement Overview
        const procurementID = cds.utils.uuid();
        await tx.run(
            INSERT.into(ProcurementOverview).entries({
                ID: procurementID,
                nfa_ID: nfaID,
                ...data.procurement
            })
        );
        // Material History
        await tx.run(
            INSERT.into(MaterialHistory).entries({
                nfa_ID: nfaID,
                ...data.materialHistory
            })
        );
        // Vendor Evaluation
        await tx.run(
            INSERT.into(SourcingVendorEvaluation).entries({
                nfa_ID: nfaID,
                ...data.sourcingVendorEvaluation
            })
        );
        // Commercial Summary
        await tx.run(
            INSERT.into(CommercialSummary).entries({
                nfa_ID: nfaID,
                ...data.commercialSummary
            })
        );

        // Finalised Terms
        await tx.run(
            INSERT.into(FinalisedTermsConditions).entries({
                nfa_ID: nfaID,
                ...data.finalisedTermsConditions
            })
        );
        // Organisation
        await tx.run(
            INSERT.into(OrganisationOther).entries({
                nfa_ID: nfaID,
                ...data.organisationOther
            })
        );
        // PO Header
        await tx.run(
            INSERT.into(EKKO_PurchaseOrder_Header).entries({
                nfa_ID: nfaID,
                ...data.purchaseOrderHeader
            })
        );
        // PO Item
        await tx.run(
            INSERT.into(EKPO_PurchaseOrder_Item).entries({
                nfa_ID: nfaID,
                ...data.purchaseOrderItem
            })
        );
        await tx.commit();
        // Send Test Email
        //await sendTestMail();
            const response = {
                message: "NFA Submitted Successfully",
                nfaID: nfaID,
                procurementID: procurementID
            };

            console.log("================================");
            console.log("Submit Response:");
            console.log(response);
            console.log("================================");

            return response;
    } catch (error) {

        await tx.rollback(error);
        console.error(error);
        req.reject(500, error.message);
    }
});

    this.on("searchExistingNFA", async (req) => {
        const { nfaNumber } = req.data;
        try {
            const oNFA = await SELECT.one.from(NFA).where({ nfaNumber });
            if (!oNFA) {
                return req.reject(404, "NFA not found");
            }
            const sNfaId = oNFA.ID;
            const oProcurementOverview = await SELECT.one.from(ProcurementOverview).where({ nfa_ID: sNfaId });
            const [
                oMaterialHistory,
                oSourcingVendorEvaluation,
                oCommercialSummary,
                oFinalisedTermsConditions,
                oOrganisationOther,
                oPurchaseOrderHeader,
                oPurchaseOrderItem,
                aAttachments
            ] = await Promise.all([
                SELECT.one.from(MaterialHistory).where({ nfa_ID: sNfaId }),
                SELECT.one.from(SourcingVendorEvaluation).where({ nfa_ID: sNfaId }),
                SELECT.one.from(CommercialSummary).where({ nfa_ID: sNfaId }),
                SELECT.one.from(FinalisedTermsConditions).where({ nfa_ID: sNfaId }),
                SELECT.one.from(OrganisationOther).where({ nfa_ID: sNfaId }),
                SELECT.one.from(EKKO_PurchaseOrder_Header).where({ nfa_ID: sNfaId }),
                SELECT.one.from(EKPO_PurchaseOrder_Item).where({ nfa_ID: sNfaId }),
                oProcurementOverview
                    ? SELECT.from(attachments).where({ up__ID: oProcurementOverview.ID })
                    : Promise.resolve([])
            ]);

            return {
                ID: oNFA.ID,
                nfaNumber: oNFA.nfaNumber,
                title: oNFA.title,
                status: oNFA.status,
                procurement: oProcurementOverview ? {
                    ...oProcurementOverview,
                    attachments: aAttachments
                } : null,
                materialHistory: oMaterialHistory,
                sourcingVendorEvaluation: oSourcingVendorEvaluation,
                commercialSummary: oCommercialSummary,
                finalisedTermsConditions: oFinalisedTermsConditions,
                organisationOther: oOrganisationOther,
                purchaseOrderHeader: oPurchaseOrderHeader,
                purchaseOrderItem: oPurchaseOrderItem
            };
        } catch (oError) {
            if (oError.statusCode || oError.code === 404) {
                throw oError;
            }

            req.reject(500, `Unable to search for the NFA: ${oError.message}`);
        }
    });

    this.on("generatePDF", async (req) => {
        console.log("===== generatePDF called =====");
        console.log(req.data);

        const { ID } = req.data;

        if (!ID) {
            return req.reject(400, "NFA ID is required");
        }

        const procurement =
            await SELECT.one.from(ProcurementOverview).where({ nfa_ID: ID });

        const attachmentList =
            procurement
                ? await SELECT.from(attachments).where({ up__ID: procurement.ID })
                : [];

        console.log("PDF Attachments:", attachmentList);

        const materialHistory =
            await SELECT.one.from(MaterialHistory).where({ nfa_ID: ID });

        const sourcingVendorEvaluation =
            await SELECT.one.from(SourcingVendorEvaluation).where({ nfa_ID: ID });

        const commercialSummary =
            await SELECT.one.from(CommercialSummary).where({ nfa_ID: ID });

        const finalisedTermsConditions =
            await SELECT.one.from(FinalisedTermsConditions).where({ nfa_ID: ID });

        const organisationOther =
            await SELECT.one.from(OrganisationOther).where({ nfa_ID: ID });

        const purchaseOrderHeader =
            await SELECT.one.from(EKKO_PurchaseOrder_Header).where({ nfa_ID: ID });

        const purchaseOrderItem =
            await SELECT.one.from(EKPO_PurchaseOrder_Item).where({ nfa_ID: ID });

        const pdf = await generatePDF({

            procurement,
            materialHistory,
            sourcingVendorEvaluation,
            commercialSummary,
            finalisedTermsConditions,
            organisationOther,
            purchaseOrderHeader,
            purchaseOrderItem,
            attachments: attachmentList
        });
        console.log("PDF Buffer:", Buffer.isBuffer(pdf));
        console.log("PDF Length:", pdf.length);
        console.log("PDF First Bytes:", pdf.slice(0, 10));

        return pdf;

    });

});
