sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.AddServiceMaster", {
        onInit: function () {
            var oView = this.getView();

            // Initialize the view model
            var oViewModel = new sap.ui.model.json.JSONModel({
                ServiceNumbers: []
            });
            oView.setModel(oViewModel, "view");

            // Fetch ServiceNumbers data
            fetch("/odata/v4/sales-cloud/ServiceNumbers")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Fetched ServiceNumbers:", data.value); // Debug: Log data
                    oViewModel.setData({ ServiceNumbers: Array.isArray(data.value) ? data.value : [] });
                    oViewModel.refresh(true);
                })
                .catch(err => {
                    console.error("Error fetching ServiceNumbers:", err);
                    sap.m.MessageBox.error("Failed to load ServiceNumbers: " + err.message);
                });

            // Bind to routeMatched event for navigation
            this.getOwnerComponent().getRouter().getRoute("serviceMaster").attachMatched(this._onRouteMatched, this);

            // Service Types
            fetch("/odata/v4/sales-cloud/ServiceTypes")
                .then(res => res.json())
                .then(data => {
                    var oModel = new sap.ui.model.json.JSONModel(data.value);
                    oView.setModel(oModel, "serviceTypes");
                });

            // Material Groups
            fetch("/odata/v4/sales-cloud/MaterialGroups")
                .then(res => res.json())
                .then(data => {
                    var oModel = new sap.ui.model.json.JSONModel(data.value);
                    oView.setModel(oModel, "materialGroups");
                });

            // Units of Measurement
            fetch("/odata/v4/sales-cloud/UnitOfMeasurements")
                .then(res => res.json())
                .then(data => {
                    var oModel = new sap.ui.model.json.JSONModel(data.value);
                    oView.setModel(oModel, "unitsOfMeasurement");
                });
        },

        _onRouteMatched: function (oEvent) {
            var oArguments = oEvent.getParameter("arguments");
            var oViewModel = this.getView().getModel("view");

            // Refetch ServiceNumbers to ensure table updates after navigation
            fetch("/odata/v4/sales-cloud/ServiceNumbers")
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(data => {
                    console.log("Refetched ServiceNumbers on route matched:", data.value);
                    oViewModel.setData({ ServiceNumbers: Array.isArray(data.value) ? data.value : [] });
                    oViewModel.refresh(true);
                    console.log("Updated ServiceNumbers array:", oViewModel.getProperty("/ServiceNumbers"));
                })
                .catch(err => {
                    console.error("Error refetching ServiceNumbers:", err);
                    sap.m.MessageBox.error("Failed to refresh table: " + err.message);
                });
        },

        _generateUUID: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        _isValidNumber: function (sValue) {
            return !isNaN(parseInt(sValue, 10)) && sValue.trim() !== "";
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
            var toBeConvertedNum = oView.byId("_IDGenInput5").getValue();
            var convertedNum = oView.byId("_IDGenInput9").getValue();
            var serviceTypeCode = oView.byId("_IDGenSelect5").getSelectedKey();
            var unitOfMeasurementCode = oView.byId("_IDGenSelect1").getSelectedKey();
            var toBeConvertedUOM = oView.byId("_IDGenSelect2").getSelectedKey();
            var convertedUOM = oView.byId("_IDGenSelect3").getSelectedKey();
            var materialGroupCode = oView.byId("_IDGenSelect4").getSelectedKey();
            var mainItem = oView.byId("_IDGenCheckBox4").getSelected();

            // Validate inputs
            if (!this._isValidNumber(serviceNumber)) {
                sap.m.MessageBox.error("Please enter a valid Service Number (ID).");
                return;
            }
            if (!searchTerm || !description) {
                sap.m.MessageBox.error("Search Term and Description are required.");
                return;
            }

            // Build payload
            var newServiceMaster = {
                serviceNumberCode: this._generateUUID(),
                serviceNumberCodeString: `SN-${serviceNumber.padStart(3, "0")}`,
                noServiceNumber: parseInt(serviceNumber, 10),
                searchTerm: searchTerm,
                description: description,
                serviceText: serviceText || null,
                shortTextChangeAllowed: shortTextAllowed,
                deletionIndicator: deletionIndicator,
                numberToBeConverted: this._isValidNumber(toBeConvertedNum) ? parseInt(toBeConvertedNum, 10) : null,
                convertedNumber: this._isValidNumber(convertedNum) ? parseInt(convertedNum, 10) : null,
                serviceTypeCode: serviceTypeCode || null,
                unitOfMeasurementCode: unitOfMeasurementCode || null,
                toBeConvertedUnitOfMeasurement: toBeConvertedUOM || null,
                defaultUnitOfMeasurement: convertedUOM || null,
                mainItem: mainItem,
                materialGroupCode: materialGroupCode || null,
                lastChangeDate: new Date().toISOString().split("T")[0]
            };

            console.log("Payload to be sent:", newServiceMaster);

            // POST to CAP service
            fetch("/odata/v4/sales-cloud/ServiceNumbers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newServiceMaster)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(e => { throw new Error(e.error?.message || response.statusText); });
                    }
                    return response.json().catch(() => newServiceMaster); // Handle empty response
                })
                .then(savedItem => {
                     sap.m.MessageBox.success("ServiceMaster saved successfully!,Press OK To return to the main page", {
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                oRouter.navTo("serviceMaster");
                            }
                        }.bind(this)
                    })
                    // sap.m.MessageToast.show("Service Master created successfully!");
                    // console.log("Server response:", savedItem);

                    // // Navigate with the new item as a parameter
                    // this.getOwnerComponent().getRouter().navTo("serviceMaster", {
                    //     newItem: encodeURIComponent(JSON.stringify(savedItem))
                    // });
                })
                .catch(err => {
                    console.error("Error saving ServiceMaster:", err);
                    sap.m.MessageBox.error("Error: " + err.message);
                });
        },
        // onAddPress: function () {
        //     var oView = this.getView();
        //     // Collect values from inputs
        //     var serviceNumber = oView.byId("_IDGenInput1").getValue();
        //     var searchTerm = oView.byId("_IDGenInput2").getValue();
        //     var description = oView.byId("_IDGenInput3").getValue();
        //     var serviceText = oView.byId("_IDGenInput4").getValue();
        //     var shortTextAllowed = oView.byId("_IDGenCheckBox1").getSelected();
        //     var deletionIndicator = oView.byId("_IDGenCheckBox3").getSelected();

        //     // Conversion values
        //     var toBeConvertedNum = oView.byId("_IDGenInput5").getValue();
        //     var convertedNum = oView.byId("_IDGenInput9").getValue();

        //     // Dropdowns
        //     var serviceTypeCode = oView.byId("_IDGenSelect").getSelectedKey();
        //     var unitOfMeasurementCode = oView.byId("_IDGenSelect1").getSelectedKey();
        //     var toBeConvertedUOM = oView.byId("_IDGenSelect2").getSelectedKey();
        //     var convertedUOM = oView.byId("_IDGenSelect3").getSelectedKey();
        //     var materialGroupCode = oView.byId("_IDGenSelect4").getSelectedKey();

        //     // Main Item checkbox
        //     var mainItem = oView.byId("_IDGenCheckBox4").getSelected();

        //     // Build payload
        //     var newServiceMaster = {
        //         noServiceNumber: parseInt(serviceNumber, 10),
        //         searchTerm: searchTerm,
        //         description: description,
        //         serviceText: serviceText,
        //         shortTextChangeAllowed: shortTextAllowed,
        //         deletionIndicator: deletionIndicator,
        //         numberToBeConverted: parseInt(toBeConvertedNum, 10),
        //         convertedNumber: parseInt(convertedNum, 10),
        //         serviceTypeCode: serviceTypeCode,
        //         unitOfMeasurementCode: unitOfMeasurementCode,
        //         toBeConvertedUnitOfMeasurement: toBeConvertedUOM,
        //         defaultUnitOfMeasurement: convertedUOM,
        //         mainItem: mainItem,
        //         materialGroupCode: materialGroupCode,
        //         lastChangeDate: new Date().toISOString().split("T")[0] // auto-fill today's date
        //     };


        //     console.log("Payload to be sent:", newServiceMaster);

        //     // POST to CAP service
        //     fetch("/odata/v4/sales-cloud/ServiceNumbers", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json"
        //         },
        //         body: JSON.stringify(newServiceMaster)
        //     })
        //         .then(response => {
        //             if (!response.ok) {
        //                 throw new Error("Failed to save: " + response.statusText);
        //             }
        //             return response.json();
        //         })
        //         .then(savedItem => {
        //             sap.m.MessageToast.show("Service Master created successfully!");
        //            this.onNavigateToServiceMaster()
        //             // Optionally refresh model/binding if you have a table/list
        //             // var oModel = this.getView().getModel();
        //             // if (oModel) {
        //             //     oModel.refresh(true);
        //             // }
        //         })
        //         .catch(err => {
        //             console.error("Error saving ServiceMaster:", err);
        //             sap.m.MessageBox.error("Error: " + err.message);
        //         });
        // },

        // onAddPress: function () {
        //     var oView = this.getView();

        //     // Collect values from inputs
        //     var serviceNumber = oView.byId("_IDGenInput1").getValue();
        //     var searchTerm = oView.byId("_IDGenInput2").getValue();
        //     var description = oView.byId("_IDGenInput3").getValue();
        //     var serviceText = oView.byId("_IDGenInput4").getValue();
        //     var shortTextAllowed = oView.byId("_IDGenCheckBox1").getSelected();
        //     var deletionIndicator = oView.byId("_IDGenCheckBox3").getSelected();

        //     // Example additional fields
        //     var toBeConvertedNum = oView.byId("_IDGenInput5").getValue();
        //     var convertedNum = oView.byId("_IDGenInput9").getValue();

        //     // Build payload
        //     var newServiceMaster = {
        //         serviceNumber: serviceNumber,
        //         searchTerm: searchTerm,
        //         description: description,
        //         serviceText: serviceText,
        //         shortTextAllowed: shortTextAllowed,
        //         deletionIndicator: deletionIndicator,
        //         toBeConvertedNum: toBeConvertedNum,
        //         convertedNum: convertedNum
        //         // add other dropdown values if needed
        //     };

        //     console.log("Payload to be sent:", newServiceMaster);

        //     // POST to CAP service
        //     fetch("/odata/v4/sales-cloud/ServiceNumbers", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json"
        //         },
        //         body: JSON.stringify(newServiceMaster)
        //     })
        //         .then(response => {
        //             if (!response.ok) {
        //                 throw new Error("Failed to save: " + response.statusText);
        //             }
        //             return response.json();
        //         })
        //         .then(savedItem => {
        //             sap.m.MessageToast.show("Service Master created successfully!");

        //             // Optionally refresh model/binding if you have a table/list
        //             var oModel = this.getView().getModel();
        //             if (oModel) {
        //                 oModel.refresh(true);
        //             }
        //         })
        //         .catch(err => {
        //             console.error("Error saving ServiceMaster:", err);
        //             sap.m.MessageBox.error("Error: " + err.message);
        //         });
        // },

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
        
        
        
        onNavigateToServiceMaster() {
            this.getOwnerComponent().getRouter().navTo("serviceMaster");
        },
        // onEdit: function (oEvent) {
        //     // Logic to edit service type
        // },
        // onDelete: function (oEvent) {
        //     // Logic to delete service type
        // }
    });
});
