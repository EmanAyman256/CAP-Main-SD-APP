sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/layout/form/ResponsiveGridLayout"

], (Controller, JSONModel, Dialog, Button, Input, Label, VBox, MessageToast, SimpleForm, ResponsiveGridLayout, MessageBox) => {
    "use strict";

    return Controller.extend("tendering.controller.View1", {

        onInit: function () {

            var oModel = new sap.ui.model.json.JSONModel({
                docNumber: "",
                itemNumber: "",
                MainItems: [],
                Formulas: [],
                Currency: [],
                UOM: [],
                ServiceNumbers: [],
                SelectedServiceNumber: "",
                SelectedServiceNumberDescription: ""

            });
            this.getView().setModel(oModel);

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("tendering").attachPatternMatched(this._onRouteMatched, this);

            this._createSubItemDialog();

            // Fetch Service Numbers
            fetch("/odata/v4/sales-cloud/ServiceNumbers")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched ServiceNumbers:", data.value);

                    if (data && data.value) {
                        const ServiceNumbers = data.value.map(item => ({
                            serviceNumberCode: item.serviceNumberCode,
                            description: item.description
                        }));
                        this.getView().getModel().setProperty("/ServiceNumbers", ServiceNumbers);

                        console.log("ServiceNumbers:", ServiceNumbers);
                    }
                })
                .catch(err => {
                    console.error("Error fetching ServiceNumbers:", err);
                });
            // Fetch Formulas
            fetch("/odata/v4/sales-cloud/Formulas")
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}, ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched Formulas:", data); // Log the raw response
                    // Ensure data.value is an array
                    const formulas = Array.isArray(data.value) ? data.value : [];
                    oModel.setData({ Formulas: formulas });
                    console.log("ServiceNumbers set in model:", oModel.getProperty("/Formulas")); // Log the model data
                    // Refresh the model to ensure the table updates
                    oModel.refresh(true);
                })
                .catch(err => {
                    console.error("Error fetching Formulas:", err);
                    sap.m.MessageBox.error("Failed to load Formulas: " + err.message);
                });
            // Fetch UOM
            fetch("/odata/v4/sales-cloud/UnitOfMeasurements")
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}, ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched UOM:", data); // Log the raw response
                    // Ensure data.value is an array
                    const uom = Array.isArray(data.value) ? data.value : [];
                    oModel.setData({ UOM: uom });
                    console.log("Uom set in model:", oModel.getProperty("/UOM")); // Log the model data
                    // Refresh the model to ensure the table updates
                    oModel.refresh(true);
                })
                .catch(err => {
                    console.error("Error fetching Unit of Measurements:", err);
                    sap.m.MessageBox.error("Failed to load  Unit of Measurements: " + err.message);
                });
            // Fetch Currencies
            fetch("/odata/v4/sales-cloud/Currencies")
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}, ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched Currency:", data); // Log the raw response
                    // Ensure data.value is an array
                    const Currency = Array.isArray(data.value) ? data.value : [];
                    oModel.setData({ Currency: Currency });
                    console.log("Currency set in model:", oModel.getProperty("/Currency")); // Log the model data
                    // Refresh the model to ensure the table updates
                    oModel.refresh(true);
                })
                .catch(err => {
                    console.error("Error fetching Currency:", err);
                    sap.m.MessageBox.error("Failed to load  Currency: " + err.message);
                });
        },


        _onRouteMatched: function (oEvent) {
            var oView = this.getView();
            var oModel = oView.getModel();

            var args = oEvent.getParameter("arguments");
            var docNumber = args.docNumber;
            var itemNumber = args.itemNumber;

            console.log("Params:", docNumber, itemNumber);
            oModel.setProperty("/docNumber", docNumber);
            oModel.setProperty("/itemNumber", itemNumber);

            // OData request URL
            //var sUrl = `/odata/v4/sales-cloud/getInvoiceMainItemByReferenceIdAndItemNumber(SalesQuotation='${docNumber}',SalesQuotationItem='${itemNumber}')`;
            var sUrl = `/odata/v4/sales-cloud/getInvoiceMainItemByReferenceIdAndItemNumber`;

            // Fetch the data
            fetch(sUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    referenceId: docNumber,
                    salesQuotationItem: itemNumber
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.value);
                    oModel.setProperty("/MainItems", data.value);

                    // if it's an array, do:
                    // oModel.setProperty("/MainItems", data.value);
                    oView.byId("treeTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching MainItems", err);
                });

        },

        // formatHierIndex: function (oContext) {
        //     if (!oContext || !oContext.getPath) {
        //         return ""; // avoid crashes
        //     }
        //     // e.g. "/MainItems/0/subItemList/1"
        //     const sPath = oContext.getPath();
        //     const parts = sPath.match(/\d+/g); // ["0","1"]
        //     if (!parts) return "";

        //     // Convert to 1-based numbering
        //     return parts.map(p => parseInt(p, 10) + 1).join(".");
        // },

        onServiceNumberChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oSelectedItem = oSelect.getSelectedItem();

            var sKey = oSelectedItem.getKey();   // serviceNumberCode
            var sText = oSelectedItem.getText(); // description

            console.log("Selected Key:", sKey, " | Text:", sText);

            // Example: store both in model
            var oModel = this.getView().getModel();
            oModel.setProperty("/SelectedServiceNumber", sKey);
            oModel.setProperty("/SelectedServiceNumberDescription", sText);
        },

        _createSubItemDialog: function () {
            var oVBox = new VBox({
                items: [
                    // new Label({ text: "Sub Item No" }),
                    // new Input(this.createId("dialogSubItemNo"), { placeholder: "Enter Sub Item No" }),

                    new Label({ text: "Sub Service No" }),
                    new Input(this.createId("dialogSubServiceNo"), { placeholder: "Enter Service No" }),

                    new Label({ text: "Description" }),
                    new Input(this.createId("dialogSubDescription"), { placeholder: "Enter Description" }),

                    new Label({ text: "Quantity" }),
                    new Input(this.createId("dialogSubQuantity"), { type: "Number", placeholder: "Enter Quantity" }),

                    new Label({ text: "UOM" }),
                    new Input(this.createId("dialogSubUOM"), { placeholder: "Enter UOM" }),

                    new Label({ text: "Formula" }),
                    new Input(this.createId("dialogSubFormula"), { placeholder: "Enter Formula" }),

                    new Label({ text: "Parameters" }),
                    new Input(this.createId("dialogSubParameters"), { placeholder: "Enter Parameters" }),

                    new Label({ text: "AmountPerUnit" }),
                    new Input(this.createId("dialogSubAmountPerUnit"), { placeholder: "Enter AmountPerUnit" }),

                    new Label({ text: "Currency" }),
                    new Input(this.createId("dialogSubCurrency"), { placeholder: "Enter Currency" }),

                    new Label({ text: "Total" }),
                    new Input(this.createId("dialogSubTotal"), { placeholder: "Enter Total" }),
                ]
            }).addStyleClass("sapUiSmallMargin");

            this._oSubDialog = new Dialog({
                title: "Add Subitem",
                content: [oVBox],
                beginButton: new Button({
                    text: "Add",
                    type: "Emphasized",
                    press: this.onAddSubItem.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: this.onCancelSubDialog.bind(this)
                })
            });

            this.getView().addDependent(this._oSubDialog);
        },

        onOpenSubDialogForRow: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oObject = oContext.getObject();

            if (!oObject.subItemList) {
                MessageToast.show("You can only add subitems under a main item!");
                return;
            }

            this._selectedParent = oObject;

            // reset fields
            // this.byId("dialogSubItemNo").setValue("");
            this.byId("dialogSubServiceNo").setValue("");
            this.byId("dialogSubDescription").setValue("");
            this.byId("dialogSubQuantity").setValue("");
            this.byId("dialogSubUOM").setValue("");
            this.byId("dialogSubFormula").setValue("");
            this.byId("dialogSubParameters").setValue("");
            this.byId("dialogSubCurrency").setValue("");
            this.byId("dialogSubAmountPerUnit").setValue("");
            this.byId("dialogSubTotal").setValue("");

            this._oSubDialog.open();
        },

        onEditRow: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oData = oContext.getObject();
            var oModel = this.getView().getModel();

            // keep the edit path for saving later
            this._editPath = oContext.getPath();

            // copy the row data to a temp model property
            oModel.setProperty("/editRow", Object.assign({}, oData));

            // check if it is a main item or sub item
            if (oData.invoiceSubItemCode) {
                // === SubItem ===
                if (!this._oEditSubDialog) {
                    this._oEditSubDialog = new sap.m.Dialog({
                        title: "Edit Sub Item",
                        contentWidth: "800px",
                        content: [
                            // new sap.m.Label({ text: "SubItem No" }),
                            // new sap.m.Input({ value: "{/editRow/SubItemNo}", editable: false }),
                            new sap.m.Label({ text: "Service No" }),
                            new sap.m.Input({ value: "{/editRow/serviceNumberCode}" }),
                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/editRow/description}" }),
                            new sap.m.Label({ text: "Quantity" }),
                            new sap.m.Input({ value: "{/editRow/quantity}", type: "Number" }),
                            new sap.m.Label({ text: "UOM" }),
                            new sap.m.Input({ value: "{/editRow/unitOfMeasurementCode}" }),
                            new sap.m.Label({ text: "Formula" }),
                            new sap.m.Input({ value: "{/editRow/formulaCode}" }),
                            new sap.m.Label({ text: "AmountPerUnit" }),
                            new sap.m.Input({ value: "{/editRow/amountPerUnit}" }),
                            new sap.m.Label({ text: "Currency" }),
                            new sap.m.Input({ value: "{/editRow/currencyCode}" }),
                            new sap.m.Label({ text: "Total" }),
                            new sap.m.Input({ value: "{/editRow/total}" }),

                        ],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            press: this.onSaveEdit.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditSubDialog.close();
                            }.bind(this)
                        })
                    }).addStyleClass("sapUiSmallMargin");
                    this.getView().addDependent(this._oEditSubDialog);
                }
                this._oEditSubDialog.open();
            } else {
                // === Main Item ===
                if (!this._oEditMainDialog) {
                    this._oEditMainDialog = new sap.m.Dialog({
                        title: "Edit Main Item",
                        contentWidth: "800px",
                        contentHeight: "80%",
                        resizable: true,
                        draggable: true,

                        // content: new VBox({}),
                        content: [
                            new sap.m.Label({ text: "Main Item No" }),
                            new sap.m.Input({ value: "{/editRow/MainItemNo}", editable: false }),

                            new sap.m.Label({ text: "Service No" }),
                            new sap.m.Input({ value: "{/editRow/serviceNumberCode}" }),

                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/editRow/description}" }),

                            new sap.m.Label({ text: "Quantity" }),
                            new sap.m.Input({ value: "{/editRow/quantity}" }),

                            new sap.m.Label({ text: "UOM" }),
                            new sap.m.Input({ value: "{/editRow/unitOfMeasurementCode}" }),

                            new sap.m.Label({ text: "Formula" }),
                            new sap.m.Input({ value: "{/editRow/formulaCode}" }),

                            new sap.m.Label({ text: "Parameters" }),
                            new sap.m.Input({ value: "{/editRow/Parameters}" }),

                            new sap.m.Label({ text: "Amount Per Unit" }),
                            new sap.m.Input({ value: "{/editRow/amountPerUnit}" }),

                            new sap.m.Label({ text: "Currency" }),
                            new sap.m.Input({ value: "{/editRow/currencyCode}" }),

                            new sap.m.Label({ text: "Total" }),
                            new sap.m.Input({ value: "{/editRow/total}" }),

                            new sap.m.Label({ text: "Profit Margin" }),
                            new sap.m.Input({ value: "{/editRow/profitMargin}" }),

                            new sap.m.Label({ text: "Amount/Unit with Profit" }),
                            new sap.m.Input({ value: "{/editRow/amountPerUnitWithProfit}" }),

                            new sap.m.Label({ text: "Total with Profit" }),
                            new sap.m.Input({ value: "{/editRow/totalWithProfit}" })
                        ],

                        beginButton: new sap.m.Button({
                            text: "Save",
                            press: this.onSaveEdit.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditMainDialog.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this._oEditMainDialog);
                }
                //  this._oEditMainDialog.removeAllContent();
                // this._oEditMainDialog.addContent(
                //    // new sap.ui.layout.form.
                //     new SimpleForm({
                //         editable: true,
                //         layout: "ResponsiveGridLayout",
                //         content: [
                //             new sap.m.Label({ text: "Main Item No" }),
                //             new sap.m.Input({ value: "{/editRow/MainItemNo}", editable: false }),

                //             new sap.m.Label({ text: "Service No" }),
                //             new sap.m.Input({ value: "{/editRow/serviceNumberCode}" }),

                //             new sap.m.Label({ text: "Description" }),
                //             new sap.m.Input({ value: "{/editRow/description}" }),

                //             new sap.m.Label({ text: "Quantity" }),
                //             new sap.m.Input({ value: "{/editRow/quantity}" }),

                //             new sap.m.Label({ text: "UOM" }),
                //             new sap.m.Input({ value: "{/editRow/unitOfMeasurementCode}" }),

                //             new sap.m.Label({ text: "Formula" }),
                //             new sap.m.Input({ value: "{/editRow/formulaCode}" }),

                //             new sap.m.Label({ text: "Parameters" }),
                //             new sap.m.Input({ value: "{/editRow/Parameters}" }),

                //             new sap.m.Label({ text: "Amount Per Unit" }),
                //             new sap.m.Input({ value: "{/editRow/amountPerUnit}" }),

                //             new sap.m.Label({ text: "Currency" }),
                //             new sap.m.Input({ value: "{/editRow/currencyCode}" }),

                //             new sap.m.Label({ text: "Total" }),
                //             new sap.m.Input({ value: "{/editRow/total}" }),

                //             new sap.m.Label({ text: "Profit Margin" }),
                //             new sap.m.Input({ value: "{/editRow/profitMargin}" }),

                //             new sap.m.Label({ text: "Amount/Unit with Profit" }),
                //             new sap.m.Input({ value: "{/editRow/amountPerUnitWithProfit}" }),

                //             new sap.m.Label({ text: "Total with Profit" }),
                //             new sap.m.Input({ value: "{/editRow/totalWithProfit}" })
                //         ],
                //     })
                // );

                this._oEditMainDialog.open();
            }

        },

        onSaveEdit: function () {
            var oModel = this.getView().getModel();
            var oEdited = oModel.getProperty("/editRow");

            // write back changes to original data
            oModel.setProperty(this._editPath, oEdited);

            // close whichever dialog is open
            if (this._oEditSubDialog && this._oEditSubDialog.isOpen()) {
                this._oEditSubDialog.close();
            }
            if (this._oEditMainDialog && this._oEditMainDialog.isOpen()) {
                this._oEditMainDialog.close();
            }
        },

        onAddSubItem: function () {
            var oSubItem = {
                // SubItemNo: this.byId("dialogSubItemNo").getValue(),
                invoiceSubItemCode: Date.now(),

                serviceNumberCode: this.byId("dialogSubServiceNo").getValue(),
                description: this.byId("dialogSubDescription").getValue(),
                quantity: this.byId("dialogSubQuantity").getValue(),
                unitOfMeasurementCode: this.byId("dialogSubUOM").getValue(),
                formulaCode: this.byId("dialogSubFormula").getValue(),
                amountPerUnit: this.byId("dialogSubAmountPerUnit").getValue(),
                currencyCode: this.byId("dialogSubCurrency").getValue(),
                total: this.byId("dialogSubTotal").getValue(),
            };

            if (!this._selectedParent.subItemList) {
                this._selectedParent.subItemList = [];
            }
            this._selectedParent.subItemList.push(oSubItem);
            console.log(oSubItem);
            console.log(this._selectedParent);

            this.getView().getModel().refresh(true);
            this._oSubDialog.close();
        },
        onDeleteRow: function (oEvent) {
            const oModel = this.getView().getModel();
            const oContext = oEvent.getSource().getBindingContext();
            const oObject = oContext.getObject();
            const sPath = oContext.getPath();

            sap.m.MessageBox.confirm(
                "Are you sure you want to delete this item?",
                {
                    title: "Confirm Deletion",
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: (sAction) => {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            if (oObject.invoiceSubItemCode) {
                                // Subitem deletion
                                const aParts = sPath.split("/"); // "/MainItems/0/children/1"
                                const iMainIndex = parseInt(aParts[2]);
                                const iSubIndex = parseInt(aParts[4]);

                                const aMainItems = oModel.getProperty("/MainItems");
                                aMainItems[iMainIndex].subItemList.splice(iSubIndex, 1);

                                sap.m.MessageToast.show("SubItem deleted successfully");
                            } else {
                                // Main item deletion
                                const iMainIndex = parseInt(sPath.split("/")[2]);

                                const aMainItems = oModel.getProperty("/MainItems");
                                aMainItems.splice(iMainIndex, 1);

                                sap.m.MessageToast.show("MainItem deleted successfully");
                            }

                            oModel.refresh();
                        }
                    }
                }
            );
        },

        onCancelSubDialog: function () {
            this._oSubDialog.close();
        },
        onCollapseAll: function () {
            const oTreeTable = this.byId("treeTable");
            oTreeTable.collapseAll();
        },

        onCollapseSelection: function () {
            const oTreeTable = this.byId("treeTable");
            oTreeTable.collapse(oTreeTable.getSelectedIndices());
        },

        onExpandFirstLevel: function () {
            const oTreeTable = this.byId("treeTable");
            oTreeTable.expandToLevel(1);
        },

        onExpandSelection: function () {
            const oTreeTable = this.byId("treeTable");
            oTreeTable.expand(oTreeTable.getSelectedIndices());
        },

        onOpenMainDialog: function () {
            this.byId("addMainDialog").open();
        },

        onOpenSubDialog: function () {
            this.byId("addSubDialog").open();
        },

        onCloseDialog: function (oEvent) {
            oEvent.getSource().getParent().close();
        },

        // Add Main Item
        // onAddMainItem: function () {
        //     var oModel = this.getView().getModel();
        //     var aMainItems = oModel.getProperty("/MainItems");
        //     var oNewItem = Object.assign({}, oModel.getProperty("/newMainItem"));

        //     // initialize children if not present
        //     oNewItem.children = [];

        //     // push to model
        //     aMainItems.push(oNewItem);
        //     oModel.setProperty("/MainItems", aMainItems);

        //     // clear form after adding
        //     oModel.setProperty("/newMainItem", {});

        //     this.byId("addMainItemDialog").close();
        // },

        onCloseMainItemDialog: function () {
            this.byId("addMainItemDialog").close();
        },

        onAddMainItem: function () {

            const oView = this.getView();
            // const oModel = oView.getModel();
            const oModel = this.getView().getModel(); // default model
            let newww = oModel.getProperty("/MainItems");
            // const aMainItems = oModel.getProperty("/MainItems");
            console.log(newww);

            const invoiceMainItemCommands = {
                serviceNumberCode: oModel.getProperty("SelectedServiceNumber"),
                description: oView.byId("mainDescriptionInput").getValue(),
                quantity: oView.byId("mainQuantityInput").getValue(),
                unitOfMeasurementCode: oView.byId("_IDGenSelect4").getSelectedKey(),
                formulaCode: oView.byId("_IDGenSelect2").getSelectedKey(),
                amountPerUnit: oView.byId("mainAmountPerUnitInput").getValue(),
                currencyCode: oView.byId("_IDGenSelect5").getSelectedKey(),
                total: oView.byId("mainTotalInput").getValue(),
                profitMargin: oView.byId("mainProfitMarginInput").getValue(),
                amountPerUnitWithProfit: oView.byId("mainAmountPerUnitWithProfitInput").getValue(),
                totalWithProfit: oView.byId("mainTotalWithProfitInput").getValue(),
                subItemList: []
            }
            const oNewMain = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "1",
                pricingProcedureCounter: "10",
                customerNumber: "120000",
                // invoiceMainItemCommands: invoiceMainItemCommands

                invoiceMainItemCode: Date.now(),

                serviceNumberCode: oModel.getProperty("SelectedServiceNumber"),
                description: oView.byId("mainDescriptionInput").getValue(),
                quantity: oView.byId("mainQuantityInput").getValue(),
                unitOfMeasurementCode: oView.byId("_IDGenSelect4").getSelectedKey(),
                formulaCode: oView.byId("_IDGenSelect2").getSelectedKey(),
                amountPerUnit: oView.byId("mainAmountPerUnitInput").getValue(),
                currencyCode: oView.byId("_IDGenSelect5").getSelectedKey(),
                total: oView.byId("mainTotalInput").getValue(),
                profitMargin: oView.byId("mainProfitMarginInput").getValue(),
                amountPerUnitWithProfit: oView.byId("mainAmountPerUnitWithProfitInput").getValue(),
                totalWithProfit: oView.byId("mainTotalWithProfitInput").getValue(),
                subItemList: []

            };
            console.log(oModel.getProperty("/MainItems"));

            const aMainItems = oModel.getProperty("/MainItems");
            console.log(aMainItems);
            aMainItems.push(oNewMain);
            var aRecords = oModel.getProperty("/MainItems") || [];
            console.log(aRecords);

            //aRecords.push(oNewMain);
            oModel.setProperty("/MainItems", aRecords);
            console.log(oModel.getProperty("/MainItems"));

            //////////////////////////////////
            // fetch("/odata/v4/sales-cloud/saveOrUpdateMainItems", {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json"
            //     },
            //     body: JSON.stringify(oNewMain)
            // })
            //     .then(response => {
            //         if (!response.ok) {
            //             throw new Error("Failed to save: " + response.statusText);
            //         }
            //         return response.json();
            //     })
            //     .then(savedItem => {
            //         var aServiceTypes = oModel.getProperty("/MainItems") || [];
            //         aServiceTypes.push(savedItem);
            //         oModel.setProperty("/MainItems", aServiceTypes);

            //         // Reset form
            //         oModel.setProperty("/newCode", "");
            //         oModel.setProperty("/newDescription", "");
            //     })
            //     .catch(err => {
            //         console.error("Error saving MainItem:", err);
            //         sap.m.MessageBox.error("Error: " + err.message);
            //     });

            oModel.refresh();

            this.byId("addMainDialog").close();
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("treeTable");
            var oBinding = oTable.getBinding("rows");

            if (sQuery) {
                var aFilters = [
                    new sap.ui.model.Filter("MainItemNo", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("SubItemNo", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("ServiceNo", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("Quantity", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("UOM", sap.ui.model.FilterOperator.Contains, sQuery)
                ];
                var oFinalFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });

                oBinding.filter([oFinalFilter]);
            } else {
                // Clear filter if empty search
                oBinding.filter([]);
            }
        }
    });
});