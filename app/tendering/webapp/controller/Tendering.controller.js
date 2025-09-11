sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/MessageToast",
    "sap/m/MessageBox"

], (Controller, JSONModel, Dialog, Button, Input, Label, VBox, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("tendering.controller.View1", {
        // onInit: function () {

        //     var oData = {
        //         MainItems: [
        //             {
        //                 MainItemNo: "1000",
        //                 Description: "Main Item 1",
        //                 children: [   // <--- TreeTable needs children
        //                     { SubItemNo: "1000-1", ServiceNo: "S001", Description: "SubItem 1", Quantity: 5, UOM: "EA" },
        //                     { SubItemNo: "1000-2", ServiceNo: "S002", Description: "SubItem 2", Quantity: 10, UOM: "EA" },

        //                 ]
        //             },
        //             {
        //                 MainItemNo: "2000",
        //                 Description: "Main Item 2",
        //                 children: []
        //             },

        //         ]
        //     };

        //     var oModel = new sap.ui.model.json.JSONModel(oData);
        //     this.getView().setModel(oModel);

        // },
        onInit: function () {
            var oData = {
                MainItems: [
                    {
                        MainItemNo: "1000",
                        ServiceNo: "S000",
                        Description: "Main Item 1",
                        Quantity: 1,
                        UOM: "EA",
                        formula: "",
                        parameters: "",
                        AmountPerUnit: 0,
                        currency: "SAR",
                        total: 0,
                        profitMargin: 0,
                        amountPerUnitWithProfit: 0,
                        totalWithProfit: 0,
                        children: [
                            { SubItemNo: "1000-1", ServiceNo: "S001", Description: "SubItem 1", Quantity: 5, UOM: "EA" },
                            { SubItemNo: "1000-2", ServiceNo: "S002", Description: "SubItem 2", Quantity: 10, UOM: "EA" }
                        ]
                    },
                    {
                        MainItemNo: "2000",
                        ServiceNo: "S000",
                        Description: "Main Item 2",
                        Quantity: 1,
                        UOM: "EA",
                        formula: "",
                        parameters: "",
                        AmountPerUnit: 0,
                        currency: "SAR",
                        total: 0,
                        profitMargin: 0,
                        amountPerUnitWithProfit: 0,
                        totalWithProfit: 0,
                        children: []
                    }
                ]
            };

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);

            this._createSubItemDialog();
        },

        _createSubItemDialog: function () {
            var oVBox = new VBox({
                items: [
                    new Label({ text: "Sub Item No" }),
                    new Input(this.createId("dialogSubItemNo"), { placeholder: "Enter Sub Item No" }),

                    new Label({ text: "Sub Service No" }),
                    new Input(this.createId("dialogSubServiceNo"), { placeholder: "Enter Service No" }),

                    new Label({ text: "Description" }),
                    new Input(this.createId("dialogSubDescription"), { placeholder: "Enter Description" }),

                    new Label({ text: "Quantity" }),
                    new Input(this.createId("dialogSubQuantity"), { type: "Number", placeholder: "Enter Quantity" }),

                    new Label({ text: "UOM" }),
                    new Input(this.createId("dialogSubUOM"), { placeholder: "Enter UOM" })
                ]
            }).addStyleClass("sapUiSmallMargin");

            this._oSubDialog = new Dialog({
                title: "Add Subitem",
                content: [oVBox],
                beginButton: new Button({
                    text: "Add",
                    type: "Emphasized",
                    press: this.onAddSubItem.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: this.onCancelSubDialog.bind(this)
                })
            });

            this.getView().addDependent(this._oSubDialog);
        },

        onOpenSubDialogForRow: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oObject = oContext.getObject();

            if (!oObject.children) {
                MessageToast.show("You can only add subitems under a main item!");
                return;
            }

            this._selectedParent = oObject;

            // reset fields
            this.byId("dialogSubItemNo").setValue("");
            this.byId("dialogSubServiceNo").setValue("");
            this.byId("dialogSubDescription").setValue("");
            this.byId("dialogSubQuantity").setValue("");
            this.byId("dialogSubUOM").setValue("");

            this._oSubDialog.open();
        },

        onEditRow: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oData = oContext.getObject();
            var oModel = this.getView().getModel();

            // keep the edit path for saving later
            this._editPath = oContext.getPath();

            // copy the row data to a temp model property
            oModel.setProperty("/editRow", Object.assign({}, oData));

            // check if it is a main item or sub item
            if (oData.SubItemNo) {
                // === SubItem ===
                if (!this._oEditSubDialog) {
                    this._oEditSubDialog = new sap.m.Dialog({
                        title: "Edit Sub Item",
                        content: [
                            new sap.m.Label({ text: "SubItem No" }),
                            new sap.m.Input({ value: "{/editRow/SubItemNo}", editable: false }),
                            new sap.m.Label({ text: "Service No" }),
                            new sap.m.Input({ value: "{/editRow/ServiceNo}" }),
                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/editRow/Description}" }),
                            new sap.m.Label({ text: "Quantity" }),
                            new sap.m.Input({ value: "{/editRow/Quantity}", type: "Number" }),
                            new sap.m.Label({ text: "UOM" }),
                            new sap.m.Input({ value: "{/editRow/UOM}" })
                        ],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            press: this.onSaveEdit.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditSubDialog.close();
                            }.bind(this)
                        })
                    }).addStyleClass("sapUiSmallMargin");
                    this.getView().addDependent(this._oEditSubDialog);
                }
                this._oEditSubDialog.open();
            } else {
                // === Main Item ===
                if (!this._oEditMainDialog) {
                    this._oEditMainDialog = new sap.m.Dialog({
                        title: "Edit Main Item",
                        contentWidth: "600px",
                        contentHeight: "80%",
                        resizable: true,
                        draggable: true,
                        content: [
                            new sap.m.Label({ text: "Main Item No" }),
                            new sap.m.Input({ value: "{/editRow/MainItemNo}", editable: false }),

                            new sap.m.Label({ text: "Service No" }),
                            new sap.m.Input({ value: "{/editRow/ServiceNo}" }),

                            new sap.m.Label({ text: "Description" }),
                            new sap.m.Input({ value: "{/editRow/Description}" }),

                            new sap.m.Label({ text: "Quantity" }),
                            new sap.m.Input({ value: "{/editRow/Quantity}" }),

                            new sap.m.Label({ text: "UOM" }),
                            new sap.m.Input({ value: "{/editRow/UOM}" }),

                            new sap.m.Label({ text: "Formula" }),
                            new sap.m.Input({ value: "{/editRow/formula}" }),

                            new sap.m.Label({ text: "Parameters" }),
                            new sap.m.Input({ value: "{/editRow/parameters}" }),

                            new sap.m.Label({ text: "Amount Per Unit" }),
                            new sap.m.Input({ value: "{/editRow/AmountPerUnit}" }),

                            new sap.m.Label({ text: "Currency" }),
                            new sap.m.Input({ value: "{/editRow/currency}" }),

                            new sap.m.Label({ text: "Total" }),
                            new sap.m.Input({ value: "{/editRow/total}" }),

                            new sap.m.Label({ text: "Profit Margin" }),
                            new sap.m.Input({ value: "{/editRow/profitMargin}" }),

                            new sap.m.Label({ text: "Amount/Unit with Profit" }),
                            new sap.m.Input({ value: "{/editRow/amountPerUnitWithProfit}" }),

                            new sap.m.Label({ text: "Total with Profit" }),
                            new sap.m.Input({ value: "{/editRow/totalWithProfit}" })
                        ],
                        beginButton: new sap.m.Button({
                            text: "Save",
                            press: this.onSaveEdit.bind(this)
                        }),
                        endButton: new sap.m.Button({
                            text: "Cancel",
                            press: function () {
                                this._oEditMainDialog.close();
                            }.bind(this)
                        })
                    });
                    this.getView().addDependent(this._oEditMainDialog);
                }

                this._oEditMainDialog.open();
            }

        },

        onSaveEdit: function () {
            var oModel = this.getView().getModel();
            var oEdited = oModel.getProperty("/editRow");

            // write back changes to original data
            oModel.setProperty(this._editPath, oEdited);

            // close whichever dialog is open
            if (this._oEditSubDialog && this._oEditSubDialog.isOpen()) {
                this._oEditSubDialog.close();
            }
            if (this._oEditMainDialog && this._oEditMainDialog.isOpen()) {
                this._oEditMainDialog.close();
            }
        },

        //     onEditRow: function (oEvent) {
        //         var oContext = oEvent.getSource().getBindingContext();
        //         var oData = oContext.getObject();

        //         var oModel = this.getView().getModel();

        //    oModel.setProperty("/editRow", Object.assign({}, oData));
        //         this._editPath = oContext.getPath();
        //      if (!this._oEditDialog) {
        //             this._oEditDialog = new sap.m.Dialog({
        //                 title: "Edit Subitem",
        //                 content: [
        //                     new sap.m.Label({ text: "SubItem No" }),
        //                     new sap.m.Input({
        //                         value: "{/editRow/SubItemNo}",
        //                         editable: false
        //                     }),
        //                     new sap.m.Label({ text: "Service No" }),
        //                     new sap.m.Input({ value: "{/editRow/ServiceNo}" }),
        //                     new sap.m.Label({ text: "Description" }),
        //                     new sap.m.Input({ value: "{/editRow/Description}" }),
        //                     new sap.m.Label({ text: "Quantity" }),
        //                     new sap.m.Input({
        //                         value: "{/editRow/Quantity}",
        //                         type: "Number"
        //                     }),
        //                     new sap.m.Label({ text: "UOM" }),
        //                     new sap.m.Input({ value: "{/editRow/UOM}" })
        //                 ],
        //                 beginButton: new sap.m.Button({
        //                     text: "Save",
        //                     press: this.onSaveEdit.bind(this)
        //                 }),
        //                 endButton: new sap.m.Button({
        //                     text: "Cancel",
        //                     press: function () {
        //                         this._oEditDialog.close();
        //                     }.bind(this)
        //                 })
        //             });

        //             this.getView().addDependent(this._oEditDialog);
        //         }

        //         this._oEditDialog.open();
        //     },

        //     onSaveEdit: function () {
        //         var oModel = this.getView().getModel();
        //         var oEdited = oModel.getProperty("/editRow");

        //         oModel.setProperty(this._editPath, oEdited);

        //         this._oEditDialog.close();
        //     },

        onAddSubItem: function () {
            var oSubItem = {
                SubItemNo: this.byId("dialogSubItemNo").getValue(),
                ServiceNo: this.byId("dialogSubServiceNo").getValue(),
                Description: this.byId("dialogSubDescription").getValue(),
                Quantity: this.byId("dialogSubQuantity").getValue(),
                UOM: this.byId("dialogSubUOM").getValue()
            };

            if (!this._selectedParent.children) {
                this._selectedParent.children = [];
            }
            this._selectedParent.children.push(oSubItem);

            this.getView().getModel().refresh(true);
            this._oSubDialog.close();
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
                            if (oObject.SubItemNo) {
                                // Subitem deletion
                                const aParts = sPath.split("/"); // "/MainItems/0/children/1"
                                const iMainIndex = parseInt(aParts[2]);
                                const iSubIndex = parseInt(aParts[4]);

                                const aMainItems = oModel.getProperty("/MainItems");
                                aMainItems[iMainIndex].children.splice(iSubIndex, 1);

                                sap.m.MessageToast.show("Subitem deleted");
                            } else {
                                // Main item deletion
                                const iMainIndex = parseInt(sPath.split("/")[2]);

                                const aMainItems = oModel.getProperty("/MainItems");
                                aMainItems.splice(iMainIndex, 1);

                                sap.m.MessageToast.show("Main item deleted");
                            }

                            oModel.refresh();
                        }
                    }
                }
            );
        },

        onCancelSubDialog: function () {
            this._oSubDialog.close();
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

        // Add Main Item
        // onAddMainItem: function () {
        //     var oModel = this.getView().getModel();
        //     var aMainItems = oModel.getProperty("/MainItems");
        //     var oNewItem = Object.assign({}, oModel.getProperty("/newMainItem"));

        //     // initialize children if not present
        //     oNewItem.children = [];

        //     // push to model
        //     aMainItems.push(oNewItem);
        //     oModel.setProperty("/MainItems", aMainItems);

        //     // clear form after adding
        //     oModel.setProperty("/newMainItem", {});

        //     this.byId("addMainItemDialog").close();
        // },

        onCloseMainItemDialog: function () {
            this.byId("addMainItemDialog").close();
        },

        onAddMainItem: function () {
            const oView = this.getView();
            const oModel = oView.getModel();
            const aMainItems = oModel.getProperty("/MainItems");

            const oNewMain = {
                MainItemNo: oView.byId("mainItemNoInput").getValue(),
                ServiceNo: oView.byId("mainServiceNoInput").getValue(),
                Description: oView.byId("mainDescriptionInput").getValue(),
                Quantity: oView.byId("mainQuantityInput").getValue(),
                UOM: oView.byId("mainUOMInput").getValue(),

                formula: oView.byId("mainFormulaInput").getValue(),
                parameters: oView.byId("mainParametersInput").getValue(),
                AmountPerUnit: oView.byId("mainAmountPerUnitInput").getValue(),
                currency: oView.byId("mainCurrencyInput").getValue(),
                total: oView.byId("mainTotalInput").getValue(),
                profitMargin: oView.byId("mainProfitMarginInput").getValue(),
                amountPerUnitWithProfit: oView.byId("mainAmountPerUnitWithProfitInput").getValue(),
                totalWithProfit: oView.byId("mainTotalWithProfitInput").getValue(),

                children: []
            };

            aMainItems.push(oNewMain);
            oModel.refresh();

            this.byId("addMainDialog").close();
        },



        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("treeTable");
            var oBinding = oTable.getBinding("rows");

            if (sQuery) {
                var aFilters = [
                    new sap.ui.model.Filter("MainItemNo", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("SubItemNo", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("ServiceNo", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("Quantity", sap.ui.model.FilterOperator.Contains, sQuery),
                    new sap.ui.model.Filter("UOM", sap.ui.model.FilterOperator.Contains, sQuery)
                ];
                var oFinalFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false
                });

                oBinding.filter([oFinalFilter]);
            } else {
                // Clear filter if empty search
                oBinding.filter([]);
            }
        }
    });
});