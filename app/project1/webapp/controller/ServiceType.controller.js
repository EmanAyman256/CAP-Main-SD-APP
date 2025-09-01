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

    return Controller.extend("project1.controller.ServiceType", {
         onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                ServiceTypes: [
                    { Code: "test1", Description: "test", CreatedOn: "2025-08-18",editMode: false  },
                    { Code: "st2", Description: "desc", CreatedOn: "2025-08-18",editMode: false  }
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
                    title: "Edit Service Type",
                    titleAlignment: "Center",
                    contentWidth: "600px",
                    content: new VBox({}),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: () => {
                            // Read values back from inputs
                            var aContent = this._oEditDialog.getContent()[0].getItems();
                            oSelectedData.Code = aContent[1].getValue();
                            oSelectedData.Description = aContent[3].getValue();

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
                        new Label({ text: "Code", design: "Bold" }),
                        new Input({ value: oSelectedData.Code }),

                        new Label({ text: "Description", design: "Bold" }),
                        new Input({ value: oSelectedData.Description }),
                    ]
                })
            );

            this._oEditDialog.open();
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