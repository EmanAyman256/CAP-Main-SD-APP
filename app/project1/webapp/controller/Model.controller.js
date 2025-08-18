sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("project1.controller.Model", {
         onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                ServiceTypes: [
                    { Code: "test1", Description: "test", CreatedOn: "2025-08-18" },
                    { Code: "st2", Description: "desc", CreatedOn: "2025-08-18" }
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
        // onAdd: function () {
        //     // Logic to add new service type
        //     var oModel = this.getView().getModel();
        //     var newCode = oModel.getProperty("/newCode");
        //     var newDescription = oModel.getProperty("/newDescription");
        //     // Add to OData service
        //     oModel.create("/ServiceTypes", {
        //         Code: newCode,
        //         Description: newDescription,
        //         CreatedOn: new Date().toISOString().split('T')[0]
        //     }, {
        //         success: function () {
        //             oModel.setProperty("/newCode", "");
        //             oModel.setProperty("/newDescription", "");
        //         }
        //     });
        // },
        onEdit: function (oEvent) {
            // Logic to edit service type
        },
        onDelete: function (oEvent) {
            // Logic to delete service type
        }
    });
});