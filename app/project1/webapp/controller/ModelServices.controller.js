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

], function (Controller, MessageBox, MessageToast, Spreadsheet, Dialog, Input, Button, Label, VBox, HBox, Table, Column, ColumnListItem) {
    "use strict";

    return Controller.extend("project1.controller.ModelServices", {
        onInit: function () {
            // console.log("MessageToast loaded:", MessageToast);
            var oOriginalData = {
                Models: [
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
            oOriginalData.originalModels = JSON.parse(JSON.stringify(oOriginalData.Models));
            var oModel = new sap.ui.model.json.JSONModel(oOriginalData);
            // var oModel = new sap.ui.model.json.JSONModel({
            //     // dialogVisible: false,
            //     dummy: [{}],
            //     selectedLine: {}, // holds the selected line data for the details dialog,

            //     Models: [
            //         {
            //             line: "001",
            //             serviceNo: "S001",
            //             shortText: "Service 1",
            //             quantity: "10",
            //             formula: "F1",
            //             formulaParameters: "P1,P2",
            //             grossPrice: "100.00",
            //             netValue: "90.00",
            //             unitOfMeasure: "EA",
            //             crcy: "USD",
            //             overFPercentage: "5%",
            //             priceChangeAllowed: "Yes",
            //             unlimitedOverF: "No",
            //             pricePerUnitOfMeasurement: "10.00",
            //             matGroup: "MG1",
            //             serviceType: "ST1",
            //             externalServiceNo: "ES001",
            //             serviceText: "Service Text 1",
            //             lineText: "Line Text 1",
            //             personnelNumber: "P001",
            //             lineType: "LT1",
            //             lineNumber: "1",
            //             alt: "A1",
            //             biddersLine: "B001",
            //             suppLine: "S001",
            //             cstgLs: "CL1"
            //         },
            //         {
            //             line: "002",
            //             serviceNo: "S002",
            //             shortText: "Service 2",
            //             quantity: "20",
            //             formula: "F2",
            //             formulaParameters: "P3,P4",
            //             grossPrice: "200.00",
            //             netValue: "180.00",
            //             unitOfMeasure: "EA",
            //             crcy: "EUR",
            //             overFPercentage: "10%",
            //             priceChangeAllowed: "No",
            //             unlimitedOverF: "Yes",
            //             pricePerUnitOfMeasurement: "20.00",
            //             matGroup: "MG2",
            //             serviceType: "ST2",
            //             externalServiceNo: "ES002",
            //             serviceText: "Service Text 2",
            //             lineText: "Line Text 2",
            //             personnelNumber: "P002",
            //             lineType: "LT2",
            //             lineNumber: "2",
            //             alt: "A2",
            //             biddersLine: "B002",
            //             suppLine: "S002",
            //             cstgLs: "CL2"
            //         }
            //     ],

            // });
            // for edit 
            // this.oEditableTemplate = new ColumnListItem({
            //     cells: [
            //         new Input({
            //             value: "{Name}"
            //         }), new Input({
            //             value: "{Quantity}",
            //             description: "{UoM}"
            //         }), new Input({
            //             value: "{WeightMeasure}",
            //             description: "{WeightUnit}"
            //         }), new Input({
            //             value: "{Price}",
            //             description: "{CurrencyCode}"
            //         })
            //     ]
            // });
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
            var oModel = this.getView().getModel();
            var newCode = oModel.getProperty("/newCode");
            var newDescription = oModel.getProperty("/newDescription");
            if (newCode && newDescription) {
                oModel.getProperty("/ServiceTypes").push({
                    Code: newCode,
                    Description: newDescription,
                    CreatedOn: new Date().toISOString().split('T')[0]
                });
                oModel.setProperty("/newCode", "");
                oModel.setProperty("/newDescription", "");
            }
        },

        onEdit: function (oEvent) {
            var oContext = oEvent.getSource().getParent().getBindingContext();
            if (oContext) {
                var modelData = oContext.getProperty();
                MessageToast.show("Edit: " + modelData.line);

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
        onCloseDetailsDialog: function () {
            var oDialog = this.getView().byId("detailsDialog");
            if (oDialog) {
                oDialog.close();
            }
        },
        onDelete: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                var oModel = this.getView().getModel();
                var oItem = oModel.getProperty(sPath);

                MessageBox.confirm("Are you sure you want to delete " + oItem.modelServSpec + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            var aModels = oModel.getProperty("/Models");
                            var iIndex = aModels.indexOf(oItem);
                            if (iIndex > -1) {
                                aModels.splice(iIndex, 1);
                                oModel.setProperty("/Models", aModels);
                            }
                        }
                    }
                });
            }
        },

        //Navigate to Add Model View
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
            var oModel = this.getView().getModel();
            var models = oModel.getProperty("/Models") || [];

            var newModel = {
                line: this.getView().byId("dialogLine").getValue(),
                serviceNo: this.getView().byId("dialogServiceNo").getValue(),
                shortText: this.getView().byId("dialogShortText").getValue(),
                quantity: this.getView().byId("dialogQuantity").getValue(),
                formula: this.getView().byId("dialogFormula").getValue(),
                formulaParameters: this.getView().byId("dialogFormulaParameters").getValue(),
                grossPrice: this.getView().byId("dialogGrossPrice").getValue(),
                netValue: this.getView().byId("dialogNetValue").getValue(),
                unitOfMeasure: this.getView().byId("dialogUnitOfMeasure").getValue(),
                crcy: this.getView().byId("dialogCrcy").getValue(),
                overFPercentage: this.getView().byId("dialogOverFPercentage").getValue(),
                priceChangeAllowed: this.getView().byId("dialogPriceChangeAllowed").getValue(),
                unlimitedOverF: this.getView().byId("dialogUnlimitedOverF").getValue(),
                pricePerUnitOfMeasurement: this.getView().byId("dialogPricePerUnitOfMeasurement").getValue(),
                matGroup: this.getView().byId("dialogMatGroup").getValue(),
                serviceType: this.getView().byId("dialogServiceType").getValue(),
                externalServiceNo: this.getView().byId("dialogExternalServiceNo").getValue(),
                serviceText: this.getView().byId("dialogServiceText").getValue(),
                lineText: this.getView().byId("dialogLineText").getValue(),
                personnelNumber: this.getView().byId("dialogPersonnelNumber").getValue(),
                lineType: this.getView().byId("dialogLineType").getValue(),
                lineNumber: this.getView().byId("dialogLineNumber").getValue(),
                alt: this.getView().byId("dialogAlt").getValue(),
                biddersLine: this.getView().byId("dialogBiddersLine").getValue(),
                suppLine: this.getView().byId("dialogSuppLine").getValue(),
                cstgLs: this.getView().byId("dialogCstgLs").getValue()
            };
            console.log(newModel);


            if (Object.values(newModel).every(value => value)) {
                models.push(newModel);
                console.log(models);

                oModel.setProperty("/Models", models);
                oModel.refresh(true);
                MessageToast.show("Formula saved successfully!");
                MessageToast.show("Record added successfully!");
                this.onCloseDialog();
            } else {
                MessageToast.show("Please fill in all required fields.");
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
       
        onExport: function () {
            var oModel = this.getView().getModel();
            var aColumns = [
                { label: "Line", property: "line", type: "String" },
                { label: "Service No", property: "serviceNo", type: "String" },
                { label: "Short Text", property: "shortText", type: "String" },
                { label: "Quantity", property: "quantity", type: "Number" },
                { label: "Formula", property: "formula", type: "String" },
                { label: "Formula Parameters", property: "formulaParameters", type: "String" },
                { label: "Gross Price", property: "grossPrice", type: "Number" },
                { label: "Net Value", property: "netValue", type: "Number" },
                { label: "Unit of Measure", property: "unitOfMeasure", type: "String" },
                { label: "Currency", property: "crcy", type: "String" },
                { label: "Over F. Percentage", property: "overFPercentage", type: "String" },
                { label: "Price Change Allowed", property: "priceChangeAllowed", type: "String" },
                { label: "Unlimited Over F", property: "unlimitedOverF", type: "String" },
                { label: "Price Per Unit", property: "pricePerUnitOfMeasurement", type: "Number" },
                { label: "Material Group", property: "matGroup", type: "String" },
                { label: "Service Type", property: "serviceType", type: "String" },
                { label: "External Service No", property: "externalServiceNo", type: "String" },
                { label: "Service Text", property: "serviceText", type: "String" },
                { label: "Line Text", property: "lineText", type: "String" },
                { label: "Personnel Number", property: "personnelNumber", type: "String" },
                { label: "Line Type", property: "lineType", type: "String" },
                { label: "Line Number", property: "lineNumber", type: "String" },
                { label: "Alt", property: "alt", type: "String" },
                { label: "Bidder's Line", property: "biddersLine", type: "String" },
                { label: "Supplier Line", property: "suppLine", type: "String" },
                { label: "Costing LS", property: "cstgLs", type: "String" }
            ];

            var oSettings = {
                workbook: { columns: aColumns },
                dataSource: oModel.getProperty("/Models"),
                fileName: "ModelServices_Export_" + new Date().toISOString().slice(0, 10) + ".xlsx",
                worker: false // Set to true for large datasets if supported
            };

            var oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(function () {
                MessageToast.show("Export to Excel completed.");
            }).catch(function (oError) {
                MessageToast.show("Error during export: " + oError.message);
            }).finally(function () {
                oSheet.destroy();
            });
        }
    });
});