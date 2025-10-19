
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
                totalValue: 0,
                docNumber: "",
                itemNumber: "",
                MainItems: [],
                Formulas: [],
                Currency: [],
                UOM: [],
                Total: 0,
                SubTotal: 0,
                IsFormulaBasedQuantity: false,
                ServiceNumbers: [],
                SelectedServiceNumber: "",
                SelectedSubServiceNumber: "",
                SelectedServiceNumberDescription: "",
                SelectedSubDescription: "",
                SelectedSubDescriptionText: "",
                SubDescriptionEditable: true,
                SelectedFormula: null,
                totalWithProfit: 0,
                amountPerUnitWithProfit: 0,
                SelectedSubFormula: null,
                HasSelectedFormula: false,
                HasSelectedSubFormula: false,
                FormulaParameters: {},
                SubFormulaParameters: {}
            });
            this.getView().setModel(oModel);

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("tendering").attachPatternMatched(this._onRouteMatched, this);

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
                .then(r => r.json())
                .then(data => {
                    const formulas = Array.isArray(data.value) ? data.value : [];
                    console.log("Fetched Formulas:", formulas); // Debug
                    oModel.setProperty("/Formulas", formulas);
                    oModel.refresh(true);
                })
                .catch(err => {
                    console.error("Error fetching Formulas:", err);
                    sap.m.MessageToast.show("Failed to load formulas.");
                });
            fetch("/odata/v4/sales-cloud/UnitOfMeasurements")
                .then(r => r.json())
                .then(data => {
                    const uom = Array.isArray(data.value) ? data.value : [];
                    oModel.setProperty("/UOM", uom);
                    oModel.refresh(true);
                });

            // Fetch Currencies
            fetch("/odata/v4/sales-cloud/Currencies")
                .then(r => r.json())
                .then(data => {
                    const currency = Array.isArray(data.value) ? data.value : [];
                    oModel.setProperty("/Currency", currency);
                    oModel.refresh(true);
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

                    const mainItems = Array.isArray(data.value) ? data.value : [];
                    // Calculate the total sum
                    const totalValue = mainItems.reduce(
                        (sum, record) => sum + Number(record.total || 0),
                        0
                    );
                    //totalWithProfit

                    console.log("Total Value:", totalValue);

                    oModel.setProperty("/MainItems", data.value);
                    oModel.setProperty("/totalValue", totalValue);
                    // if it's an array, do:
                    // oModel.setProperty("/MainItems", data.value);
                    oView.byId("treeTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching MainItems", err);
                });

        },
        onInputChange: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEditRow = oModel.getProperty("/editRow");

            // Get values
            var sQuantity = oView.byId("mainQuantityInput").getValue();
            var sAmount = oView.byId("mainAmountPerUnitInput").getValue();
            var sProfitMargin = oView.byId("mainProfitMarginInput").getValue()

            var editQuantity = oView.byId("editMainQuantityInput").getValue();
            var editAmount = oView.byId("editMainAmountPerUnitInput").getValue();
            var editProfitMargin = oView.byId("editMainProfitMarginInput").getValue()

            var iQuantity = parseFloat(sQuantity) || 0;
            var iAmount = parseFloat(sAmount) || 0;
            var iProfitMargin = parseFloat(sProfitMargin) || 0;
            var eQuantity = parseFloat(editQuantity) || 0;
            var eAmount = parseFloat(editAmount) || 0;
            var eProfitMargin = parseFloat(editProfitMargin) || 0;
            // Calculate total
            var eTotal = eQuantity * eAmount;
            var eTotalWithProfit = (eQuantity / eProfitMargin) * 100;
            var eAmountPerUnitWithProfit = (eAmount / eProfitMargin) * 100;
            var iTotal = iQuantity * iAmount;
            var totalWithProfit = (iTotal / iProfitMargin) * 100;
            var amountPerUnitWithProfit = (iAmount / iProfitMargin) * 100;

            oEditRow.total = eTotal.toFixed(2);
            oEditRow.totalWithProfit = eTotalWithProfit.toFixed(2);
            oEditRow.amountPerUnitWithProfit = eAmountPerUnitWithProfit.toFixed(2);

            // Now update the model so bindings refresh
            oModel.setProperty("/editRow", oEditRow);

            // Update model
            oModel.setProperty("/Total", iTotal);
            oModel.setProperty("/totalWithProfit", totalWithProfit);
            oModel.setProperty("/amountPerUnitWithProfit", amountPerUnitWithProfit);

        },
        onServiceNumberChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oSelectedItem = oSelect.getSelectedItem();
            var oDescriptionInput = this.byId("mainDescriptionInput");
            var oDescSubItems = this.byId("dialogSubDescription")
            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();   // serviceNumberCode
                var sText = oSelectedItem.getText(); // description

                console.log("Selected Key:", sKey, " | Text:", sText);

                // Store both in model
                var oModel = this.getView().getModel();
                oModel.setProperty("/SelectedServiceNumber", sKey);
                oModel.setProperty("/SelectedServiceNumberDescription", sText);

                // Fill input & lock it
                oDescriptionInput.setValue(sText);
                oDescriptionInput.setEditable(false);
            } else {
                // If nothing selected -> clear & allow manual typing
                oDescriptionInput.setValue("");
                oDescriptionInput.setEditable(true);
            }
        }
        ,
        _calculateFormulaResult: function (oFormula, oParams) {
            if (!oFormula || !oParams) return 0;

            try {
                // Use the formulaLogic property from the backend
                let expression = oFormula.formulaLogic; // e.g. "22/7*r^2"
                console.log("expression", expression);

                // Replace parameter names with actual values entered by the user
                oFormula.parameterIds.forEach(paramId => {
                    const value = parseFloat(oParams[paramId]) || 0;
                    expression = expression.replaceAll(paramId, value);
                });

                // Replace ^ with ** to make it valid JavaScript
                expression = expression.replace(/\^/g, "**");

                // Safely evaluate
                const result = Function('"use strict";return (' + expression + ')')();

                // Round to 2 decimals for display
                console.log(parseFloat(result.toFixed(2)));

                return parseFloat(result.toFixed(2));
            } catch (err) {
                console.error("Error evaluating formula:", err);
                sap.m.MessageToast.show("Invalid formula or parameters.");
                return 0;
            }
        },

        onFormulaSelected: function (oEvent) {
            var oSelect = oEvent.getSource();
            var sKey = oSelect.getSelectedKey();
            var oModel = this.getView().getModel();
            var aFormulas = oModel.getProperty("/Formulas") || [];
            var oFormula = aFormulas.find(f => f.formulaCode === sKey);

            oModel.setProperty("/SelectedFormula", oFormula || null);
            oModel.setProperty("/HasSelectedFormula", !!oFormula);

            // If user cleared formula, enable manual input
            var oQuantityInput = this.byId("mainQuantityInput");
            if (!oFormula) {
                oQuantityInput.setEditable(true);
                oModel.setProperty("/IsFormulaBasedQuantity", false);
                oQuantityInput.setValue(""); // optional: clear old value
            }
        },
        onApplyProfitMargin: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oTable = oView.byId("treeTable"); // your main table ID
            var aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                sap.m.MessageToast.show("Please select a main item first.");
                return;
            }

            var iIndex = aSelectedIndices[0];
            var sPath = oTable.getContextByIndex(iIndex).getPath();
            var oItem = oModel.getProperty(sPath);

            // Get entered profit margin
            var eProfitMargin = parseFloat(oView.byId("groupInput").getValue()) || 0;
            var eQuantity = parseFloat(oItem.quantity) || 0;
            var eAmount = parseFloat(oItem.amountPerUnit) || 0;
            var eTotal = eQuantity * eAmount;
            var eAmountPerUnitWithProfit = (eAmount / eProfitMargin) * 100;
            var eTotalWithProfit = (eTotal / eProfitMargin) * 100;

            if (eProfitMargin === 0) {
                eAmountPerUnitWithProfit = 0
                eTotalWithProfit = 0
            }
            else {
                var eTotal = eQuantity * eAmount;
                var eAmountPerUnitWithProfit = (eAmount / eProfitMargin) * 100;
                var eTotalWithProfit = (eTotal / eProfitMargin) * 100;
            }
            // Calculate new totals
            // Update the row
            oItem.profitMargin = eProfitMargin;
            oItem.total = eTotal.toFixed(2);
            oItem.amountPerUnitWithProfit = eAmountPerUnitWithProfit.toFixed(2);
            oItem.totalWithProfit = eTotalWithProfit.toFixed(2);

            // Update model to refresh UI
            oModel.setProperty(sPath, oItem);

            sap.m.MessageToast.show("Profit margin applied to selected item.");
        },


        onOpenFormulaDialog: function (oEvent) {
            var oButton = oEvent.getSource();
            var sButtonId = oButton.getId();
            console.log("BUTTON PRESS FIRED! Button ID:", sButtonId); // Key: Share this log!

            // More robust ID check: Split on '--' to get local ID, then check
            var sLocalId = sButtonId.split('--').pop(); // Gets "btnSubParameters" from namespaced ID
            var sItemType = sLocalId === "btnSubParameters" ? "sub" : "main"; // Exact local match
            console.log("Detected Item Type:", sItemType); // Should be "sub"

            var oModel = this.getView().getModel();
            var oFormula = sItemType === "sub" ? oModel.getProperty("/SelectedSubFormula") : oModel.getProperty("/SelectedFormula");

            console.log("Raw /SelectedSubFormula from model:", oModel.getProperty("/SelectedSubFormula")); // Always log this
            console.log("Raw /SelectedFormula from model:", oModel.getProperty("/SelectedFormula")); // For comparison
            console.log("Formula retrieved for " + sItemType + ":", oFormula); // This triggers toast if null

            if (!oFormula) {
                MessageToast.show("Please select a formula first.");
                return;
            }

            // Rest unchanged...
            var oVBox = sItemType === "sub" ? this.byId("subFormulaParamContainer") : this.byId("formulaParamContainer");
            oVBox.removeAllItems();

            var oParams = {};
            oFormula.parameterIds.forEach((sId, i) => {
                oParams[sId] = "";
                oVBox.addItem(new Label({ text: oFormula.parameterDescriptions[i] }));
                oVBox.addItem(new Input({
                    placeholder: "Enter " + oFormula.parameterDescriptions[i],
                    value: `{/${sItemType === "sub" ? "SubFormulaParameters" : "FormulaParameters"}/${sId}}`
                }));
            });

            oModel.setProperty(sItemType === "sub" ? "/SubFormulaParameters" : "/FormulaParameters", oParams);

            var oDialog = sItemType === "sub" ? this.byId("SubFormulaDialog") : this.byId("formulaDialog");
            oDialog.open();
            console.log("Opening dialog for " + sItemType + " with formula:", oFormula);
        },
        onFormulaDialogOK: function () {
            var oModel = this.getView().getModel();
            var oFormula = oModel.getProperty("/SelectedFormula");
            var oParams = oModel.getProperty("/FormulaParameters");
            oModel.setProperty("/SelectedFormulaParams", oParams);
            this.byId("formulaDialog").close();

            // Calculate the formula result
            var result = this._calculateFormulaResult(oFormula, oParams);
            console.log("Formula Result:", result);

            // Fill the Quantity input
            var oQuantityInput = this.byId("mainQuantityInput");
            oQuantityInput.setValue(result);
            oQuantityInput.setEditable(false); // Lock manual entry when formula is applied

            // Mark as formula-based quantity
            oModel.setProperty("/IsFormulaBasedQuantity", true);
        },
        onSubFormulaDialogOK: function () {
            var oModel = this.getView().getModel();
            var oParams = oModel.getProperty("/SubFormulaParameters");
            oModel.setProperty("/SelectedSubFormulaParams", oParams);
            this.byId("SubFormulaDialog").close();
        },
        onSubInputChange: function () {
            var oView = this.getView();
            var oModel = oView.getModel();

            var sQuantity = oView.byId("subQuantityInput").getValue();
            var sAmount = oView.byId("subAmountPerUnitInput").getValue();

            var iQuantity = parseFloat(sQuantity) || 0;
            var iAmount = parseFloat(sAmount) || 0;

            var iTotal = iQuantity * iAmount;
            oModel.setProperty("/SubTotal", iTotal.toFixed(2));
        },
        onSubServiceNumberChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oSelectedItem = oSelect.getSelectedItem();
            var oDescriptionInput = this.byId("subDescriptionInput");
            var oModel = this.getView().getModel();

            if (oSelectedItem) {
                var sKey = oSelectedItem.getKey();
                var sText = oSelectedItem.getText();

                oModel.setProperty("/SelectedSubServiceNumber", sKey);
                oModel.setProperty("/SelectedSubDescriptionText", sText);
                oModel.setProperty("/SubDescriptionEditable", false);

                oDescriptionInput.setValue(sText);
                oDescriptionInput.setEditable(false);
            } else {
                oModel.setProperty("/SelectedSubServiceNumber", "");
                oModel.setProperty("/SelectedSubDescriptionText", "");
                oModel.setProperty("/SubDescriptionEditable", true);

                oDescriptionInput.setValue("");
                oDescriptionInput.setEditable(true);
            }
        },
        _recalculateSubTotal: function () {
            var oQuantityInput = this.byId("dialogSubQuantity");
            var oAmountInput = this.byId("dialogSubAmountPerUnit");
            var oTotalInput = this.byId("dialogSubTotal");

            var qty = parseFloat(oQuantityInput.getValue()) || 0;
            var amount = parseFloat(oAmountInput.getValue()) || 0;

            var total = qty * amount;

            oTotalInput.setValue(total.toFixed(2)); // show with 2 decimals
        },
        onSaveDocument: function () {
            const oModel = this.getView().getModel(); // default model
            let Items = oModel.getProperty("/MainItems") || [];
            Items = Items.map(({ createdAt, modifiedAt, createdBy,
                modifiedBy, invoiceMainItemCode, serviceNumber_serviceNumberCode,
                salesQuotation, salesQuotationItem
                , pricingProcedureCounter, pricingProcedureStep, customerNumber,
                ...rest }) => rest);

            console.log("Mainitems Sent to Doc", Items);

            let body = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "20",
                pricingProcedureCounter: "1",
                customerNumber: "120000",
                invoiceMainItemCommands: Items,


            }
            console.log(body);

            fetch("/odata/v4/sales-cloud/saveOrUpdateMainItems", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)



            })


                .then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to save: " + response.statusText);
                    }
                    return response.json();
                })
                .then(savedItem => {

                    var aServiceTypes = oModel.getProperty("/MainItems") || [];
                    aServiceTypes.push(savedItem);
                    oModel.setProperty("/MainItems", aServiceTypes);


                })
                .catch(err => {
                    console.error("Error saving MainItem:", err);
                    sap.m.MessageBox.error("Error: " + err.message);
                });


        },
        onOpenSubDialogForRow: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oObject = oContext.getObject();

            if (!oObject.subItemList) {
                sap.m.MessageToast.show("You can only add subitems under a main item!");
                return;
            }

            this._selectedParent = oObject;

            // Reset fields using XML-defined IDs
            this.byId("parentMainItemNoInput").setValue(oObject.MainItemNo || "");
            this.byId("subItemNoInput").setValue("");
            this.byId("subServiceNoInput").setSelectedKey("");
            this.byId("subDescriptionInput").setValue("");
            this.byId("subQuantityInput").setValue("");
            this.byId("subUOMInput").setSelectedKey("");
            this.byId("subFormulaSelect").setSelectedKey("");
            this.byId("subAmountPerUnitInput").setValue("");
            this.byId("subCurrencyInput").setSelectedKey("");
            this.byId("subTotalInput").setValue("");
            this.getView().getModel().setProperty("/HasSelectedSubFormula", false);
            this.getView().getModel().setProperty("/SelectedSubFormulaParams", {});
            this.getView().getModel().setProperty("/SelectedSubServiceNumber", "");
            this.getView().getModel().setProperty("/SelectedSubDescriptionText", "");
            this.getView().getModel().setProperty("/SubDescriptionEditable", true);
            this.getView().getModel().setProperty("/SubTotal", "0");

            this.byId("addSubDialog").open();
        },

        _calculateTotals: function (oItem) {
            // Parse safely with nullish coalescing (?? 0)
            var quantity = parseFloat(oItem.quantity) ?? 0;
            var amountPerUnit = parseFloat(oItem.amountPerUnit) ?? 0;
            var profitMargin = parseFloat(oItem.profitMargin) ?? 0;

            console.log("Calc inputs:", { quantity, amountPerUnit, profitMargin });

            // Basic total (always quantity * amountPerUnit)
            oItem.total = (quantity * amountPerUnit).toFixed(2);

            // Compute amountPerUnitWithProfit (with fallback if null/0)
            var amountPerUnitWithProfit = parseFloat(oItem.amountPerUnitWithProfit) ?? 0;
            if (amountPerUnitWithProfit === null || amountPerUnitWithProfit === 0) {
                amountPerUnitWithProfit = (amountPerUnit * (1 + profitMargin / 100)).toFixed(2);
            }
            oItem.amountPerUnitWithProfit = parseFloat(amountPerUnitWithProfit);  // Ensure number

            // Your exact totalWithProfit logic (conditional fallback)
            oItem.totalWithProfit = (amountPerUnitWithProfit != null && amountPerUnitWithProfit !== 0) ?
                (quantity ?? 0) * amountPerUnitWithProfit :
                (quantity ?? 0) * (amountPerUnit ?? 0) * ((profitMargin ?? 0) / 100) + (quantity ?? 0) * (amountPerUnit ?? 0);

            // Round to 2 decimals for display
            oItem.totalWithProfit = parseFloat(oItem.totalWithProfit).toFixed(2);

            console.log("Calc outputs:", { total: oItem.total, amountPerUnitWithProfit: oItem.amountPerUnitWithProfit, totalWithProfit: oItem.totalWithProfit });
        },

        _onValueChange: function (oEvent) {
            var oModel = this.getView().getModel();
            var oEditRow = oModel.getProperty("/editRow");

            // Read all inputs directly by ID
            var quantityInput = this.byId("quantity");
            var amountInput = this.byId("amountPerUnit");
            var profitInput = this.byId("profitMargin");

            // Parse numbers safely
            var quantity = parseFloat(quantityInput.getValue()) || 0;
            var amountPerUnit = parseFloat(amountInput.getValue()) || 0;
            var profitMargin = parseFloat(profitInput.getValue()) || 0;
            console.log(quantity, amountInput, profitInput);


            // Calculate totals
            var total = quantity * amountPerUnit;
            var amountWithProfit = amountPerUnit + (amountPerUnit * profitMargin / 100);
            var totalWithProfit = quantity * amountWithProfit;

            // Update the model
            oEditRow.quantity = quantity;
            oEditRow.amountPerUnit = amountPerUnit;
            oEditRow.profitMargin = profitMargin;
            oEditRow.total = total.toFixed(2);
            oEditRow.amountPerUnitWithProfit = amountWithProfit.toFixed(2);
            oEditRow.totalWithProfit = totalWithProfit.toFixed(2);
            this._calculateTotals(oEditRow);

            oModel.setProperty("/editRow", oEditRow);
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
                        contentWidth: "600px",

                        content: [
                            new sap.ui.layout.form.SimpleForm({
                                layout: "ResponsiveGridLayout",
                                labelSpanXL: 3,
                                labelSpanL: 3,
                                labelSpanM: 3,
                                labelSpanS: 12,
                                adjustLabelSpan: false,
                                emptySpanXL: 1,
                                emptySpanL: 1,
                                emptySpanM: 1,
                                columnsXL: 2,
                                columnsL: 2,
                                columnsM: 2,
                                singleContainerFullSize: false,
                                content: [
                                    new sap.m.Label({ text: "Service No" }),
                                    new sap.m.Select(this.createId("editSubServiceNo"), {
                                        selectedKey: "{/editRow/serviceNumberCode}",
                                        items: {
                                            path: "/ServiceNumbers",
                                            template: new sap.ui.core.Item({
                                                key: "{serviceNumberCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Description" }),
                                    new sap.m.Input({ value: "{/editRow/description}" }),

                                    new sap.m.Label({ text: "Quantity" }),
                                    new sap.m.Input({ value: "{/editRow/quantity}", type: "Number", liveChange: this._onValueChange.bind(this) }),

                                    new sap.m.Label({ text: "UOM" }),
                                    new sap.m.Select(this.createId("editSubUOM"), {
                                        selectedKey: "{/editRow/unitOfMeasurementCode}",
                                        items: {
                                            path: "/UOM",
                                            template: new sap.ui.core.Item({
                                                key: "{unitOfMeasurementCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Formula" }),
                                    new sap.m.Select(this.createId("editSubFormula"), {
                                        selectedKey: "{/editRow/formulaCode}",
                                        items: {
                                            path: "/Formulas",
                                            template: new sap.ui.core.Item({
                                                key: "{formulaCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Amount Per Unit" }),
                                    new sap.m.Input({ value: "{/editRow/amountPerUnit}", type: "Number", liveChange: this._onValueChange.bind(this) }),

                                    new sap.m.Label({ text: "Currency" }),
                                    new sap.m.Select(this.createId("editSubCurrency"), {
                                        selectedKey: "{/editRow/currencyCode}",
                                        items: {
                                            path: "/Currency",
                                            template: new sap.ui.core.Item({
                                                key: "{currencyCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Total" }),
                                    new sap.m.Input({ value: "{/editRow/total}", editable: false })
                                ]
                            })
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
            }
            else {
                // === Main Item ===
                if (!this._oEditMainDialog) {
                    this._oEditMainDialog = new sap.m.Dialog({
                        title: "Edit Main Item",
                        contentWidth: "600px",
                        resizable: true,
                        draggable: true,
                        content: [
                            new sap.ui.layout.form.SimpleForm({
                                layout: "ResponsiveGridLayout",
                                editable: true,
                                labelSpanXL: 4,
                                labelSpanL: 4,
                                labelSpanM: 4,
                                labelSpanS: 12,
                                adjustLabelSpan: false,
                                emptySpanXL: 1,
                                emptySpanL: 1,
                                emptySpanM: 1,
                                emptySpanS: 0,
                                columnsXL: 1,
                                columnsL: 1,
                                columnsM: 1,
                                content: [
                                    new sap.m.Label({ text: "Service No" }),
                                    new sap.m.Select(this.createId("editMainServiceNo"), {
                                        selectedKey: "{/editRow/serviceNumberCode}",
                                        items: {
                                            path: "/ServiceNumbers",
                                            template: new sap.ui.core.Item({
                                                key: "{serviceNumberCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Description" }),
                                    new sap.m.Input({ value: "{/editRow/description}" }),

                                    new sap.m.Label({ text: "Quantity" }),
                                    new sap.m.Input(this.createId("editMainQuantityInput"), {
                                        value: "{/editRow/quantity}",
                                        type: "Number",
                                        editable: true,
                                        liveChange: this.onInputChange.bind(this)
                                    }),

                                    new sap.m.Label({ text: "UOM" }),
                                    new sap.m.Select(this.createId("editMainUOMSelect"), {
                                        selectedKey: "{/editRow/unitOfMeasurementCode}",
                                        items: {
                                            path: "/UOM",
                                            template: new sap.ui.core.Item({
                                                key: "{unitOfMeasurementCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Formula" }),
                                    new sap.m.Select(this.createId("editFormulaSelect"), {
                                        selectedKey: "{/editRow/formulaCode}",
                                        change: this._onEditFormulaSelected.bind(this),
                                        items: {
                                            path: "/Formulas",
                                            template: new sap.ui.core.Item({
                                                key: "{formulaCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),
                                    new sap.m.Button(this.createId("btnEditEnterParams"), {
                                        text: "Enter Parameters",
                                        enabled: "{= ${/editRow/formulaCode} ? true : false }",
                                        press: this.onOpenEditFormulaDialog.bind(this)
                                    }),

                                    new sap.m.Label({ text: "Amount Per Unit" }),
                                    new sap.m.Input(this.createId("editMainAmountPerUnitInput"), {
                                        value: "{/editRow/amountPerUnit}",
                                        type: "Number",
                                        liveChange: this.onInputChange.bind(this)

                                    }),

                                    new sap.m.Label({ text: "Currency" }),
                                    new sap.m.Select(this.createId("editMainCurrencySelect"), {
                                        selectedKey: "{/editRow/currencyCode}",
                                        items: {
                                            path: "/Currency",
                                            template: new sap.ui.core.Item({
                                                key: "{currencyCode}",
                                                text: "{description}"
                                            })
                                        }
                                    }),

                                    new sap.m.Label({ text: "Total" }),
                                    new sap.m.Input(this.createId("editMainTotalInput"), {
                                        value: "{/editRow/total}",
                                        editable: false
                                    }),

                                    new sap.m.Label({ text: "Profit Margin" }),
                                    new sap.m.Input(this.createId("editMainProfitMarginInput"), {
                                        value: "{/editRow/profitMargin}",
                                        type: "Number",
                                        liveChange: this.onInputChange.bind(this)

                                    }),

                                    new sap.m.Label({ text: "Amount/Unit with Profit" }),
                                    new sap.m.Input(this.createId("editMainAmountPerUnitWithProfitInput"), {
                                        value: "{/editRow/amountPerUnitWithProfit}",
                                        editable: false
                                    }),

                                    new sap.m.Label({ text: "Total with Profit" }),
                                    new sap.m.Input(this.createId("editMainTotalWithProfitInput"), {
                                        value: "{/editRow/totalWithProfit}",
                                        editable: false
                                    })
                                ]
                            })
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

                this._oEditMainDialog.open();
            }


        },
        _onEditFormulaSelected: function (oFormula, oContext) {
            const oModel = this.getView().getModel();
            const oData = oContext.getObject();

            // Example: open a dialog for entering parameters (like r = 5)
            const sParam = oFormula.parameterDescriptions[0];
            const oInput = new sap.m.Input({ placeholder: `Enter value for ${sParam}` });

            const oDialog = new sap.m.Dialog({
                title: "Enter Parameters",
                content: [oInput],
                beginButton: new sap.m.Button({
                    text: "OK",
                    press: () => {
                        const val = parseFloat(oInput.getValue());
                        if (isNaN(val)) {
                            sap.m.MessageToast.show("Please enter a valid number");
                            return;
                        }

                        // Example calculation using formula logic (replace this with real parser)
                        const result = (22 / 7) * (val * val); // for 22/7*r^2
                        oData.result = result;
                        oModel.refresh(true);
                        oDialog.close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: () => oDialog.close()
                })
            });

            oDialog.open();
        },
        onOpenEditFormulaDialog: function () {
            const oModel = this.getView().getModel();
            const sFormulaCode = oModel.getProperty("/editRow/formulaCode");

            if (!sFormulaCode) {
                sap.m.MessageToast.show("Please select a formula first.");
                return;
            }

            const aFormulas = oModel.getProperty("/Formulas") || [];
            const oFormula = aFormulas.find(f => f.formulaCode === sFormulaCode);

            if (!oFormula) {
                sap.m.MessageToast.show("Formula not found.");
                return;
            }

            // Create a VBox with dynamic parameter inputs
            const oVBox = new sap.m.VBox({ id: this.createId("editFormulaParamBox") });
            oFormula.parameterDescriptions.forEach((desc, i) => {
                const paramId = oFormula.parameterIds[i];
                oVBox.addItem(new sap.m.Label({ text: desc }));
                oVBox.addItem(new sap.m.Input(this.createId("editParam_" + paramId), {
                    placeholder: `Enter ${desc}`
                }));
            });

            // Create and open the dialog
            const oDialog = new sap.m.Dialog({
                title: "Enter Formula Parameters",
                content: [oVBox],
                beginButton: new sap.m.Button({
                    text: "OK",
                    type: "Emphasized",
                    press: () => {
                        const oParams = {};
                        oFormula.parameterIds.forEach(paramId => {
                            oParams[paramId] = this.byId("editParam_" + paramId).getValue();
                        });

                        const result = this._calculateFormulaResult(oFormula, oParams);

                        // Update the quantity in the edit model
                        oModel.setProperty("/editRow/quantity", result);

                        sap.m.MessageToast.show("Quantity updated to " + result);
                        oDialog.close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: () => oDialog.close()
                })
            });

            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onSaveEdit: function () {
            var oModel = this.getView().getModel();
            var oEdited = oModel.getProperty("/editRow");

            console.log(oEdited);


            // write back changes to original data
            oModel.setProperty(this._editPath, oEdited);
            console.log(oModel.getProperty(this._editPath));
            sap.m.MessageToast.show("The Line updated successfully");

            // close whichever dialog is open
            if (this._oEditSubDialog && this._oEditSubDialog.isOpen()) {
                this._oEditSubDialog.close();
            }
            if (this._oEditMainDialog && this._oEditMainDialog.isOpen()) {
                this._oEditMainDialog.close();
            }
        },
        onAddSubItem: function () {
            var oModel = this.getView().getModel();
            var oUOMSelect = oView.byId("subUOMInput");
            var oFormulaSelect = oView.byId("subFormulaSelect");
            var oCurrencySelect = oView.byId("subCurrencyInput");
            var oSubItem = {
                //invoiceSubItemCode: Date.now(),
                serviceNumberCode: this.byId("subServiceNoInput").getSelectedItem().getText(),
                description: this.byId("subDescriptionInput").getValue(),
                quantity: this.byId("subQuantityInput").getValue(),
                unitOfMeasurementCode: this.byId("subUOMInput").getSelectedItem().getText(),
                formulaCode: this.byId("subFormulaSelect").getSelectedItem().getText(),

                // parameters: oModel.getProperty("/SelectedSubFormulaParams") || {},
                amountPerUnit: this.byId("subAmountPerUnitInput").getValue(),
                currencyCode: this.byId("subCurrencyInput").getSelectedItem().getText(),
                total: this.byId("subTotalInput").getValue()
            };

            if (!this._selectedParent.subItemList) {
                this._selectedParent.subItemList = [];
            }
            this._selectedParent.subItemList.push(oSubItem);

            oModel.refresh(true);
            this.byId("addSubDialog").close();
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
        onAddMainItem: function () {

            const oView = this.getView();
            // const oModel = oView.getModel();
            const oModel = this.getView().getModel(); // default model
            let newww = oModel.getProperty("/MainItems");
            // const aMainItems = oModel.getProperty("/MainItems");
            console.log(newww);
            var oUOMSelect = oView.byId("mainUOMSelect");
            var oFormulaSelect = oView.byId("formulaSelect");
            var oCurrencySelect = oView.byId("mainCurrencySelect");
            const oNewMain = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "1",
                pricingProcedureCounter: "10",
                customerNumber: "120000",
                // invoiceMainItemCommands: invoiceMainItemCommands

                invoiceMainItemCode: Date.now(),

                serviceNumberCode: oModel.getProperty("/SelectedServiceNumberDescription") || "", // Fixed: Added /
                description: oView.byId("mainDescriptionInput").getValue() || "",
                unitOfMeasurementCode: oUOMSelect && oUOMSelect.getSelectedItem()
                    ? oUOMSelect.getSelectedItem().getText()
                    : "",
                quantity: parseFloat(oView.byId("mainQuantityInput").getValue()) || 0, // Parse to number
                // unitOfMeasurementCode: oView.byId("mainUOMSelect").getSelectedItem().getText() || " ", // Fixed ID
                formulaCode: oFormulaSelect && oFormulaSelect.getSelectedItem()
                    ? oFormulaSelect.getSelectedItem().getText()
                    : "",
                // formulaCode: oView.byId("formulaSelect").getSelectedItem().getText() || "", // Fixed ID
                currencyCode: oCurrencySelect && oCurrencySelect.getSelectedItem()
                    ? oCurrencySelect.getSelectedItem().getText()
                    : "",
                amountPerUnit: parseFloat(oView.byId("mainAmountPerUnitInput").getValue()) || 0,
                //currencyCode: oView.byId("mainCurrencySelect").getSelectedItem().getText() || "", // Fixed ID
                total: parseFloat(oView.byId("mainTotalInput").getValue()) || 0,
                profitMargin: parseFloat(oView.byId("mainProfitMarginInput").getValue()) || 0,
                amountPerUnitWithProfit: parseFloat(oView.byId("mainAmountPerUnitWithProfitInput").getValue()) || 0,
                totalWithProfit: parseFloat(oView.byId("mainTotalWithProfitInput").getValue()) || 0,
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
        },
        onCancelSubDialog: function () {
            this.byId("addSubDialog").close();
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
        onCloseMainItemDialog: function () {
            this.byId("addMainItemDialog").close();
        },

    });
});