sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("tendering.controller.View1", {
        onInit: function () {
            // var oData = {
            //     MainItems: [
            //         {
            //             MainItemNo: "1000",
            //             Description: "Main Item 1",
            //             SubItems: [
            //                 { SubItemNo: "1000-1", ServiceNo: "S001", Description: "SubItem 1", Quantity: 5, UOM: "EA" },
            //                 { SubItemNo: "1000-2", ServiceNo: "S002", Description: "SubItem 2", Quantity: 10, UOM: "EA" }
            //             ]
            //         },
            //         {
            //             MainItemNo: "2000",
            //             Description: "Main Item 2",
            //             SubItems: []
            //         }
            //     ]
            // };
            var oData = {
                MainItems: [
                    {
                        MainItemNo: "1000",
                        Description: "Main Item 1",
                        children: [   // <--- TreeTable needs children
                            { SubItemNo: "1000-1", ServiceNo: "S001", Description: "SubItem 1", Quantity: 5, UOM: "EA" },
                            { SubItemNo: "1000-2", ServiceNo: "S002", Description: "SubItem 2", Quantity: 10, UOM: "EA" },

                        ]
                    },
                    {
                        MainItemNo: "2000",
                        Description: "Main Item 2",
                        children: []
                    },
                    { MainItemNo: "", Description: "", Quantity: "", UOM: "", isFooter: true } // Footer row

                ]
            };

            var oModel = new sap.ui.model.json.JSONModel(oData);
            this.getView().setModel(oModel);

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
        onAddMainItem: function () {
            const oView = this.getView();
            const oModel = oView.getModel();
            const aMainItems = oModel.getProperty("/MainItems");

            const oNewMain = {
                MainItemNo: oView.byId("dialogMainItemNo").getValue(),
                ServiceNo: oView.byId("dialogMainServiceNo").getValue(),
                Description: oView.byId("dialogMainDescription").getValue(),
                Quantity: oView.byId("dialogMainQuantity").getValue(),
                UOM: oView.byId("dialogMainUOM").getValue(),
                children: []
            };

            aMainItems.push(oNewMain);
            oModel.refresh();

            this.byId("addMainDialog").close();
        },

        // Add Sub Item
        onAddSubItem: function () {
            const oView = this.getView();
            const oModel = oView.getModel();
            const aMainItems = oModel.getProperty("/MainItems");

            const sParentNo = oView.byId("dialogParentMainItemNo").getValue();
            const oParent = aMainItems.find(item => item.MainItemNo === sParentNo);

            if (!oParent) {
                sap.m.MessageToast.show("Parent Main Item not found!");
                return;
            }

            const oNewSub = {
                SubItemNo: oView.byId("dialogSubItemNo").getValue(),
                ServiceNo: oView.byId("dialogSubServiceNo").getValue(),
                Description: oView.byId("dialogSubDescription").getValue(),
                Quantity: oView.byId("dialogSubQuantity").getValue(),
                UOM: oView.byId("dialogSubUOM").getValue()
            };

            oParent.children.push(oNewSub);
            oModel.refresh();

            this.byId("addSubDialog").close();
        },

        // onAddSubItem: function (oEvent) {
        //     var oModel = this.getView().getModel();
        //     var sPath = oEvent.getSource().data("path"); // path of MainItem
        //     var aSubItems = oModel.getProperty(sPath + "/SubItems");

        //     var newSubItem = {
        //         SubItemNo: "NEW-" + Date.now(),
        //         ServiceNo: "",
        //         Description: "New SubItem",
        //         Quantity: 0,
        //         UOM: ""
        //     };

        //     aSubItems.push(newSubItem);
        //     oModel.refresh(true);
        // },


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