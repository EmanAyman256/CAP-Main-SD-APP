sap.ui.define([
    "sap/ui/core/mvc/Controller",
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
], function (Controller, MessageBox, Dialog, Input, Button, Label, VBox,HBox,Table, Column, ColumnListItem) {
    "use strict";

    return Controller.extend("project1.controller.ModelServices", {
         onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                dialogVisible: false,
                dummy: [{}],
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
                newCode: "",
                newDescription: ""
            });
            this.getView().setModel(oModel);
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
            // Logic to edit service type
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
        onPress(){
             this.getOwnerComponent().getRouter().navTo("addModel");
        },

         onToggleAddDialog: function () {
            var oModel = this.getView().getModel();
            var currentVisibility = oModel.getProperty("/dialogVisible");
            oModel.setProperty("/dialogVisible", !currentVisibility);
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

            if (Object.values(newModel).every(value => value)) {
                models.push(newModel);
                oModel.setProperty("/Models", models);
                oModel.refresh(true);
                MessageToast.show("Record added successfully!");
                this.onCancelDialog();
            } else {
                MessageToast.show("Please fill in all required fields.");
            }
        },
        onCancelDialog: function () {
            var oModel = this.getView().getModel();
            oModel.setProperty("/dialogVisible", false);
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

        // onOpenAddDialog: function () {
        //     var oDialog = new Dialog({
        //         title: "Add New Model Service",
        //         content: new Table({
        //             columns: [
        //                 new Column({ header: new Label({ text: "Line *" }) }),
        //                 new Column({ header: new Label({ text: "Service.No *" }) }),
        //                 new Column({ header: new Label({ text: "ShortText *" }) }),
        //                 new Column({ header: new Label({ text: "Quantity *" }) }),
        //                 new Column({ header: new Label({ text: "Formula *" }) }),
        //                 new Column({ header: new Label({ text: "Formula Parameters *" }) }),
        //                 new Column({ header: new Label({ text: "GrossPrice *" }) }),
        //                 new Column({ header: new Label({ text: "Net Value *" }) }),
        //                 new Column({ header: new Label({ text: "UnitOfMeasure* *" }) }),
        //                 new Column({ header: new Label({ text: "Crcy *" }) }),
        //                 new Column({ header: new Label({ text: "OverF.Percentage *" }) }),
        //                 new Column({ header: new Label({ text: "PriceChangeAllowed *" }) }),
        //                 new Column({ header: new Label({ text: "UnlimitedOverF *" }) }),
        //                 new Column({ header: new Label({ text: "PricePerUnitOfMeasurement *" }) }),
        //                 new Column({ header: new Label({ text: "Mat Group *" }) }),
        //                 new Column({ header: new Label({ text: "Service Type *" }) }),
        //                 new Column({ header: new Label({ text: "External.Service.No *" }) }),
        //                 new Column({ header: new Label({ text: "Service Text *" }) }),
        //                 new Column({ header: new Label({ text: "Line Text *" }) }),
        //                 new Column({ header: new Label({ text: "PersonnelNumber *" }) }),
        //                 new Column({ header: new Label({ text: "Line Type *" }) }),
        //                 new Column({ header: new Label({ text: "Line Number *" }) }),
        //                 new Column({ header: new Label({ text: "Alt *" }) }),
        //                 new Column({ header: new Label({ text: "Bidder's Line *" }) }),
        //                 new Column({ header: new Label({ text: "Supp.Line *" }) }),
        //                 new Column({ header: new Label({ text: "Cstg Ls *" }) }),
        //                 new Column({ header: new Label({ text: "" }) }) // Placeholder for Actions
        //             ],
        //             items: {
        //                 path: "/dummy",
        //                 template: new ColumnListItem({
        //                     cells: [
        //                         new Input({ id: "dialogLine", placeholder: "Enter Line" }),
        //                         new Input({ id: "dialogServiceNo", placeholder: "Enter Service No" }),
        //                         new Input({ id: "dialogShortText", placeholder: "Enter Short Text" }),
        //                         new Input({ id: "dialogQuantity", placeholder: "Enter Quantity" }),
        //                         new Input({ id: "dialogFormula", placeholder: "Enter Formula" }),
        //                         new Input({ id: "dialogFormulaParameters", placeholder: "Enter Formula Parameters" }),
        //                         new Input({ id: "dialogGrossPrice", placeholder: "Enter Gross Price" }),
        //                         new Input({ id: "dialogNetValue", placeholder: "Enter Net Value" }),
        //                         new Input({ id: "dialogUnitOfMeasure", placeholder: "Enter Unit Of Measure" }),
        //                         new Input({ id: "dialogCrcy", placeholder: "Enter Crcy" }),
        //                         new Input({ id: "dialogOverFPercentage", placeholder: "Enter OverF Percentage" }),
        //                         new Input({ id: "dialogPriceChangeAllowed", placeholder: "Enter Price Change Allowed" }),
        //                         new Input({ id: "dialogUnlimitedOverF", placeholder: "Enter Unlimited OverF" }),
        //                         new Input({ id: "dialogPricePerUnitOfMeasurement", placeholder: "Enter Price Per Unit" }),
        //                         new Input({ id: "dialogMatGroup", placeholder: "Enter Mat Group" }),
        //                         new Input({ id: "dialogServiceType", placeholder: "Enter Service Type" }),
        //                         new Input({ id: "dialogExternalServiceNo", placeholder: "Enter External Service No" }),
        //                         new Input({ id: "dialogServiceText", placeholder: "Enter Service Text" }),
        //                         new Input({ id: "dialogLineText", placeholder: "Enter Line Text" }),
        //                         new Input({ id: "dialogPersonnelNumber", placeholder: "Enter Personnel Number" }),
        //                         new Input({ id: "dialogLineType", placeholder: "Enter Line Type" }),
        //                         new Input({ id: "dialogLineNumber", placeholder: "Enter Line Number" }),
        //                         new Input({ id: "dialogAlt", placeholder: "Enter Alt" }),
        //                         new Input({ id: "dialogBiddersLine", placeholder: "Enter Bidder's Line" }),
        //                         new Input({ id: "dialogSuppLine", placeholder: "Enter Supp Line" }),
        //                         new Input({ id: "dialogCstgLs", placeholder: "Enter Cstg Ls" }),
        //                         new Label({ text: "" }) // Placeholder for Actions
        //                     ]
        //                 })
        //             }
        //         }),
        //         beginButton: new Button({
        //             text: "Add Record",
        //             press: this.onAddRecordFromDialog.bind(this)
        //         }),
        //         endButton: new Button({
        //             text: "Cancel",
        //             press: function () {
        //                 oDialog.close();
        //             }
        //         }),
        //         afterClose: function () {
        //             oDialog.destroy();
        //         }
        //     });

        //     // Set a dummy model for the dialog table
        //     oDialog.getContent()[0].setModel(new sap.ui.model.json.JSONModel({ dummy: [{}] }));

        //     oDialog.open();
        // },
        // onAddRecordFromDialog: function () {
        //     var oModel = this.getView().getModel();
        //     var models = oModel.getProperty("/Models") || [];

        //     var newModel = {
        //         line: this.getView().byId("dialogLine").getValue(),
        //         serviceNo: this.getView().byId("dialogServiceNo").getValue(),
        //         shortText: this.getView().byId("dialogShortText").getValue(),
        //         quantity: this.getView().byId("dialogQuantity").getValue(),
        //         formula: this.getView().byId("dialogFormula").getValue(),
        //         formulaParameters: this.getView().byId("dialogFormulaParameters").getValue(),
        //         grossPrice: this.getView().byId("dialogGrossPrice").getValue(),
        //         netValue: this.getView().byId("dialogNetValue").getValue(),
        //         unitOfMeasure: this.getView().byId("dialogUnitOfMeasure").getValue(),
        //         crcy: this.getView().byId("dialogCrcy").getValue(),
        //         overFPercentage: this.getView().byId("dialogOverFPercentage").getValue(),
        //         priceChangeAllowed: this.getView().byId("dialogPriceChangeAllowed").getValue(),
        //         unlimitedOverF: this.getView().byId("dialogUnlimitedOverF").getValue(),
        //         pricePerUnitOfMeasurement: this.getView().byId("dialogPricePerUnitOfMeasurement").getValue(),
        //         matGroup: this.getView().byId("dialogMatGroup").getValue(),
        //         serviceType: this.getView().byId("dialogServiceType").getValue(),
        //         externalServiceNo: this.getView().byId("dialogExternalServiceNo").getValue(),
        //         serviceText: this.getView().byId("dialogServiceText").getValue(),
        //         lineText: this.getView().byId("dialogLineText").getValue(),
        //         personnelNumber: this.getView().byId("dialogPersonnelNumber").getValue(),
        //         lineType: this.getView().byId("dialogLineType").getValue(),
        //         lineNumber: this.getView().byId("dialogLineNumber").getValue(),
        //         alt: this.getView().byId("dialogAlt").getValue(),
        //         biddersLine: this.getView().byId("dialogBiddersLine").getValue(),
        //         suppLine: this.getView().byId("dialogSuppLine").getValue(),
        //         cstgLs: this.getView().byId("dialogCstgLs").getValue()
        //     };

        //     // Validate required fields
        //     if (Object.values(newModel).every(value => value)) {
        //         models.push(newModel);
        //         oModel.setProperty("/Models", models);
        //         oModel.refresh(true);
        //         MessageToast.show("Record added successfully!");
        //         this.getView().byId("dialogLine").setValue("");
        //         this.getView().byId("dialogServiceNo").setValue("");
        //         this.getView().byId("dialogShortText").setValue("");
        //         this.getView().byId("dialogQuantity").setValue("");
        //         this.getView().byId("dialogFormula").setValue("");
        //         this.getView().byId("dialogFormulaParameters").setValue("");
        //         this.getView().byId("dialogGrossPrice").setValue("");
        //         this.getView().byId("dialogNetValue").setValue("");
        //         this.getView().byId("dialogUnitOfMeasure").setValue("");
        //         this.getView().byId("dialogCrcy").setValue("");
        //         this.getView().byId("dialogOverFPercentage").setValue("");
        //         this.getView().byId("dialogPriceChangeAllowed").setValue("");
        //         this.getView().byId("dialogUnlimitedOverF").setValue("");
        //         this.getView().byId("dialogPricePerUnitOfMeasurement").setValue("");
        //         this.getView().byId("dialogMatGroup").setValue("");
        //         this.getView().byId("dialogServiceType").setValue("");
        //         this.getView().byId("dialogExternalServiceNo").setValue("");
        //         this.getView().byId("dialogServiceText").setValue("");
        //         this.getView().byId("dialogLineText").setValue("");
        //         this.getView().byId("dialogPersonnelNumber").setValue("");
        //         this.getView().byId("dialogLineType").setValue("");
        //         this.getView().byId("dialogLineNumber").setValue("");
        //         this.getView().byId("dialogAlt").setValue("");
        //         this.getView().byId("dialogBiddersLine").setValue("");
        //         this.getView().byId("dialogSuppLine").setValue("");
        //         this.getView().byId("dialogCstgLs").setValue("");
        //         this.getView().byId("dialog").close();
        //     } else {
        //         MessageToast.show("Please fill in all required fields.");
        //     }
        // }


        
    });
});