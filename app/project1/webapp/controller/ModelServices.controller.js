

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
            // var oModel = new sap.ui.model.json.JSONModel({
            //     ModelServices: [],
            // });
            // this.getView().setModel(oModel, "view");
            // fetch("/odata/v4/sales-cloud/ModelSpecificationsDetails")
            //     .then(response => response.json())
            //     .then(data => {
            //         oModel.setData({ ModelServices: data.value });
            //         this.getView().byId("modelServicesTable").setModel(oModel);
            //     })
            //     .catch(err => {
            //         console.error("Error fetching model Services", err);
            //     });

            var oOriginalData = {
                ModelSpecificationsDetails: [
                    {
                        line: "001",
                        serviceNo: "S001",
                        shortText: "Service 1",
                        quantity: "10",
                        formula: "F1",
                        formulaParameters: "P1,P2",
                        grossPrice: "100.00",
                        netValue: "90.00",
                        unitOfMeasure: "EA",
                        crcy: "USD",
                        overFPercentage: "5%",
                        priceChangeAllowed: "Yes",
                        unlimitedOverF: "No",
                        pricePerUnitOfMeasurement: "10.00",
                        matGroup: "MG1",
                        serviceType: "ST1",
                        externalServiceNo: "ES001",
                        serviceText: "Service Text 1",
                        lineText: "Line Text 1",
                        personnelNumber: "P001",
                        lineType: "LT1",
                        lineNumber: "1",
                        alt: "A1",
                        biddersLine: "B001",
                        suppLine: "S001",
                        cstgLs: "CL1"
                    },
                    {
                        line: "002",
                        serviceNo: "S002",
                        shortText: "Service 2",
                        quantity: "20",
                        formula: "F2",
                        formulaParameters: "P3,P4",
                        grossPrice: "200.00",
                        netValue: "180.00",
                        unitOfMeasure: "EA",
                        crcy: "EUR",
                        overFPercentage: "10%",
                        priceChangeAllowed: "No",
                        unlimitedOverF: "Yes",
                        pricePerUnitOfMeasurement: "20.00",
                        matGroup: "MG2",
                        serviceType: "ST2",
                        externalServiceNo: "ES002",
                        serviceText: "Service Text 2",
                        lineText: "Line Text 2",
                        personnelNumber: "P002",
                        lineType: "LT2",
                        lineNumber: "2",
                        alt: "A2",
                        biddersLine: "B002",
                        suppLine: "S002",
                        cstgLs: "CL2"
                    }
                ],
                dummy: [{}],
                selectedLine: {},
                originalModels: [] // Added to store the original dataset
            };
            // Initialize Models with original data and store originalModels
            oOriginalData.originalModels = JSON.parse(JSON.stringify(oOriginalData.ModelSpecificationsDetails));
            var oModel = new sap.ui.model.json.JSONModel(oOriginalData);
            
            this.getView().setModel(oModel);

            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `
                .myCustomStyle .customTopMargin {
                    margin-top: 1rem;
                }
            `;
            document.getElementsByTagName('head')[0].appendChild(style);
        },
        onAdd: function () {

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
                var newServiceModel ={
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
            var oDialog = this.getView().byId("addServiceDialog");
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