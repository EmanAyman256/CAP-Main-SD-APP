sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/ui/layout/form/SimpleForm",
], function (Controller, MessageBox, MessageToast, SimpleForm, Spreadsheet, exportLibrary, Dialog, Input, Button, Label, VBox, HBox, Table, Column, ColumnListItem) {
    "use strict";
    return Controller.extend("project1.controller.ModelServices", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                ModelServices: [],
                Formulas: [],
                Currency: [],
                ModelSpecRec: {},
                LineTypes: [],
                UOM: [],
                personnelNumbers: [],
                ServiceTypes: [],
                ServiceNumbers: [],
                MatGroups: [], // Added for Material Groups
                FormulaParameters: {},
                HasSelectedFormula: false,
                Total: 0,
                SubTotal: 0,
                IsFormulaBasedQuantity: false,
                ServiceNumbers: [],
                SelectedServiceNumber: "",
                SelectedServiceNumberDescription: "",
                SubDescriptionEditable: true,
                SelectedFormula: null,
                totalWithProfit: 0,
                amountPerUnitWithProfit: 0,
            });
            this.getView().setModel(oModel, "view");
            // Removed general fetch for ModelSpecificationsDetails as we load specific in route matched
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
            fetch("/odata/v4/sales-cloud/PersonnelNumbers")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched personnelNumbers:", data.value);

                    if (data && data.value) {
                        const personnelNumbers = data.value.map(item => ({
                            serviceNumberCode: item.serviceNumberCode,
                            description: item.description
                        }));
                        this.getView().getModel().setProperty("/personnelNumbers", personnelNumbers);

                        console.log("personnelNumbers:", personnelNumbers);
                    }
                })
                .catch(err => {
                    console.error("Error fetching ServiceNumbers:", err);
                });
            fetch("/odata/v4/sales-cloud/ServiceTypes")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched ServiceTypes:", data.value);

                    if (data && data.value) {
                        const ServiceTypes = data.value.map(item => ({
                            serviceNumberCode: item.serviceNumberCode,
                            description: item.description
                        }));
                        this.getView().getModel().setProperty("/ServiceTypes", ServiceTypes);

                        console.log("ServiceTypes:", ServiceTypes);
                    }
                })
                .catch(err => {
                    console.error("Error fetching ServiceNumbers:", err);
                });
            fetch("/odata/v4/sales-cloud/LineTypes")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched LineTypes:", data.value);

                    if (data && data.value) {
                        const LineTypes = data.value.map(item => ({
                            serviceNumberCode: item.serviceNumberCode,
                            description: item.description
                        }));
                        this.getView().getModel().setProperty("/LineTypes", LineTypes);

                        console.log("LineTypes:", LineTypes);
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
            // Added fetch for MaterialGroups (assuming endpoint and fields match others)
            fetch("/odata/v4/sales-cloud/MaterialGroups")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched MaterialGroups:", data.value);

                    if (data && data.value) {
                        const MatGroups = data.value.map(item => ({
                            materialGroupCode: item.materialGroupCode,
                            description: item.description
                        }));
                        this.getView().getModel().setProperty("/MatGroups", MatGroups);

                        console.log("MatGroups:", MatGroups);
                    }
                })
                .catch(err => {
                    console.error("Error fetching MaterialGroups:", err);
                });
            this.getView().setModel(oModel);
            this.getOwnerComponent().getRouter()
                .getRoute("modelServices")
                .attachPatternMatched(this._onObjectMatched, this);


        },
        _onObjectMatched: function (oEvent) {
            const sModelSpecCode = oEvent.getParameter("arguments").modelSpecCode;
            // const sModelSpecRec = oEvent.getParameter("arguments").Record;
            // const oModel = this.getView().getModel("view");
            // oModel.setProperty("/ModelSpecRec", sModelSpecRec)
            // console.log("sModelSpecRec",sModelSpecRec);
            
            console.log("Navigated with modelSpecCode:", sModelSpecCode);
            this.currentModelSpecCode = sModelSpecCode;

            this._loadModelSpecificationDetails(sModelSpecCode);

        },
        _loadModelSpecificationDetails: function (sModelSpecCode) {
            const oModel = this.getView().getModel("view");
            const sUrl = `/odata/v4/sales-cloud/ModelSpecifications(${sModelSpecCode})?$expand=modelSpecificationsDetails`;
            console.log(sUrl);

            fetch(sUrl)
                .then(response => response.json())
                .then(data => {
                    console.log("API Resp:", data);
                    console.log("The Model Specification Details:", data.modelSpecificationsDetails);

                    // const aData = Array.isArray(data) ? data : [data];
                    oModel.setProperty("/ModelServices", data.modelSpecificationsDetails);
                    console.log("Fetched ModelServices for", sModelSpecCode, data.modelSpecificationsDetails);
                })
                .catch(err => {
                    console.error("Error fetching ModelSpecificationDetails:", err);
                    sap.m.MessageToast.show("Failed to load model details.");
                });
        },
        onServiceNumberChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oSelectedItem = oSelect.getSelectedItem();
            var oDescriptionInput = this.byId("mainShortTextInput");
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
        onFormulaSelected: function (oEvent) {
            var oSelect = oEvent.getSource();
            var sKey = oSelect.getSelectedKey();
            var oModel = this.getView().getModel();
            var aFormulas = oModel.getProperty("/Formulas") || [];

            var oFormula = aFormulas.find(f => f.formulaCode === sKey);
            oModel.setProperty("/SelectedFormula", oFormula || null);
            oModel.setProperty("/HasSelectedFormula", !!oFormula);

            // Enable or disable parameter button + quantity input
            var oQuantityInput = this.byId("mainQuantityInput");
            if (!oFormula) {
                oQuantityInput.setEditable(true);
                oQuantityInput.setValue("");
                oModel.setProperty("/IsFormulaBasedQuantity", false);
            } else {
                oQuantityInput.setEditable(false);
                oModel.setProperty("/IsFormulaBasedQuantity", true);
            }
        },
        onOpenFormulaDialog: function () {
            var oModel = this.getView().getModel();
            var oFormula = oModel.getProperty("/SelectedFormula");

            if (!oFormula) {
                sap.m.MessageToast.show("Please select a formula first.");
                return;
            }

            var oDialog = this.byId("formulaDialog");
            var oVBox = this.byId("formulaParamContainer");
            oVBox.removeAllItems();

            var oParams = {};
            oFormula.parameterIds.forEach(paramId => {
                oVBox.addItem(new sap.m.Label({ text: paramId }));
                var oInput = new sap.m.Input({
                    id: paramId,
                    placeholder: "Enter " + paramId,
                    liveChange: (oEvt) => {
                        oParams[paramId] = oEvt.getParameter("value");
                        oModel.setProperty("/FormulaParameters", oParams);
                    }
                });
                oVBox.addItem(oInput);
            });

            oDialog.open();
        },
        _calculateFormulaResult: function (oFormula, oParams) {
            if (!oFormula || !oParams) return 0;

            try {
                let expression = oFormula.formulaLogic; // e.g. "length * width + depth"
                oFormula.parameterIds.forEach(paramId => {
                    const value = parseFloat(oParams[paramId]) || 0;
                    expression = expression.replaceAll(paramId, value);
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
        onFormulaDialogOK: function () {
            var oModel = this.getView().getModel();
            var oFormula = oModel.getProperty("/SelectedFormula");
            var oParams = oModel.getProperty("/FormulaParameters");
            var result = this._calculateFormulaResult(oFormula, oParams);

            this.byId("formulaDialog").close();

            var oQuantityInput = this.byId("mainQuantityInput");
            oQuantityInput.setValue(result);
            oModel.setProperty("/IsFormulaBasedQuantity", true);

            var amount = parseFloat(this.byId("mainAmountPerUnitInput").getValue()) || 0;
            var total = result * amount;
            this.byId("mainTotalInput").setValue(total.toFixed(3));
        },
        onInputChange: function () {
            var qty = parseFloat(this.byId("mainQuantityInput").getValue()) || 0;
            var price = parseFloat(this.byId("mainAmountPerUnitInput").getValue()) || 0;
            this.byId("mainTotalInput").setValue((qty * price).toFixed(3));
        },
        onOpenMainDialog: function () {
            const oModel = this.getView().getModel();
            oModel.setProperty("/newModelService", {}); // Reset before opening
            this.byId("addModelServiceDialog").open();
        },
        onAddModelSpecDetails: async function () {
            const oView = this.getView();
            const oModel = oView.getModel("view");
            const modelSpecCode = this.currentModelSpecCode; 
            if (!modelSpecCode) {
                sap.m.MessageBox.error("Model Specification Code not found! Cannot add detail.");
                return;
            }
            const aDetails = oModel.getProperty("/ModelServices") || [];
            const maxId = aDetails.length > 0 ? Math.max(...aDetails.map(d => parseInt(d.modelSpecDetailsCode) || 0)) : 0;
            const modelSpecDetailsCode = maxId + 1;  // Sequential integer, valid for Integer type
            const oServiceTypeSelect = oView.byId("mainServiceTypeSelect");
            const oMatGroupSelect = oView.byId("mainMatGroupSelect");
            const oPersonnelSelect = oView.byId("personnelNumber");
            const oLineTypeSelect = oView.byId("lineTypes");
            const oUOMSelect = oView.byId("mainUOMSelect");
            const oFormulaSelect = oView.byId("formulaSelect");
            const oCurrencySelect = oView.byId("mainCurrencySelect");
            var oPayload = {
                modelSpecDetailsCode: modelSpecDetailsCode,  // Integer
                serviceNumberCode: parseInt(oView.byId("mainModelServiceNoSelect").getSelectedKey()) || 0,
                noServiceNumber: 0,
                serviceTypeCode: oServiceTypeSelect && oServiceTypeSelect.getSelectedItem()
                    ? oServiceTypeSelect.getSelectedItem().getText()
                    : oModel.getProperty("/newModelService/serviceTypeCode") || "",
                materialGroupCode: oMatGroupSelect && oMatGroupSelect.getSelectedItem()
                    ? oMatGroupSelect.getSelectedItem().getText()
                    : oModel.getProperty("/newModelService/materialGroupCode") || "",
                personnelNumberCode: oPersonnelSelect && oPersonnelSelect.getSelectedItem()
                    ? oPersonnelSelect.getSelectedItem().getText()
                    : "",
                unitOfMeasurementCode: oUOMSelect && oUOMSelect.getSelectedItem()
                    ? oUOMSelect.getSelectedItem().getText()
                    : "",
                formulaCode: oFormulaSelect && oFormulaSelect.getSelectedItem()
                    ? oFormulaSelect.getSelectedItem().getText()
                    : "",
                currencyCode: oCurrencySelect && oCurrencySelect.getSelectedItem()
                    ? oCurrencySelect.getSelectedItem().getText()
                    : "",
                lineTypeCode: oLineTypeSelect && oLineTypeSelect.getSelectedItem()
                    ? oLineTypeSelect.getSelectedItem().getText()
                    : "",
                selectionCheckBox: true,
                lineIndex: "",
                shortText: oView.byId("mainShortTextInput").getValue() || "",
                quantity: parseFloat(oView.byId("mainQuantityInput").getValue()) || parseFloat(oModel.getProperty("/newModelService/quantity")) || 0,
                grossPrice: parseFloat(oView.byId("mainAmountPerUnitInput").getValue()) || parseFloat(oModel.getProperty("/newModelService/grossPrice")) || 0,
                overFulfilmentPercentage: parseFloat(oView.byId("mainOverFInput").getValue()) || parseFloat(oModel.getProperty("/newModelService/overFulfilmentPercentage")) || 0,
                priceChangedAllowed: oView.byId("mainPriceChangeAllowed").getSelected() || oModel.getProperty("/newModelService/priceChangedAllowed") || false,
                unlimitedOverFulfillment: oView.byId("mainUnlimitedOverF").getSelected() || oModel.getProperty("/newModelService/unlimitedOverFulfillment") || false,
                pricePerUnitOfMeasurement: parseFloat(oView.byId("mainPricePerUnitInput").getValue()) || parseFloat(oModel.getProperty("/newModelService/pricePerUnitOfMeasurement")) || 0,
                externalServiceNumber: oView.byId("mainExternalServiceNo").getValue() || oModel.getProperty("/newModelService/externalServiceNumber") || "",
                netValue: parseFloat(oView.byId("mainTotalInput").getValue()) || 0,
                serviceText: oView.byId("mainServiceText").getValue() || oModel.getProperty("/newModelService/serviceText") || "",
                lineText: oView.byId("mainLineText").getValue() || oModel.getProperty("/newModelService/lineText") || "",
                lineNumber: oView.byId("_IDGenInput6").getValue() || oModel.getProperty("/newModelService/lineNumber") || "",
                alternatives: oView.byId("_IDGenInput7").getValue() || oModel.getProperty("/newModelService/alternatives") || "",
                biddersLine: oView.byId("_IDGenCheckBox").getSelected() || oModel.getProperty("/newModelService/biddersLine") || false,
                supplementaryLine: oView.byId("_IDGenCheckBox2").getSelected() || oModel.getProperty("/newModelService/supplementaryLine") || false,
                lotSizeForCostingIsOne: oView.byId("_IDGenCheckBox6").getSelected() || oModel.getProperty("/newModelService/lotSizeForCostingIsOne") || false,
                lastChangeDate: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD
                modelSpecifications_modelSpecCode: parseInt(modelSpecCode), // Ensure numeric as per example
                serviceNumber_serviceNumberCode: oView.byId("mainModelServiceNoSelect").getSelectedKey() || ""
            };
            const sUrl = `/odata/v4/sales-cloud/ModelSpecifications(${modelSpecCode})/modelSpecificationsDetails`;
            try {
                const response = await fetch(sUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(oPayload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                sap.m.MessageToast.show("Model Specification Detail added successfully!");
                this._loadModelSpecificationDetails(modelSpecCode); 

                const oDialog = oView.byId("addModelServiceDialog");
                if (oDialog) oDialog.close();

            } catch (err) {
                console.error("Error adding Model Specification Detail:", err);
                sap.m.MessageBox.error("Failed to add Model Specification Detail: " + err.message);
            }
        },
        onDetails: function (oEvent) {
            var oContext = oEvent.getSource().getParent().getBindingContext();
            if (oContext) {
                var modelData = oContext.getProperty();
                //MessageToast.show("Details: " + modelData.line);

                var oModel = this.getView().getModel();
                oModel.setProperty("/selectedLine", modelData);

                var oDialog = this.getView().byId("detailsDialog");
                if (oDialog) {
                    oDialog.open();
                } else {
                    console.error("Details dialog not found");
                }

            }
        },
        onDelete: function (oEvent) {

            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                var oModel = this.getView().byId("modelServicesTable").getModel();
                var oItem = oModel.getProperty(sPath);
                console.log(oItem);
                if (!oItem) {
                    sap.m.MessageBox.error("Error: Could not determine the row to delete!");
                    return;
                }
                sap.m.MessageBox.confirm("Are you sure you want to delete this record?", {
                    title: "Confirm Deletion",
                    icon: sap.m.MessageBox.Icon.WARNING,
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    emphasizedAction: sap.m.MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            //Delete For DB 
                            fetch(`/odata/v4/sales-cloud/ModelSpecificationsDetails('${oItem.modelSpecDetailsCode}')`, {
                                method: "DELETE"
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to delete: " + response.statusText);
                                    }
                                    // Remove the object from the model
                                    var aData = oModel.getProperty("/ModelServices"); // Fixed path to /ModelServices
                                    var iIndex = parseInt(sPath.split("/")[1]); // Adjusted for /ModelServices path
                                    aData.splice(iIndex, 1); // remove 1 element at index
                                    oModel.setProperty("/ModelServices", aData);
                                    sap.m.MessageToast.show("Record deleted successfully.");
                                })
                                .catch(err => {
                                    console.error("Error deleting Formula:", err);
                                    sap.m.MessageBox.error("Error: " + err.message);
                                });
                        }
                    }
                });
            }
        },
        onPress() {
            this.getOwnerComponent().getRouter().navTo("addModel");
        },
        onOpenAddDialog: function () {
            console.log("Opening dialog");
            var oDialog = this.getView().byId("addServiceDialog");
            if (oDialog) {
                oDialog.open();
            } else {
                console.error("Dialog not found");
            }
        },
        
        onAddRecord: function () {

            var shorttxt = this.byId("dialogShortText").getValue(); //For Example # Not Working

            const oTable = this.byId("addServiceTable");
            const aItems = oTable.getRows();   // rows of the table

            if (aItems.length > 0) {
                const oRow = aItems[0];        // since you only have one row
                const aCells = oRow.getCells();
                var newServiceModel = {
                    serviceNumberCode: aCells[1].getValue(),
                    shortText: aCells[2].getValue(),
                    quantity: aCells[3].getValue(),
                    formulaCode: aCells[4].getValue(),
                    modelSpecifications: [
                        {
                            modelSpecCode: "01234567-89ab-cdef-0123-456789abcdef",
                        }
                    ]
                }

                //Check Mandatories before Posting in DB
                //Post In DB
                fetch("/odata/v4/sales-cloud/ModelSpecificationsDetails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newServiceModel)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("Failed to save: " + response.statusText);
                        }
                        return response.json();
                    })
                    .then(savedItem => {
                        var oModel = this.getView().getModel();
                        var models = oModel.getProperty("/ModelSpecificationsDetails") || [];
                        models.push(savedItem);
                        oModel.setProperty("/ModelSpecificationsDetails", models);
                        oModel.refresh(true);
                    })
                    .catch(err => {
                        console.error("Error saving Model Service:", err);
                        sap.m.MessageBox.error("Error: " + err.message);
                        return;
                    });
                sap.m.MessageToast.show("Record added successfully!");
                this.onCloseDialog();
            }

        },
        onCloseDialog: function () {
            var oDialog = this.getView().byId("addModelServiceDialog");
            if (oDialog) {
                oDialog.close();
                this.getView().byId("dialogLine").setValue("");
                this.getView().byId("dialogServiceNo").setValue("");
                this.getView().byId("dialogShortText").setValue("");
                this.getView().byId("dialogQuantity").setValue("");
                this.getView().byId("dialogFormula").setValue("");
                this.getView().byId("dialogFormulaParameters").setValue("");
                this.getView().byId("dialogGrossPrice").setValue("");
                this.getView().byId("dialogNetValue").setValue("");
                this.getView().byId("dialogUnitOfMeasure").setValue("");
                this.getView().byId("dialogCrcy").setValue("");
                this.getView().byId("dialogOverFPercentage").setValue("");
                this.getView().byId("dialogPriceChangeAllowed").setValue("");
                this.getView().byId("dialogUnlimitedOverF").setValue("");
                this.getView().byId("dialogPricePerUnitOfMeasurement").setValue("");
                this.getView().byId("dialogMatGroup").setValue("");
                this.getView().byId("dialogServiceType").setValue("");
                this.getView().byId("dialogExternalServiceNo").setValue("");
                this.getView().byId("dialogServiceText").setValue("");
                this.getView().byId("dialogLineText").setValue("");
                this.getView().byId("dialogPersonnelNumber").setValue("");
                this.getView().byId("dialogLineType").setValue("");
                this.getView().byId("dialogLineNumber").setValue("");
                this.getView().byId("dialogAlt").setValue("");
                this.getView().byId("dialogBiddersLine").setValue("");
                this.getView().byId("dialogSuppLine").setValue("");
                this.getView().byId("dialogCstgLs").setValue("");
            }
        },
        onChangeFilterLine: function (oEvent) {
            var oModel = this.getView().getModel();
            var filterValue = oEvent.getParameter("value");

            if (filterValue) {
                // Filter the original models based on the line value
                var filteredModels = oModel.getProperty("/originalModels").filter(function (model) {
                    return model.line.toLowerCase().includes(filterValue.toLowerCase());
                });
                oModel.setProperty("/Models", filteredModels);
            } else {
                // Reset to original models when input is empty
                oModel.setProperty("/Models", oModel.getProperty("/originalModels"));
            }
            //  MessageToast.show("Filtered by Line: " + (filterValue || "All"));
        },
        onSearch: function () {
            var oModel = this.getView().getModel();
            var filterValue = this.getView().byId("filterLine").getValue();

            if (filterValue) {
                // Filter the models based on the line value
                var filteredModels = oModel.getProperty("/originalModels").filter(function (model) {
                    return model.line.toLowerCase().includes(filterValue.toLowerCase());
                });
                oModel.setProperty("/Models", filteredModels);
            } else {
                // Reset to original models when filter is empty
                oModel.setProperty("/Models", oModel.getProperty("/originalModels"));
            }
            MessageToast.show("Filtered by Line: " + (filterValue || "All"));
        },
        onExportToExcel: function () {
            var oTable = this.byId("modelServicesTable"); // your table
            var oModel = this.getView().getModel();

            // build column config (headers + property bindings)
            var aCols = [
                { label: "line", property: "line" },
                { label: "serviceNo", property: "serviceNo" },
                { label: "shortText", property: "shortText" },
                { label: "quantity", property: "quantity" },
                { label: "formula", property: "formula" },
                { label: "formulaParameters", property: "formulaParameters" },
                { label: "grossPrice", property: "grossPrice" },
                { label: "netValue", property: "netValue" },
                { label: "unitOfMeasure", property: "unitOfMeasure" },
                { label: "crcy", property: "crcy" },
                { label: "overFPercentage", property: "overFPercentage" },
                { label: "priceChangeAllowed", property: "priceChangeAllowed" },
                { label: "unlimitedOverF", property: "unlimitedOverF" },
                { label: "pricePerUnitOfMeasurement", property: "pricePerUnitOfMeasurement" },
                { label: "matGroup", property: "matGroup" },
                { label: "serviceType", property: "serviceType" },
                { label: "externalServiceNo", property: "externalServiceNo" },
                { label: "serviceText", property: "serviceText" },
                { label: "lineText", property: "lineText" },
                { label: "personnelNumber", property: "personnelNumber" },
                { label: "lineType", property: "lineType" },
                { label: "lineNumber", property: "lineNumber" },
                { label: "alt", property: "alt" },
                { label: "biddersLine", property: "biddersLine" },
                { label: "suppLine", property: "suppLine" },
                { label: "cstgLs", property: "cstgLs" }
            ];

            // data source (your model path)
            var oSettings = {
                workbook: { columns: aCols },
                dataSource: oModel.getProperty("/ModelServices"), // Fixed to /ModelServices
                fileName: "ModelServices.xlsx"
            };

            var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
            });
        },
        onImport: function () {
            var that = this;
            var oFileUploader = document.createElement("input");
            oFileUploader.type = "file";
            oFileUploader.accept = ".xlsx, .xls";
            oFileUploader.style.display = "none";

            oFileUploader.addEventListener("change", function (event) {
                var file = event.target.files[0];
                if (!file) {
                    sap.m.MessageToast.show("No file selected!");
                    return;
                }

                var reader = new FileReader();
                reader.onload = function (e) {
                    var data = new Uint8Array(e.target.result);
                    var workbook = XLSX.read(data, { type: "array" });

                    var firstSheet = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[firstSheet];

                    var excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    console.log(excelData);
                    var mappedData = excelData.map(function (row) {
                        return {
                            line: row.line || "",
                            serviceNo: row.serviceNo || "",
                            shortText: row.shortText || "",
                            quantity: row.quantity || "",
                            formula: row.formula || "",
                            formulaParameters: row.formulaParameters || "",
                            grossPrice: row.grossPrice || "",
                            netValue: row.netValue || "",
                            unitOfMeasure: row.unitOfMeasure || "",
                            crcy: row.crcy || "",
                            overFPercentage: row.overFPercentage || "",
                            priceChangeAllowed: row.priceChangeAllowed || "",
                            unlimitedOverF: row.unlimitedOverF || "",
                            pricePerUnitOfMeasurement: row.pricePerUnitOfMeasurement || "",
                            matGroup: row.matGroup || "",
                            serviceType: row.serviceType || "",
                            externalServiceNo: row.externalServiceNo || "",
                            serviceText: row.serviceText || "",
                            lineText: row.lineText || "",
                            personnelNumber: row.personnelNumber || "",
                            lineType: row.lineType || "",
                            lineNumber: row.lineNumber || "",
                            alt: row.alt || "",
                            biddersLine: row.biddersLine || "",
                            suppLine: row.suppLine || "",
                            cstgLs: row.cstgLs || ""
                        };
                    });
                    console.log(mappedData);

                    var oModel = that.getView().getModel();

                    var existingData = oModel.getProperty("/ModelServices") || []; // Fixed to /ModelServices

                    var mergedData = existingData.concat(mappedData);

                    oModel.setProperty("/ModelServices", mergedData);

                    sap.m.MessageToast.show("Excel records imported and appended successfully!");
                };
                reader.readAsArrayBuffer(file);
            });

            oFileUploader.click();
        }
    });
});