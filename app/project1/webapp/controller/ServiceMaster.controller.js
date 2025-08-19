sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
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
            // Logic to delete service type
        }
    });
});
