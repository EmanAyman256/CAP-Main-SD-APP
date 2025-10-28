

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
                UOM: [],
                ServiceNumbers: [],
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
            fetch("/odata/v4/sales-cloud/ModelSpecificationsDetails")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ ModelServices: data.value });
                    this.getView().byId("modelServicesTable").setModel(oModel);
                    console.log("Model Object", data.value);

                })
                .catch(err => {
                    console.error("Error fetching model Services", err);
                });
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
            this.getView().setModel(oModel);

            // var style = document.createElement('style');
            // style.type = 'text/css';
            // style.innerHTML = `
            //     .myCustomStyle .customTopMargin {
            //         margin-top: 1rem;
            //     }
            // `;
            // document.getElementsByTagName('head')[0].appendChild(style);
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
        onOpenMainDialog: function () {
            this.byId("addModelServiceDialog").open();
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

        onCloseDetailsDialog: function () {
            var oDialog = this.getView().byId("detailsDialog");
            if (oDialog) {
                oDialog.close();
            }

        },
        onEdit: function (oEvent) {
            var oContext = oEvent.getSource().getParent().getBindingContext();
            if (oContext) {
                var modelData = oContext.getProperty();
                //MessageToast.show("Details: " + modelData.line);

                var oModel = this.getView().getModel();
                oModel.setProperty("/selectedLine", modelData);

                var oDialog = this.getView().byId("editDialog");
                if (oDialog) {
                    oDialog.open();
                } else {
                    console.error("edit dialog not found");
                }

            }
        },
        onSaveEditDialog: function () {
            var oModel = this.getView().getModel();
            var oDialog = this.getView().byId("editDialog");
            if (oDialog) {
                var oForm = oDialog.getContent()[0].getItems()[0];
                var aContent = oForm.getContent();
                var selectedLine = oModel.getProperty("/selectedLine");

                selectedLine.line = aContent[1].getValue();
                selectedLine.serviceNo = aContent[3].getValue();
                selectedLine.shortText = aContent[5].getValue();
                selectedLine.quantity = aContent[7].getValue();
                selectedLine.formula = aContent[9].getValue();
                selectedLine.formulaParameters = aContent[11].getValue();
                selectedLine.grossPrice = aContent[13].getValue();
                selectedLine.netValue = aContent[15].getValue();
                selectedLine.unitOfMeasure = aContent[17].getValue();
                selectedLine.crcy = aContent[19].getValue();
                selectedLine.overFPercentage = aContent[21].getValue();
                selectedLine.priceChangeAllowed = aContent[23].getValue();
                selectedLine.unlimitedOverF = aContent[25].getValue();
                selectedLine.pricePerUnitOfMeasurement = aContent[27].getValue();
                selectedLine.matGroup = aContent[29].getValue();
                selectedLine.serviceType = aContent[31].getValue();
                selectedLine.externalServiceNo = aContent[33].getValue();
                selectedLine.serviceText = aContent[35].getValue();
                selectedLine.lineText = aContent[37].getValue();
                selectedLine.personnelNumber = aContent[39].getValue();
                selectedLine.lineType = aContent[41].getValue();
                selectedLine.lineNumber = aContent[43].getValue();
                selectedLine.alt = aContent[45].getValue();
                selectedLine.biddersLine = aContent[47].getValue();
                selectedLine.suppLine = aContent[49].getValue();
                selectedLine.cstgLs = aContent[51].getValue();

                // Update the original data in the Models array
                var models = oModel.getProperty("/Models");
                var index = models.findIndex(function (item) {
                    return item.line === oModel.getProperty("/selectedLine/line");
                });
                if (index !== -1) {
                    models[index] = Object.assign({}, selectedLine);
                    oModel.setProperty("/Models", models);
                }

                oModel.refresh(true);
                oDialog.close();
                MessageToast.show("Changes saved successfully");
            }
        },
        onCloseEditDialog: function () {
            var oDialog = this.getView().byId("editDialog");
            if (oDialog) {
                oDialog.close();
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
                                    var aData = oModel.getProperty("/ModelSpecificationsDetails");
                                    var iIndex = parseInt(sPath.split("/")[2]); // index from binding path
                                    aData.splice(iIndex, 1); // remove 1 element at index
                                    oModel.setProperty("/ModelSpecificationsDetails", aData);
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
            var oDialog = this.getView().byId("addModelService");
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
                dataSource: oModel.getProperty("/Models"), // array of objects
                fileName: "ModelServices.xlsx"
            };

            var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
            });
        },

        onImport: function () {
            var that = this;
            // Create a hidden file input dynamically
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

                    // Assume first sheet contains the data
                    var firstSheet = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[firstSheet];

                    // Convert sheet to JSON
                    var excelData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    console.log(excelData);
                    // Map Excel rows to your Model format
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

                    // Update JSON Model 
                    var oModel = that.getView().getModel();

                    // Get existing data (if any)
                    var existingData = oModel.getProperty("/Models") || [];

                    // Merge old data with new mapped data
                    var mergedData = existingData.concat(mappedData);

                    // Set merged data back to model
                    oModel.setProperty("/Models", mergedData);

                    sap.m.MessageToast.show("Excel records imported and appended successfully!");
                };
                reader.readAsArrayBuffer(file);
            });

            oFileUploader.click();
        }

    });
});