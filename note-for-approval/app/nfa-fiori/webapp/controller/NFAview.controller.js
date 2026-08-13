sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/Button"
], (Controller, JSONModel, MessageToast, MessageBox, Dialog, Input, Label, Button) => {
    "use strict";

    return Controller.extend("nfafiori.controller.NFAview", {
        onInit() {
            this.getView().setModel(new JSONModel({ items: [] }), "attachments");

            const oViewModel = new JSONModel({
                procurement: {
                    procurementName: "",
                    aribaSourcingEventRef: "",
                    procurementRoute: "",
                    procurementStrategy: "",
                    expenseCategory: "",
                    procurementObjectives: "",
                    procurementBackground: ""
                },
                materialHistory: {
                    materialCode: "",
                    materialDescription: "",
                    quantityProcured: "",
                    awardedUnitPrice: "",
                    lastPONumber: "",
                    lastPODate: "",
                    lastPOVendor: "",
                    lastPOValue: "",
                    lastPOUnitPrice: "",
                    variancePercentVsLastPO: "",
                    last6MonthsPurchaseQty: "",
                    last6MonthsPurchaseValue: "",
                    avgUnitPrice6Months: "",
                    variancePercentVsAvg6Months: "",
                    consumption6Months: "",
                    consumption12Months: "",
                    avgMonthlyConsumptionRate: "",
                    currentStock: "",
                    stockCoverMonths: "",
                    priceJustification: ""
                },
                sourcingVendorEvaluation: {
                    vendorsInvited: "",
                    vendorsResponded: "",
                    vendorsShortlisted: "",
                    evaluationSummary: "",
                    numberOfVendorsSelected: "",
                    selectedVendorName: "",
                    selectedVendorCode: "",
                    awardJustification: ""
                },
                commercialSummary: {
                    totalValueOfProcurement: "",
                    currency: "",
                    securedSavings: "",
                    costIncrease: "",
                    recommendations: ""
                },
                finalisedTermsConditions: {
                    paymentTerms: "",
                    milestone: "",
                    performanceBond: "",
                    warranty: "",
                    termsOfDelivery: "",
                    incoterms: "",
                    liquidatedDamages: "",
                    applicableTaxes: ""
                },
                organisationOther: {
                    purchasingGroup: "",
                    companyCode: "",
                    otherConditions: "",
                    supportingDocuments: ""
                },
                purchaseOrderHeader: {
                    client: "",
                    purchasingDocument: "",
                    companyCode: "",
                    documentCategory: "",
                    documentType: "",
                    control: "",
                    deletionIndicator: "",
                    status: "",
                    itemInterval: "",
                    lastItem: "",
                    supplier: "",
                    language: "",
                    paymentTerms: "",
                    paymentInDays1: "",
                    paymentInDays2: "",
                    paymentInDays3: ""
                },
                purchaseOrderItem: {
                    client: "",
                    purchasingDocument: "",
                    item: "",
                    documentItem: "",
                    deletionIndicator: "",
                    origin: "",
                    shortText: "",
                    material: "",
                    externalMaterial: "",
                    companyCode: "",
                    plant: "",
                    storageLocation: "",
                    trackingNumber: "",
                    materialGroup: "",
                    infoRecord: "",
                    supplierMaterialNumber: "",
                    targetQuantity: "",
                    purchaseOrderQuantity: "",
                    orderUnit: ""
                }
            });
            this.getView().setModel(oViewModel, "viewModel");
            const oExistingModel = new JSONModel({
                procurement: {
                    procurementName: "",
                    aribaSourcingEventRef: "",
                    procurementRoute: "",
                    procurementStrategy: "",
                    expenseCategory: "",
                    procurementObjectives: "",
                    procurementBackground: ""
                },
                materialHistory: {
                    materialCode: "",
                    materialDescription: "",
                    quantityProcured: "",
                    awardedUnitPrice: "",
                    lastPONumber: "",
                    lastPODate: "",
                    lastPOVendor: "",
                    lastPOValue: "",
                    lastPOUnitPrice: "",
                    variancePercentVsLastPO: "",
                    last6MonthsPurchaseQty: "",
                    last6MonthsPurchaseValue: "",
                    avgUnitPrice6Months: "",
                    variancePercentVsAvg6Months: "",
                    consumption6Months: "",
                    consumption12Months: "",
                    avgMonthlyConsumptionRate: "",
                    currentStock: "",
                    stockCoverMonths: "",
                    priceJustification: ""
                },
                sourcingVendorEvaluation: {
                    vendorsInvited: "",
                    vendorsResponded: "",
                    vendorsShortlisted: "",
                    evaluationSummary: "",
                    numberOfVendorsSelected: "",
                    selectedVendorName: "",
                    selectedVendorCode: "",
                    awardJustification: ""
                },
                commercialSummary: {
                    totalValueOfProcurement: "",
                    currency: "",
                    securedSavings: "",
                    costIncrease: "",
                    recommendations: ""
                },
                finalisedTermsConditions: {
                    paymentTerms: "",
                    milestone: "",
                    performanceBond: "",
                    warranty: "",
                    termsOfDelivery: "",
                    incoterms: "",
                    liquidatedDamages: "",
                    applicableTaxes: ""
                },
                organisationOther: {
                    purchasingGroup: "",
                    companyCode: "",
                    otherConditions: "",
                    supportingDocuments: ""
                },
                purchaseOrderHeader: {
                    client: "",
                    purchasingDocument: "",
                    companyCode: "",
                    documentCategory: "",
                    documentType: "",
                    control: "",
                    deletionIndicator: "",
                    status: "",
                    itemInterval: "",
                    lastItem: "",
                    supplier: "",
                    language: "",
                    paymentTerms: "",
                    paymentInDays1: "",
                    paymentInDays2: "",
                    paymentInDays3: ""
                },
                purchaseOrderItem: {
                    client: "",
                    purchasingDocument: "",
                    item: "",
                    documentItem: "",
                    deletionIndicator: "",
                    origin: "",
                    shortText: "",
                    material: "",
                    externalMaterial: "",
                    companyCode: "",
                    plant: "",
                    storageLocation: "",
                    trackingNumber: "",
                    materialGroup: "",
                    infoRecord: "",
                    supplierMaterialNumber: "",
                    targetQuantity: "",
                    purchaseOrderQuantity: "",
                    orderUnit: ""
                }
            });

this.getView().setModel(oExistingModel, "existingModel");
            this._selectedNfaId = "";
            this._selectedNfaNumber = "";

            // Replace this mapping with your API response structure when you are ready.
            this.mapFormData({});
        },

        mapFormData(oApiData) {
            const oData = oApiData || {};
            const oProcurement = {
                procurementName: oData?.procurement?.procurementName || oData?.procurementName || "",
                aribaSourcingEventRef: oData?.procurement?.aribaSourcingEventRef || oData?.aribaSourcingEventRef || "",
                procurementRoute: oData?.procurement?.procurementRoute || oData?.procurementRoute || "",
                procurementStrategy: oData?.procurement?.procurementStrategy || oData?.procurementStrategy || "",
                expenseCategory: oData?.procurement?.expenseCategory || oData?.expenseCategory || "",
                procurementObjectives: oData?.procurement?.procurementObjectives || oData?.procurementObjectives || "",
                procurementBackground: oData?.procurement?.procurementBackground || oData?.procurementBackground || ""
            };

            const oMaterialHistory = {
                materialCode: oData?.materialHistory?.materialCode || oData?.materialCode || "",
                materialDescription: oData?.materialHistory?.materialDescription || oData?.materialDescription || "",
                quantityProcured: oData?.materialHistory?.quantityProcured || oData?.quantityProcured || "",
                awardedUnitPrice: oData?.materialHistory?.awardedUnitPrice || oData?.awardedUnitPrice || "",
                lastPONumber: oData?.materialHistory?.lastPONumber || oData?.lastPONumber || "",
                lastPODate: oData?.materialHistory?.lastPODate || oData?.lastPODate || "",
                lastPOVendor: oData?.materialHistory?.lastPOVendor || oData?.lastPOVendor || "",
                lastPOValue: oData?.materialHistory?.lastPOValue || oData?.lastPOValue || "",
                lastPOUnitPrice: oData?.materialHistory?.lastPOUnitPrice || oData?.lastPOUnitPrice || "",
                variancePercentVsLastPO: oData?.materialHistory?.variancePercentVsLastPO || oData?.variancePercentVsLastPO || "",
                last6MonthsPurchaseQty: oData?.materialHistory?.last6MonthsPurchaseQty || oData?.last6MonthsPurchaseQty || "",
                last6MonthsPurchaseValue: oData?.materialHistory?.last6MonthsPurchaseValue || oData?.last6MonthsPurchaseValue || "",
                avgUnitPrice6Months: oData?.materialHistory?.avgUnitPrice6Months || oData?.avgUnitPrice6Months || "",
                variancePercentVsAvg6Months: oData?.materialHistory?.variancePercentVsAvg6Months || oData?.variancePercentVsAvg6Months || "",
                consumption6Months: oData?.materialHistory?.consumption6Months || oData?.consumption6Months || "",
                consumption12Months: oData?.materialHistory?.consumption12Months || oData?.consumption12Months || "",
                avgMonthlyConsumptionRate: oData?.materialHistory?.avgMonthlyConsumptionRate || oData?.avgMonthlyConsumptionRate || "",
                currentStock: oData?.materialHistory?.currentStock || oData?.currentStock || "",
                stockCoverMonths: oData?.materialHistory?.stockCoverMonths || oData?.stockCoverMonths || "",
                priceJustification: oData?.materialHistory?.priceJustification || oData?.priceJustification || ""
            };

            const oSourcingVendorEvaluation = {
                vendorsInvited: oData?.sourcingVendorEvaluation?.vendorsInvited || oData?.vendorsInvited || "",
                vendorsResponded: oData?.sourcingVendorEvaluation?.vendorsResponded || oData?.vendorsResponded || "",
                vendorsShortlisted: oData?.sourcingVendorEvaluation?.vendorsShortlisted || oData?.vendorsShortlisted || "",
                evaluationSummary: oData?.sourcingVendorEvaluation?.evaluationSummary || oData?.evaluationSummary || "",
                numberOfVendorsSelected: oData?.sourcingVendorEvaluation?.numberOfVendorsSelected || oData?.numberOfVendorsSelected || "",
                selectedVendorName: oData?.sourcingVendorEvaluation?.selectedVendorName || oData?.selectedVendorName || "",
                selectedVendorCode: oData?.sourcingVendorEvaluation?.selectedVendorCode || oData?.selectedVendorCode || "",
                awardJustification: oData?.sourcingVendorEvaluation?.awardJustification || oData?.awardJustification || ""
            };

            const oCommercialSummary = {
                totalValueOfProcurement: oData?.commercialSummary?.totalValueOfProcurement || oData?.totalValueOfProcurement || "",
                currency: oData?.commercialSummary?.currency || oData?.currency || "",
                securedSavings: oData?.commercialSummary?.securedSavings || oData?.securedSavings || "",
                costIncrease: oData?.commercialSummary?.costIncrease || oData?.costIncrease || "",
                recommendations: oData?.commercialSummary?.recommendations || oData?.recommendations || ""
            };

            const oFinalisedTermsConditions = {
                paymentTerms: oData?.finalisedTermsConditions?.paymentTerms || oData?.paymentTerms || "",
                milestone: oData?.finalisedTermsConditions?.milestone || oData?.milestone || "",
                performanceBond: oData?.finalisedTermsConditions?.performanceBond || oData?.performanceBond || "",
                warranty: oData?.finalisedTermsConditions?.warranty || oData?.warranty || "",
                termsOfDelivery: oData?.finalisedTermsConditions?.termsOfDelivery || oData?.termsOfDelivery || "",
                incoterms: oData?.finalisedTermsConditions?.incoterms || oData?.incoterms || "",
                liquidatedDamages: oData?.finalisedTermsConditions?.liquidatedDamages || oData?.liquidatedDamages || "",
                applicableTaxes: oData?.finalisedTermsConditions?.applicableTaxes || oData?.applicableTaxes || ""
            };

            const oOrganisationOther = {
                purchasingGroup: oData?.organisationOther?.purchasingGroup || oData?.purchasingGroup || "",
                companyCode: oData?.organisationOther?.companyCode || oData?.companyCode || "",
                otherConditions: oData?.organisationOther?.otherConditions || oData?.otherConditions || "",
                supportingDocuments: oData?.organisationOther?.supportingDocuments || oData?.supportingDocuments || ""
            };

            const oPurchaseOrderHeader = {
                client: oData?.purchaseOrderHeader?.client || oData?.client || "",
                purchasingDocument: oData?.purchaseOrderHeader?.purchasingDocument || oData?.purchasingDocument || "",
                companyCode: oData?.purchaseOrderHeader?.companyCode || oData?.companyCode || "",
                documentCategory: oData?.purchaseOrderHeader?.documentCategory || oData?.documentCategory || "",
                documentType: oData?.purchaseOrderHeader?.documentType || oData?.documentType || "",
                control: oData?.purchaseOrderHeader?.control || oData?.control || "",
                deletionIndicator: oData?.purchaseOrderHeader?.deletionIndicator || oData?.deletionIndicator || "",
                status: oData?.purchaseOrderHeader?.status || oData?.status || "",
                itemInterval: oData?.purchaseOrderHeader?.itemInterval || oData?.itemInterval || "",
                lastItem: oData?.purchaseOrderHeader?.lastItem || oData?.lastItem || "",
                supplier: oData?.purchaseOrderHeader?.supplier || oData?.supplier || "",
                language: oData?.purchaseOrderHeader?.language || oData?.language || "",
                paymentTerms: oData?.purchaseOrderHeader?.paymentTerms || oData?.paymentTerms || "",
                paymentInDays1: oData?.purchaseOrderHeader?.paymentInDays1 || oData?.paymentInDays1 || "",
                paymentInDays2: oData?.purchaseOrderHeader?.paymentInDays2 || oData?.paymentInDays2 || "",
                paymentInDays3: oData?.purchaseOrderHeader?.paymentInDays3 || oData?.paymentInDays3 || ""
            };

            const oPurchaseOrderItem = {
                client: oData?.purchaseOrderItem?.client || oData?.client || "",
                purchasingDocument: oData?.purchaseOrderItem?.purchasingDocument || oData?.purchasingDocument || "",
                item: oData?.purchaseOrderItem?.item || oData?.item || "",
                documentItem: oData?.purchaseOrderItem?.documentItem || oData?.documentItem || "",
                deletionIndicator: oData?.purchaseOrderItem?.deletionIndicator || oData?.deletionIndicator || "",
                origin: oData?.purchaseOrderItem?.origin || oData?.origin || "",
                shortText: oData?.purchaseOrderItem?.shortText || oData?.shortText || "",
                material: oData?.purchaseOrderItem?.material || oData?.material || "",
                externalMaterial: oData?.purchaseOrderItem?.externalMaterial || oData?.externalMaterial || "",
                companyCode: oData?.purchaseOrderItem?.companyCode || oData?.companyCode || "",
                plant: oData?.purchaseOrderItem?.plant || oData?.plant || "",
                storageLocation: oData?.purchaseOrderItem?.storageLocation || oData?.storageLocation || "",
                trackingNumber: oData?.purchaseOrderItem?.trackingNumber || oData?.trackingNumber || "",
                materialGroup: oData?.purchaseOrderItem?.materialGroup || oData?.materialGroup || "",
                infoRecord: oData?.purchaseOrderItem?.infoRecord || oData?.infoRecord || "",
                supplierMaterialNumber: oData?.purchaseOrderItem?.supplierMaterialNumber || oData?.supplierMaterialNumber || "",
                targetQuantity: oData?.purchaseOrderItem?.targetQuantity || oData?.targetQuantity || "",
                purchaseOrderQuantity: oData?.purchaseOrderItem?.purchaseOrderQuantity || oData?.purchaseOrderQuantity || "",
                orderUnit: oData?.purchaseOrderItem?.orderUnit || oData?.orderUnit || ""
            };

                const oExistingModel = this.getView().getModel("existingModel");

                oExistingModel.setProperty("/procurement", oProcurement);
                oExistingModel.setProperty("/materialHistory", oMaterialHistory);
                oExistingModel.setProperty("/sourcingVendorEvaluation", oSourcingVendorEvaluation);
                oExistingModel.setProperty("/commercialSummary", oCommercialSummary);
                oExistingModel.setProperty("/finalisedTermsConditions", oFinalisedTermsConditions);
                oExistingModel.setProperty("/organisationOther", oOrganisationOther);
                oExistingModel.setProperty("/purchaseOrderHeader", oPurchaseOrderHeader);
                oExistingModel.setProperty("/purchaseOrderItem", oPurchaseOrderItem);
            const oAttachmentsModel = this.getView().getModel("attachments");

if (oAttachmentsModel) {

    const aAttachments =
        oData?.procurement?.attachments || [];
          console.log("Attachments from Backend:", aAttachments);

    oAttachmentsModel.setProperty(
        "/items",
        aAttachments.map(a => ({
            id: a.ID,
            name: a.filename,
            type: a.mimeType,
            url: `/odata/v4/nfa/attachments(up__ID=${a.up__ID},ID=${a.ID})/content`,
            file: null
        }))
    );
}
        },
 
// onFileChange
        onFileChange(oEvent) {
            console.log("File Change Triggered");
            console.log(oEvent);
            const aFiles = Array.from(oEvent.getParameter("files") || []);
            const oModel = this.getView().getModel("attachments");
            const aExistingItems = oModel.getProperty("/items");
            const aNewItems = aFiles.map((oFile) => ({
                id: `${oFile.name}-${oFile.size}-${oFile.lastModified}`,
                name: oFile.name,
                size: oFile.size,
                type: oFile.type,
                file: oFile          // Keep actual File object
            }));
 
            const aItems = [...aExistingItems];
            aNewItems.forEach((oNewItem) => {
                if (!aItems.some((oItem) => oItem.id === oNewItem.id)) {
                    aItems.push(oNewItem);
                }
            });
 
            oModel.setProperty("/items", aItems);
                console.log(
                this.getView()
                    .getModel("attachments")
                    .getProperty("/items")
                );
 
            if (aNewItems.length) {
                MessageToast.show(`${aNewItems.length} attachment${aNewItems.length === 1 ? "" : "s"} added.`);
            }
        },
 
// onRemoveAttachment
        onRemoveAttachment(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("attachments");
            const sPath = oContext.getPath();
            const oModel = this.getView().getModel("attachments");
            const aItems = oModel.getProperty("/items").slice();
            const iIndex = Number(sPath.split("/").pop());
 
            aItems.splice(iIndex, 1);
            oModel.setProperty("/items", aItems);
            MessageToast.show("Attachment removed.");
        },

// onFetchProcurementData
        async onFetchProcurementData(oEvent) {

            try {
                const sEventId =
                    oEvent.getSource().getValue().trim();
                if (!sEventId) {
                    return;
                }
                const oModel = this.getView().getModel();
                const oAction =
                    oModel.bindContext("/getProcurementDetails(...)");
                    oAction.setParameter("eventId", sEventId);

                await oAction.execute();
                const oData =
                    oAction.getBoundContext().getObject();
                    console.log(oData);
                const oViewModel =
                    this.getView().getModel("viewModel");

                oViewModel.setProperty("/procurement/procurementName", oData.procurementName);
                oViewModel.setProperty("/procurement/procurementRoute", oData.procurementRoute);
                oViewModel.setProperty("/procurement/aribaSourcingEventRef", oData.aribaSourcingEventRef);
                oViewModel.setProperty("/procurement/procurementStrategy", oData.procurementStrategy);
                oViewModel.setProperty("/procurement/expenseCategory", oData.expenseCategory);
                oViewModel.setProperty("/procurement/procurementObjectives", oData.procurementObjectives);
                oViewModel.setProperty("/procurement/procurementBackground", oData.procurementBackground);
                oViewModel.setProperty("/sourcingVendorEvaluation/vendorsInvited",oData.noOfVendorsInvited);
                oViewModel.setProperty("/sourcingVendorEvaluation/vendorsResponded",oData.vendorsResponded);
                oViewModel.setProperty("/sourcingVendorEvaluation/numberOfVendorsSelected",oData.numberOfVendorsSelected);
                oViewModel.setProperty("/commercialSummary/totalValueOfProcurement",oData.totalValueOfProcurement);
                oViewModel.setProperty("/commercialSummary/currency",oData.currency);
                this.getView().getModel("attachments").setProperty(
                    "/items",
                    (oData.attachments || []).map(file => ({
                        id: file.ID,
                        name: file.fileName,
                        size: file.fileSize,
                        type: file.mimeType,
                        url: `/odata/v4/nfa/attachments(up__ID='${file.up_ID}',ID='${file.ID}')/content`
                    }))
                );
                MessageToast.show("Procurement data loaded.");
                

            } catch (oError) {
                console.error(oError);
                MessageBox.error("Unable to fetch procurement details.");
            }},

// onSubmitForApproval

   async onSubmitForApproval() {
    try {
        const oViewModel =
            this.getView().getModel("viewModel");
        const payload = {
            procurement:
                oViewModel.getProperty("/procurement"),
            materialHistory:
                oViewModel.getProperty("/materialHistory"),
            sourcingVendorEvaluation:
                oViewModel.getProperty("/sourcingVendorEvaluation"),
            commercialSummary:
                oViewModel.getProperty("/commercialSummary"),
            finalisedTermsConditions:
                oViewModel.getProperty("/finalisedTermsConditions"),
            organisationOther:
                oViewModel.getProperty("/organisationOther"),
            purchaseOrderHeader:
                oViewModel.getProperty("/purchaseOrderHeader"),
            purchaseOrderItem:
                oViewModel.getProperty("/purchaseOrderItem")

        };

        const oModel = this.getView().getModel();
        const oAction =
            oModel.bindContext("/submitNFA(...)");
            oAction.setParameter("data", JSON.stringify(payload));
        await oAction.execute();
        const oResult =
            oAction.getBoundContext().getObject();
        console.log("Submit Response:", oResult);
        const procurementID = oResult.procurementID;
        console.log("Procurement ID:", procurementID);

        const aFiles = this.getView()
            .getModel("attachments")
            .getProperty("/items") || [];

        for (const item of aFiles) {

            console.log("Uploading:", item.name);

            // 1. Create attachment record
            const oAttachment = oModel.bindList("/attachments");

            const oContext = oAttachment.create({
                up__ID: procurementID,
                filename: item.name,
                mimeType: item.type
            });

            await oContext.created();

            // 2. Read attachment ID returned by CAP
            const attachment = oContext.getObject();

            console.log("Attachment:", attachment);

            // 3. Upload binary stream
            const uploadUrl =
                `/odata/v4/nfa/attachments(up__ID=${procurementID},ID=${attachment.ID})/content`;

            await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": item.type
                },
                body: item.file
            });
            
            console.log("Uploaded:", item.name);
        }
        MessageToast.show(oResult.message);
            } catch (error) {
                console.error(error);
                MessageBox.error("Submit Failed");
            }
    },

