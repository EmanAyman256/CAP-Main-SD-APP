sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
      "sap/ui/model/json/JSONModel"
], function (Controller, Dialog, VBox, Text, Button, Spreadsheet, exportLibrary,JSONModel) {
    "use strict";
    return Controller.extend("project1.controller.ServiceMaster", {
onInit: function () {
    var oModel = new sap.ui.model.json.JSONModel({
                ServiceNumbers: [],
               
            });
            this.getView().setModel(oModel, "view");
            fetch("/odata/v4/sales-cloud/ServiceNumbers")
                .then(response => response.json())
                .then(data => {
                    // Wrap array inside an object for binding
                    oModel.setData({ ServiceNumbers: data.value });
                    this.getView().byId("serviceMaster").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching ServiceNumbers", err);
                });

},
        onNavigateToAddServiceMaster() {
            this.getOwnerComponent().getRouter().navTo("addServiceMaster");
        },
        onEdit: function () {
            var oTable = this.byId("serviceMaster");
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                sap.m.MessageBox.warning("Please, select an item to edit");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            var oSelectedData = oContext.getObject();
            var oModel = this.getView().getModel();

            // Create Edit Dialog if not exists
            if (!this._oEditDialog) {
                this._oEditDialog = new sap.m.Dialog({
                    title: "Edit Service Master",
                    titleAlignment: "Center",
                    contentWidth: "600px",
                    content: new sap.m.VBox({}),
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: () => {
                            // Read values back from inputs
                            var aContent = this._oEditDialog.getContent()[0].getItems();
                            oSelectedData.Code = aContent[1].getValue();
                            oSelectedData.SearchTerm = aContent[3].getValue();
                            oSelectedData.Description = aContent[5].getValue();
                            oSelectedData.lastChangeDate = aContent[7].getValue();
                            oSelectedData.serviceType = aContent[9].getValue();
                            oSelectedData.CreatedOn = aContent[11].getValue();

                            // Refresh model so table updates
                            oModel.refresh(true);

                            this._oEditDialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: () => this._oEditDialog.close()
                    })
                });

                this.getView().addDependent(this._oEditDialog);
            }

            // Fill dialog content with selected data
            this._oEditDialog.removeAllContent();
            this._oEditDialog.addContent(
                new sap.m.VBox({
                    items: [
                        new sap.m.Label({ text: "Service Master Code", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.Code }),

                        new sap.m.Label({ text: "Search Term", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.SearchTerm }),

                        new sap.m.Label({ text: "Description", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.Description }),

                        new sap.m.Label({ text: "Last Changed Date", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.lastChangeDate }),

                        new sap.m.Label({ text: "Service Type", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.serviceType }),

                        new sap.m.Label({ text: "Created On", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.CreatedOn })
                    ]
                })
            );

            this._oEditDialog.open();
        },
        onShowDetails: function () {
            var oTable = this.byId("serviceMaster");
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                sap.m.MessageBox.warning("Please, select an item");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            var oSelectedData = oContext.getObject();

            // Build dialog content dynamically
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = new Dialog({
                    title: "Service Master Details",
                    titleAlignment: "Center",
                    contentWidth: "600px",
                    content: new VBox({}),
                    endButton: new Button({
                        text: "Close",
                        press: () => this._oValueHelpDialog.close()
                    })
                });

                this.getView().addDependent(this._oValueHelpDialog);
            }

            // Update dialog content each time
            this._oValueHelpDialog.setTitle("Service Master: " + oSelectedData.Code);

            this._oValueHelpDialog.removeAllContent();
            this._oValueHelpDialog.addContent(
                new sap.m.VBox({
                    items: [
                        new sap.m.Label({ text: "Service Master Code", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.Code, editable: false }),

                        new sap.m.Label({ text: "Search Term", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.SearchTerm, editable: false }),

                        new sap.m.Label({ text: "Description", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.Description, editable: false }),

                        new sap.m.Label({ text: "Last Changed Date", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.lastChangeDate, editable: false }),

                        new sap.m.Label({ text: "Service Type", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.serviceType, editable: false }),

                        new sap.m.Label({ text: "Created On", design: "Bold" }),
                        new sap.m.Input({ value: oSelectedData.CreatedOn, editable: false })
                    ]
                })
            );

            this._oValueHelpDialog.open();
        },
        onCopy: function () {
            var oTable = this.byId("serviceMaster");
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                sap.m.MessageBox.warning("Please, select an item to copy");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            var oSelectedData = oContext.getObject();
            var oModel = this.getView().getModel();
            var aData = oModel.getProperty("/ServiceMaster");

            // Create a new object as a copy
            var oNewData = Object.assign({}, oSelectedData);
            oNewData.Code = oNewData.Code + "_Copy"; // give it a unique code

            // Create Copy Dialog if not exists
            if (!this._oCopyDialog) {
                this._oCopyDialog = new sap.m.Dialog({
                    title: "Copy Service Master",
                    titleAlignment: "Center",
                    contentWidth: "600px",
                    content: new sap.m.VBox({}),
                    beginButton: new sap.m.Button({
                        text: "Save",
                        type: "Emphasized",
                        press: () => {
                            var aContent = this._oCopyDialog.getContent()[0].getItems();

                            var oNewEntry = {
                                Code: aContent[1].getValue(),
                                SearchTerm: aContent[3].getValue(),
                                Description: aContent[5].getValue(),
                                lastChangeDate: aContent[7].getValue(),
                                serviceType: aContent[9].getValue(),
                                CreatedOn: aContent[11].getValue()
                            };

                            // Add new entry to the array
                            aData.push(oNewEntry);
                            oModel.setProperty("/ServiceMaster", aData);
                            oModel.refresh(true);

                            this._oCopyDialog.close();
                            sap.m.MessageToast.show("Item copied successfully");
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: () => this._oCopyDialog.close()
                    })
                });

                this.getView().addDependent(this._oCopyDialog);
            }

            // Fill dialog with copied data
            this._oCopyDialog.removeAllContent();
            this._oCopyDialog.addContent(
                new sap.m.VBox({
                    items: [
                        new sap.m.Label({ text: "Service Master Code", design: "Bold" }),
                        new sap.m.Input({ value: oNewData.Code }),

                        new sap.m.Label({ text: "Search Term", design: "Bold" }),
                        new sap.m.Input({ value: oNewData.SearchTerm }),

                        new sap.m.Label({ text: "Description", design: "Bold" }),
                        new sap.m.Input({ value: oNewData.Description }),

                        new sap.m.Label({ text: "Last Changed Date", design: "Bold" }),
                        new sap.m.Input({ value: oNewData.lastChangeDate }),

                        new sap.m.Label({ text: "Service Type", design: "Bold" }),
                        new sap.m.Input({ value: oNewData.serviceType }),

                        new sap.m.Label({ text: "Created On", design: "Bold" }),
                        new sap.m.Input({ value: oNewData.CreatedOn })
                    ]
                })
            );

            this._oCopyDialog.open();
        },
        onExport: function () {
            var oModel = this.getView().getModel();
            var aData = oModel.getProperty("/ServiceMaster");

            if (!aData || aData.length === 0) {
                sap.m.MessageBox.warning("No data available to export");
                return;
            }

            // Define the Excel columns
            var aColumns = [
                { label: "Service Master Code", property: "Code" },
                { label: "Search Term", property: "SearchTerm" },
                { label: "Description", property: "Description" },
                { label: "Last Changed Date", property: "lastChangeDate" },
                { label: "Service Type", property: "serviceType" },
                { label: "Created On", property: "CreatedOn" }
            ];

            // Settings for Spreadsheet
            var oSettings = {
                workbook: { columns: aColumns },
                dataSource: aData,
                fileName: "ServiceMaster.xlsx",
                worker: false // set to true for large datasets
            };

            var oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(() => {
                    sap.m.MessageToast.show("Export finished!");
                })
                .finally(() => {
                    oSheet.destroy();
                });
        },
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var oTable = this.byId("serviceMaster");
            var oBinding = oTable.getBinding("items");

            if (sQuery && sQuery.length > 0) {
                // فلترة على أكتر من عمود
                var oFilter1 = new sap.ui.model.Filter("Code", sap.ui.model.FilterOperator.Contains, sQuery);
                var oFilter2 = new sap.ui.model.Filter("SearchTerm", sap.ui.model.FilterOperator.Contains, sQuery);
                var oFilter3 = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sQuery);

                var oCombinedFilter = new sap.ui.model.Filter({
                    filters: [oFilter1, oFilter2, oFilter3],
                    and: false // OR logic
                });

                oBinding.filter([oCombinedFilter]);
            } else {
                oBinding.filter([]);
            }
        }

    });
});


