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

    return Controller.extend("project1.controller.Model", {
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
            var oButton = oEvent.getSource();
            var oContext = oButton.getParent().getParent().getBindingContext(); // Navigate to ColumnListItem context

            if (!oContext) {
                MessageBox.warning("Error: Unable to retrieve row data");
                return;
            }

            var oSelectedData = oContext.getObject();
            var oModel = this.getView().getModel();

            // Create Edit Dialog if not exists
            if (!this._oEditDialog) {
                this._oEditDialog = new Dialog({
                    title: "Edit Model",
                    titleAlignment: "Center",
                    contentWidth: "600px",
                    content: new VBox({}),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: () => {
                            // Read values back from inputs
                            var aContent = this._oEditDialog.getContent()[0].getItems();
                            oSelectedData.modelServSpec = aContent[1].getValue();
                            oSelectedData.blockingIndicator = aContent[3].getValue();
                            oSelectedData.serviceSelection = aContent[5].getValue();
                            oSelectedData.description = aContent[7].getValue();
                            oSelectedData.searchTerm = aContent[9].getValue();
                            oSelectedData.currencyCode = aContent[11].getValue();

                            // Refresh model so table updates
                            oModel.refresh(true);

                            this._oEditDialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: () => this._oEditDialog.close()
                    })
                });

                this.getView().addDependent(this._oEditDialog);
            }

            // Fill dialog content with selected data
            this._oEditDialog.removeAllContent();
            this._oEditDialog.addContent(
                new VBox({
                    items: [
                        new Label({ text: "modelServSpec", design: "Bold" }),
                        new Input({ value: oSelectedData.modelServSpec }),

                        new Label({ text: "blockingIndicator", design: "Bold" }),
                        new Input({ value: oSelectedData.blockingIndicator }),

                        new Label({ text: "serviceSelection", design: "Bold" }),
                        new Input({ value: oSelectedData.serviceSelection }),

                        new Label({ text: "description", design: "Bold" }),
                        new Input({ value: oSelectedData.description }),

                        new Label({ text: "searchTerm", design: "Bold" }),
                        new Input({ value: oSelectedData.searchTerm }),

                        new Label({ text: "currencyCode", design: "Bold" }),
                        new Input({ value: oSelectedData.currencyCode })
                    ]
                })
            );

            this._oEditDialog.open();
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
        },

        onNavigateToModelServices() {
            this.getOwnerComponent().getRouter().navTo("modelServices");
        }
        
    });
});