// onSearchExistingNFA
    async onSearchExistingNFA() {
            debugger;
            const oSearchInput = this.byId("existingNFANumber");
            const sNfaNumber = oSearchInput?.getValue?.().trim() || "";

            oSearchInput?.setValueState("None");
            oSearchInput?.setValueStateText("");

            if (!sNfaNumber) {
                MessageBox.error("Please enter an NFA Number.");
                return;
            }

            try {
                const oModel = this.getView().getModel();

                console.log("Model Object:", oModel);
                console.log("Model Type:", oModel.getMetadata().getName());

                const oFunction = oModel.bindContext("/searchExistingNFA(...)");

                oFunction.setParameter("nfaNumber", sNfaNumber);

                await oFunction.execute();

                const oResponse = oFunction.getBoundContext().getObject();

                console.log("Response:", oResponse);

                if (!oResponse || Object.keys(oResponse).length === 0) {
                    oSearchInput?.setValueState("Error");
                    oSearchInput?.setValueStateText("NFA not found.");
                    MessageBox.error("NFA not found.");
                    return;
                }

                this.mapFormData(oResponse);
                this._selectedNfaId = oResponse.ID || oResponse.id || oResponse.nfaId || "";
                this._selectedNfaNumber = oResponse.nfaNumber || sNfaNumber;

                oSearchInput?.setValueState("Success");
                oSearchInput?.setValueStateText(`Found NFA ${this._selectedNfaNumber}`);
                MessageToast.show(`Found NFA ${this._selectedNfaNumber}`);
            } catch (oError) {
                const sErrorText = String(
                    oError?.message ||
                    oError?.response?.message ||
                    oError?.response?.statusText ||
                    oError?.statusText ||
                    oError ||
                    ""
                );
                const sErrorLower = sErrorText.toLowerCase();
                const bNotFound = oError?.statusCode === 404 || /not found/i.test(sErrorLower);
                const bDatabaseError = /sqlite|database|sql|unable to search/i.test(sErrorLower);

                oSearchInput?.setValueState("Error");
                if (bNotFound) {
                    oSearchInput?.setValueStateText("NFA not found.");
                    MessageBox.error("NFA not found.");
                } else if (bDatabaseError) {
                    oSearchInput?.setValueStateText("A database error occurred while searching for the NFA.");
                    MessageBox.error("A database error occurred while searching for the NFA.");
                } else {
                    oSearchInput?.setValueStateText("A network or API error occurred while searching for the NFA.");
                    MessageBox.error("A network or API error occurred while searching for the NFA.");
                }
                console.error(oError);
            }
        },

