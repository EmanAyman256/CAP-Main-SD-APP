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
    
    onNavigateToAddServiceMaster() {
            this.getOwnerComponent().getRouter().navTo("addServiceMaster");
        },
        onEdit: function (oEvent) {
            // Logic to edit service type
        },
        onDelete: function (oEvent) {
            // Logic to delete service type
        }
    });
});
