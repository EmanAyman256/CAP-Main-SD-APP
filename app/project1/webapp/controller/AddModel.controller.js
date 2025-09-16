sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.AddModel", {
        onInit() {
        },

       

        onAddModel: function () {
            const modelServSpec = this.byId("_IDGenInput").getValue();
            const blockingIndicator = this.byId("_IDGenCheckBox").getSelected();
            const serviceSelection = this.byId("_IDGenCheckBox2").getSelected();
            const oDescriptionInput = this.byId("_IDGenInput6");
            const description = oDescriptionInput.getValue();
            const searchTerm = this.byId("_IDGenInput7").getValue();
            const currency = this.byId("_IDGenInput8").getValue();

            // ✅ Mandatory check
            if (!description) {
                oDescriptionInput.setValueState("Error");
                oDescriptionInput.setValueStateText("Description is required");
                sap.m.MessageToast.show("Description is required");
                return;
            }

            // ✅ Prepare payload
            const newModel = {
                modelServSpec: modelServSpec,
                blockingIndicator: blockingIndicator,
                serviceSelection: serviceSelection,
                description: description,
                searchTerm: searchTerm,
                currencyCode: currency
            };

            fetch("/odata/v4/sales-cloud/ModelSpecifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newModel)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to create model: " + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    sap.m.MessageBox.success("Model saved successfully!,Press OK To return to the main page", {
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                oRouter.navTo("model");
                            }
                        }.bind(this) 
                    });

                    // optional: clear fields
                    this.byId("_IDGenInput").setValue("");
                    this.byId("_IDGenCheckBox").setSelected(false);
                    this.byId("_IDGenCheckBox2").setSelected(false);
                    this.byId("_IDGenInput6").setValue("");
                    this.byId("_IDGenInput7").setValue("");
                    this.byId("_IDGenInput8").setValue("");

                    // optional: refresh table if you show models
                    // let oTable = this.byId("modelTable");
                    // oTable.getBinding("items").refresh();
                })
                .catch(err => {
                    sap.m.MessageBox.error("Error: " + err.message);
                });
        }


    });
});