// onOpenAttachment
onOpenAttachment: function (oEvent) {

    const oItem = oEvent.getSource()
        .getBindingContext("attachments")
        .getObject();

    console.log("Attachment Object:", oItem);

    if (oItem.url) {
        console.log("URL:", oItem.url);
        window.open(oItem.url, "_blank");
    } else {
        MessageToast.show("Attachment URL not found");
    }
},

//  Workspace ID popup
// onImportDocument: function () {

//     // Make sure an NFA has been searched
//     if (!this._selectedNfaId) {
//         MessageBox.error("Please search for an NFA first.");
//         return;
//     }

//     const oInput = new Input({
//         width: "100%",
//         placeholder: "Enter Ariba Workspace ID"
//     });

//     const oDialog = new Dialog({
//         title: "Import Document to Ariba",
//         contentWidth: "450px",
//         content: [
//             new Label({
//                 text: "Ariba Workspace ID",
//                 required: true
//             }),
//             oInput
//         ],

//         beginButton: new Button({
//             text: "Import",
//             type: "Emphasized",

//             press: () => {

//                 const sWorkspaceId =
//                     oInput.getValue().trim();

//                 if (!sWorkspaceId) {
//                     MessageBox.error(
//                         "Please enter the Ariba Workspace ID."
//                     );
//                     return;
//                 }

