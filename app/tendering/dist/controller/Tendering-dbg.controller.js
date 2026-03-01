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
                .then(response => { if (!response.ok) throw new Error(response.statusText); return response.json(); })
                .then(data => {
                    if (data && data.value) {
                        const ServiceNumbers = data.value.map(item => ({
                            serviceNumberCode: item.serviceNumberCode,
                            description: item.description
                        }));
                        this.getView().getModel().setProperty("/ServiceNumbers", ServiceNumbers);
                    }
                })
                .catch(err => console.error("Error fetching ServiceNumbers:", err));

            fetch("./odata/v4/sales-cloud/Formulas")
                .then(r => r.json())
                .then(data => {
                    oModel.setProperty("/Formulas", Array.isArray(data.value) ? data.value : []);
                    oModel.refresh(true);
                })
                .catch(err => { console.error("Error fetching Formulas:", err); sap.m.MessageToast.show("Failed to load formulas."); });

            fetch("./odata/v4/sales-cloud/UnitOfMeasurements")
                .then(r => r.json())
                .then(data => { oModel.setProperty("/UOM", Array.isArray(data.value) ? data.value : []); oModel.refresh(true); });

            fetch("./odata/v4/sales-cloud/Currencies")
                .then(r => r.json())
                .then(data => { oModel.setProperty("/Currency", Array.isArray(data.value) ? data.value : []); oModel.refresh(true); });
        },

        _onRouteMatched: function (oEvent) {
            var oView = this.getView();
            var oModel = oView.getModel();
            var args = oEvent.getParameter("arguments");
            var docNumber = args.docNumber;
            var itemNumber = args.itemNumber;
            oModel.setProperty("/docNumber", docNumber);
            oModel.setProperty("/itemNumber", itemNumber);

            fetch("./odata/v4/sales-cloud/getInvoiceMainItemByReferenceIdAndItemNumber", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referenceId: docNumber, salesQuotationItem: itemNumber })
            })
                .then(response => response.json())
                .then(data => {
                    const mainItems = Array.isArray(data.value) ? data.value : [];
                    // FIX: totalValue = sum of totalWithProfit (matching Spring Boot getTotalHeader())
                    const totalValue = mainItems.reduce((sum, record) => sum + Number(record.totalWithProfit || record.total || 0), 0);
                    oModel.setProperty("/MainItems", mainItems);
                    oModel.setProperty("/totalValue", totalValue);
                    oView.byId("treeTable").setModel(oModel);
                })
                .catch(err => console.error("Error fetching MainItems", err));
        },

        // ─── CORE CALCULATION (matches Spring Boot InvoiceMainItem.calculateTotal()) ───────────
        // profitMargin = 0 or null → totalWithProfit = total, amountPerUnitWithProfit = amountPerUnit
        // profitMargin > 0         → totalWithProfit = total + total*(pm/100), amountPerUnitWithProfit = amt + amt*(pm/100)
        _applyProfitToItem: function (oItem) {
            const quantity = parseFloat(oItem.quantity) || 0;
            const amountPerUnit = parseFloat(oItem.amountPerUnit) || 0;
            const profitMargin = parseFloat(oItem.profitMargin) || 0;

            const total = quantity * amountPerUnit;
            oItem.total = total.toFixed(3);

            if (profitMargin > 0) {
                oItem.totalWithProfit = (total + total * (profitMargin / 100)).toFixed(3);
                oItem.amountPerUnitWithProfit = (amountPerUnit + amountPerUnit * (profitMargin / 100)).toFixed(3);
            } else {
                // Match Spring Boot: when no profit, these equal the base values (not zero)
                oItem.totalWithProfit = total.toFixed(3);
                oItem.amountPerUnitWithProfit = amountPerUnit.toFixed(3);
            }
        },

        // ─── TOTAL VALUE = sum of totalWithProfit (matches Spring Boot getTotalHeader()) ───────
        _recalculateTotalValue: function () {
            const oModel = this.getView().getModel();
            const aMainItems = oModel.getProperty("/MainItems") || [];
            const newTotalValue = aMainItems.reduce((sum, item) => sum + parseFloat(item.totalWithProfit || item.total || 0), 0);
            oModel.setProperty("/totalValue", newTotalValue);
        },

        // ─── SUB-ITEM → MAIN RECALC (matches Spring Boot updateMainItem() with subItems) ───────
        // amountPerUnit = sum of all sub-item totals
        // total = quantity * amountPerUnit
        // then apply profit
        _recalculateMainFromSubitems: function (oMainItem) {
            if (!oMainItem || !Array.isArray(oMainItem.subItemList)) return;

            const totalSubItems = oMainItem.subItemList.reduce((sum, sub) => sum + (parseFloat(sub.total) || 0), 0);

            // amountPerUnit = total of all subitems (Spring Boot: oldMainItem.setAmountPerUnit(totalFromSubItems))
            oMainItem.amountPerUnit = totalSubItems.toFixed(3);

            // Apply profit calculation (sets total, totalWithProfit, amountPerUnitWithProfit)
            this._applyProfitToItem(oMainItem);
        },

        onInputChange: function (oEvent) {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oSource = oEvent.getSource();
            var sId = oSource.getId();
            var bIsEdit = sId.includes("editMain");
            var sViewId = this.getView().getId();

            var oQtyInput = bIsEdit ? this.byId("editMainQuantityInput") : sap.ui.getCore().byId(sViewId + "--mainQuantityInput");
            var oAmtInput = bIsEdit ? this.byId("editMainAmountPerUnitInput") : sap.ui.getCore().byId(sViewId + "--mainAmountPerUnitInput");
            var oProfitInput = bIsEdit ? this.byId("editMainProfitMarginInput") : sap.ui.getCore().byId(sViewId + "--mainProfitMarginInput");

            var iQuantity = parseFloat(oQtyInput ? oQtyInput.getValue() : 0) || 0;
            var iAmount = parseFloat(oAmtInput ? oAmtInput.getValue() : 0) || 0;
            var iProfitMargin = parseFloat(oProfitInput ? oProfitInput.getValue() : 0) || 0;

            var iTotal = iQuantity * iAmount;
            // FIX: match Spring Boot — no profit means values equal base (not zero)
            var amountPerUnitWithProfit = iProfitMargin > 0 ? (iAmount + iAmount * (iProfitMargin / 100)) : iAmount;
            var totalWithProfit = iProfitMargin > 0 ? (iTotal + iTotal * (iProfitMargin / 100)) : iTotal;

            if (bIsEdit) {
                var oEditRow = oModel.getProperty("/editRow") || {};
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
            if (oSelectedItem) {
                var oModel = this.getView().getModel();
                oModel.setProperty("/SelectedServiceNumber", oSelectedItem.getKey());
                oModel.setProperty("/SelectedServiceNumberDescription", oSelectedItem.getText());
                oDescriptionInput.setValue(oSelectedItem.getText());
                oDescriptionInput.setEditable(false);
            } else {
                oDescriptionInput.setValue("");
                oDescriptionInput.setEditable(true);
            }
        },

        _calculateFormulaResult: function (oFormula, oParams) {
            if (!oFormula || !oParams) return 0;
            try {
                let expression = oFormula.formulaLogic;
                oFormula.parameterIds.forEach(paramId => {
                    expression = expression.replaceAll(paramId, parseFloat(oParams[paramId]) || 0);
                });
                expression = expression.replace(/\^/g, "**");
                const result = Function('"use strict";return (' + expression + ')')();
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
            if (!oFormula) {
                var oQuantityInput = this.byId("mainQuantityInput");
                oQuantityInput.setEditable(true);
                oModel.setProperty("/IsFormulaBasedQuantity", false);
                oQuantityInput.setValue("");
            }
        },

        onOpenFormulaDialog: function (oEvent) {
            var sLocalId = oEvent.getSource().getId().split('--').pop();
            var sItemType = sLocalId === "btnSubParameters" ? "sub" : "main";
            var oModel = this.getView().getModel();
            var oFormula = sItemType === "sub" ? oModel.getProperty("/SelectedSubFormula") : oModel.getProperty("/SelectedFormula");
            if (!oFormula) { MessageToast.show("Please select a formula first."); return; }

            var oVBox = sItemType === "sub" ? this.byId("subFormulaParamContainer") : this.byId("formulaParamContainer");
            oVBox.removeAllItems();
            var oParams = {};
            oFormula.parameterIds.forEach((sId, i) => {
                oParams[sId] = "";
                oVBox.addItem(new Label({ text: oFormula.parameterDescriptions[i] }));
                oVBox.addItem(new Input({
                    placeholder: "Enter " + oFormula.parameterDescriptions[i],
                    value: "{/" + (sItemType === "sub" ? "SubFormulaParameters" : "FormulaParameters") + "/" + sId + "}"
                }));
            });
            oModel.setProperty(sItemType === "sub" ? "/SubFormulaParameters" : "/FormulaParameters", oParams);
            (sItemType === "sub" ? this.byId("SubFormulaDialog") : this.byId("formulaDialog")).open();
        },

        onFormulaDialogOK: function () {
            var oModel = this.getView().getModel();
            var oFormula = oModel.getProperty("/SelectedFormula");
            var oParams = oModel.getProperty("/FormulaParameters");
            oModel.setProperty("/SelectedFormulaParams", oParams);
            this.byId("formulaDialog").close();
            var result = this._calculateFormulaResult(oFormula, oParams);
            var oQuantityInput = this.byId("mainQuantityInput");
            oQuantityInput.setValue(result);
            oQuantityInput.setEditable(false);
            oModel.setProperty("/IsFormulaBasedQuantity", true);
        },

        onApplyProfitMargin: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oTable = oView.byId("treeTable");
            // FIX 4: filter out -1 (no selection)
            var aSelectedIndices = oTable.getSelectedIndices().filter(i => i >= 0);
            if (aSelectedIndices.length === 0) { sap.m.MessageToast.show("Please select a main item first."); return; }

            var sPath = oTable.getContextByIndex(aSelectedIndices[0]).getPath();
            var oItem = oModel.getProperty(sPath);
            var eProfitMargin = parseFloat(oView.byId("groupInput").getValue()) || 0;

            oItem.profitMargin = eProfitMargin;
            // Use unified calculation
            this._applyProfitToItem(oItem);
            oModel.setProperty(sPath, oItem);

            this._recalculateTotalValue();
            oModel.refresh(true);
            sap.m.MessageToast.show("Profit margin applied to selected item.");
        },

        onSubFormulaDialogOK: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/SelectedSubFormulaParams", oModel.getProperty("/SubFormulaParameters"));
            this.byId("SubFormulaDialog").close();
        },

        onSubInputChange: function () {
            var oView = this.getView();
            var iQuantity = parseFloat(oView.byId("subQuantityInput").getValue()) || 0;
            var iAmount = parseFloat(oView.byId("subAmountPerUnitInput").getValue()) || 0;
            oView.getModel().setProperty("/SubTotal", (iQuantity * iAmount).toFixed(3));
        },

        onSubServiceNumberChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oSelectedItem = oSelect.getSelectedItem();
            var oDescriptionInput = this.byId("subDescriptionInput");
            var oModel = this.getView().getModel();
            if (oSelectedItem) {
                oModel.setProperty("/SelectedSubServiceNumber", oSelectedItem.getKey());
                oModel.setProperty("/SelectedSubDescriptionText", oSelectedItem.getText());
                oModel.setProperty("/SubDescriptionEditable", false);
                oDescriptionInput.setValue(oSelectedItem.getText());
                oDescriptionInput.setEditable(false);
            } else {
                oModel.setProperty("/SelectedSubServiceNumber", "");
                oModel.setProperty("/SelectedSubDescriptionText", "");
                oModel.setProperty("/SubDescriptionEditable", true);
                oDescriptionInput.setValue("");
                oDescriptionInput.setEditable(true);
            }
        },

        onSaveDocument: function () {
            const oModel = this.getView().getModel();
            let Items = oModel.getProperty("/MainItems") || [];

            Items = Items.map(item => {
                const {
                    createdAt, modifiedAt, createdBy, modifiedBy, invoiceMainItemCode,
                    serviceNumber_serviceNumberCode, currencyText, formulaText, unitOfMeasurementText,
                    salesQuotation, salesQuotationItem, pricingProcedureCounter, pricingProcedureStep,
                    customerNumber, ...rest
                } = item;
                rest.totalHeader = parseFloat(Number(rest.totalHeader || 0).toFixed(3));
                const cleanedSubItems = (item.subItemList || [])
                    .filter(sub => sub && sub.serviceNumberCode)
                    .map(sub => {
                        const { invoiceMainItemCode, createdAt, createdBy, modifiedAt, modifiedBy, invoiceSubItemCode, mainItem_invoiceMainItemCode, serviceNumber_serviceNumberCode, ...subRest } = sub;
                        return { ...subRest, amountPerUnit: parseFloat(Number(subRest.amountPerUnit || 0).toFixed(3)), total: parseFloat(Number(subRest.total || 0).toFixed(3)) };
                    });
                return { ...rest, subItemList: cleanedSubItems };
            });

            const body = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "20",
                pricingProcedureCounter: "1",
                customerNumber: "120000",
                invoiceMainItemCommands: Items
            };

            fetch("./odata/v4/sales-cloud/saveOrUpdateMainItems", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
                .then(response => { if (!response.ok) throw new Error("Failed to save: " + response.statusText); return response.json(); })
                .then(savedItem => {
                    const updatedMainItems = Array.isArray(savedItem.value) ? savedItem.value : [];
                    oModel.setProperty("/MainItems", updatedMainItems);
                    // FIX: sum totalWithProfit for totalValue
                    const totalValue = updatedMainItems.reduce((sum, record) => sum + Number(record.totalWithProfit || record.total || 0), 0);
                    oModel.setProperty("/totalValue", totalValue);
                    oModel.refresh(true);
                    sap.m.MessageToast.show("Document saved successfully!");
                })
                .catch(err => { console.error("Error saving:", err); sap.m.MessageBox.error("Error: " + err.message); });
        },

        onOpenSubDialogForRow: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oObject = oContext.getObject();
            if (!oObject.subItemList) { sap.m.MessageToast.show("You can only add subitems under a main item!"); return; }

            this._selectedParent = oObject;
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

            var oModel = this.getView().getModel();
            oModel.setProperty("/HasSelectedSubFormula", false);
            oModel.setProperty("/SelectedSubFormulaParams", {});
            oModel.setProperty("/SelectedSubServiceNumber", "");
            oModel.setProperty("/SelectedSubDescriptionText", "");
            oModel.setProperty("/SubDescriptionEditable", true);
            oModel.setProperty("/SubTotal", "0");

            this.byId("addSubDialog").open();
        },

        onEditRow: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            if (!oContext) { sap.m.MessageToast.show("No item context found."); return; }

            var oData = oContext.getObject();
            var oModel = this.getView().getModel();
            this._editPath = oContext.getPath();
            oModel.setProperty("/editRow", Object.assign({}, oData));

            var bIsSubItem = !!oData.invoiceSubItemCode;

            if (bIsSubItem) {
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

        // For sub-item live edits in the dialog: only total = qty * amount
        _onSubValueChange: function (oEvent) {
            const oModel = this.getView().getModel();
            const oEditRow = oModel.getProperty("/editRow") || {};
            const fieldId = oEvent.getSource().getBindingInfo("value").parts[0].path.split("/").pop();
            const newValue = parseFloat(oEvent.getParameter("value"));
            oEditRow[fieldId] = isNaN(newValue) ? 0 : newValue;
            oEditRow.total = ((parseFloat(oEditRow.quantity) || 0) * (parseFloat(oEditRow.amountPerUnit) || 0)).toFixed(3);
            oModel.setProperty("/editRow", oEditRow);
        },

        // FIX 3 & 5: Correct save logic — sub-item edit recalcs parent, all use _applyProfitToItem, single refresh at end
        onSaveEdit: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var oEdited = oModel.getProperty("/editRow");
            var bIsSubItem = !!oEdited.invoiceSubItemCode;

            // Read select values
            var oCurrencySelect = bIsSubItem ? oView.byId("editSubCurrency") : oView.byId("editMainCurrencySelect");
            var oUOMSelect = bIsSubItem ? oView.byId("editSubUOM") : oView.byId("editMainUOMSelect");
            var oFormulaSelect = bIsSubItem ? oView.byId("editSubFormula") : oView.byId("editFormulaSelect");

            var oSelCur = oCurrencySelect && oCurrencySelect.getSelectedItem();
            oEdited.currencyCode = oSelCur ? oSelCur.getText() : "";
            var oSelUOM = oUOMSelect && oUOMSelect.getSelectedItem();
            oEdited.unitOfMeasurementCode = oSelUOM ? oSelUOM.getText() : "";
            var oSelFrm = oFormulaSelect && oFormulaSelect.getSelectedItem();
            oEdited.formulaCode = oSelFrm ? oSelFrm.getText() : "";

            // For sub-item: ensure total is recalculated
            if (bIsSubItem) {
                oEdited.total = ((parseFloat(oEdited.quantity) || 0) * (parseFloat(oEdited.amountPerUnit) || 0)).toFixed(3);
            } else {
                // For main item without sub-items (or if user edited it directly): use _applyProfitToItem
                // Only if it has no subitems — if it does, _recalculateMainFromSubitems handles it
                const hasSubItems = Array.isArray(oEdited.subItemList) && oEdited.subItemList.length > 0;
                if (!hasSubItems) {
                    this._applyProfitToItem(oEdited);
                }
            }

            // Step 1: Write edited row back to model
            oModel.setProperty(this._editPath, oEdited);

            // FIX 3: If sub-item — find parent and recalculate using correct path parsing
            if (bIsSubItem) {
                const aPathParts = this._editPath.split('/');
                const iMainItemsIdx = aPathParts.indexOf('MainItems');
                const iMainIndex = iMainItemsIdx >= 0 ? parseInt(aPathParts[iMainItemsIdx + 1]) : -1;
                if (iMainIndex >= 0) {
                    const oMainItem = oModel.getProperty("/MainItems/" + iMainIndex);
                    if (oMainItem) {
                        this._recalculateMainFromSubitems(oMainItem);
                        oModel.setProperty("/MainItems/" + iMainIndex, oMainItem);
                    }
                }
            }

            // FIX 5: Recalculate totalValue (sum of totalWithProfit) AFTER all updates
            this._recalculateTotalValue();

            // Single refresh at the end
            oModel.refresh(true);
            sap.m.MessageToast.show("The line was updated successfully");

            if (this._oEditSubDialog && this._oEditSubDialog.isOpen()) { this._oEditSubDialog.close(); this._oEditSubDialog.destroy(); this._oEditSubDialog = null; }
            if (this._oEditMainDialog && this._oEditMainDialog.isOpen()) { this._oEditMainDialog.close(); this._oEditMainDialog.destroy(); this._oEditMainDialog = null; }
        },

        _onEditFormulaSelected: function (oFormula, oContext) {
            const oModel = this.getView().getModel();
            const oData = oContext.getObject();
            const oInput = new sap.m.Input({ placeholder: "Enter value for " + oFormula.parameterDescriptions[0] });
            const oDialog = new sap.m.Dialog({
                title: "Enter Parameters", content: [oInput],
                beginButton: new sap.m.Button({ text: "OK", press: () => { const val = parseFloat(oInput.getValue()); if (isNaN(val)) { sap.m.MessageToast.show("Please enter a valid number"); return; } oData.result = (22 / 7) * (val * val); oModel.refresh(true); oDialog.close(); } }),
                endButton: new sap.m.Button({ text: "Cancel", press: () => oDialog.close() })
            });
            oDialog.open();
        },

        onOpenEditFormulaDialog: function () {
            const oModel = this.getView().getModel();
            const sFormulaCode = oModel.getProperty("/editRow/formulaCode");
            if (!sFormulaCode) { sap.m.MessageToast.show("Please select a formula first."); return; }
            const oFormula = (oModel.getProperty("/Formulas") || []).find(f => f.formulaCode === sFormulaCode);
            if (!oFormula) { sap.m.MessageToast.show("Formula not found."); return; }

            const oVBox = new sap.m.VBox({ id: this.createId("editFormulaParamBox") });
            oFormula.parameterDescriptions.forEach((desc, i) => {
                oVBox.addItem(new sap.m.Label({ text: desc }));
                oVBox.addItem(new sap.m.Input(this.createId("editParam_" + oFormula.parameterIds[i]), { placeholder: "Enter " + desc }));
            });

            const oDialog = new sap.m.Dialog({
                title: "Enter Formula Parameters", content: [oVBox],
                beginButton: new sap.m.Button({
                    text: "OK", type: "Emphasized",
                    press: () => {
                        const oParams = {};
                        oFormula.parameterIds.forEach(id => { oParams[id] = this.byId("editParam_" + id).getValue(); });
                        oModel.setProperty("/editRow/quantity", this._calculateFormulaResult(oFormula, oParams));
                        sap.m.MessageToast.show("Quantity updated.");
                        oDialog.close();
                    }
                }),
                endButton: new sap.m.Button({ text: "Cancel", press: () => oDialog.close() })
            });
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onAddSubItem: function () {
            var oView = this.getView();
            var oModel = oView.getModel();
            var sDescription = this.byId("subDescriptionInput").getValue();
            var sQuantity = this.byId("subQuantityInput").getValue();
            if (!sDescription.trim()) { sap.m.MessageToast.show("Description is required."); return; }
            if (!sQuantity || parseFloat(sQuantity) <= 0) { sap.m.MessageToast.show("Quantity must be a positive number."); return; }

            var oServiceSelect = this.byId("subServiceNoInput").getSelectedItem();
            var oUOMSelect = this.byId("subUOMInput").getSelectedItem();
            var oFormulaSelect = this.byId("subFormulaSelect").getSelectedItem();
            var oCurrencySelect = this.byId("subCurrencyInput").getSelectedItem();
            var qty = parseFloat(sQuantity) || 0;
            var amt = parseFloat(this.byId("subAmountPerUnitInput").getValue()) || 0;

            var oSubItem = {
                serviceNumberCode: oServiceSelect ? oServiceSelect.getText() : "",
                description: sDescription,
                quantity: qty,
                unitOfMeasurementCode: oUOMSelect ? oUOMSelect.getText() : "",
                formulaCode: oFormulaSelect ? oFormulaSelect.getText() : "",
                amountPerUnit: amt,
                currencyCode: oCurrencySelect ? oCurrencySelect.getText() : "",
                total: (qty * amt).toFixed(3)
            };

            if (!this._selectedParent.subItemList) this._selectedParent.subItemList = [];
            this._selectedParent.subItemList.push(oSubItem);
            this._recalculateMainFromSubitems(this._selectedParent);

            // FIX 5: update totalValue = sum of totalWithProfit
            this._recalculateTotalValue();

            oModel.refresh(true);
            this.byId("addSubDialog").close();
            sap.m.MessageToast.show("Subitem added successfully!");
        },

        onDeleteRow: function (oEvent) {
            const oModel = this.getView().getModel();
            const oContext = oEvent.getSource().getBindingContext();
            const oObject = oContext.getObject();
            const sPath = oContext.getPath();

            sap.m.MessageBox.confirm("Are you sure you want to delete this item?", {
                title: "Confirm Deletion",
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: (sAction) => {
                    if (sAction === sap.m.MessageBox.Action.YES) {
                        const aParts = sPath.split("/");
                        if (oObject.invoiceSubItemCode) {
                            const iMainIndex = parseInt(aParts[2]);
                            const iSubIndex = parseInt(aParts[4]);
                            const aMainItems = oModel.getProperty("/MainItems");
                            aMainItems[iMainIndex].subItemList.splice(iSubIndex, 1);
                            this._recalculateMainFromSubitems(aMainItems[iMainIndex]);
                            sap.m.MessageToast.show("SubItem deleted successfully");
                        } else {
                            const aMainItems = oModel.getProperty("/MainItems");
                            aMainItems.splice(parseInt(aParts[2]), 1);
                            sap.m.MessageToast.show("MainItem deleted successfully");
                        }
                        this._recalculateTotalValue();
                        oModel.refresh(true);
                    }
                }
            });
        },

        // FIX 1: Clear all fields before opening Add Main Item dialog
        onOpenMainDialog: function () {
            const oView = this.getView();
            const oModel = oView.getModel();

            oView.byId("mainItemNoInput").setValue("");
            oView.byId("mainDescriptionInput").setValue("");
            oView.byId("mainDescriptionInput").setEditable(true);
            oView.byId("mainQuantityInput").setValue("");
            oView.byId("mainQuantityInput").setEditable(true);
            oView.byId("mainAmountPerUnitInput").setValue("");
            oView.byId("mainServiceNoSelect").setSelectedKey("");
            oView.byId("mainUOMSelect").setSelectedKey("");
            oView.byId("mainCurrencySelect").setSelectedKey("");
            oView.byId("formulaSelect").setSelectedKey("");

            oModel.setProperty("/Total", 0);
            oModel.setProperty("/totalWithProfit", 0);
            oModel.setProperty("/amountPerUnitWithProfit", 0);
            oModel.setProperty("/SelectedServiceNumber", "");
            oModel.setProperty("/SelectedServiceNumberDescription", "");
            oModel.setProperty("/HasSelectedFormula", false);
            oModel.setProperty("/SelectedFormula", null);
            oModel.setProperty("/FormulaParameters", {});
            oModel.setProperty("/IsFormulaBasedQuantity", false);

            this.byId("addMainDialog").open();
        },

        onAddMainItem: function () {
            const oView = this.getView();
            const oModel = oView.getModel();
            var oUOMSelect = oView.byId("mainUOMSelect");
            var oFormulaSelect = oView.byId("formulaSelect");
            var oCurrencySelect = oView.byId("mainCurrencySelect");

            var qty = parseFloat(oView.byId("mainQuantityInput").getValue()) || 0;
            var amt = parseFloat(oView.byId("mainAmountPerUnitInput").getValue()) || 0;
            var pm = parseFloat(oView.byId("mainProfitMarginInput").getValue()) || 0;
            var total = qty * amt;
            // FIX: correct profit logic on add (no profit → totalWithProfit = total, not 0)
            var totalWithProfit = pm > 0 ? (total + total * (pm / 100)) : total;
            var amountPerUnitWithProfit = pm > 0 ? (amt + amt * (pm / 100)) : amt;

            const oNewMain = {
                salesQuotation: oModel.getProperty("/docNumber"),
                salesQuotationItem: oModel.getProperty("/itemNumber"),
                pricingProcedureStep: "1",
                pricingProcedureCounter: "10",
                customerNumber: "120000",
                invoiceMainItemCode: Date.now(),
                serviceNumberCode: oModel.getProperty("/SelectedServiceNumberDescription") || "",
                description: oView.byId("mainDescriptionInput").getValue() || "",
                quantity: qty,
                unitOfMeasurementCode: oUOMSelect && oUOMSelect.getSelectedItem() ? oUOMSelect.getSelectedItem().getText() : "",
                formulaCode: oFormulaSelect && oFormulaSelect.getSelectedItem() ? oFormulaSelect.getSelectedItem().getText() : "",
                currencyCode: oCurrencySelect && oCurrencySelect.getSelectedItem() ? oCurrencySelect.getSelectedItem().getText() : "",
                amountPerUnit: amt,
                total: total.toFixed(3),
                profitMargin: pm,
                amountPerUnitWithProfit: amountPerUnitWithProfit.toFixed(3),
                totalWithProfit: totalWithProfit.toFixed(3),
                subItemList: []
            };

            const aMainItems = oModel.getProperty("/MainItems") || [];
            aMainItems.push(oNewMain);
            oModel.setProperty("/MainItems", aMainItems);

            // FIX 5: totalValue = sum of totalWithProfit
            this._recalculateTotalValue();

            oModel.refresh(true);
            this.byId("addMainDialog").close();
            sap.m.MessageToast.show("Main item added successfully!");
        },

        onSearch: function (oEvent) {
            const oTable = this.byId("treeTable");
            const oBinding = oTable.getBinding("rows");
            const sQuery = oEvent.getParameter("query") || oEvent.getSource().getValue();
            if (!oBinding) return;
            if (!sQuery) { oBinding.filter([]); return; }
            const aFilters = [
                new sap.ui.model.Filter("serviceNumberCode", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("unitOfMeasurementCode", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("formulaCode", sap.ui.model.FilterOperator.Contains, sQuery),
                new sap.ui.model.Filter("currencyCode", sap.ui.model.FilterOperator.Contains, sQuery)
            ];
            oBinding.filter(new sap.ui.model.Filter({ filters: aFilters, and: false }));
        },

        onImport: function () {
            this.byId("importDialog").open();
            this.byId("importStatus").setText("");
            this.byId("fileUploader").clear();
            this.getView().getModel().setProperty("/importReady", false);
        },

        _openExcelUploadDialogTendering: function () {
            var selectedFile;
            const oMainModel = this.getView().getModel();
            var oFileUploader = new sap.ui.unified.FileUploader({ width: "100%", fileType: ["xls", "xlsx"], sameFilenameAllowed: true, change: (oEvent) => { selectedFile = oEvent.getParameter("files")[0]; } });
            var oDialogContent = new sap.m.VBox({ items: [oFileUploader] });
            var oExcelTable;

            var oExcelDialog = new sap.m.Dialog({
                title: "Import Main Items from Excel", contentWidth: "80%", contentHeight: "70%", content: [oDialogContent],
                buttons: [
                    new sap.m.Button({
                        text: "Add Selected", type: "Emphasized",
                        press: () => {
                            const aMainItems = oMainModel.getProperty("/MainItems") || [];
                            const rows = oExcelTable.getModel().getProperty("/rows");
                            const selectedRows = rows.filter(r => r.selected);
                            if (selectedRows.length === 0) { sap.m.MessageToast.show("Please select at least one row!"); return; }
                            selectedRows.forEach(row => {
                                var qty = parseFloat(row["Quantity"]) || 0;
                                var amt = parseFloat(row["Amount Per Unit"]) || 0;
                                var pm = parseFloat(row["Profit Margin"]) || 0;
                                var total = qty * amt;
                                aMainItems.push({
                                    salesQuotation: oMainModel.getProperty("/docNumber"), salesQuotationItem: oMainModel.getProperty("/itemNumber"),
                                    pricingProcedureStep: "1", pricingProcedureCounter: "10", customerNumber: "120000",
                                    invoiceMainItemCode: Date.now(),
                                    serviceNumberCode: row["Service No"] || "", description: row["Description"] || "",
                                    quantity: qty, unitOfMeasurementCode: row["UOM"] || "", formulaCode: row["Formula"] || "",
                                    currencyCode: row["Currency"] || "", amountPerUnit: amt,
                                    total: total.toFixed(3), profitMargin: pm,
                                    amountPerUnitWithProfit: (pm > 0 ? amt + amt * (pm / 100) : amt).toFixed(3),
                                    totalWithProfit: (pm > 0 ? total + total * (pm / 100) : total).toFixed(3),
                                    subItemList: []
                                });
                            });
                            oMainModel.setProperty("/MainItems", aMainItems);
                            this._recalculateTotalValue();
                            oMainModel.refresh(true);
                            sap.m.MessageToast.show("Main items added successfully!");
                            oExcelDialog.close();
                        }
                    }),
                    new sap.m.Button({ text: "Add All", press: () => { const rows = oExcelTable.getModel().getProperty("/rows"); rows.forEach(r => r.selected = true); oExcelTable.getModel().refresh(); oExcelDialog.getButtons()[0].firePress(); } }),
                    new sap.m.Button({ text: "Cancel", press: () => oExcelDialog.close() })
                ]
            });

            oFileUploader.attachChange(() => {
                if (!selectedFile) return;
                var reader = new FileReader();
                reader.onload = (e) => {
                    var data = new Uint8Array(e.target.result);
                    var workbook = XLSX.read(data, { type: "array" });
                    var jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    jsonData.forEach(r => r.selected = false);
                    oExcelTable = new sap.m.Table({ width: "100%", columns: ["Select","Service No","Description","Quantity","UOM","Formula","Currency","Amount Per Unit","Total"].map(t => new sap.m.Column({ header: new sap.m.Text({ text: t }) })) });
                    oExcelTable.setModel(new sap.ui.model.json.JSONModel({ rows: jsonData }));
                    oExcelTable.bindItems({ path: "/rows", template: new sap.m.ColumnListItem({ type: "Inactive", cells: [new sap.m.CheckBox({ selected: "{selected}" }), new sap.m.Text({ text: "{Service No}" }), new sap.m.Text({ text: "{Description}" }), new sap.m.Text({ text: "{Quantity}" }), new sap.m.Text({ text: "{UOM}" }), new sap.m.Text({ text: "{Formula}" }), new sap.m.Text({ text: "{Currency}" }), new sap.m.Text({ text: "{Amount Per Unit}" }), new sap.m.Text({ text: "{Total}" })] }) });
                    oDialogContent.addItem(oExcelTable);
                };
                reader.readAsArrayBuffer(selectedFile);
            });
            oExcelDialog.open();
        },

        onFileChange: function (oEvent) {
            var oUploader = oEvent.getSource();
            var $fileInput = oUploader.$().find('input[type="file"]');
            if ($fileInput.length === 0) { sap.m.MessageToast.show("File input not found."); return; }
            var oFile = $fileInput[0].files[0];
            if (!oFile || !oFile.name.endsWith('.xlsx')) { sap.m.MessageToast.show("Please select a valid .xlsx file."); return; }
            var oReader = new FileReader();
            oReader.onload = function (e) {
                var sData = new Uint8Array(e.target.result);
                var oWorkbook = XLSX.read(sData, { type: 'array' });
                var aData = XLSX.utils.sheet_to_json(oWorkbook.Sheets[oWorkbook.SheetNames[0]], { header: 1 });
                if (aData.length < 2) { sap.m.MessageToast.show("Excel file is empty."); return; }
                var aHeaders = aData[0];
                var aRequired = ["Service No", "Description", "Quantity", "UOM", "Amount Per Unit", "Currency"];
                if (!aRequired.every(h => aHeaders.includes(h))) { sap.m.MessageToast.show("Excel must have headers: " + aRequired.join(", ")); return; }
                var aRows = aData.slice(1).map(aRow => {
                    var oRow = {}; aHeaders.forEach((h, i) => { oRow[h] = aRow[i] || ""; });
                    var qty = parseFloat(oRow.Quantity) || 0; var amt = parseFloat(oRow["Amount Per Unit"]) || 0;
                    return { serviceNumberCode: oRow["Service No"] || "", description: oRow.Description || "", quantity: qty.toFixed(3), unitOfMeasurementCode: oRow.UOM || "", amountPerUnit: amt.toFixed(3), total: (qty * amt).toFixed(3), totalWithProfit: (qty * amt).toFixed(3), amountPerUnitWithProfit: amt.toFixed(3), currencyCode: oRow.Currency || "", formulaCode: "", profitMargin: "0", subItemList: [] };
                }).filter(r => r.description.trim() && r.quantity > 0);
                if (aRows.length === 0) { sap.m.MessageToast.show("No valid rows to import."); return; }
                this.getView().getModel().setProperty("/importRows", aRows);
                this.getView().getModel().setProperty("/importReady", true);
                this.byId("importStatus").setText(aRows.length + " valid rows ready to import.");
            }.bind(this);
            oReader.readAsArrayBuffer(oFile);
        },

        onImportData: function () {
            var oModel = this.getView().getModel();
            var aNewRows = oModel.getProperty("/importRows") || [];
            var aMainItems = (oModel.getProperty("/MainItems") || []).concat(aNewRows);
            oModel.setProperty("/MainItems", aMainItems);
            this._recalculateTotalValue();
            oModel.refresh(true);
            this.onCloseImportDialog();
            sap.m.MessageToast.show(aNewRows.length + " items imported successfully!");
        },

        onExport: function () {
            var aData = this._flattenDataForExport();
            if (aData.length === 0) { sap.m.MessageToast.show("No data to export."); return; }
            var aHeaders = Object.keys(aData[0]);
            var oWS = XLSX.utils.aoa_to_sheet([aHeaders].concat(aData.map(r => aHeaders.map(k => r[k]))));
            var oWB = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(oWB, oWS, "Tendering Items");
            XLSX.writeFile(oWB, "Tendering_Export_" + new Date().toISOString().slice(0, 10) + ".xlsx");
            sap.m.MessageToast.show(aData.length + " rows exported.");
            this.onCloseExportDialog();
        },

        onExportPDF: function () {
            var aData = this._flattenDataForExport();
            if (aData.length === 0) { sap.m.MessageToast.show("No data to export."); return; }
            var aHeaders = Object.keys(aData[0]);
            var { jsPDF } = window.jspdf;
            var oDoc = new jsPDF('l', 'mm', 'a4');
            oDoc.text("Tendering Items Export - " + new Date().toLocaleDateString(), 14, 20);
            oDoc.autoTable({ head: [aHeaders], body: aData.map(r => aHeaders.map(k => r[k])), startY: 30, theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [41, 128, 185], textColor: 255 }, margin: { top: 30, left: 10, right: 10 } });
            oDoc.text("Total Value: " + (this.getView().getModel().getProperty("/totalValue") || "0") + " SAR", 14, oDoc.lastAutoTable.finalY + 10);
            oDoc.save("Tendering_Export_" + new Date().toISOString().slice(0, 10) + ".pdf");
            sap.m.MessageToast.show(aData.length + " rows exported.");
            this.onCloseExportDialog();
        },

        _flattenDataForExport: function () {
            return (this.getView().getModel().getProperty("/MainItems") || []).map(oMain => ({
                "Type": "Main", "Service No": oMain.serviceNumberCode || "", "Description": oMain.description || "",
                "Quantity": oMain.quantity || "0", "UOM": oMain.unitOfMeasurementCode || "",
                "Formula": oMain.formulaCode || "", "Parameters": oMain.parameters ? Object.keys(oMain.parameters).join(", ") : "None",
                "Currency": oMain.currencyCode || "", "Amount Per Unit": oMain.amountPerUnit || "0",
                "Total": oMain.total || "0", "Profit Margin": oMain.profitMargin || "0",
                "Amount Per Unit with Profit": oMain.amountPerUnitWithProfit || "0",
                "Total with Profit": oMain.totalWithProfit || "0"
            }));
        },

        onCloseImportDialog: function () {
            this.byId("importDialog").close();
            this.getView().getModel().setProperty("/importReady", false);
            this.getView().getModel().setProperty("/importRows", []);
            this.byId("importStatus").setText("");
        },

        onCancelSubDialog: function () { this.byId("addSubDialog").close(); },

        // FIX 4: Collapse/Expand — filter -1 sentinel, try/catch guard
        onCollapseAll: function () { try { this.byId("treeTable").collapseAll(); } catch (e) { console.error(e); } },
        onCollapseSelection: function () {
            try {
                const oT = this.byId("treeTable");
                const aIdx = oT.getSelectedIndices().filter(i => i >= 0);
                if (aIdx.length === 0) { sap.m.MessageToast.show("Please select rows to collapse."); return; }
                oT.collapse(aIdx);
            } catch (e) { console.error(e); }
        },
        onExpandFirstLevel: function () { try { this.byId("treeTable").expandToLevel(1); } catch (e) { console.error(e); } },
        onExpandSelection: function () {
            try {
                const oT = this.byId("treeTable");
                const aIdx = oT.getSelectedIndices().filter(i => i >= 0);
                if (aIdx.length === 0) { sap.m.MessageToast.show("Please select rows to expand."); return; }
                oT.expand(aIdx);
            } catch (e) { console.error(e); }
        },

        onCloseDialog: function (oEvent) { oEvent.getSource().getParent().close(); },
        onCloseMainItemDialog: function () { this.byId("addMainItemDialog").close(); },
        onCloseExportDialog: function () { this.byId("exportChoiceDialog").close(); }
    });
});