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

    return Controller.extend("project1.controller.Formulas", {
         onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                Formulas: [
                    { Code: "test1", Description: "test"  },
                    { Code: "st2", Description: "desc"  }
                ],
                newCode: "",
                newDescription: ""
            });
            this.getView().setModel(oModel);
        },
         onNavigateToAddFormula() {
            this.getOwnerComponent().getRouter().navTo("formula");
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
        // onAdd: function () {
        //     // Logic to add new service type
        //     var oModel = this.getView().getModel();
        //     var newCode = oModel.getProperty("/newCode");
        //     var newDescription = oModel.getProperty("/newDescription");
        //     // Add to OData service
        //     oModel.create("/ServiceTypes", {
        //         Code: newCode,
        //         Description: newDescription,
        //         CreatedOn: new Date().toISOString().split('T')[0]
        //     }, {
        //         success: function () {
        //             oModel.setProperty("/newCode", "");
        //             oModel.setProperty("/newDescription", "");
        //         }
        //     });
        // },
       onEdit: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var oModel = this.getView().getModel();
                var sPath = oBindingContext.getPath();
                oModel.setProperty(sPath + "/editMode", true);
            }
        },
        onSave: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var oModel = this.getView().getModel();
                var sPath = oBindingContext.getPath();
                oModel.setProperty(sPath + "/editMode", false);
                // Changes are automatically saved due to two-way binding
            }
        },
        onDelete: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                var oModel = this.getView().getModel();
                var oItem = oModel.getProperty(sPath);

                MessageBox.confirm("Are you sure you want to delete " + oItem.Code + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            var aServiceTypes = oModel.getProperty("/ServiceTypes");
                            var iIndex = aServiceTypes.indexOf(oItem);
                            if (iIndex > -1) {
                                aServiceTypes.splice(iIndex, 1);
                                oModel.setProperty("/ServiceTypes", aServiceTypes);
                            }
                        }
                    }
                });
            }
        },
         onOpenAddServiceTypeDialog: function () {
            var oModel = this.getView().getModel();
            var oDialog = new Dialog({
                title: "Add New Service Type",
                content: new VBox({
                    items: [
                        new Label({ text: "Code" }),
                        new Input({ value: "{/newCode}", placeholder: "Enter Code" }),
                        new Label({ text: "Description" }),
                        new Input({ value: "{/newDescription}", placeholder: "Enter Description" })
                    ]
                }),
                beginButton: new Button({
                    text: "Add",
                    press: function () {
                        var newCode = oModel.getProperty("/newCode");
                        var newDescription = oModel.getProperty("/newDescription");
                        if (newCode && newDescription) {
                            oModel.getProperty("/ServiceTypes").push({
                                Code: newCode,
                                Description: newDescription,
                                CreatedOn: new Date().toISOString().split('T')[0],
                                editMode: false
                            });
                            oModel.setProperty("/newCode", "");
                            oModel.setProperty("/newDescription", "");
                            oDialog.close();
                        } else {
                            MessageBox.error("Please fill in both Code and Description.");
                        }
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oModel.setProperty("/newCode", "");
                        oModel.setProperty("/newDescription", "");
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.setModel(oModel);
            oDialog.open();
        }
    });
});