//                 // Store it temporarily.
//                 // We will use this in the next steps.
//                 this._aribaWorkspaceId = sWorkspaceId;

//                 console.log(
//                     "Selected NFA ID:",
//                     this._selectedNfaId
//                 );

//                 console.log(
//                     "Ariba Workspace ID:",
//                     this._aribaWorkspaceId
//                 );

//                 oDialog.close();

//                 MessageToast.show(
//                     "Workspace ID captured."
//                 );
//             }
//         }),

//         endButton: new Button({
//             text: "Cancel",
//             press: () => {
//                 oDialog.close();
//             }
//         }),

//         afterClose: () => {
//             oDialog.destroy();
//         }
//     });

//     oDialog.open();
// },
onImportDocument: function () {

    // Make sure an NFA has been searched/selected
    if (!this._selectedNfaId) {
        MessageBox.error("Please search for an NFA first.");
        return;
    }

    const oInput = new Input({
        width: "100%",
        placeholder: "Enter Ariba Workspace ID"
    });

    const oDialog = new Dialog({
        title: "Import Document to Ariba",
        contentWidth: "450px",

        content: [
            new Label({
                text: "Ariba Workspace ID",
                required: true
            }),

            oInput
        ],

        beginButton: new Button({
            text: "Import",
            type: "Emphasized",

press: async () => {

    const sWorkspaceId =
        oInput.getValue().trim();

    if (!sWorkspaceId) {
        MessageBox.error(
            "Please enter the Ariba Workspace ID."
        );
        return;
    }

    if (!this._selectedNfaId) {
        MessageBox.error(
            "No NFA is selected. Please search for an NFA first."
        );
        return;
    }

    try {

        this._aribaWorkspaceId = sWorkspaceId;

        console.log("================================");
        console.log("CALLING CAP IMPORT DOCUMENT");
        console.log("NFA ID:", this._selectedNfaId);
        console.log(
            "Workspace ID:",
            this._aribaWorkspaceId
        );
        console.log("================================");

        const oModel =
            this.getView().getModel();

        const oAction =
            oModel.bindContext(
                "/importDocument(...)"
            );

        oAction.setParameter(
            "ID",
            this._selectedNfaId
        );

        oAction.setParameter(
            "workspaceId",
            this._aribaWorkspaceId
        );

        oDialog.close();

        MessageToast.show(
            "Importing document to Ariba..."
        );

        const oResult =
            await oAction.execute();

        console.log(
            "================================"
        );

        console.log(
            "IMPORT DOCUMENT RESPONSE:",
            oResult
        );

        console.log(
            "================================"
        );

        MessageBox.success(
            "Document imported successfully into Ariba."
        );

    } catch (error) {

        console.error(
            "Import Document Error:",
            error
        );

        MessageBox.error(
            error.message ||
            "Failed to import document to Ariba."
        );
    }
}
}),

        endButton: new Button({
            text: "Cancel",

            press: () => {
                oDialog.close();
            }
        }),

        afterClose: () => {
            oDialog.destroy();
        }
    });

    oDialog.open();
},
// onDownloadPDF
onDownloadPDF: async function () {
    try {

        if (!this._selectedNfaId) {
            MessageBox.error("Please search for an NFA first.");
            return;
        }

        const response = await fetch("/odata/v4/nfa/generatePDF", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({ ID: this._selectedNfaId })

        });

        if (!response.ok) {
            throw new Error("Failed to generate PDF");
        }

        const result = await response.json();

        console.log(result);

        if (!result.value || !result.value.data) {
            throw new Error("Invalid PDF response");
        }

        const bytes = new Uint8Array(result.value.data);

        const blob = new Blob([bytes], {
            type: "application/pdf"
        });
        const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");

                a.href = url;
                a.download = `NFA-${this._selectedNfaNumber || this._selectedNfaId}.pdf`;

                document.body.appendChild(a);

                a.click();

                document.body.removeChild(a);

                window.URL.revokeObjectURL(url);

                MessageToast.show("PDF downloaded successfully.");

            } catch (error) {

                console.error(error);

                MessageToast.show(error.message || "Unable to download PDF.");

            }

        },
 
        formatFileSize(iBytes) {
            if (!iBytes) {
                return "0 B";
            }
 
            const aUnits = ["B", "KB", "MB", "GB"];
            const iUnit = Math.min(Math.floor(Math.log(iBytes) / Math.log(1024)), aUnits.length - 1);
            const iValue = iBytes / (1024 ** iUnit);
            return `${iValue.toFixed(iUnit ? 1 : 0)} ${aUnits[iUnit]}`;
        }
    });
});