sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("project1.controller.Example", {
    onInit: function () {
      var oModel = new JSONModel();

      // Fetch data from CAP OData service
      fetch("/odata/v4/SalesCloudService/ServiceNumbers")
        .then(response => response.json())
        .then(data => {
          console.log(data.value);
          
            debugger
          // Wrap array inside an object for binding
          oModel.setData({ ServiceTypes: data.value });
          this.getView().byId("serviceTypesTable").setModel(oModel);
        })
        .catch(err => {
          console.error("Error fetching ServiceTypes", err);
        });
    }
  });
});
