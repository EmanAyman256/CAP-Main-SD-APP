sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("invoice.controller.View1", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                DocumentNumber: "",
                SelectedItemNumber: "",
                ErrorMessage: "",
                documentItems: []
            });
            this.getView().setModel(oModel);
        },


        onValueHelpRequest(oEvent) {
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new sap.m.Dialog({
                    title: "Select Debit Memo Number",
                    content: [
                        new sap.m.Table({
                            id: this.createId("debitTable"),
                            mode: "SingleSelectMaster",
                            growing: true,
                            growingThreshold: 50,
                            columns: [
                                new sap.m.Column({ header: new sap.m.Label({ text: "Debit Memo Number" }) }),
                                new sap.m.Column({ header: new sap.m.Label({ text: "OverallOrdReltdBillgStatus" }) }),
                                new sap.m.Column({ header: new sap.m.Label({ text: "DebitMemoRequestType" }) }),
                                new sap.m.Column({ header: new sap.m.Label({ text: "SoldToParty" }) })
                            ],
                            items: {
                                path: "/DebitMemo",
                                parameters: {
                                    $count: true
                                },
                                template: new sap.m.ColumnListItem({
                                    type: "Active",
                                    cells: [
                                        new sap.m.Text({ text: "{DebitMemoRequest}" }),
                                        new sap.m.Text({ text: "{OverallOrdReltdBillgStatus}" }),
                                        new sap.m.Text({ text: "{DebitMemoRequestType}" }),
                                        new sap.m.Text({ text: "{SoldToParty}" })
                                    ]
                                }),
                                events: {
                                    dataReceived: (oEvent) => {
                                        const oBinding = oEvent.getSource();
                                        const oTable = this.byId("debitTable");
                                        const aItems = oTable.getItems();
                                        const oContext = oEvent.getParameter("data");
                                        console.log("Total items received:", aItems.length);
                                        console.log("Total count from server:", oContext?.__count || "N/A");
                                        if (aItems.length === 0) {
                                            sap.m.MessageBox.warning("No data found in Debit Memo.");
                                        }
                                    }
                                }
                            }
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Confirm",
                        press: (oEvent) => {
                            const oTable = this.byId("debitTable");
                            const oSelectedItem = oTable.getSelectedItem();
                            if (oSelectedItem) {
                                const sOrder = oSelectedItem.getCells()[0].getText();
                                this.byId("debitmemoInput").setValue(sOrder);
                                this.getView().getModel().setProperty("/DocumentNumber", sOrder);


                                const docNumber = this.getView().getModel().getProperty("/DocumentNumber");
                                console.log(docNumber);

                                fetch(`/odata/v4/sales-cloud/findItemsByDebitMemoRequest?debitMemoRequest'${docNumber}'`, {
                                    method: "GET",
                                    headers: {
                                        "Content-Type": "application/json"
                                    }
                                })
                                    .then(response => response.json())
                                    .then(data => {
                                        // Parse
                                        const parsedValue = JSON.parse(data.value);

                                        console.log("Parsed Value:", parsedValue);
                                        console.log("Items Value:", parsedValue.d.results);
                                        if (parsedValue && parsedValue.d && parsedValue.d.results) {
                                            const documentItems = parsedValue.d.results.map(item => ({
                                                DebitMemoRequestItem: item.DebitMemoRequestItem,
                                                DebitMemoRequestItemText: item.DebitMemoRequestItemText
                                            }));

                                            this.getView().getModel().setProperty("/documentItems", documentItems);

                                            console.log("Stored documentItems:", documentItems);
                                        } else {
                                            sap.m.MessageBox.warning("No items found in Debit Memo.");
                                        }
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
            const oView = this.getView();
            const oModel = oView.getModel();

            const itemNumber = oView.byId("_IDGenSelect").getSelectedKey();
            const docNumber = oModel.getProperty("/DocumentNumber");

            if (!docNumber) {
                MessageBox.warning("Document Number is required.");
                return;
            }

            if (!itemNumber) {
                MessageBox.warning("Item Number is required.");
                return;
            }

            oModel.setProperty("/ErrorMessage", "");

            MessageToast.show("Navigating to next step with Doc: " + docNumber + ", Item: " + itemNumber);

            // Navigate
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("invoice", {
                docNumber: docNumber,
                itemNumber: itemNumber
            });
        }
    });
});