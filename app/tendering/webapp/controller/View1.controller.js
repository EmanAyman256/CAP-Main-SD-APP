sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",           
    "sap/ui/model/FilterOperator"    
], (Controller, MessageToast, MessageBox, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("tendering.controller.View1", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                DocumentNumber: "",
                SelectedItemNumber: "",
                ErrorMessage: "",
                documentItems: []
            });
            this.getView().setModel(oModel);
        },

        onValueHelpRequest: function(oEvent) {
            // ✅ DESTROY OLD DIALOG IF EXISTS
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.destroy();
                this._oValueHelpDialog = null;
            }

            // ✅ CREATE FRESH DIALOG EVERY TIME
            this._oValueHelpDialog = new sap.m.Dialog({
                title: "Select Quotation Number",
                contentWidth: "80%",
                contentHeight: "70%",
                content: [
                    new sap.m.SearchField({
                        width: "100%",
                        placeholder: "Search by quotation number, customer, status...",
                        search: this.onSearchQuotations.bind(this),
                        liveChange: this.onSearchQuotations.bind(this)
                    }),
                    
                    new sap.m.Table({
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
                                    const oTable = this._oValueHelpDialog.getContent()[1];
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
                    press: () => {
                        const oTable = this._oValueHelpDialog.getContent()[1];
                        const oSelectedItem = oTable.getSelectedItem();
                        if (oSelectedItem) {
                            const sQuotation = oSelectedItem.getCells()[0].getText();
                            this.byId("quotationInput").setValue(sQuotation);
                            this.getView().getModel().setProperty("/DocumentNumber", sQuotation);

                            const docNumber = this.getView().getModel().getProperty("/DocumentNumber");
                            console.log(docNumber);

                            fetch(`./odata/v4/sales-cloud/SalesQuotation('${docNumber}')/items`, {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })
                                .then(response => response.json())
                                .then(data => {
                                    console.log("Full Items Response:", data);

                                    if (data && data.value) {
                                        const documentItems = data.value.map(item => ({
                                            SalesQuotationItem: item.SalesQuotationItem,
                                            SalesQuotationItemText: item.SalesQuotationItemText
                                        }));
                                        this.getView().getModel().setProperty("/documentItems", documentItems);

                                        console.log("Stored documentItems:", documentItems);
                                    } else {
                                        sap.m.MessageBox.warning("No items found in SalesQuotation.");
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
                }),
                afterClose: () => {
                    this._oValueHelpDialog.destroy();
                    this._oValueHelpDialog = null;
                }
            });

            var oODataModel = this.getOwnerComponent().getModel();
            this._oValueHelpDialog.setModel(oODataModel);
            this.getView().addDependent(this._oValueHelpDialog);
            
            this._oValueHelpDialog.open();
        },

        onSearchQuotations: function (oEvent) {
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            
            if (!this._oValueHelpDialog) {
                return;
            }

            // Get table from dialog content (2nd element, index 1)
            const oTable = this._oValueHelpDialog.getContent()[1];
            const oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            if (!sQuery) {
                oBinding.filter([]);
                return;
            }

            const aFilters = [
                new Filter("SalesQuotation", FilterOperator.Contains, sQuery),
                new Filter("OverallSDProcessStatus", FilterOperator.Contains, sQuery),
                new Filter("CustomerPaymentTerms", FilterOperator.Contains, sQuery),
                new Filter("SoldToParty", FilterOperator.Contains, sQuery)
            ];

            const oCombinedFilter = new Filter({
                filters: aFilters,
                and: false
            });

            oBinding.filter(oCombinedFilter);
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

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("tendering", {
                docNumber: docNumber,
                itemNumber: itemNumber
            });
        }
    });
});