sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/Text",
    "sap/m/Button",
], function (Controller, Dialog, Text, VBox, Button) {
    "use strict";

    return Controller.extend("project1.controller.ServiceMaster", {
        onInit: function () {
            var oserviceModel = new sap.ui.model.json.JSONModel({
                ServiceMaster: [
                    { Code: "test1", SearchTerm: "Test", Description: "test", lastChangeDate: "19-8-2025", serviceType: "Test1", CreatedOn: "2025-08-18" },
                    { Code: "st2", SearchTerm: "Test ST2", Description: "desc", lastChangeDate: "19-8-2025", serviceType: "Test2", CreatedOn: "2025-08-18" }
                ],
                newCode: "",
                newDescription: ""
            });
            this.getView().setModel(oserviceModel);
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

        // onEdit: function (oEvent) {
        //     // Logic to edit service type
        // },
        onDelete: function (oEvent) {
            // Logic to delete service type
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

    // Create a copy (shallow clone of object)
    var oNewData = Object.assign({}, oSelectedData);

    // Optional: change the Code so it doesn’t conflict
    oNewData.Code = oNewData.Code + "_Copy";

    // Add new record to the array
    aData.push(oNewData);

    // Update model
    oModel.setProperty("/ServiceMaster", aData);
    oModel.refresh(true);

    sap.m.MessageToast.show("Item copied successfully");
}



        // onShowDetails: function (){
        //     // Logic to Show Details of Selected Service

        //     var oTable = this.byId("serviceMaster");
        //     var oSelectedItem = oTable.getSelectedItem();
        //     if (oSelectedItem) {
        //         var oContext = oSelectedItem.getBindingContext();
        //         if (oContext) {
        //             var oSelectedData = oContext.getObject();
        //             if(oSelectedData){
        //                 var code = oSelectedData.Code;
        //                 var createdOn = oSelectedData.CreatedOn;
        //                 var searchTerm = oSelectedData.SearchTerm;
        //                 var description = oSelectedData.Description;
        //                 var serviceType = oSelectedData.serviceType;
        //                 var lastChangedDate = oSelectedData.lastChangeDate;
        //             }
        //         }
        //     }
        //     else
        //     {
        //         sap.m.MessageBox.warning("Please, Select an item");
        //     }
        //     if(!this._oValueHelpDialog){
        //         this._oValueHelpDialog = new Dialog({
        //             title : "Service Master: "+ code,
        //             titleAlignment: "Center",
        //             contentWidth : "800px",

        //             content: new sap.m.VBox({
        //                 items: [
        //                     new VBox({}),
        //                     new sap.m.VBox({
        //                         items: [
        //                             new sap.m.Label({ text: "Service Master Code" , design: "Bold"}),
        //                             new sap.m.Input({ value: code || "" , editable: false }),

        //                         ]
        //                     }),
        //                     new VBox({}),
        //                     new sap.m.VBox({
        //                         items: [
        //                             new sap.m.Label({ text: "Search Term" , design: "Bold"}),
        //                             new sap.m.Input({ value: searchTerm || "" , editable: false }),
        //                         ]
        //                     }),
        //                     new VBox({}),
        //                     new sap.m.VBox({
        //                         items: [
        //                             new sap.m.Label({ text: "Description" , design: "Bold"}),
        //                             new sap.m.Input({ value: description || "" , editable: false }),
        //                         ]
        //                     }),
        //                     new VBox({}),
        //                     new sap.m.VBox({
        //                         items: [
        //                             new sap.m.Label({ text: "Last Changed Date" , design: "Bold"}),
        //                             new sap.m.Input({ value: lastChangedDate || "" , editable: false }), 
        //                         ]
        //                     }),
        //                     new VBox({}),
        //                     new sap.m.VBox({
        //                         items: [
        //                             new sap.m.Label({ text: "Service Type" , design: "Bold"}),
        //                             new sap.m.Input({ value: serviceType || "" , editable: false }),
        //                         ]
        //                     }),
        //                     new VBox({}),
        //                     new sap.m.VBox({
        //                         items: [
        //                             new sap.m.Label({ text: "Created On" , design: "Bold"}),
        //                             new sap.m.Input({ value: createdOn || "" , editable: false }),
        //                         ]
        //                     }),
        //                     new VBox({}),
        //                 ]
        //            }),

        //             endButton: new sap.m.Button({
        //                 text: "Close",
        //                 press: () => {
        //                     this._oValueHelpDialog.close();
        //                 }
        //             })

        //         })
        //     }
        //     //To avoid showing empty Dialog in Case of no selection
        //     if(oSelectedItem ){
        //         this.getView().addDependent(this._oValueHelpDialog);
        //          this._oValueHelpDialog.open(); 
        //     }
        // }
    });
});
