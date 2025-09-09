sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("invoice.controller.View1", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                DocumentNumber: "20000010",
                SelectedItemNumber: "",
                ErrorMessage: ""
            });
            this.getView().setModel(oModel);
        },

        onNextPress: function () {
            var oModel = this.getView().getModel();
            var sItem = oModel.getProperty("/SelectedItemNumber");

            if (!sItem) {
                oModel.setProperty("/ErrorMessage", "Item Number is required");
                return;
            }
            oModel.setProperty("/ErrorMessage", "");
            MessageToast.show("Navigating to next step with item: " + sItem);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("invoice");
        }
    });
});