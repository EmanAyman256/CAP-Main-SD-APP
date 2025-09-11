sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/ui/model/odata/v4/ODataModel"

], function (Controller, MessageBox, Dialog, Input, Button, Label, VBox) {
    "use strict";

    return Controller.extend("project1.controller.ServiceType", {
        onInit: function () {
            // var oModel = new sap.ui.model.json.JSONModel({
            //     ServiceTypes: [
            //         { Code: "test1", Description: "test", CreatedOn: "2025-08-18", editMode: false },
            //         { Code: "st2", Description: "desc", CreatedOn: "2025-08-18", editMode: false }
            //     ],
            //     newCode: "",
            //     newDescription: ""
            // });

            // this.getView().setModel(oModel);


            // Fetch data from CAP OData service
            fetch("/odata/v4/SalesCloudService/ServiceType")
                .then(response => response.json())
                .then(data => {

                    // Wrap array inside an object for binding
                    oModel.setData({ ServiceTypes: data.value });
                    this.getView().byId("serviceTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching ServiceTypes", err);
                });


            // var oModel = new sap.ui.model.odata.v4.ODataModel({
            //     serviceUrl: "https://port4004-workspaces-ws-j72gp.us10.trial.applicationstudio.cloud.sap/odata/v4/sales-cloud/"
            // });

            // this.getView().setModel(oModel, "ServiceModel");
            // var oBinding = oModel.bindList("/ServiceTypes");
            // oBinding.requestContexts().then(function (aContexts) {
            //     aContexts.forEach(function (oContext) {
            //         console.log(oContext.getObject()); 
            //     });
            // });

        },
       
        onAdd: function () {
            var oModel = this.getView().getModel();
            var newCode = oModel.getProperty("/newCode");
            var newDescription = oModel.getProperty("/newDescription");

            if (newCode && newDescription) {
                // Prepare payload matching CAP entity
                var newServiceType = {
                    serviceTypeCode: parseInt(newCode, 10),
                    description: newDescription,
                    createdOn: new Date().toISOString().split("T")[0]
                };

                // Call CAP OData service
                fetch("/odata/v4/SalesCloudService/ServiceType", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newServiceType)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("Failed to save: " + response.statusText);
                        }
                        return response.json();
                    })
                    .then(savedItem => {
                        // Update local model after DB save
                        var aServiceTypes = oModel.getProperty("/ServiceType") || [];
                        aServiceTypes.push(savedItem);
                        oModel.setProperty("/ServiceType", aServiceTypes);

                        // Clear form inputs
                        oModel.setProperty("/newCode", "");
                        oModel.setProperty("/newDescription", "");
                    })
                    .catch(err => {
                        console.error("Error saving ServiceType:", err);
                    });
            }
        }
        ,
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
                            var aContent = this._oEditDialog.getContent()[0].getContent(); // SimpleForm content
                            oSelectedData.Code = aContent[1].getValue();        // Input after first Label
                            oSelectedData.Description = aContent[3].getValue(); // Input after second Label

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
                new sap.ui.layout.form.SimpleForm({
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    content: [
                        new Label({ text: "Code", design: "Bold" }),
                        new Input({ value: oSelectedData.Code }),
                        new Label({ text: "Description", design: "Bold" }),
                        new Input({ value: oSelectedData.Description })
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
            console.log(oModel);

            var oDialog = new Dialog({
                title: "Add New Service Type",
                content: new sap.ui.layout.form.SimpleForm({
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    content: [
                        new Label({ text: "Code", design: "Bold" }),
                        new Input({ value: "{/newCode}", placeholder: "Enter Code" }),

                        new Label({ text: "Description", design: "Bold" }),
                        new Input({ value: "{/newDescription}", placeholder: "Enter Description" })
                    ]
                }),
                beginButton: new Button({
                    text: "Add",
                    press: function () {
                        var newCode = oModel.getProperty("/newCode");
                        var newDescription = oModel.getProperty("/newDescription");
                        // if (newCode && newDescription) {
                        //     oModel.getProperty("/ServiceTypes").push({
                        //         serviceId: newCode,
                        //         description: newDescription,
                        //         // CreatedOn: new Date().toISOString().split('T')[0],
                        //         // editMode: false
                        //     });
                        //     oModel.setProperty("/newCode", "");
                        //     oModel.setProperty("/newDescription", "");
                        //     oDialog.close();
                        // } else {
                        //     MessageBox.error("Please fill in both Code and Description.");
                        // }

                        var newData = oTempModel.getData();
                        if (newData.newCode && newData.newDescription) {
                            // Now create in OData V4 model
                            var oODataModel = this.getView().getModel("ServiceModel");
                            oODataModel.create("/ServiceTypes", {
                                serviceId: newData.newCode,
                                description: newData.newDescription,
                                createdAt: new Date().toISOString()
                            }, {
                                success: function () {
                                    sap.m.MessageToast.show("Service Type created successfully!");
                                    oDialog.close();
                                },
                                error: function (oError) {
                                    sap.m.MessageBox.error("Error creating ServiceType: " + oError.message);
                                }
                            });
                        } else {
                            sap.m.MessageBox.error("Please fill in both fields.");
                        }

                    }.bind(this)
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
