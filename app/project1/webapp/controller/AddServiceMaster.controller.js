sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller,JSONModel,MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.AddServiceMaster", {
  onInit: function () {
            var oserviceModel = new JSONModel({
                ServiceMaster: [
                    { Code: "test1", SearchTerm: "Test", Description: "test", lastChangeDate: "19-8-2025", serviceType: "Test1", CreatedOn: "2025-08-18" },
                    { Code: "st2", SearchTerm: "Test ST2", Description: "desc", lastChangeDate: "19-8-2025", serviceType: "Test2", CreatedOn: "2025-08-18" }
                ],
                newCode: "",
                newDescription: ""
            });
            this.getView().setModel(oserviceModel);
        },
onAddPress: function () {
    var oView = this.getView();

    // Collect values from inputs
    var serviceNumber = oView.byId("_IDGenInput1").getValue();
    var searchTerm = oView.byId("_IDGenInput2").getValue();
    var description = oView.byId("_IDGenInput3").getValue();
    var serviceText = oView.byId("_IDGenInput4").getValue();
    var shortTextAllowed = oView.byId("_IDGenCheckBox1").getSelected();
    var deletionIndicator = oView.byId("_IDGenCheckBox3").getSelected();

    // Example additional fields
    var toBeConvertedNum = oView.byId("_IDGenInput5").getValue();
    var convertedNum = oView.byId("_IDGenInput9").getValue();

    // Build payload
    var newServiceMaster = {
        serviceNumber: serviceNumber,
        searchTerm: searchTerm,
        description: description,
        serviceText: serviceText,
        shortTextAllowed: shortTextAllowed,
        deletionIndicator: deletionIndicator,
        toBeConvertedNum: toBeConvertedNum,
        convertedNum: convertedNum
        // add other dropdown values if needed
    };

    console.log("Payload to be sent:", newServiceMaster);

    // POST to CAP service
    fetch("/odata/v4/sales-cloud/ServiceNumbers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newServiceMaster)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to save: " + response.statusText);
            }
            return response.json();
        })
        .then(savedItem => {
            sap.m.MessageToast.show("Service Master created successfully!");

            // Optionally refresh model/binding if you have a table/list
            var oModel = this.getView().getModel();
            if (oModel) {
                oModel.refresh(true);
            }
        })
        .catch(err => {
            console.error("Error saving ServiceMaster:", err);
            sap.m.MessageBox.error("Error: " + err.message);
        });
},

        // onAddPress: function () {
        //     // Get the model
        //     var oModel = this.getView().getModel();
        //     var oData = oModel.getData();
            
        //     // Get values from input fields and controls
        //     var sServiceNumber = this.byId("_IDGenInput1").getValue(); // Service Number
        //     var sSearchTerm = this.byId("_IDGenInput2").getValue(); // Search Term
        //     var sDescription = this.byId("_IDGenInput3").getValue(); // Description
        //     var sServiceText = this.byId("_IDGenInput4").getValue(); // Service Text
        //     var bShortTextChange = this.byId("_IDGenCheckBox1").getSelected(); // Short Text Change Allowed
        //     var bDeletionIndicator = this.byId("_IDGenCheckBox3").getSelected(); // Deletion Indicator
        //     var sServiceType = this.byId("_IDGenSelect").getSelectedKey(); // Service Type
        //     var sBaseUOM = this.byId("_IDGenSelect1").getSelectedKey(); // Base Unit of Measurement
        //     var sToBeConvertedNumber = this.byId("_IDGenInput5").getValue(); // To Be Converted Number
        //     var sToBeConvertedUOM = this.byId("_IDGenSelect2").getSelectedKey(); // To Be Converted UOM
        //     var sConvertedNumber = this.byId("_IDGenInput9").getValue(); // Converted Number
        //     var sConvertedUOM = this.byId("_IDGenSelect3").getSelectedKey(); // Converted UOM
        //     var bMainItem = this.byId("_IDGenCheckBox4").getSelected(); // Main Item
        //     var sMaterialGroup = this.byId("_IDGenSelect4").getSelectedKey(); // Material Group

        //     // Validate required fields
        //     if (!sSearchTerm || !sDescription || !sServiceText) {
        //         MessageToast.show("Please fill all required fields: Search Term, Description, and Service Text.");
        //         return;
        //     }
        //     // Create new entry
        //     var oNewEntry = {
        //         Code: sServiceNumber || "NEW" + Date.now(), // Generate a unique code if not provided
        //         SearchTerm: sSearchTerm,
        //         Description: sDescription,
        //         ServiceText: sServiceText,
        //         lastChangeDate: new Date().toLocaleDateString("en-GB"), // e.g., "24-8-2025"
        //         serviceType: sServiceType || "Default",
        //         CreatedOn: new Date().toLocaleDateString("en-GB"),
        //         ShortTextChangeAllowed: bShortTextChange,
        //         DeletionIndicator: bDeletionIndicator,
        //         BaseUnitOfMeasurement: sBaseUOM || "",
        //         ToBeConvertedNumber: sToBeConvertedNumber || "",
        //         ToBeConvertedUOM: sToBeConvertedUOM || "",
        //         ConvertedNumber: sConvertedNumber || "",
        //         ConvertedUOM: sConvertedUOM || "",
        //         MainItem: bMainItem,
        //         MaterialGroup: sMaterialGroup || ""
        //     };

        //     // Add new entry to ServiceMaster array
        //     oData.ServiceMaster.push(oNewEntry);

        //     // Update the model
        //     oModel.setData(oData);

        //     // Clear input fields (optional)
        //     this.byId("_IDGenInput1").setValue("");
        //     this.byId("_IDGenInput2").setValue("");
        //     this.byId("_IDGenInput3").setValue("");
        //     this.byId("_IDGenInput4").setValue("");
        //     this.byId("_IDGenInput5").setValue("");
        //     this.byId("_IDGenInput9").setValue("");
        //     this.byId("_IDGenCheckBox1").setSelected(false);
        //     this.byId("_IDGenCheckBox3").setSelected(false);
        //     this.byId("_IDGenCheckBox4").setSelected(false);
        //     this.byId("_IDGenSelect").setSelectedKey("");
        //     this.byId("_IDGenSelect1").setSelectedKey("");
        //     this.byId("_IDGenSelect2").setSelectedKey("");
        //     this.byId("_IDGenSelect3").setSelectedKey("");
        //     this.byId("_IDGenSelect4").setSelectedKey("");

        //     // Show success message
        //     MessageToast.show("Service added successfully!");
        // },
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
