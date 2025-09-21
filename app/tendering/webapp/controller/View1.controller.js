sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("tendering.controller.View1", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                DocumentNumber: "",
                SelectedItemNumber: "",
                ErrorMessage: "",
                documentItems:[]
            });
            this.getView().setModel(oModel);
        },


        onValueHelpRequest(oEvent) {
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new sap.m.Dialog({
                    title: "Select Quotation Number",
                    content: [
                        new sap.m.Table({
                            id: this.createId("quotationTable"),
                            mode: "SingleSelectMaster",
                            growing: true,
                            growingThreshold: 50,
                            columns: [
                                new sap.m.Column({ header: new sap.m.Label({ text: "Quotation Number" }) }),
                                new sap.m.Column({ header: new sap.m.Label({ text: "OverallSDProcessStatus" }) }),
                                new sap.m.Column({ header: new sap.m.Label({ text: "CustomerPaymentTerms" }) }),
                                new sap.m.Column({ header: new sap.m.Label({ text: "SoldToParty" }) })
                            ],
                            items: {
                                path: "/SalesQuotation",
                                parameters: {
                                    $count: true
                                },
                                template: new sap.m.ColumnListItem({
                                    type: "Active",
                                    cells: [
                                        new sap.m.Text({ text: "{SalesQuotation}" }),
                                        new sap.m.Text({ text: "{OverallSDProcessStatus}" }),
                                        new sap.m.Text({ text: "{CustomerPaymentTerms}" }),
                                        new sap.m.Text({ text: "{SoldToParty}" })
                                    ]
                                }),
                                events: {
                                    dataReceived: (oEvent) => {
                                        const oBinding = oEvent.getSource();
                                        const oTable = this.byId("quotationTable");
                                        const aItems = oTable.getItems();
                                        const oContext = oEvent.getParameter("data");
                                        console.log("Total items received:", aItems.length);
                                        console.log("Total count from server:", oContext?.__count || "N/A");
                                        if (aItems.length === 0) {
                                            sap.m.MessageBox.warning("No data found in A_SalesQuotation.");
                                        }
                                    }
                                }
                            }
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Confirm",
                        press: (oEvent) => {
                            const oTable = this.byId("quotationTable");
                            const oSelectedItem = oTable.getSelectedItem();
                            if (oSelectedItem) {
                                const sQuotation = oSelectedItem.getCells()[0].getText();
                                this.byId("quotationInput").setValue(sQuotation);
                                this.getView().getModel().setProperty("/DocumentNumber", sQuotation);
                                //this.updateSimulateButtonState();
                                /*  
                                  fetch("/odata/v4/sales-cloud/ServiceTypes")
                .then(response => response.json())
                .then(data => {
                    // Wrap array inside an object for binding
                    oModel.setData({ ServiceTypes: data.value });
                    this.getView().byId("serviceTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching ServiceTypes", err);
                });

                                */
                                const docNumber = this.getView().getModel().getProperty("/DocumentNumber");
                                fetch(`/odata/v4/sales-cloud/ServiceTypes('${docNumber}')`, {
                                    method: "GET",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    // body: JSON.stringify({
                                    //     serviceId: sNewCode,       // optional if Code is key, only update if editable
                                    //     description: sNewDescription
                                    // })
                                })
                                    .then(response => {
                                        console.log(response);
                                         this.getView().getModel().setProperty("/documentItems", response.value);
                                        return response.json();
                                    })
                                    .catch(err => {
                                        console.error("Error fetching items:", err);
                                        sap.m.MessageBox.error("Error: " + err.message);
                                    });
                                this._oValueHelpDialog.close();
                            }
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: () => {
                            this._oValueHelpDialog.close();
                        }
                    })
                });

                var oODataModel = this.getOwnerComponent().getModel();
                this._oValueHelpDialog.setModel(oODataModel);
                this.getView().addDependent(this._oValueHelpDialog);
            }
            this._oValueHelpDialog.open();
        },

        onNextPress: function () {

           // var itemNumber = oView.byId("_IDGenSelect").getSelectedKey();
            // fetch services by item number
            var oModel = this.getView().getModel();
            var sItem = oModel.getProperty("/SelectedItemNumber");

            if (!sItem) {
                oModel.setProperty("/ErrorMessage", "Item Number is required");
                return;
            }
            oModel.setProperty("/ErrorMessage", "");
            MessageToast.show("Navigating to next step with item: " + sItem);
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("tendering");
        }

    });
});