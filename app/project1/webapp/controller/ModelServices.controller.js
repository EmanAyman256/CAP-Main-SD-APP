sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox"
], function (Controller, MessageBox, Dialog, Input, Button, Label, VBox) {
    "use strict";

    return Controller.extend("project1.controller.ModelServices", {
         onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                Models: [
                    { modelServSpec: "model1", blockingIndicator: true,serviceSelection:true, description: "model 1 desc",searchTerm:"term",currencyCode:1},
                    { modelServSpec: "model2", blockingIndicator: true,serviceSelection:false, description: "model 2 desc",searchTerm:"term2",currencyCode:2},
                   
                ],
                newCode: "",
                newDescription: ""
            });
            this.getView().setModel(oModel);
        },
        onAdd: function () {
            var oModel = this.getView().getModel();
            var newCode = oModel.getProperty("/newCode");
            var newDescription = oModel.getProperty("/newDescription");
            if (newCode && newDescription) {
                oModel.getProperty("/ServiceTypes").push({
                    Code: newCode,
                    Description: newDescription,
                    CreatedOn: new Date().toISOString().split('T')[0]
                });
                oModel.setProperty("/newCode", "");
                oModel.setProperty("/newDescription", "");
            }
        },
       
        onEdit: function (oEvent) {
            // Logic to edit service type
        },
       onDelete: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                var oModel = this.getView().getModel();
                var oItem = oModel.getProperty(sPath);

                MessageBox.confirm("Are you sure you want to delete " + oItem.modelServSpec + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            var aModels = oModel.getProperty("/Models");
                            var iIndex = aModels.indexOf(oItem);
                            if (iIndex > -1) {
                                aModels.splice(iIndex, 1);
                                oModel.setProperty("/Models", aModels);
                            }
                        }
                    }
                });
            }
        },

        //Navigate to Add Model View
        onPress(){
             this.getOwnerComponent().getRouter().navTo("addModel");
        }
        
    });
});