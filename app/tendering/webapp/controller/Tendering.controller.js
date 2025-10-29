
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
                importReady: false,
                importRows: [],
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
        onInputChange: function (oEvent) {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEditRow = oModel.getProperty("/editRow") || {};

            var oSource = oEvent.getSource();
            var sId = oSource.getId();
            var bIsEdit = sId.includes("editMain");

            var sViewId = this.getView().getId();

            // Resolve input IDs explicitly
            var oQtyInput = bIsEdit
                ? this.byId("editMainQuantityInput")
                : sap.ui.getCore().byId(sViewId + "--mainQuantityInput");
            var oAmtInput = bIsEdit
                ? this.byId("editMainAmountPerUnitInput")
                : sap.ui.getCore().byId(sViewId + "--mainAmountPerUnitInput");
            var oProfitInput = bIsEdit
                ? this.byId("editMainProfitMarginInput")
                : sap.ui.getCore().byId(sViewId + "--mainProfitMarginInput");

            var iQuantity = parseFloat(oQtyInput?.getValue()) || 0;
            var iAmount = parseFloat(oAmtInput?.getValue()) || 0;
            var iProfitMargin = parseFloat(oProfitInput?.getValue()) || 0;

            console.log("Quantity Calculated:", iQuantity);
            console.log("amount :", iAmount);
            console.log("Profit Calculated:", iProfitMargin);

            var iTotal = iQuantity * iAmount;
            var amountPerUnitWithProfit = iProfitMargin
                ? (iAmount * (iProfitMargin / 100) + iAmount)
                //iAmount + (iAmount * iProfitMargin / 100)
                : 0;
            var totalWithProfit = iProfitMargin
                ? (iTotal * (iProfitMargin / 100) + iTotal)
                //iTotal + (iTotal * iProfitMargin / 100)
                : 0;

            console.log("Total Calculated:", iTotal);

            if (bIsEdit && oEditRow) {
                oEditRow.total = iTotal.toFixed(3);
                oEditRow.totalWithProfit = totalWithProfit.toFixed(3);
                oEditRow.amountPerUnitWithProfit = amountPerUnitWithProfit.toFixed(3);
                oModel.setProperty("/editRow", oEditRow);
            } else {
                oModel.setProperty("/Total", iTotal.toFixed(3));
                oModel.setProperty("/totalWithProfit", totalWithProfit.toFixed(3));
                oModel.setProperty("/amountPerUnitWithProfit", amountPerUnitWithProfit.toFixed(3));
            }
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
        },
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
                console.log(parseFloat(result.toFixed(3)));

                return parseFloat(result.toFixed(3));
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
            var eAmountPerUnitWithProfit = (eAmount * (eProfitMargin / 100) + eAmount);
            var eTotalWithProfit = (eTotal * (eProfitMargin / 100) + eTotal);

            if (eProfitMargin === 0) {
                eAmountPerUnitWithProfit = 0
                eTotalWithProfit = 0
            }
            else {
                var eTotal = eQuantity * eAmount;
                var eAmountPerUnitWithProfit = (eAmount * (eProfitMargin / 100) + eAmount)

                var eTotalWithProfit = (eTotal * (eProfitMargin / 100) + eTotal);
            }
            // Calculate new totals
            // Update the row
            oItem.profitMargin = eProfitMargin;
            oItem.total = eTotal.toFixed(3);
            oItem.amountPerUnitWithProfit = eAmountPerUnitWithProfit.toFixed(3);
            oItem.totalWithProfit = eTotalWithProfit.toFixed(3);

            // Update model to refresh UI
            oModel.setProperty(sPath, oItem);

            sap.m.MessageToast.show("Profit margin applied to selected item.");
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
            oModel.setProperty("/SubTotal", iTotal.toFixed(3));
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

            oTotalInput.setValue(total.toFixed(3)); // show with 2 decimals
        },
        onSaveDocument: function () {
            const oModel = this.getView().getModel();
            let Items = oModel.getProperty("/MainItems") || [];

            // ✅ Prepare clean payload
            Items = Items.map(item => {
                const {
                    createdAt, modifiedAt, createdBy, modifiedBy, invoiceMainItemCode,
                    serviceNumber_serviceNumberCode, currencyText, formulaText, unitOfMeasurementText,
                    salesQuotation, salesQuotationItem, pricingProcedureCounter, pricingProcedureStep,
                    customerNumber, ...rest
                } = item;
                rest.totalHeader = parseFloat(Number(rest.totalHeader || 0).toFixed(3));

                // ✅ Clean subitems if exist
                const cleanedSubItems = (item.subItemList || [])
                    .filter(sub => sub && sub.serviceNumberCode) // remove empty/undefined
                    .map(sub => {
                        const {
                            invoiceMainItemCode, createdAt, createdBy, modifiedAt, modifiedBy, invoiceSubItemCode,
                            mainItem_invoiceMainItemCode, serviceNumber_serviceNumberCode, ...subRest
                        } = sub;
                        // Ensure relation is kept
                        return {
                            ...subRest,
                            amountPerUnit: parseFloat(Number(subRest.amountPerUnit || 0).toFixed(3)),
                            total: parseFloat(Number(subRest.total || 0).toFixed(3))
                            //invoiceMainItemCode: item.invoiceMainItemCode
                        };
                    });

                return {
                    ...rest,

                    //invoiceMainItemCode: item.invoiceMainItemCode,
                    subItemList: cleanedSubItems
                };
            });

            // ✅ Build final body
            const body = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "20",
                pricingProcedureCounter: "1",
                customerNumber: "120000",
                invoiceMainItemCommands: Items
            };

            console.log("📦 Final payload sent to backend:", JSON.stringify(body, null, 2));

            // ✅ Send to backend
            fetch("/odata/v4/sales-cloud/saveOrUpdateMainItems", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
                .then(response => {
                    if (!response.ok) throw new Error("Failed to save: " + response.statusText);
                    return response.json();
                })
                .then(savedItem => {
                    console.log("💾 Save response:", savedItem);

                    // ✅ Update model with saved data
                    const updatedMainItems = Array.isArray(savedItem.value) ? savedItem.value : [];
                    oModel.setProperty("/MainItems", updatedMainItems);

                    // ✅ Recalculate total
                    const totalValue = updatedMainItems.reduce(
                        (sum, record) => sum + Number(record.total || 0), 0
                    );
                    oModel.setProperty("/totalValue", totalValue);

                    oModel.refresh(true);
                    sap.m.MessageToast.show("Document saved successfully!");
                })
                .catch(err => {
                    console.error("❌ Error saving MainItem:", err);
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
        _calculateTotals: function (oItem, isSubItem = false) {
            if (!oItem) return;

            const quantity = parseFloat(oItem.quantity) || 0;
            const amountPerUnit = parseFloat(oItem.amountPerUnit) || 0;
            const profitMargin = parseFloat(oItem.profitMargin) || 0;

            if (isSubItem) {
                // 🟢 For subitems: calculate only their own total
                oItem.total = (quantity * amountPerUnit).toFixed(3);
                return;
            }

            // 🟢 For main items: calculate using profit margin
            const total = quantity * amountPerUnit;
            const amountWithProfit = amountPerUnit + (amountPerUnit * profitMargin / 100);
            const totalWithProfit = quantity * amountWithProfit;

            oItem.total = total.toFixed(3);
            oItem.amountPerUnitWithProfit = amountWithProfit.toFixed(3);
            oItem.totalWithProfit = totalWithProfit.toFixed(3);
        },
        _recalculateMainFromSubitems: function (oMainItem) {
            if (!oMainItem || !Array.isArray(oMainItem.subItemList)) return;

            // 1️⃣ Sum all subitem totals
            const totalSubItems = oMainItem.subItemList.reduce((sum, sub) => {
                const subTotal = parseFloat(sub.total) || 0;
                return sum + subTotal;
            }, 0);

            // 2️⃣ Update main amount per unit = total of all subitems
            oMainItem.amountPerUnit = totalSubItems.toFixed(3);

            // 3️⃣ Base calculations
            const quantity = parseFloat(oMainItem.quantity) || 0;
            const profitMargin = parseFloat(oMainItem.profitMargin) || 0;

            const eAmount = totalSubItems;                 // base amount per unit
            const eTotal = quantity * eAmount;             // base total

            oMainItem.total = eTotal.toFixed(3);

            // 4️⃣ Profit logic (your version)
            if (profitMargin > 0) {
                var eAmountPerUnitWithProfit = (eAmount * (profitMargin / 100) + eAmount);
                var eTotalWithProfit = (eTotal * (profitMargin / 100) + eTotal);

                oMainItem.amountPerUnitWithProfit = eAmountPerUnitWithProfit.toFixed(3);
                oMainItem.totalWithProfit = eTotalWithProfit.toFixed(3);
            } else {
                // No profit → clear those fields
                oMainItem.amountPerUnitWithProfit = 0;
                oMainItem.totalWithProfit = 0;
            }
        },
        onEditRow: function (oEvent) {
            // Get the row context from the button's parent (the row)
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext(); // Simplified: button has the context directly
            if (!oContext) {
                sap.m.MessageToast.show("No item context found.");
                return;
            }
            var oData = oContext.getObject();
            var oModel = this.getView().getModel();
            // keep the edit path for saving later
            this._editPath = oContext.getPath();
            // copy the row data to a temp model property
            oModel.setProperty("/editRow", Object.assign({}, oData));
            console.log("Editing item:", oData); // Debug: remove after testing

            // check if it is a main item or sub item
            var bIsSubItem = !!oData.invoiceSubItemCode;

            if (bIsSubItem) {
                // === Sub Item ===
                if (!this._oEditSubDialog) {
                    var oSubForm = new sap.ui.layout.form.SimpleForm({
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
                                forceSelection: false,
                                items: [
                                    new sap.ui.core.Item({ key: "", text: "— Select Formula —" }),
                                    new sap.ui.core.Item({
                                        key: "{formulaCode}",
                                        text: "{description}"
                                    })
                                ],
                                items: {
                                    path: "/Formulas",
                                    templateShareable: false,
                                    template: new sap.ui.core.Item({
                                        key: "{formulaCode}",
                                        text: "{description}"
                                    })
                                }
                            }),

                            new sap.m.Button(this.createId("btnEditEnterParams"), {
                                text: "Enter Parameters",
                                enabled: "{/HasSelectedFormula}",
                                press: this.onOpenEditFormulaDialog.bind(this)
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
                    });

                    this._oEditSubDialog = new sap.m.Dialog({
                        title: "Edit Sub Item",
                        contentWidth: "700px",
                        contentHeight: "auto",
                        resizable: true,
                        draggable: true,
                        content: [oSubForm],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: "Emphasized",
                            press: this.onSaveEdit.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditSubDialog.close();
                                this._oEditSubDialog.destroy();
                                this._oEditSubDialog = null;
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this._oEditSubDialog);
                }

                this._oEditSubDialog.open();
            } else {
                // === Main Item ===
                if (!this._oEditMainDialog) {
                    var oMainForm = new sap.ui.layout.form.SimpleForm({
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

                            new sap.m.Label({ text: "Amount Per Unit with Profit" }),
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
                    });

                    this._oEditMainDialog = new sap.m.Dialog({
                        title: "Edit Main Item",
                        contentWidth: "700px",
                        contentHeight: "auto",
                        resizable: true,
                        draggable: true,
                        content: [oMainForm],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            type: "Emphasized",
                            press: this.onSaveEdit.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditMainDialog.close();
                                this._oEditMainDialog.destroy();
                                this._oEditMainDialog = null;
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this._oEditMainDialog);
                }

                this._oEditMainDialog.open();
            }
        },
        _onValueChange: function (oEvent) {
            const oModel = this.getView().getModel();
            const oEditRow = oModel.getProperty("/editRow") || {};

            // 🟢 Get field & value that changed
            const newValue = parseFloat(oEvent.getParameter("value"));
            const fieldId = oEvent.getSource().getBindingInfo("value").parts[0].path.split("/").pop();

            // If not a number (empty, null, etc.), treat as 0
            oEditRow[fieldId] = isNaN(newValue) ? " " : newValue;

            // 🟢 Safely parse numbers (prevent NaN)
            const quantity = parseFloat(oEditRow.quantity);
            const amountPerUnit = parseFloat(oEditRow.amountPerUnit);
            const profitMargin = parseFloat(oEditRow.profitMargin);

            const safeQuantity = isNaN(quantity) ? 0 : quantity;
            const safeAmountPerUnit = isNaN(amountPerUnit) ? 0 : amountPerUnit;
            const safeProfitMargin = isNaN(profitMargin) ? 0 : profitMargin;

            // 🟢 Check if it's a subitem
            const isSubItem = !!oEditRow.invoiceSubItemCode;

            if (isSubItem) {
                // Subitems: only total
                oEditRow.total = (safeQuantity * safeAmountPerUnit).toFixed(3);
            } else {
                // Main items: include profit
                const total = safeQuantity * safeAmountPerUnit;
                const amountWithProfit = safeAmountPerUnit + (safeAmountPerUnit * safeProfitMargin / 100);
                const totalWithProfit = safeQuantity * amountWithProfit;

                oEditRow.total = total.toFixed(3);
                oEditRow.amountPerUnitWithProfit = amountWithProfit.toFixed(3);
                oEditRow.totalWithProfit = totalWithProfit.toFixed(3);
            }

            // ✅ Update the model safely
            oModel.setProperty("/editRow", oEditRow);
        },
        onSaveEdit: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEdited = oModel.getProperty("/editRow");

            var bIsSubItem = !!oEdited.invoiceSubItemCode;

            var oCurrencySelect = bIsSubItem
                ? oView.byId("editSubCurrency")
                : oView.byId("editMainCurrencySelect");

            var oUOMSelect = bIsSubItem
                ? oView.byId("editSubUOM")
                : oView.byId("editMainUOMSelect");

            var oFormulaSelect = bIsSubItem
                ? oView.byId("editSubFormula")
                : oView.byId("editFormulaSelect");

            var oSelectedCurrency = oCurrencySelect && oCurrencySelect.getSelectedItem();
            if (oSelectedCurrency) {
                oEdited.currencyCode = oSelectedCurrency.getText();
                console.log("Edited Currency", oEdited.currencyCode);
            } else {
                oEdited.currencyCode = "";
            }


            var oSelectedUOM = oUOMSelect && oUOMSelect.getSelectedItem();
            if (oSelectedUOM) {
                oEdited.unitOfMeasurementCode = oSelectedUOM.getText();
                console.log("Edited unitOfMeasurementCode", oEdited.unitOfMeasurementCode);
            } else {
                oEdited.unitOfMeasurementCode = "";
            }

            var oSelectedFormula = oFormulaSelect && oFormulaSelect.getSelectedItem();
            if (oSelectedFormula) {
                oEdited.formulaCode = oSelectedFormula.getText();
                console.log("Edited formulaCode", oEdited.formulaCode);
            } else {
                oEdited.formulaCode = "";
            }

            oModel.setProperty(this._editPath, oEdited);
            oModel.refresh(true);
            if (bIsSubItem) {
                // Parse path to find parent: e.g., "/MainItems/0/subItemList/1" → mainIndex = 0
                const aPathParts = this._editPath.split('/');
                const iMainIndex = parseInt(aPathParts[2]); // Index in /MainItems
                const oMainItem = oModel.getProperty(`/MainItems/${iMainIndex}`);

                if (oMainItem) {
                    this._recalculateMainFromSubitems(oMainItem);
                    oModel.setProperty(`/MainItems/${iMainIndex}`, oMainItem); // Update parent in model
                }
            }
            const aMainItems = oModel.getProperty("/MainItems") || [];
            const newTotalValue = aMainItems.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
            oModel.setProperty("/totalValue", newTotalValue);
            sap.m.MessageToast.show("The line was updated successfully");

            if (this._oEditSubDialog && this._oEditSubDialog.isOpen()) {
                this._oEditSubDialog.close();
                this._oEditSubDialog.destroy();
                this._oEditSubDialog = null;
            }
            if (this._oEditMainDialog && this._oEditMainDialog.isOpen()) {
                this._oEditMainDialog.close();
                this._oEditMainDialog.destroy();
                this._oEditMainDialog = null;
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
        onAddSubItem: function () {
            var oView = this.getView();
            var oModel = oView.getModel();

            // Optional: Basic validation to prevent incomplete adds
            var sDescription = this.byId("subDescriptionInput").getValue();
            var sQuantity = this.byId("subQuantityInput").getValue();
            if (!sDescription.trim()) {
                sap.m.MessageToast.show("Description is required.");
                return;
            }
            if (!sQuantity || parseFloat(sQuantity) <= 0) {
                sap.m.MessageToast.show("Quantity must be a positive number.");
                return;
            }

            // Null-safe gets for selects
            var oServiceSelect = this.byId("subServiceNoInput").getSelectedItem();
            var oUOMSelect = this.byId("subUOMInput").getSelectedItem();
            var oFormulaSelect = this.byId("subFormulaSelect").getSelectedItem();
            var oCurrencySelect = this.byId("subCurrencyInput").getSelectedItem();

            var oSubItem = {
                //invoiceSubItemCode: Date.now(),
                serviceNumberCode: oServiceSelect ? oServiceSelect.getText() : "",
                description: sDescription,
                quantity: parseFloat(sQuantity) || 0,  // Ensure number
                unitOfMeasurementCode: oUOMSelect ? oUOMSelect.getText() : "",
                formulaCode: oFormulaSelect ? oFormulaSelect.getText() : "",
                // parameters: oModel.getProperty("/SelectedSubFormulaParams") || {},
                amountPerUnit: parseFloat(this.byId("subAmountPerUnitInput").getValue()) || 0,
                currencyCode: oCurrencySelect ? oCurrencySelect.getText() : "",
                total: parseFloat(this.byId("subTotalInput").getValue()) || 0
            };

            console.log("Adding subitem:", oSubItem);  // Debug: Check values

            if (!this._selectedParent.subItemList) {
                this._selectedParent.subItemList = [];
            }
            this._selectedParent.subItemList.push(oSubItem);

            // Optional: Recalculate parent totals if subitems affect them
            // this._calculateTotals(this._selectedParent);
            this._recalculateMainFromSubitems(this._selectedParent);


            oModel.refresh(true);
            this.byId("addSubDialog").close();

            sap.m.MessageToast.show("Subitem added successfully!");
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
            const oModel = oView.getModel();

            var oUOMSelect = oView.byId("mainUOMSelect");
            var oFormulaSelect = oView.byId("formulaSelect");
            var oCurrencySelect = oView.byId("mainCurrencySelect");

            const oNewMain = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "1",
                pricingProcedureCounter: "10",
                customerNumber: "120000",
                invoiceMainItemCode: Date.now(),

                // Service
                serviceNumberCode: oModel.getProperty("/SelectedServiceNumberDescription") || "",
                description: oView.byId("mainDescriptionInput").getValue() || "",

                // Quantity
                quantity: parseFloat(oView.byId("mainQuantityInput").getValue()) || 0,
                unitOfMeasurementCode: oUOMSelect && oUOMSelect.getSelectedItem()
                    ? oUOMSelect.getSelectedItem().getText()
                    : "",
                formulaCode: oFormulaSelect && oFormulaSelect.getSelectedItem()
                    ? oFormulaSelect.getSelectedItem().getText()
                    : "",
                // formulaCode: oView.byId("formulaSelect").getSelectedItem().getText() || "", // Fixed ID
                currencyCode: oCurrencySelect && oCurrencySelect.getSelectedItem()
                    ? oCurrencySelect.getSelectedItem().getText()
                    : "",
                // ✅ UOM (Key = ID, Text = Description)
                // unitOfMeasurementCode: oUOMSelect?.getSelectedItem()?.getKey() || "",
                // unitOfMeasurementText: oUOMSelect?.getSelectedItem()?.getText() || "",
                // unitOfMeasurementCode: this.byId("mainUOMInput").getSelectedItem().getText(),


                // ✅ Formula (Key = formulaCode, Text = description)
                // formulaCode: oFormulaSelect?.getSelectedItem()?.getKey() || "",
                // formulaText: oFormulaSelect?.getSelectedItem()?.getText() || "",

                // ✅ Currency (Key = currencyCode UUID, Text = description)
                // currencyCode: oCurrencySelect?.getSelectedItem()?.getKey() || "",
                // currencyText: oCurrencySelect?.getSelectedItem()?.getText() || "",

                // Amounts
                amountPerUnit: parseFloat(oView.byId("mainAmountPerUnitInput").getValue()) || 0,
                total: parseFloat(oView.byId("mainTotalInput").getValue()) || 0,
                profitMargin: parseFloat(oView.byId("mainProfitMarginInput").getValue()) || 0,
                amountPerUnitWithProfit: parseFloat(oView.byId("mainAmountPerUnitWithProfitInput").getValue()) || 0,
                totalWithProfit: parseFloat(oView.byId("mainTotalWithProfitInput").getValue()) || 0,

                subItemList: []
            };

            // Push new record to model
            const aMainItems = oModel.getProperty("/MainItems") || [];
            aMainItems.push(oNewMain);
            // this._recalculateMainFromSubitems(aMainItems)
            oModel.setProperty("/MainItems", aMainItems);
            oModel.refresh(true);

            // Close dialog
            this.byId("addMainDialog").close();
            sap.m.MessageToast.show("Main item added successfully!");
        },
        onSearch: function (oEvent) {
            const oTable = this.byId("treeTable");
            const oBinding = oTable.getBinding("rows");
            const sQuery = oEvent.getParameter("query") || oEvent.getSource().getValue();

            if (!oBinding) {
                console.warn("Table binding not found.");
                return;
            }

            if (!sQuery) {
                oBinding.filter([]);
                return;
            }

            const aFilters = [
                new sap.ui.model.Filter("serviceNumberCode", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("quantity", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("unitOfMeasurementCode", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("formulaCode", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("currencyCode", sap.ui.model.FilterOperator.Contains, sQuery)
            ];

            // Combine them with OR logic
            const oCombinedFilter = new sap.ui.model.Filter({
                filters: aFilters,
                and: false
            });

            oBinding.filter(oCombinedFilter);

        },
        onImport: function () {
            this.byId("importDialog").open();
            this.byId("importStatus").setText("");
            this.byId("fileUploader").clear();
            this.getView().getModel().setProperty("/importReady", false);
        },


        onFileChange: function (oEvent) {
            var oUploader = oEvent.getSource();
            var $fileInput = oUploader.$().find('input[type="file"]');
            if ($fileInput.length === 0) {
                sap.m.MessageToast.show("File input not found. Please try selecting again.");
                return;
            }
            var oFile = $fileInput[0].files[0];  
            if (!oFile || !oFile.name.endsWith('.xlsx')) {
                sap.m.MessageToast.show("Please select a valid .xlsx file.");
                return;
            }
            var oReader = new FileReader();
            oReader.onload = function (e) {
                var sData = new Uint8Array(e.target.result);
                var oWorkbook = XLSX.read(sData, { type: 'array' });
                var oSheet = oWorkbook.Sheets[oWorkbook.SheetNames[0]]; 
                var aData = XLSX.utils.sheet_to_json(oSheet, { header: 1 });  

                if (aData.length < 2) {  
                    sap.m.MessageToast.show("Excel file is empty or has no data rows.");
                    return;
                }

                var aHeaders = aData[0];  // Row 0 = headers
                var aRequiredHeaders = ["Service No", "Description", "Quantity", "UOM", "Amount Per Unit", "Currency"];
                var bValidHeaders = aRequiredHeaders.every(function (sHeader) {
                    return aHeaders.includes(sHeader);
                });
                if (!bValidHeaders) {
                    sap.m.MessageToast.show("Excel must have headers: " + aRequiredHeaders.join(", "));
                    return;
                }

                var aRows = aData.slice(1).map(function (aRow, iIndex) {  
                    var oRow = {};
                    aHeaders.forEach(function (sHeader, iCol) {
                        oRow[sHeader] = aRow[iCol] || "";  
                    });
                    oRow.Quantity = parseFloat(oRow.Quantity) || 0;
                    oRow["Amount Per Unit"] = parseFloat(oRow["Amount Per Unit"]) || 0;
                    oRow.Total = (oRow.Quantity * oRow["Amount Per Unit"]).toFixed(3);  
                    return {
                        serviceNumberCode: oRow["Service No"] || "",
                        description: oRow.Description || "",
                        quantity: oRow.Quantity.toFixed(3),
                        unitOfMeasurementCode: oRow.UOM || "",
                        amountPerUnit: oRow["Amount Per Unit"].toFixed(3),
                        total: oRow.Total,
                        currencyCode: oRow.Currency || "",
                        formulaCode: "",  // Default empty
                        profitMargin: "0.000",  // Default
                        amountPerUnitWithProfit: "0.000",
                        totalWithProfit: "0.000",
                        subItemList: []  // New main item, no subs
                    };
                }).filter(function (oRow) {  // Validate rows
                    return oRow.description.trim() && oRow.quantity > 0;  
                });

                if (aRows.length === 0) {
                    sap.m.MessageToast.show("No valid rows to import.");
                    return;
                }

                this.getView().getModel().setProperty("/importRows", aRows);
                this.getView().getModel().setProperty("/importReady", true);
                this.byId("importStatus").setText(aRows.length + " valid rows ready to import.");
            }.bind(this);
            oReader.readAsArrayBuffer(oFile);
        },
        onImportData: function () {
            var oModel = this.getView().getModel();
            var aNewRows = oModel.getProperty("/importRows") || [];

            // Append to existing MainItems
            var aMainItems = oModel.getProperty("/MainItems") || [];
            aMainItems = aMainItems.concat(aNewRows);

            // Recalc totalValue
            var totalValue = aMainItems.reduce(function (sum, oItem) {
                return parseFloat((sum + parseFloat(oItem.total || "0.000")).toFixed(3));
            }, 0);
            oModel.setProperty("/MainItems", aMainItems);
            oModel.setProperty("/totalValue", totalValue.toFixed(3));

            // Refresh table
            oModel.refresh(true);

            // Close & reset
            this.onCloseImportDialog();
            sap.m.MessageToast.show(aNewRows.length + " items imported successfully!");
        },
        onExport: function () {
            this.byId("exportChoiceDialog").open();
        },

        onCloseExportDialog: function () {
            this.byId("exportChoiceDialog").close();
        },

        // Existing onExport (Excel) – now called from choice button
        onExport: function () {  // Overload/rename if needed; or keep as-is for Excel button press
            var aData = this._flattenDataForExport();
            if (aData.length === 0) {
                sap.m.MessageToast.show("No data to export.");
                return;
            }

            var aHeaders = Object.keys(aData[0]);
            var aHeaderRow = [aHeaders];

            var aDataRows = aData.map(function (oRow) {
                return aHeaders.map(function (sKey) {
                    return oRow[sKey];
                });
            });

            var oWS = XLSX.utils.aoa_to_sheet(aHeaderRow.concat(aDataRows));
            var oWB = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(oWB, oWS, "Tendering Items");

            XLSX.writeFile(oWB, "Tendering_Export_" + new Date().toISOString().slice(0, 10) + ".xlsx");
            sap.m.MessageToast.show(aData.length + " rows exported to Excel.");

            // Close choice dialog after export
            this.onCloseExportDialog();
        },

        // PDF from choice (existing logic)
        onExportPDF: function () {
            var aData = this._flattenDataForExport();
            if (aData.length === 0) {
                sap.m.MessageToast.show("No data to export.");
                return;
            }

            var aHeaders = Object.keys(aData[0]);
            var aDataRows = aData.map(function (oRow) {
                return aHeaders.map(function (sKey) {
                    return oRow[sKey];
                });
            });

            var { jsPDF } = window.jspdf;
            var oDoc = new jsPDF('l', 'mm', 'a4');

            oDoc.text("Tendering Items Export - " + new Date().toLocaleDateString(), 14, 20);

            oDoc.autoTable({
                head: [aHeaders],
                body: aDataRows,
                startY: 30,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 20 },  // Type
                    1: { cellWidth: 40 },  // Service No
                    2: { cellWidth: 50 },  // Description
                    // Auto for rest
                },
                margin: { top: 30, left: 10, right: 10 }
            });

            var totalValue = this.getView().getModel().getProperty("/totalValue") || "0.000";
            oDoc.text("Total Value: " + totalValue + " SAR", 14, oDoc.lastAutoTable.finalY + 10);

            oDoc.save("Tendering_Export_" + new Date().toISOString().slice(0, 10) + ".pdf");
            sap.m.MessageToast.show(aData.length + " rows exported to PDF.");

            // Close choice dialog
            this.onCloseExportDialog();
        },
        _flattenDataForExport: function () {
            var oModel = this.getView().getModel();
            var aMainItems = oModel.getProperty("/MainItems") || [];
            var aFlatData = [];

            aMainItems.forEach(function (oMain, iMainIndex) {
                // Main row
                aFlatData.push({
                    "Type": "Main",
                    "Service No": oMain.serviceNumberCode || "",
                    "Description": oMain.description || "",
                    "Quantity": oMain.quantity || "0.000",
                    "UOM": oMain.unitOfMeasurementCode || "",
                    "Formula": oMain.formulaCode || "",
                    "Parameters": oMain.parameters ? Object.keys(oMain.parameters).join(", ") : "None",
                    "Currency": oMain.currencyCode || "",
                    "Amount Per Unit": oMain.amountPerUnit || "0.000",
                    "Total": oMain.total || "0.000",
                    "Profit Margin": oMain.profitMargin || "0.000",
                    "Amount Per Unit with Profit": oMain.amountPerUnitWithProfit || "0.000",
                    "Total with Profit": oMain.totalWithProfit || "0.000"
                });

                // Sub rows (indented)
                if (oMain.subItemList && oMain.subItemList.length > 0) {
                    oMain.subItemList.forEach(function (oSub) {
                        aFlatData.push({
                            "Type": "  Sub",  // Indent for hierarchy
                            "Service No": oSub.serviceNumberCode || "",
                            "Description": oSub.description || "",
                            "Quantity": oSub.quantity || "0.000",
                            "UOM": oSub.unitOfMeasurementCode || "",
                            "Formula": oSub.formulaCode || "",
                            "Parameters": oSub.parameters ? Object.keys(oSub.parameters).join(", ") : "None",
                            "Currency": oSub.currencyCode || "",
                            "Amount Per Unit": oSub.amountPerUnit || "0.000",
                            "Total": oSub.total || "0.000",
                            "Profit Margin": "",  // Subs may not have profit
                            "Amount Per Unit with Profit": "",
                            "Total with Profit": ""
                        });
                    });
                }
            });

            return aFlatData;
        },
        // Optional: For "Print" button (browser print of page/table)
        onPrintUI: function () {
            window.print();  // Native browser print
            sap.m.MessageToast.show("Printing current view...");
        },
        onCloseImportDialog: function () {
            this.byId("importDialog").close();
            this.getView().getModel().setProperty("/importReady", false);
            this.getView().getModel().setProperty("/importRows", []);  // Clear stored rows
            this.byId("importStatus").setText("");
        },

        onUploadComplete: function () {
            // Optional: If you later add server upload, handle here
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