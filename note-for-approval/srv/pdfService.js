const PDFDocument = require("pdfkit");

async function generatePDF(oDatabaseData) {

    if (!oDatabaseData || typeof oDatabaseData !== "object") {
        throw new Error("Unable to generate PDF: database data was not provided.");
    }

    // The service supplies the latest SQLite records. Normalize the database
    // result shape for the existing PDF layout without using UI form values.
    const data = {
        procurement: oDatabaseData.ProcurementOverview || oDatabaseData.procurement || {},
        materialHistory: oDatabaseData.MaterialHistory || oDatabaseData.materialHistory || {},
        sourcingVendorEvaluation: oDatabaseData.SourcingVendorEvaluation || oDatabaseData.sourcingVendorEvaluation || {},
        commercialSummary: oDatabaseData.CommercialSummary || oDatabaseData.commercialSummary || {},
        finalisedTermsConditions: oDatabaseData.FinalisedTermsConditions || oDatabaseData.finalisedTermsConditions || {},
        organisationOther: oDatabaseData.OrganisationOther || oDatabaseData.organisationOther || {},
        purchaseOrderHeader: oDatabaseData.PurchaseOrderHeader || oDatabaseData.purchaseOrderHeader || {},
        purchaseOrderItem: oDatabaseData.PurchaseOrderItem || oDatabaseData.purchaseOrderItem || {},
        attachments: oDatabaseData.attachments || []
    };

    const doc = new PDFDocument({
        size: "A4",
        margin: 50
    });

const buffers = [];

doc.on("data", (chunk) => {
    buffers.push(chunk);
});

return new Promise((resolve, reject) => {

    doc.on("error", reject);

    doc.on("end", () => {

        const pdfBuffer = Buffer.concat(buffers);

        console.log("PDF Buffer Size:", pdfBuffer.length);

        resolve(pdfBuffer);

    });

        // TITLE
       
        doc
            .fontSize(22)
            .fillColor("#003366")
            .text("NOTE FOR APPROVAL", {
                align: "center"
            });

        doc.moveDown(2);

        // 1. PROCUREMENT OVERVIEW
    
        doc
            .fontSize(16)
            .fillColor("blue")
            .text("1. Procurement Overview");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Procurement Name : ${data.procurement.procurementName || ""}`);
        doc.text(`Ariba Sourcing Event Ref : ${data.procurement.aribaSourcingEventRef || ""}`);
        doc.text(`Procurement Route : ${data.procurement.procurementRoute || ""}`);
        doc.text(`Procurement Strategy : ${data.procurement.procurementStrategy || ""}`);
        doc.text(`Expense Category : ${data.procurement.expenseCategory || ""}`);

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Procurement Objectives");
        doc.font("Helvetica").text(data.procurement.procurementObjectives || "");

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Procurement Background");
        doc.font("Helvetica").text(data.procurement.procurementBackground || "");

        doc.moveDown(2);

  
        // 2. MATERIAL HISTORY


        doc
            .fontSize(16)
            .fillColor("blue")
            .text("2. Material History");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Material Code : ${data.materialHistory.materialCode || ""}`);
        doc.text(`Material Description : ${data.materialHistory.materialDescription || ""}`);
        doc.text(`Quantity Procured : ${data.materialHistory.quantityProcured || ""}`);
        doc.text(`Awarded Unit Price : ${data.materialHistory.awardedUnitPrice || ""}`);
        doc.text(`Last PO Number : ${data.materialHistory.lastPONumber || ""}`);
        doc.text(`Last PO Vendor : ${data.materialHistory.lastPOVendor || ""}`);
        doc.text(`Last PO Value : ${data.materialHistory.lastPOValue || ""}`);
        doc.text(`Current Stock : ${data.materialHistory.currentStock || ""}`);

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Price Justification");
        doc.font("Helvetica").text(data.materialHistory.priceJustification || "");

        doc.moveDown(2);


        // 3. SOURCING VENDOR EVALUATION
  

        doc
            .fontSize(16)
            .fillColor("blue")
            .text("3. Sourcing Vendor Evaluation");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Vendors Invited : ${data.sourcingVendorEvaluation.vendorsInvited || ""}`);
        doc.text(`Vendors Responded : ${data.sourcingVendorEvaluation.vendorsResponded || ""}`);
        doc.text(`Vendors Shortlisted : ${data.sourcingVendorEvaluation.vendorsShortlisted || ""}`);
        doc.text(`Selected Vendor : ${data.sourcingVendorEvaluation.selectedVendorName || ""}`);
        doc.text(`Vendor Code : ${data.sourcingVendorEvaluation.selectedVendorCode || ""}`);

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Evaluation Summary");
        doc.font("Helvetica").text(data.sourcingVendorEvaluation.evaluationSummary || "");

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Award Justification");
        doc.font("Helvetica").text(data.sourcingVendorEvaluation.awardJustification || "");

        doc.moveDown(2);

        // 4. COMMERCIAL SUMMARY

        doc
            .fontSize(16)
            .fillColor("blue")
            .text("4. Commercial Summary");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Total Procurement Value : ${data.commercialSummary.totalValueOfProcurement || ""}`);
        doc.text(`Currency : ${data.commercialSummary.currency || ""}`);
        doc.text(`Secured Savings : ${data.commercialSummary.securedSavings || ""}`);
        doc.text(`Cost Increase : ${data.commercialSummary.costIncrease || ""}`);

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Recommendations");
        doc.font("Helvetica").text(data.commercialSummary.recommendations || "");

        doc.moveDown(2);

        // 5. FINALISED TERMS & CONDITIONS

        doc
            .fontSize(16)
            .fillColor("blue")
            .text("5. Finalised Terms & Conditions");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Payment Terms : ${data.finalisedTermsConditions.paymentTerms || ""}`);
        doc.text(`Milestone : ${data.finalisedTermsConditions.milestone || ""}`);
        doc.text(`Performance Bond : ${data.finalisedTermsConditions.performanceBond || ""}`);
        doc.text(`Warranty : ${data.finalisedTermsConditions.warranty || ""}`);
        doc.text(`Terms of Delivery : ${data.finalisedTermsConditions.termsOfDelivery || ""}`);
        doc.text(`Incoterms : ${data.finalisedTermsConditions.incoterms || ""}`);
        doc.text(`Applicable Taxes : ${data.finalisedTermsConditions.applicableTaxes || ""}`);

        doc.moveDown(2);

        
        // 6. ORGANISATION & OTHER

        doc
            .fontSize(16)
            .fillColor("blue")
            .text("6. Organisation & Other");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Purchasing Group : ${data.organisationOther.purchasingGroup || ""}`);
        doc.text(`Company Code : ${data.organisationOther.companyCode || ""}`);

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Other Conditions");
        doc.font("Helvetica").text(data.organisationOther.otherConditions || "");

        doc.moveDown();

        doc.font("Helvetica-Bold").text("Supporting Documents");
        doc.font("Helvetica").text(data.organisationOther.supportingDocuments || "");

        doc.moveDown(2);

    
        // 7. PURCHASE ORDER HEADER


        doc
            .fontSize(16)
            .fillColor("blue")
            .text("7. Purchase Order Header");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Purchase Order : ${data.purchaseOrderHeader.purchasingDocument || ""}`);
        doc.text(`Supplier : ${data.purchaseOrderHeader.supplier || ""}`);
        doc.text(`Company Code : ${data.purchaseOrderHeader.companyCode || ""}`);
        doc.text(`Payment Terms : ${data.purchaseOrderHeader.paymentTerms || ""}`);

        doc.moveDown(2);

        // 8. PURCHASE ORDER ITEM

        doc
            .fontSize(16)
            .fillColor("blue")
            .text("8. Purchase Order Item");

        doc.moveDown();

        doc
            .fontSize(11)
            .fillColor("black");

        doc.text(`Material : ${data.purchaseOrderItem.material || ""}`);
        doc.text(`Material Description : ${data.purchaseOrderItem.shortText || ""}`);
        doc.text(`Target Quantity : ${data.purchaseOrderItem.targetQuantity || ""}`);
        doc.text(`Purchase Order Quantity : ${data.purchaseOrderItem.purchaseOrderQuantity || ""}`);
        doc.text(`Order Unit : ${data.purchaseOrderItem.orderUnit || ""}`);

        doc.moveDown(2);


        // 9. ATTACHMENTS


        doc
            .fontSize(16)
            .fillColor("blue")
            .text("9. Attachments");

        doc.moveDown();
        doc
            .fontSize(10)      // or 10 if you want it even smaller
            .fillColor("blue");

        if (data.attachments && data.attachments.length > 0) {

            data.attachments.forEach((file, index) => {

                const fileUrl =
                    `http://localhost:4004/odata/v4/nfa/attachments(up__ID='${file.up__ID}',ID='${file.ID}')/content`;
                    // when we will deploy to cloud, we will need to change the URL to this 
                    // `${process.env.BASE_URL}/odata/v4/nfa/attachments(up__ID='${file.up__ID}',ID='${file.ID}')/content`;

                doc
                    .fillColor("blue")
                    .text(`${index + 1}. ${file.filename}`, {
                        link: fileUrl,
                        underline: true
                    });

            });

        } else {

            doc.fillColor("black").text("No attachments");

        }

        doc.fillColor("black");


        // END PDF
  

        doc.end();

    });

}

module.exports = {
    generatePDF
};
