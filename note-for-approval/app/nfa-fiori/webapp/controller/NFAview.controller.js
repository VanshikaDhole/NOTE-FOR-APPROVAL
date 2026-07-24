sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageToast) => {
    "use strict";
 
    return Controller.extend("nfa.nfaapp.controller.nfa-Preview", {
        onInit() {
            this.getView().setModel(new JSONModel({ items: [] }), "attachments");
        },
 
        onFileChange(oEvent) {
            const aFiles = Array.from(oEvent.getParameter("files") || []);
            const oModel = this.getView().getModel("attachments");
            const aExistingItems = oModel.getProperty("/items");
            const aNewItems = aFiles.map((oFile) => ({
                id: `${oFile.name}-${oFile.size}-${oFile.lastModified}`,
                name: oFile.name,
                size: oFile.size
            }));
 
            const aItems = [...aExistingItems];
            aNewItems.forEach((oNewItem) => {
                if (!aItems.some((oItem) => oItem.id === oNewItem.id)) {
                    aItems.push(oNewItem);
                }
            });
 
            oModel.setProperty("/items", aItems);
            this.byId("fileUploader").clear();
 
            if (aNewItems.length) {
                MessageToast.show(`${aNewItems.length} attachment${aNewItems.length === 1 ? "" : "s"} added.`);
            }
        },
 
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