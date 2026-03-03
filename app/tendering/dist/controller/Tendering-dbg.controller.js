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
// FIX 2: Callback order MUST match the define array order above.
// Previously MessageBox was at position 11 in callback but position 9 in define array,
// so MessageBox variable was actually receiving ResponsiveGridLayout → .error() didn't exist.
], (Controller, JSONModel, Dialog, Button, Input, Label, VBox, MessageToast, MessageBox, SimpleForm, ResponsiveGridLayout) => {
    "use strict";

    return Controller.extend("tendering.controller.Tendering", {

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

            fetch("./odata/v4/sales-cloud/ServiceNumbers")
                .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
                .then(data => {
                    if (data && data.value) {
                        oModel.setProperty("/ServiceNumbers", data.value.map(i => ({
                            serviceNumberCode: i.serviceNumberCode,
                            description: i.description
                        })));
                    }
                })
                .catch(err => console.error("Error fetching ServiceNumbers:", err));

            fetch("./odata/v4/sales-cloud/Formulas")
                .then(r => r.json())
                .then(data => { oModel.setProperty("/Formulas", Array.isArray(data.value) ? data.value : []); oModel.refresh(true); })
                .catch(err => { console.error("Error fetching Formulas:", err); MessageToast.show("Failed to load formulas."); });

            fetch("./odata/v4/sales-cloud/UnitOfMeasurements")
                .then(r => r.json())
                .then(data => { oModel.setProperty("/UOM", Array.isArray(data.value) ? data.value : []); oModel.refresh(true); });

            fetch("./odata/v4/sales-cloud/Currencies")
                .then(r => r.json())
                .then(data => { oModel.setProperty("/Currency", Array.isArray(data.value) ? data.value : []); oModel.refresh(true); });
        },

        _onRouteMatched: function (oEvent) {
            var oModel = this.getView().getModel();
            var args = oEvent.getParameter("arguments");
            oModel.setProperty("/docNumber", args.docNumber);
            oModel.setProperty("/itemNumber", args.itemNumber);

            fetch("./odata/v4/sales-cloud/getInvoiceMainItemByReferenceIdAndItemNumber", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referenceId: args.docNumber, salesQuotationItem: args.itemNumber })
            })
                .then(r => r.json())
                .then(data => {
                    // Normalize subItemList to [] so tree arrows always show
                    const mainItems = Array.isArray(data.value) ? data.value.map(item => ({
                        ...item,
                        subItemList: Array.isArray(item.subItemList) ? item.subItemList : []
                    })) : [];
                    const totalValue = mainItems.reduce((sum, r) => sum + Number(r.totalWithProfit || r.total || 0), 0);
                    oModel.setProperty("/MainItems", mainItems);
                    oModel.setProperty("/totalValue", totalValue);
                    this.getView().byId("treeTable").setModel(oModel);
                })
                .catch(err => console.error("Error fetching MainItems:", err));
        },

        // ─── CORE CALCULATION (matches Spring Boot logic) ─────────────────────────
        _applyProfitToItem: function (oItem) {
            const qty = parseFloat(oItem.quantity) || 0;
            const amt = parseFloat(oItem.amountPerUnit) || 0;
            const pm  = parseFloat(oItem.profitMargin) || 0;
            const total = qty * amt;
            oItem.total = total.toFixed(3);
            if (pm > 0) {
                oItem.totalWithProfit = (total + total * (pm / 100)).toFixed(3);
                oItem.amountPerUnitWithProfit = (amt + amt * (pm / 100)).toFixed(3);
            } else {
                oItem.totalWithProfit = total.toFixed(3);
                oItem.amountPerUnitWithProfit = amt.toFixed(3);
            }
        },

        _recalculateTotalValue: function () {
            const oModel = this.getView().getModel();
            const items = oModel.getProperty("/MainItems") || [];
            const total = items.reduce((sum, i) => sum + parseFloat(i.totalWithProfit || i.total || 0), 0);
            oModel.setProperty("/totalValue", total);
        },

        _recalculateMainFromSubitems: function (oMainItem) {
            if (!oMainItem || !Array.isArray(oMainItem.subItemList)) return;
            const totalSubs = oMainItem.subItemList.reduce((sum, sub) => sum + (parseFloat(sub.total) || 0), 0);
            oMainItem.amountPerUnit = totalSubs.toFixed(3);
            this._applyProfitToItem(oMainItem);
        },

        // ─── INPUT CHANGE ─────────────────────────────────────────────────────────
        onInputChange: function (oEvent) {
            var oModel = this.getView().getModel();
            var sId = oEvent.getSource().getId();
            var bIsEdit = sId.includes("editMain");
            var sViewId = this.getView().getId();

            var oQtyInput    = bIsEdit ? this.byId("editMainQuantityInput")    : sap.ui.getCore().byId(sViewId + "--mainQuantityInput");
            var oAmtInput    = bIsEdit ? this.byId("editMainAmountPerUnitInput") : sap.ui.getCore().byId(sViewId + "--mainAmountPerUnitInput");
            var oProfitInput = bIsEdit ? this.byId("editMainProfitMarginInput") : sap.ui.getCore().byId(sViewId + "--mainProfitMarginInput");

            var qty   = parseFloat(oQtyInput ? oQtyInput.getValue() : 0) || 0;
            var amt   = parseFloat(oAmtInput ? oAmtInput.getValue() : 0) || 0;
            var pm    = parseFloat(oProfitInput ? oProfitInput.getValue() : 0) || 0;
            var total = qty * amt;
            var amtWithProfit   = pm > 0 ? (amt + amt * (pm / 100)) : amt;
            var totalWithProfit = pm > 0 ? (total + total * (pm / 100)) : total;

            if (bIsEdit) {
                var oEditRow = oModel.getProperty("/editRow") || {};
                oEditRow.total = total.toFixed(3);
                oEditRow.totalWithProfit = totalWithProfit.toFixed(3);
                oEditRow.amountPerUnitWithProfit = amtWithProfit.toFixed(3);
                oModel.setProperty("/editRow", oEditRow);
            } else {
                oModel.setProperty("/Total", total.toFixed(3));
                oModel.setProperty("/totalWithProfit", totalWithProfit.toFixed(3));
                oModel.setProperty("/amountPerUnitWithProfit", amtWithProfit.toFixed(3));
            }
        },

        onSubInputChange: function () {
            var qty = parseFloat(this.byId("subQuantityInput").getValue()) || 0;
            var amt = parseFloat(this.byId("subAmountPerUnitInput").getValue()) || 0;
            this.getView().getModel().setProperty("/SubTotal", (qty * amt).toFixed(3));
        },

        // ─── SERVICE NUMBER CHANGE ────────────────────────────────────────────────
        onServiceNumberChange: function (oEvent) {
            var oSel   = oEvent.getSource().getSelectedItem();
            var oDesc  = this.byId("mainDescriptionInput");
            var oModel = this.getView().getModel();
            if (oSel) {
                oModel.setProperty("/SelectedServiceNumber", oSel.getKey());
                oModel.setProperty("/SelectedServiceNumberDescription", oSel.getText());
                oDesc.setValue(oSel.getText());
                oDesc.setEditable(false);
            } else {
                oModel.setProperty("/SelectedServiceNumber", "");
                oModel.setProperty("/SelectedServiceNumberDescription", "");
                oDesc.setValue("");
                oDesc.setEditable(true);
            }
        },

        onSubServiceNumberChange: function (oEvent) {
            var oSel   = oEvent.getSource().getSelectedItem();
            var oDesc  = this.byId("subDescriptionInput");
            var oModel = this.getView().getModel();
            if (oSel) {
                oModel.setProperty("/SelectedSubServiceNumber", oSel.getKey());
                oModel.setProperty("/SelectedSubDescriptionText", oSel.getText());
                oModel.setProperty("/SubDescriptionEditable", false);
                oDesc.setValue(oSel.getText());
                oDesc.setEditable(false);
            } else {
                oModel.setProperty("/SelectedSubServiceNumber", "");
                oModel.setProperty("/SelectedSubDescriptionText", "");
                oModel.setProperty("/SubDescriptionEditable", true);
                oDesc.setValue("");
                oDesc.setEditable(true);
            }
        },

        // ─── FORMULA SELECTION ────────────────────────────────────────────────────
        onFormulaSelected: function (oEvent) {
            var oSelect   = oEvent.getSource();
            var sId       = oSelect.getId();
            var bIsSub    = sId.includes("sub") || sId.includes("Sub");
            var sKey      = oSelect.getSelectedKey();
            var oModel    = this.getView().getModel();
            var aFormulas = oModel.getProperty("/Formulas") || [];
            var oFormula  = aFormulas.find(f => f.formulaCode === sKey);

            if (bIsSub) {
                oModel.setProperty("/SelectedSubFormula", oFormula || null);
                oModel.setProperty("/HasSelectedSubFormula", !!oFormula);
                if (!oFormula) {
                    var oSubQty = this.byId("subQuantityInput");
                    oSubQty.setEditable(true);
                    oSubQty.setValue("");
                    oModel.setProperty("/SubFormulaParameters", {});
                }
            } else {
                oModel.setProperty("/SelectedFormula", oFormula || null);
                oModel.setProperty("/HasSelectedFormula", !!oFormula);
                if (!oFormula) {
                    // FIX 1 (part): Clearing formula unlocks & resets quantity and totals
                    this._clearMainFormula();
                }
            }
        },

        // FIX 1: Dedicated clear formula handler — called by the "Clear Formula" button in the view
        onClearFormula: function () {
            var oModel = this.getView().getModel();
            // Reset the select back to empty
            var oFormulaSelect = this.byId("formulaSelect");
            if (oFormulaSelect) oFormulaSelect.setSelectedKey("");
            this._clearMainFormula();
            MessageToast.show("Formula cleared. You can now enter quantity manually.");
        },

        // Shared helper — resets all formula-related state for main item dialog
        _clearMainFormula: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/SelectedFormula", null);
            oModel.setProperty("/HasSelectedFormula", false);
            oModel.setProperty("/FormulaParameters", {});
            oModel.setProperty("/IsFormulaBasedQuantity", false);
            // Unlock and clear quantity so user can type manually
            var oQty = this.byId("mainQuantityInput");
            if (oQty) {
                oQty.setValue("");
                oQty.setEditable(true);
            }
            // Reset calculated fields
            oModel.setProperty("/Total", "0.000");
            oModel.setProperty("/totalWithProfit", "0.000");
            oModel.setProperty("/amountPerUnitWithProfit", "0.000");
        },

        // FIX 1: Same for sub item formula
        onClearSubFormula: function () {
            var oModel = this.getView().getModel();
            var oFormulaSelect = this.byId("subFormulaSelect");
            if (oFormulaSelect) oFormulaSelect.setSelectedKey("");
            oModel.setProperty("/SelectedSubFormula", null);
            oModel.setProperty("/HasSelectedSubFormula", false);
            oModel.setProperty("/SubFormulaParameters", {});
            var oQty = this.byId("subQuantityInput");
            if (oQty) {
                oQty.setValue("");
                oQty.setEditable(true);
            }
            oModel.setProperty("/SubTotal", "0.000");
            MessageToast.show("Formula cleared. You can now enter quantity manually.");
        },

        // ─── FORMULA DIALOGS ──────────────────────────────────────────────────────
        _calculateFormulaResult: function (oFormula, oParams) {
            if (!oFormula || !oParams) return 0;
            try {
                let expr = oFormula.formulaLogic;
                oFormula.parameterIds.forEach(id => {
                    expr = expr.replaceAll(id, parseFloat(oParams[id]) || 0);
                });
                expr = expr.replace(/\^/g, "**");
                return parseFloat(Function('"use strict";return (' + expr + ')')().toFixed(3));
            } catch (err) {
                console.error("Formula error:", err);
                MessageToast.show("Invalid formula or parameters.");
                return 0;
            }
        },

        onOpenFormulaDialog: function (oEvent) {
            var sLocalId = oEvent.getSource().getId().split('--').pop();
            var sType    = sLocalId === "btnSubParameters" ? "sub" : "main";
            var oModel   = this.getView().getModel();
            var oFormula = sType === "sub" ? oModel.getProperty("/SelectedSubFormula") : oModel.getProperty("/SelectedFormula");
            if (!oFormula) { MessageToast.show("Please select a formula first."); return; }

            var oVBox = sType === "sub" ? this.byId("subFormulaParamContainer") : this.byId("formulaParamContainer");
            oVBox.removeAllItems();
            var oParams = {};
            oFormula.parameterIds.forEach((id, i) => {
                oParams[id] = "";
                oVBox.addItem(new Label({ text: oFormula.parameterDescriptions[i] }));
                oVBox.addItem(new Input({
                    placeholder: "Enter " + oFormula.parameterDescriptions[i],
                    value: "{/" + (sType === "sub" ? "SubFormulaParameters" : "FormulaParameters") + "/" + id + "}"
                }));
            });
            oModel.setProperty(sType === "sub" ? "/SubFormulaParameters" : "/FormulaParameters", oParams);
            (sType === "sub" ? this.byId("SubFormulaDialog") : this.byId("formulaDialog")).open();
        },

        onFormulaDialogOK: function () {
            var oModel   = this.getView().getModel();
            var oFormula = oModel.getProperty("/SelectedFormula");
            var oParams  = oModel.getProperty("/FormulaParameters");
            oModel.setProperty("/SelectedFormulaParams", oParams);
            this.byId("formulaDialog").close();
            var result = this._calculateFormulaResult(oFormula, oParams);
            var oQty = this.byId("mainQuantityInput");
            oQty.setValue(result);
            oQty.setEditable(false);
            oModel.setProperty("/IsFormulaBasedQuantity", true);
            // Trigger recalculation
            var amt = parseFloat(this.byId("mainAmountPerUnitInput").getValue()) || 0;
            var pm  = parseFloat(this.byId("mainProfitMarginInput").getValue()) || 0;
            var total = result * amt;
            oModel.setProperty("/Total", total.toFixed(3));
            oModel.setProperty("/totalWithProfit", (pm > 0 ? total + total * (pm / 100) : total).toFixed(3));
            oModel.setProperty("/amountPerUnitWithProfit", (pm > 0 ? amt + amt * (pm / 100) : amt).toFixed(3));
        },

        onSubFormulaDialogOK: function () {
            var oModel   = this.getView().getModel();
            var oFormula = oModel.getProperty("/SelectedSubFormula");
            var oParams  = oModel.getProperty("/SubFormulaParameters");
            this.byId("SubFormulaDialog").close();
            var result = this._calculateFormulaResult(oFormula, oParams);
            var oQty = this.byId("subQuantityInput");
            oQty.setValue(result);
            oQty.setEditable(false);
            var amt = parseFloat(this.byId("subAmountPerUnitInput").getValue()) || 0;
            oModel.setProperty("/SubTotal", (result * amt).toFixed(3));
        },

        // ─── ADD MAIN ITEM DIALOG ─────────────────────────────────────────────────
        onOpenMainDialog: function () {
            var oView  = this.getView();
            var oModel = oView.getModel();

            oView.byId("mainItemNoInput").setValue("");
            oView.byId("mainDescriptionInput").setValue("");
            oView.byId("mainDescriptionInput").setEditable(true);
            oView.byId("mainAmountPerUnitInput").setValue("");
            oView.byId("mainProfitMarginInput").setValue("");

            var oQty = oView.byId("mainQuantityInput");
            oQty.setValue("");
            oQty.setEditable(true);

            oView.byId("mainServiceNoSelect").setSelectedKey("");
            oView.byId("mainUOMSelect").setSelectedKey("");
            oView.byId("mainCurrencySelect").setSelectedKey("");
            oView.byId("formulaSelect").setSelectedKey("");

            oModel.setProperty("/Total", 0);
            oModel.setProperty("/totalWithProfit", 0);
            oModel.setProperty("/amountPerUnitWithProfit", 0);
            oModel.setProperty("/SelectedServiceNumber", "");
            oModel.setProperty("/SelectedServiceNumberDescription", "");
            oModel.setProperty("/SelectedFormula", null);
            oModel.setProperty("/HasSelectedFormula", false);
            oModel.setProperty("/FormulaParameters", {});
            oModel.setProperty("/IsFormulaBasedQuantity", false);

            oView.byId("addMainDialog").open();
        },

        onAddMainItem: function () {
            var oView  = this.getView();
            var oModel = oView.getModel();

            var sDesc = oView.byId("mainDescriptionInput").getValue();
            var sQty  = oView.byId("mainQuantityInput").getValue();
            if (!sDesc.trim()) { MessageToast.show("Description is required."); return; }
            if (!sQty || parseFloat(sQty) <= 0) { MessageToast.show("Quantity must be a positive number."); return; }

            var qty   = parseFloat(sQty) || 0;
            var amt   = parseFloat(oView.byId("mainAmountPerUnitInput").getValue()) || 0;
            var pm    = parseFloat(oView.byId("mainProfitMarginInput").getValue()) || 0;
            var total = qty * amt;
            var totalWithProfit = pm > 0 ? (total + total * (pm / 100)) : total;
            var amtWithProfit   = pm > 0 ? (amt + amt * (pm / 100)) : amt;

            var oUOM      = oView.byId("mainUOMSelect").getSelectedItem();
            var oFormula  = oView.byId("formulaSelect").getSelectedItem();
            var oCurrency = oView.byId("mainCurrencySelect").getSelectedItem();

            var oNewItem = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "1",
                pricingProcedureCounter: "10",
                customerNumber: "120000",
                invoiceMainItemCode: Date.now().toString(),
                serviceNumberCode: oView.byId("mainServiceNoSelect").getSelectedKey() || "",
                description: sDesc,
                quantity: qty,
                unitOfMeasurementCode: oUOM ? oUOM.getKey() : "",
                formulaCode: oFormula ? oFormula.getKey() : "",
                // NOTE: no "parameters" field — not in CAP entity schema
                currencyCode: oCurrency ? oCurrency.getKey() : "",
                amountPerUnit: amt,
                total: total.toFixed(3),
                profitMargin: pm,
                amountPerUnitWithProfit: amtWithProfit.toFixed(3),
                totalWithProfit: totalWithProfit.toFixed(3),
                subItemList: []
            };

            var aItems = oModel.getProperty("/MainItems") || [];
            aItems.push(oNewItem);
            oModel.setProperty("/MainItems", aItems);
            this._recalculateTotalValue();
            oModel.refresh(true);
            this.byId("addMainDialog").close();
            MessageToast.show("Main item added successfully!");
        },

        // ─── ADD SUB ITEM DIALOG ──────────────────────────────────────────────────
        onOpenSubDialogForRow: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oObject  = oContext.getObject();
            var oModel   = this.getView().getModel();

            if (!oObject.subItemList) {
                MessageToast.show("You can only add subitems under a main item!");
                return;
            }
            oModel.setProperty("/selectedMainPath", oContext.getPath());
            this._selectedParent = oObject;

            this.byId("parentMainItemNoInput").setValue(oObject.invoiceMainItemCode || "");
            this.byId("subItemNoInput").setValue("");
            this.byId("subServiceNoInput").setSelectedKey("");
            this.byId("subDescriptionInput").setValue("");
            this.byId("subDescriptionInput").setEditable(true);
            this.byId("subUOMInput").setSelectedKey("");
            this.byId("subFormulaSelect").setSelectedKey("");
            this.byId("subAmountPerUnitInput").setValue("");
            this.byId("subCurrencyInput").setSelectedKey("");
            this.byId("subTotalInput").setValue("");

            var oSubQty = this.byId("subQuantityInput");
            oSubQty.setValue("");
            oSubQty.setEditable(true);

            oModel.setProperty("/SelectedSubServiceNumber", "");
            oModel.setProperty("/SelectedSubDescriptionText", "");
            oModel.setProperty("/SubDescriptionEditable", true);
            oModel.setProperty("/SelectedSubFormula", null);
            oModel.setProperty("/HasSelectedSubFormula", false);
            oModel.setProperty("/SubFormulaParameters", {});
            oModel.setProperty("/SubTotal", "0");

            this.byId("addSubDialog").open();
        },

        onAddSubItem: function () {
            var oModel    = this.getView().getModel();
            var sMainPath = oModel.getProperty("/selectedMainPath");
            var sDesc     = this.byId("subDescriptionInput").getValue();
            var sQuantity = this.byId("subQuantityInput").getValue();
            var oFormItem = this.byId("subFormulaSelect").getSelectedItem();
            var sFormKey  = oFormItem ? oFormItem.getKey() : "";

            if (!sDesc.trim()) { MessageToast.show("Description is required."); return; }

            var hasQty     = !!sQuantity && parseFloat(sQuantity) > 0;
            var hasFormula = !!sFormKey;
            if (!hasQty && !hasFormula) {
                MessageToast.show("Please enter a quantity OR select a formula with parameters.");
                return;
            }

            var qty = parseFloat(sQuantity) || 0;
            var amt = parseFloat(this.byId("subAmountPerUnitInput").getValue()) || 0;
            var oSvcItem = this.byId("subServiceNoInput").getSelectedItem();
            var oUOMItem = this.byId("subUOMInput").getSelectedItem();
            var oCurItem = this.byId("subCurrencyInput").getSelectedItem();

            var oSubItem = {
                invoiceSubItemCode: Date.now().toString(),
                serviceNumberCode: oSvcItem ? oSvcItem.getKey() : "",
                description: sDesc,
                quantity: qty,
                unitOfMeasurementCode: oUOMItem ? oUOMItem.getKey() : "",
                formulaCode: sFormKey,
                // NOTE: no "parameters" field
                amountPerUnit: amt,
                currencyCode: oCurItem ? oCurItem.getKey() : "",
                total: (qty * amt).toFixed(3)
            };

            var oMainItem = oModel.getProperty(sMainPath);
            if (!oMainItem.subItemList) oMainItem.subItemList = [];
            oMainItem.subItemList.push(oSubItem);
            this._recalculateMainFromSubitems(oMainItem);
            oModel.setProperty(sMainPath, oMainItem);
            this._recalculateTotalValue();
            oModel.refresh(true);
            this.byId("addSubDialog").close();
            MessageToast.show("Sub item added successfully!");
        },

        // ─── APPLY PROFIT MARGIN ─────────────────────────────────────────────────
        onApplyProfitMargin: function () {
            var oTable   = this.byId("treeTable");
            var oModel   = this.getView().getModel();
            var aIndices = oTable.getSelectedIndices().filter(i => i >= 0);

            if (aIndices.length === 0) {
                MessageToast.show("Please select at least one main item first.");
                return;
            }

            var iProfit  = parseFloat(this.byId("groupInput").getValue()) || 0;
            var bChanged = false;

            aIndices.forEach(iIndex => {
                var oContext = oTable.getContextByIndex(iIndex);
                if (!oContext) return;
                var sPath = oContext.getPath();
                if (sPath.includes("/subItemList/")) return;
                var oItem = oModel.getProperty(sPath);
                oItem.profitMargin = iProfit;
                this._applyProfitToItem(oItem);
                oModel.setProperty(sPath, oItem);
                bChanged = true;
            });

            if (bChanged) {
                this._recalculateTotalValue();
                oModel.refresh(true);
                MessageToast.show("Profit margin applied to selected main items.");
            }
        },

        // ─── SAVE DOCUMENT ────────────────────────────────────────────────────────
        onSaveDocument: function () {
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/MainItems") || [];

            aItems.forEach(item => {
                if (item.subItemList && item.subItemList.length > 0) {
                    this._recalculateMainFromSubitems(item);
                } else {
                    this._applyProfitToItem(item);
                }
            });
            this._recalculateTotalValue();

            var cleanedItems = aItems.map(item => {
                // Destructure to strip fields the CAP entity doesn't know
                const {
                    createdAt, modifiedAt, createdBy, modifiedBy, invoiceMainItemCode,
                    serviceNumber_serviceNumberCode, currencyText, formulaText, unitOfMeasurementText,
                    salesQuotation, salesQuotationItem, pricingProcedureCounter, pricingProcedureStep,
                    customerNumber,
                    parameters,          // FIX 2: strip — CAP entity has no "parameters" column → causes 400
                    ...rest
                } = item;
                rest.totalHeader = parseFloat(Number(rest.totalHeader || 0).toFixed(3));

                const cleanedSubs = (item.subItemList || [])
                    .filter(sub => sub && sub.serviceNumberCode)
                    .map(sub => {
                        const {
                            invoiceMainItemCode, createdAt, createdBy, modifiedAt, modifiedBy,
                            invoiceSubItemCode, mainItem_invoiceMainItemCode,
                            serviceNumber_serviceNumberCode,
                            parameters,  // FIX 2: strip from subitems too
                            ...subRest
                        } = sub;
                        return {
                            ...subRest,
                            amountPerUnit: parseFloat(Number(subRest.amountPerUnit || 0).toFixed(3)),
                            total: parseFloat(Number(subRest.total || 0).toFixed(3))
                        };
                    });
                return { ...rest, subItemList: cleanedSubs };
            });

            var body = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "20",
                pricingProcedureCounter: "1",
                customerNumber: "120000",
                invoiceMainItemCommands: cleanedItems
            };

            fetch("./odata/v4/sales-cloud/saveOrUpdateMainItems", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
                .then(r => { if (!r.ok) throw new Error("Save failed: " + r.statusText); return r.json(); })
                .then(saved => {
                    // Normalize subItemList in response to keep tree arrows
                    var updated = Array.isArray(saved.value) ? saved.value.map(item => ({
                        ...item,
                        subItemList: Array.isArray(item.subItemList) ? item.subItemList : []
                    })) : [];
                    oModel.setProperty("/MainItems", updated);
                    var totalValue = updated.reduce((sum, r) => sum + Number(r.totalWithProfit || r.total || 0), 0);
                    oModel.setProperty("/totalValue", totalValue);
                    oModel.refresh(true);
                    MessageToast.show("Document saved successfully!");
                })
                .catch(err => {
                    console.error("Error saving:", err);
                    // FIX 2: Use MessageToast as fallback — avoids crash if MessageBox somehow unavailable
                    try {
                        MessageBox.error("Save failed: " + err.message);
                    } catch (e) {
                        MessageToast.show("Save failed: " + err.message);
                    }
                });
        },

        // ─── EDIT ROW ─────────────────────────────────────────────────────────────
        onEditRow: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) { MessageToast.show("No item context found."); return; }
            var oData  = oContext.getObject();
            var oModel = this.getView().getModel();
            this._editPath = oContext.getPath();
            oModel.setProperty("/editRow", Object.assign({}, oData));

            var bIsSub = !!oData.invoiceSubItemCode;
            if (bIsSub) {
                if (!this._oEditSubDialog) {
                    var oSubForm = new sap.ui.layout.form.SimpleForm({
                        layout: "ResponsiveGridLayout", editable: true,
                        labelSpanXL: 4, labelSpanL: 4, labelSpanM: 4, labelSpanS: 12,
                        adjustLabelSpan: false, emptySpanXL: 1, emptySpanL: 1, emptySpanM: 1, emptySpanS: 0,
                        columnsXL: 1, columnsL: 1, columnsM: 1,
                        content: [
                            new sap.m.Label({ text: "Service No" }),
                            new sap.m.Select(this.createId("editSubServiceNo"), { selectedKey: "{/editRow/serviceNumberCode}", items: { path: "/ServiceNumbers", template: new sap.ui.core.Item({ key: "{serviceNumberCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/editRow/description}" }),
                            new sap.m.Label({ text: "Quantity" }),
                            new sap.m.Input({ value: "{/editRow/quantity}", type: "Number", liveChange: this._onSubValueChange.bind(this) }),
                            new sap.m.Label({ text: "UOM" }),
                            new sap.m.Select(this.createId("editSubUOM"), { selectedKey: "{/editRow/unitOfMeasurementCode}", items: { path: "/UOM", template: new sap.ui.core.Item({ key: "{unitOfMeasurementCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Formula" }),
                            new sap.m.Select(this.createId("editSubFormula"), { selectedKey: "{/editRow/formulaCode}", forceSelection: false, items: { path: "/Formulas", templateShareable: false, template: new sap.ui.core.Item({ key: "{formulaCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Amount Per Unit" }),
                            new sap.m.Input({ value: "{/editRow/amountPerUnit}", type: "Number", liveChange: this._onSubValueChange.bind(this) }),
                            new sap.m.Label({ text: "Currency" }),
                            new sap.m.Select(this.createId("editSubCurrency"), { selectedKey: "{/editRow/currencyCode}", items: { path: "/Currency", template: new sap.ui.core.Item({ key: "{currencyCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Total" }),
                            new sap.m.Input({ value: "{/editRow/total}", editable: false })
                        ]
                    });
                    this._oEditSubDialog = new sap.m.Dialog({
                        title: "Edit Sub Item", contentWidth: "700px", contentHeight: "auto", resizable: true, draggable: true,
                        content: [oSubForm],
                        beginButton: new sap.m.Button({ text: "Save", type: "Emphasized", press: this.onSaveEdit.bind(this) }),
                        endButton: new sap.m.Button({ text: "Cancel", press: () => { this._oEditSubDialog.close(); this._oEditSubDialog.destroy(); this._oEditSubDialog = null; } })
                    });
                    this.getView().addDependent(this._oEditSubDialog);
                }
                this._oEditSubDialog.open();
            } else {
                if (!this._oEditMainDialog) {
                    var oMainForm = new sap.ui.layout.form.SimpleForm({
                        layout: "ResponsiveGridLayout", editable: true,
                        labelSpanXL: 4, labelSpanL: 4, labelSpanM: 4, labelSpanS: 12,
                        adjustLabelSpan: false, emptySpanXL: 1, emptySpanL: 1, emptySpanM: 1, emptySpanS: 0,
                        columnsXL: 1, columnsL: 1, columnsM: 1,
                        content: [
                            new sap.m.Label({ text: "Service No" }),
                            new sap.m.Select(this.createId("editMainServiceNo"), { selectedKey: "{/editRow/serviceNumberCode}", items: { path: "/ServiceNumbers", template: new sap.ui.core.Item({ key: "{serviceNumberCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/editRow/description}" }),
                            new sap.m.Label({ text: "Quantity" }),
                            new sap.m.Input(this.createId("editMainQuantityInput"), { value: "{/editRow/quantity}", type: "Number", liveChange: this.onInputChange.bind(this) }),
                            new sap.m.Label({ text: "UOM" }),
                            new sap.m.Select(this.createId("editMainUOMSelect"), { selectedKey: "{/editRow/unitOfMeasurementCode}", items: { path: "/UOM", template: new sap.ui.core.Item({ key: "{unitOfMeasurementCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Formula" }),
                            new sap.m.Select(this.createId("editFormulaSelect"), { selectedKey: "{/editRow/formulaCode}", change: this._onEditFormulaSelected.bind(this), items: { path: "/Formulas", template: new sap.ui.core.Item({ key: "{formulaCode}", text: "{description}" }) } }),
                            new sap.m.Button(this.createId("btnEditEnterParams"), { text: "Enter Parameters", enabled: "{= ${/editRow/formulaCode} ? true : false }", press: this.onOpenEditFormulaDialog.bind(this) }),
                            new sap.m.Label({ text: "Amount Per Unit" }),
                            new sap.m.Input(this.createId("editMainAmountPerUnitInput"), { value: "{/editRow/amountPerUnit}", type: "Number", liveChange: this.onInputChange.bind(this) }),
                            new sap.m.Label({ text: "Currency" }),
                            new sap.m.Select(this.createId("editMainCurrencySelect"), { selectedKey: "{/editRow/currencyCode}", items: { path: "/Currency", template: new sap.ui.core.Item({ key: "{currencyCode}", text: "{description}" }) } }),
                            new sap.m.Label({ text: "Total" }),
                            new sap.m.Input(this.createId("editMainTotalInput"), { value: "{/editRow/total}", editable: false }),
                            new sap.m.Label({ text: "Profit Margin" }),
                            new sap.m.Input(this.createId("editMainProfitMarginInput"), { value: "{/editRow/profitMargin}", type: "Number", liveChange: this.onInputChange.bind(this) }),
                            new sap.m.Label({ text: "Amount Per Unit with Profit" }),
                            new sap.m.Input(this.createId("editMainAmountPerUnitWithProfitInput"), { value: "{/editRow/amountPerUnitWithProfit}", editable: false }),
                            new sap.m.Label({ text: "Total with Profit" }),
                            new sap.m.Input(this.createId("editMainTotalWithProfitInput"), { value: "{/editRow/totalWithProfit}", editable: false })
                        ]
                    });
                    this._oEditMainDialog = new sap.m.Dialog({
                        title: "Edit Main Item", contentWidth: "700px", contentHeight: "auto", resizable: true, draggable: true,
                        content: [oMainForm],
                        beginButton: new sap.m.Button({ text: "Save", type: "Emphasized", press: this.onSaveEdit.bind(this) }),
                        endButton: new sap.m.Button({ text: "Cancel", press: () => { this._oEditMainDialog.close(); this._oEditMainDialog.destroy(); this._oEditMainDialog = null; } })
                    });
                    this.getView().addDependent(this._oEditMainDialog);
                }
                this._oEditMainDialog.open();
            }
        },

        _onSubValueChange: function (oEvent) {
            var oModel   = this.getView().getModel();
            var oEditRow = oModel.getProperty("/editRow") || {};
            var val      = parseFloat(oEvent.getParameter("value"));
            var fieldId  = oEvent.getSource().getBindingInfo("value").parts[0].path.split("/").pop();
            oEditRow[fieldId] = isNaN(val) ? 0 : val;
            oEditRow.total = ((parseFloat(oEditRow.quantity) || 0) * (parseFloat(oEditRow.amountPerUnit) || 0)).toFixed(3);
            oModel.setProperty("/editRow", oEditRow);
        },

        _onEditFormulaSelected: function () { /* formula change in edit dialog — Enter Parameters button handles param entry */ },

        onOpenEditFormulaDialog: function () {
            var oModel       = this.getView().getModel();
            var sFormulaCode = oModel.getProperty("/editRow/formulaCode");
            if (!sFormulaCode) { MessageToast.show("Please select a formula first."); return; }
            var oFormula = (oModel.getProperty("/Formulas") || []).find(f => f.formulaCode === sFormulaCode);
            if (!oFormula) { MessageToast.show("Formula not found."); return; }

            var oVBox = new sap.m.VBox({ id: this.createId("editFormulaParamBox") });
            oFormula.parameterDescriptions.forEach((desc, i) => {
                oVBox.addItem(new sap.m.Label({ text: desc }));
                oVBox.addItem(new sap.m.Input(this.createId("editParam_" + oFormula.parameterIds[i]), { placeholder: "Enter " + desc }));
            });
            var oDialog = new sap.m.Dialog({
                title: "Enter Formula Parameters", content: [oVBox],
                beginButton: new sap.m.Button({
                    text: "OK", type: "Emphasized",
                    press: () => {
                        var oParams = {};
                        oFormula.parameterIds.forEach(id => { oParams[id] = this.byId("editParam_" + id).getValue(); });
                        oModel.setProperty("/editRow/quantity", this._calculateFormulaResult(oFormula, oParams));
                        MessageToast.show("Quantity updated.");
                        oDialog.close();
                    }
                }),
                endButton: new sap.m.Button({ text: "Cancel", press: () => oDialog.close() })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onSaveEdit: function () {
            var oView   = this.getView();
            var oModel  = oView.getModel();
            var oEdited = oModel.getProperty("/editRow");
            var bIsSub  = !!oEdited.invoiceSubItemCode;

            var oCurrSel = bIsSub ? oView.byId("editSubCurrency") : oView.byId("editMainCurrencySelect");
            var oUOMSel  = bIsSub ? oView.byId("editSubUOM")      : oView.byId("editMainUOMSelect");
            var oFrmSel  = bIsSub ? oView.byId("editSubFormula")  : oView.byId("editFormulaSelect");

            var oCurItem = oCurrSel && oCurrSel.getSelectedItem();
            oEdited.currencyCode = oCurItem ? oCurItem.getText() : "";
            var oUOMItem = oUOMSel && oUOMSel.getSelectedItem();
            oEdited.unitOfMeasurementCode = oUOMItem ? oUOMItem.getText() : "";
            var oFrmItem = oFrmSel && oFrmSel.getSelectedItem();
            oEdited.formulaCode = oFrmItem ? oFrmItem.getText() : "";

            if (bIsSub) {
                oEdited.total = ((parseFloat(oEdited.quantity) || 0) * (parseFloat(oEdited.amountPerUnit) || 0)).toFixed(3);
            } else {
                var hasSubItems = Array.isArray(oEdited.subItemList) && oEdited.subItemList.length > 0;
                if (!hasSubItems) this._applyProfitToItem(oEdited);
            }

            oModel.setProperty(this._editPath, oEdited);

            if (bIsSub) {
                var aParts = this._editPath.split('/');
                var iMain  = parseInt(aParts[aParts.indexOf('MainItems') + 1]);
                if (iMain >= 0) {
                    var oMain = oModel.getProperty("/MainItems/" + iMain);
                    if (oMain) { this._recalculateMainFromSubitems(oMain); oModel.setProperty("/MainItems/" + iMain, oMain); }
                }
            }

            this._recalculateTotalValue();
            oModel.refresh(true);
            MessageToast.show("The line was updated successfully");

            if (this._oEditSubDialog  && this._oEditSubDialog.isOpen())  { this._oEditSubDialog.close();  this._oEditSubDialog.destroy();  this._oEditSubDialog  = null; }
            if (this._oEditMainDialog && this._oEditMainDialog.isOpen()) { this._oEditMainDialog.close(); this._oEditMainDialog.destroy(); this._oEditMainDialog = null; }
        },

        // ─── DELETE ───────────────────────────────────────────────────────────────
        onDeleteRow: function (oEvent) {
            var oModel   = this.getView().getModel();
            var oContext = oEvent.getSource().getBindingContext();
            var oObject  = oContext.getObject();
            var sPath    = oContext.getPath();

            MessageBox.confirm("Are you sure you want to delete this item?", {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.YES) return;
                    var aParts = sPath.split("/");
                    if (oObject.invoiceSubItemCode) {
                        var iMain = parseInt(aParts[2]), iSub = parseInt(aParts[4]);
                        var aItems = oModel.getProperty("/MainItems");
                        aItems[iMain].subItemList.splice(iSub, 1);
                        this._recalculateMainFromSubitems(aItems[iMain]);
                        MessageToast.show("Sub item deleted.");
                    } else {
                        var aItems2 = oModel.getProperty("/MainItems");
                        aItems2.splice(parseInt(aParts[2]), 1);
                        MessageToast.show("Main item deleted.");
                    }
                    this._recalculateTotalValue();
                    oModel.refresh(true);
                }
            });
        },

        // ─── SEARCH ───────────────────────────────────────────────────────────────
        onSearch: function (oEvent) {
            var oBinding = this.byId("treeTable").getBinding("rows");
            if (!oBinding) return;
            var sQuery = oEvent.getParameter("query") || oEvent.getSource().getValue();
            if (!sQuery) { oBinding.filter([]); return; }
            oBinding.filter(new sap.ui.model.Filter({
                filters: [
                    new sap.ui.model.Filter("serviceNumberCode",     sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("description",           sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("unitOfMeasurementCode", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("currencyCode",          sap.ui.model.FilterOperator.Contains, sQuery)
                ],
                and: false
            }));
        },

        // ─── IMPORT / EXPORT ──────────────────────────────────────────────────────
        _openExcelUploadDialogTendering: function () {
            var selectedFile;
            var oMainModel = this.getView().getModel();
            var oFileUploader = new sap.ui.unified.FileUploader({ width: "100%", fileType: ["xls","xlsx"], sameFilenameAllowed: true, change: e => { selectedFile = e.getParameter("files")[0]; } });
            var oDialogContent = new sap.m.VBox({ items: [oFileUploader] });
            var oExcelTable;
            var oExcelDialog = new sap.m.Dialog({
                title: "Import Main Items from Excel", contentWidth: "80%", contentHeight: "70%", content: [oDialogContent],
                buttons: [
                    new sap.m.Button({ text: "Add Selected", type: "Emphasized", press: () => {
                        var rows = oExcelTable.getModel().getProperty("/rows").filter(r => r.selected);
                        if (!rows.length) { MessageToast.show("Please select at least one row!"); return; }
                        var aItems = oMainModel.getProperty("/MainItems") || [];
                        rows.forEach(row => {
                            var qty = parseFloat(row["Quantity"]) || 0, amt = parseFloat(row["Amount Per Unit"]) || 0, pm = parseFloat(row["Profit Margin"]) || 0;
                            var total = qty * amt;
                            aItems.push({ salesQuotation: oMainModel.getProperty("/docNumber"), salesQuotationItem: oMainModel.getProperty("/itemNumber"), pricingProcedureStep: "1", pricingProcedureCounter: "10", customerNumber: "120000", invoiceMainItemCode: Date.now().toString(), serviceNumberCode: row["Service No"] || "", description: row["Description"] || "", quantity: qty, unitOfMeasurementCode: row["UOM"] || "", formulaCode: row["Formula"] || "", currencyCode: row["Currency"] || "", amountPerUnit: amt, total: total.toFixed(3), profitMargin: pm, amountPerUnitWithProfit: (pm > 0 ? amt + amt*(pm/100) : amt).toFixed(3), totalWithProfit: (pm > 0 ? total + total*(pm/100) : total).toFixed(3), subItemList: [] });
                        });
                        oMainModel.setProperty("/MainItems", aItems);
                        this._recalculateTotalValue();
                        oMainModel.refresh(true);
                        MessageToast.show("Items added successfully!");
                        oExcelDialog.close();
                    }}),
                    new sap.m.Button({ text: "Add All", press: () => { var rows = oExcelTable.getModel().getProperty("/rows"); rows.forEach(r => r.selected = true); oExcelTable.getModel().refresh(); oExcelDialog.getButtons()[0].firePress(); } }),
                    new sap.m.Button({ text: "Cancel", press: () => oExcelDialog.close() })
                ]
            });
            oFileUploader.attachChange(() => {
                if (!selectedFile) return;
                var reader = new FileReader();
                reader.onload = e => {
                    var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                    var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                    rows.forEach(r => r.selected = false);
                    oExcelTable = new sap.m.Table({ width: "100%", columns: ["Select","Service No","Description","Quantity","UOM","Formula","Currency","Amount Per Unit","Total"].map(t => new sap.m.Column({ header: new sap.m.Text({ text: t }) })) });
                    oExcelTable.setModel(new sap.ui.model.json.JSONModel({ rows }));
                    oExcelTable.bindItems({ path: "/rows", template: new sap.m.ColumnListItem({ type: "Inactive", cells: [new sap.m.CheckBox({ selected: "{selected}" }), new sap.m.Text({ text: "{Service No}" }), new sap.m.Text({ text: "{Description}" }), new sap.m.Text({ text: "{Quantity}" }), new sap.m.Text({ text: "{UOM}" }), new sap.m.Text({ text: "{Formula}" }), new sap.m.Text({ text: "{Currency}" }), new sap.m.Text({ text: "{Amount Per Unit}" }), new sap.m.Text({ text: "{Total}" })] }) });
                    oDialogContent.addItem(oExcelTable);
                };
                reader.readAsArrayBuffer(selectedFile);
            });
            oExcelDialog.open();
        },

        onFileChange: function (oEvent) {
            var oFile = oEvent.getSource().$().find('input[type="file"]')[0]?.files[0];
            if (!oFile || !oFile.name.endsWith('.xlsx')) { MessageToast.show("Please select a valid .xlsx file."); return; }
            var oReader = new FileReader();
            oReader.onload = e => {
                var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                var aData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                if (aData.length < 2) { MessageToast.show("Excel file is empty."); return; }
                var aH = aData[0];
                var aReq = ["Service No","Description","Quantity","UOM","Amount Per Unit","Currency"];
                if (!aReq.every(h => aH.includes(h))) { MessageToast.show("Excel must have headers: " + aReq.join(", ")); return; }
                var aRows = aData.slice(1).map(aRow => {
                    var oRow = {}; aH.forEach((h, i) => oRow[h] = aRow[i] || "");
                    var qty = parseFloat(oRow.Quantity) || 0, amt = parseFloat(oRow["Amount Per Unit"]) || 0;
                    return { serviceNumberCode: oRow["Service No"], description: oRow.Description, quantity: qty.toFixed(3), unitOfMeasurementCode: oRow.UOM, amountPerUnit: amt.toFixed(3), total: (qty*amt).toFixed(3), totalWithProfit: (qty*amt).toFixed(3), amountPerUnitWithProfit: amt.toFixed(3), currencyCode: oRow.Currency, formulaCode: "", profitMargin: "0", subItemList: [] };
                }).filter(r => r.description.trim() && r.quantity > 0);
                if (!aRows.length) { MessageToast.show("No valid rows to import."); return; }
                var oModel = this.getView().getModel();
                oModel.setProperty("/importRows", aRows);
                oModel.setProperty("/importReady", true);
                this.byId("importStatus").setText(aRows.length + " valid rows ready to import.");
            };
            oReader.readAsArrayBuffer(oFile);
        },

        onImportData: function () {
            var oModel = this.getView().getModel();
            var aItems = (oModel.getProperty("/MainItems") || []).concat(oModel.getProperty("/importRows") || []);
            oModel.setProperty("/MainItems", aItems);
            this._recalculateTotalValue();
            oModel.refresh(true);
            this.onCloseImportDialog();
            MessageToast.show("Items imported successfully!");
        },

        onExport: function () {
            var aData = this._flattenDataForExport();
            if (!aData.length) { MessageToast.show("No data to export."); return; }
            var aH = Object.keys(aData[0]);
            var oWB = XLSX.utils.book_new();
            var oWS = XLSX.utils.aoa_to_sheet([aH].concat(aData.map(r => aH.map(k => r[k]))));
            XLSX.utils.book_append_sheet(oWB, oWS, "Tendering Items");
            XLSX.writeFile(oWB, "Tendering_Export_" + new Date().toISOString().slice(0,10) + ".xlsx");
            MessageToast.show(aData.length + " rows exported.");
            this.onCloseExportDialog();
        },

        onExportPDF: function () {
            var aData = this._flattenDataForExport();
            if (!aData.length) { MessageToast.show("No data to export."); return; }
            var aH = Object.keys(aData[0]);
            var oDoc = new window.jspdf.jsPDF('l','mm','a4');
            oDoc.text("Tendering Items Export - " + new Date().toLocaleDateString(), 14, 20);
            oDoc.autoTable({ head: [aH], body: aData.map(r => aH.map(k => r[k])), startY: 30, theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [41,128,185], textColor: 255 }, margin: { top: 30, left: 10, right: 10 } });
            oDoc.text("Total Value: " + (this.getView().getModel().getProperty("/totalValue") || 0) + " SAR", 14, oDoc.lastAutoTable.finalY + 10);
            oDoc.save("Tendering_Export_" + new Date().toISOString().slice(0,10) + ".pdf");
            MessageToast.show(aData.length + " rows exported to PDF.");
            this.onCloseExportDialog();
        },

        _flattenDataForExport: function () {
            return (this.getView().getModel().getProperty("/MainItems") || []).map(m => ({
                "Type": "Main", "Service No": m.serviceNumberCode || "", "Description": m.description || "",
                "Quantity": m.quantity || "0", "UOM": m.unitOfMeasurementCode || "", "Formula": m.formulaCode || "",
                "Currency": m.currencyCode || "", "Amount Per Unit": m.amountPerUnit || "0",
                "Total": m.total || "0", "Profit Margin": m.profitMargin || "0",
                "Amount Per Unit with Profit": m.amountPerUnitWithProfit || "0",
                "Total with Profit": m.totalWithProfit || "0"
            }));
        },

        onCloseImportDialog: function () {
            this.byId("importDialog").close();
            var oModel = this.getView().getModel();
            oModel.setProperty("/importReady", false);
            oModel.setProperty("/importRows", []);
            this.byId("importStatus").setText("");
        },

        onCancelSubDialog: function () { this.byId("addSubDialog").close(); },

        onCollapseAll: function () { try { this.byId("treeTable").collapseAll(); } catch(e) { console.error(e); } },
        onCollapseSelection: function () {
            try {
                var oT = this.byId("treeTable");
                var aIdx = oT.getSelectedIndices().filter(i => i >= 0);
                if (!aIdx.length) { MessageToast.show("Please select rows to collapse."); return; }
                oT.collapse(aIdx);
            } catch(e) { console.error(e); }
        },
        onExpandFirstLevel: function () { try { this.byId("treeTable").expandToLevel(1); } catch(e) { console.error(e); } },
        onExpandSelection: function () {
            try {
                var oT = this.byId("treeTable");
                var aIdx = oT.getSelectedIndices().filter(i => i >= 0);
                if (!aIdx.length) { MessageToast.show("Please select rows to expand."); return; }
                oT.expand(aIdx);
            } catch(e) { console.error(e); }
        },

        onCloseDialog: function (oEvent) { oEvent.getSource().getParent().close(); },
        onCloseMainItemDialog: function () { this.byId("addMainItemDialog").close(); },
        onCloseExportDialog: function () { this.byId("exportChoiceDialog").close(); },
        onPrint: function () { MessageToast.show("Print not implemented yet."); }
    });
});