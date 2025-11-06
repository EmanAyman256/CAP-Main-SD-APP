sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, Dialog, Input, Button, Label, VBox, JSONModel) {
    "use strict";
    return Controller.extend("project1.controller.Model", {
        onInit: function () {



            this.getOwnerComponent().getRouter()
                .getRoute("model")
                .attachPatternMatched(this._onRouteMatched, this);

            var oModel = new sap.ui.model.json.JSONModel({
                Models: [],
            });
            this.getView().setModel(oModel, "view");
            //  // optional: refresh table if you show models
            //         let oTable = this.getView().byId("modelTable")
            //         //this.byId("modelTable");
            //         oTable.getBinding("items").refresh();


            // currency
            fetch("/odata/v4/sales-cloud/Currencies")
                .then(res => res.json())
                .then(data => {
                    var oModel = new sap.ui.model.json.JSONModel(data.value);
                    this.getView().setModel(oModel, "currencies");
                });
            // Fetch data from CAP OData service

            fetch("/odata/v4/sales-cloud/ModelSpecifications")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ Models: data.value });
                    this.getView().byId("modelTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching models", err);
                });
        },
        _onRouteMatched: function () {
            this._loadModels();
        },
        _loadModels: function () {
            var oModel = new sap.ui.model.json.JSONModel();
            fetch("/odata/v4/sales-cloud/ModelSpecifications")
                .then(response => response.json())
                .then(data => {
                    oModel.setData({ Models: data.value });
                    this.getView().byId("modelTable").setModel(oModel);
                })
                .catch(err => {
                    console.error("Error fetching models", err);
                });
        },
        onEdit: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getParent().getParent().getBindingContext();

            if (!oContext) {
                MessageBox.warning("Error: Unable to retrieve row data");
                return;
            }

            var oSelectedData = oContext.getObject();
            var oModel = this.getView().getModel("view");

            // Create Edit Dialog if not exists
            if (!this._oEditDialog) {
                // keep references for inputs
                this._oModelServSpecInput = new Input();
                this._oBlockingIndicatorInput = new Input();
                this._oServiceSelectionInput = new Input();
                this._oDescriptionInput = new Input();
                this._oSearchTermInput = new Input();
                // this._oCurrencyCodeInput = new Input();
                this._oCurrencyCodeSelect = new sap.m.Select({
                    id: "currency",
                    class: "sapUiSmallMarginStart",
                    width: "200px",
                    forceSelection: false,
                    items: {
                        path: "currencies>/",
                        template:
                            new sap.ui.core.Item({
                                key: "{currencies>currencyCode}",
                                text: "{currencies>description}"
                            })
                    }
                });

                this._oCurrencyCodeSelect.insertItem(
                    new sap.ui.core.Item({ key: "", text: "Cancel" }),
                    0
                );

                // this._oCurrencyCodeSelect = new sap.m.Select({
                //     id: "currency",
                //     class: "sapUiSmallMarginStart",
                //     width: "200px",
                //     forceSelection: false,
                //     items: [
                //         new sap.ui.core.Item({ key: "", text: "Cancel" }) // 👈 static cancel option
                //     ],
                //     // Dynamic items from the model
                //     additionalText: "currencies>",
                //     bindItems: {
                //         path: "currencies>/",
                //         template: new sap.ui.core.Item({
                //             key: "{currencies>currencyCode}",
                //             text: "{currencies>description}"
                //         })
                //     },
                //     change: function (oEvent) {
                //         const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                //         if (sSelectedKey === "") {
                //             // 👇 handle cancel action
                //             sap.m.MessageToast.show("Selection cancelled");
                //         }
                //     }
                // });



                this._oEditDialog = new Dialog({
                    title: "Edit Model",
                    titleAlignment: "Center",
                    contentWidth: "600px",
                    content: new sap.ui.layout.form.SimpleForm({
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        content: [
                            new Label({ text: "modelServSpec", design: "Bold" }),
                            this._oModelServSpecInput,

                            new Label({ text: "blockingIndicator", design: "Bold" }),
                            this._oBlockingIndicatorInput,

                            new Label({ text: "serviceSelection", design: "Bold" }),
                            this._oServiceSelectionInput,

                            new Label({ text: "description", design: "Bold" }),
                            this._oDescriptionInput,

                            new Label({ text: "searchTerm", design: "Bold" }),
                            this._oSearchTermInput,

                            new Label({ text: "currencyCode", design: "Bold" }),
                            this._oCurrencyCodeSelect
                        ]
                    }),
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: () => {
                            // Build updated payload
                            const updatedData = {
                                modelServSpec: this._oModelServSpecInput.getValue(),
                                blockingIndicator: this._oBlockingIndicatorInput.getValue() === "true" || this._oBlockingIndicatorInput.getValue() === true,
                                serviceSelection: this._oServiceSelectionInput.getValue() === "true" || this._oServiceSelectionInput.getValue() === true,
                                description: this._oDescriptionInput.getValue(),
                                searchTerm: this._oSearchTermInput.getValue(),
                                currencyCode: this._oCurrencyCodeSelect.getSelectedKey()
                            };

                            // Send PATCH request to CAP OData
                            fetch(`/odata/v4/sales-cloud/ModelSpecifications('${(oSelectedData.modelSpecCode)}')`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(updatedData)
                            })
                                .then(res => {
                                    if (!res.ok) throw new Error("Update failed");
                                    return res.json();
                                })
                                .then((updatedItem) => {
                                    console.log(updatedItem);
                                    /*
                                    Update the table after changes with 2 ways
                                    */
                                    // Way 1: Update local model so table refreshes
                                    var oModel1 = this.getView().byId("modelTable").getModel();
                                    var aModels = oModel1.getProperty("/Models") || [];
                                    var iIndex = aModels.findIndex(st => st.modelSpecCode === oSelectedData.modelSpecCode);
                                    console.log(iIndex);

                                    if (iIndex > -1) {
                                        aModels[iIndex] = updatedData;
                                        oModel1.setProperty("/Models", aModels);
                                    }
                                    // Way 2 : re-fetch models from backend
                                    // fetch("/odata/v4/sales-cloud/ModelSpecifications")
                                    //     .then(res => res.json())
                                    //     .then(data => {
                                    //         var oNewModel = new sap.ui.model.json.JSONModel({ Models: data.value });
                                    //         this.getView().byId("modelTable").setModel(oNewModel);
                                    //     });

                                    sap.m.MessageToast.show("Model updated successfully");
                                    this._oEditDialog.close();
                                })
                                .catch(err => {
                                    sap.m.MessageBox.error("Error updating model: " + err.message);
                                });
                        }
                    }),

                    endButton: new Button({
                        text: "Cancel",
                        press: () => this._oEditDialog.close()
                    })
                });
                this.getView().addDependent(this._oEditDialog);
            }
            // Fill inputs with selected data
            this._oModelServSpecInput.setValue(oSelectedData.modelServSpec);
            this._oBlockingIndicatorInput.setValue(oSelectedData.blockingIndicator);
            this._oServiceSelectionInput.setValue(oSelectedData.serviceSelection);
            this._oDescriptionInput.setValue(oSelectedData.description);
            this._oSearchTermInput.setValue(oSelectedData.searchTerm);
            this._oCurrencyCodeSelect.setValue(oSelectedData.currencyCode);

            this._oEditDialog.open();
        },
        onDelete: function (oEvent) {
            var oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext) {
                var sPath = oBindingContext.getPath();
                // var oModel = this.getView().getModel("view");
                var oModel = this.getView().byId("modelTable").getModel();
                var oItem = oModel.getProperty(sPath);
                if (!oItem) {
                    sap.m.MessageBox.error("Could not find model data for deletion.");
                    return;
                }

                MessageBox.confirm("Are you sure you want to delete " + oItem.modelServSpec + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            // 🔥 Call CAP backend DELETE
                            fetch(`/odata/v4/sales-cloud/ModelSpecifications('${oItem.modelSpecCode}')`, {
                                method: "DELETE"
                            })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error("Failed to delete: " + response.statusText);
                                    }

                                    //  Update local JSONModel
                                    var aRecords = oModel.getProperty("/Models");
                                    var iIndex = aRecords.findIndex(st => st.modelSpecCode === oItem.modelSpecCode);
                                    if (iIndex > -1) {
                                        aRecords.splice(iIndex, 1);
                                        oModel.setProperty("/Models", aRecords);
                                    }

                                    sap.m.MessageToast.show("Model deleted successfully!");
                                })
                                .catch(err => {
                                    console.error("Error deleting Model:", err);
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
        onNavigateToModelServices: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            const sModelSpecCode = oData.modelSpecCode;
            console.log("Nav to Service",oData);   
            this.getOwnerComponent().getRouter().navTo("modelServices", {
                modelSpecCode: sModelSpecCode,
                Record:oData
            });
        }


    });
});