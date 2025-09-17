
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox"
], function (Controller, MessageToast, Input, Label, VBox) {
    "use strict";

    return Controller.extend("project1.controller.Formula", {
        onInit: function () {
            var oModel = new sap.ui.model.json.JSONModel({
                paramCount: 0,
                params: [],
                paramIdsText: "",
                relationText: "",
                formulaReview: "",
                testValues: [],
                operations: [
                    { key: "+", text: "+" },
                    { key: "-", text: "-" },
                    { key: "*", text: "*" },
                    { key: "/", text: "/" },
                    { key: "^", text: "^" },
                    { key: "%", text: "%" },
                    { key: "π", text: "π" },
                ],
                wizard: { currentStep: "step1" } // Explicitly track current step
            });
            this.getView().setModel(oModel);
            //this.getView().setModel(oModel, "view");
            // this.getView().getModel().setProperty("/wizard/currentStep", "step1");
        },
        onAddOperation: function (oEvent) {
            var oTextArea = this.getView().byId("relationInput");
            var operation = oEvent.getSource().getText();
            var currentValue = oTextArea.getValue();
            oTextArea.setValue(currentValue + " " + operation + " ");
        },
        onParamCountChange: function (oEvent) {
            var oModel = this.getView().getModel();
            var paramCount = parseInt(oEvent.getParameter("value")) || 0;
            oModel.setProperty("/paramCount", paramCount);

            var oParamContainer = this.getView().byId("_IDGenVBox8");
            oParamContainer.removeAllItems();

            for (var i = 1; i <= paramCount; i++) {
                var oVBox = new VBox({
                    items: [
                        new Label({ text: "ParamID " + i + "*" }),
                        new Input({ value: "{/params/" + (i - 1) + "/id}", placeholder: "Enter ParamID " + i }),
                        new Label({ text: "Param Description " + i + "*" }),
                        new Input({ value: "{/params/" + (i - 1) + "/description}", placeholder: "Enter Param Description " + i })
                    ]
                });
                oParamContainer.addItem(oVBox);
            }
            var params = [];
            for (var j = 0; j < paramCount; j++) {
                params.push({ id: "", description: "" });
            }
            console.log(params);

            oModel.setProperty("/params", params);

        },
        updateParamIdsText: function () {
            var oModel = this.getView().getModel();
            var paramCount = oModel.getProperty("/paramCount");
            console.log(paramCount);

            var params = oModel.getProperty("/params");
            // Update paramIdsText with current ParamIDs (initially empty)
            var paramIds = params.map(param => param.id).join(", ");
            console.log(paramIds);

            oModel.setProperty("/paramIdsText", (paramIds || "None entered yet"));
            oModel.refresh(true); // Force refresh to ensure binding updates


            // Generate test inputs for Step 4
            var oTestContainer = this.getView().byId("testInputsContainer");
            oTestContainer.removeAllItems();
            var testValues = [];
            for (var k = 0; k < paramCount; k++) {
                var paramId = params[k] ? params[k].id : "Param" + (k + 1);
                console.log(paramId);

                var oLabel = new Label({ text: paramId + " Value:" });
                var oInput = new Input({ value: "{/testValues/" + k + "}", type: "Number" });
                oTestContainer.addItem(oLabel);
                oTestContainer.addItem(oInput);
                testValues.push("");
            }
            oModel.setProperty("/testValues", testValues);
        },
        onShowResult: function () {
            var oModel = this.getView().getModel();
            var relation = oModel.getProperty("/relationText");
            var params = oModel.getProperty("/params");
            var testValues = oModel.getProperty("/testValues");

            var expression = relation;
            for (var i = 0; i < params.length; i++) {
                var paramId = params[i].id;
                var value = testValues[i] || "0"; // Default to 0 if empty
                expression = expression.replace(new RegExp(paramId, 'g'), value);
            }
            try {
                var result = eval(expression);
                // MessageToast.show("Result: " + result);
                sap.m.MessageBox.information("Result: " + result, {
                    title: "Calculation Result",
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.OK) {
                            console.log("User confirmed result");
                        }
                    }
                });
            } catch (e) {
                MessageToast.show("Invalid expression: " + e.message);
            }
        },
        // onSaveFormula: function () {
        //     var oView = this.getView();

        //     // Get user inputs
        //     var sName = oView.byId("formulaNameInput").getValue();
        //     var sDescription = oView.byId("formulaDescriptionInput").getValue();
        //     var sRelation = oView.byId("relationInput").getValue();
        //     console.log(sName);


        //     // Basic validation
        //     if (!sName || !sDescription) {
        //         sap.m.MessageToast.show("Please fill in all required fields.");
        //         return;
        //     }

        //     // Access global/shared model
        //     // var oModel = this.getOwnerComponent().getModel(); // assuming you registered it in Component.js
        //     // var aFormulas = oModel.getProperty("/Formulas") || [];

        //     // // Create new formula object
        //     // var oNewFormula = {
        //     //     Code: sName,                // use Name as Code
        //     //     Description: sDescription,  // formula description
        //     //     Relation: sRelation         // optional, if you want to keep it
        //     // };

        //     // // Append to existing formulas
        //     // aFormulas.push(oNewFormula);

        //     // // Update the model
        //     // oModel.setProperty("/Formulas", aFormulas);


        //     // sap.m.MessageToast.show("Formula saved successfully!");
        //     sap.m.MessageBox.success("Formula saved successfully!,Press OK To return to the main page", {
        //         title: "Success",
        //         actions: [sap.m.MessageBox.Action.OK],
        //         onClose: function (sAction) {
        //             if (sAction === sap.m.MessageBox.Action.OK) {
        //                 // Navigate back to the main page (formulas list)
        //                 var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        //                 oRouter.navTo("formulas");
        //             }
        //         }.bind(this) // important to keep controller context
        //     });


        //     // Optionally reset wizard inputs
        //     oView.byId("formulaNameInput").setValue("");
        //     oView.byId("formulaDescriptionInput").setValue("");
        //     oView.byId("relationInput").setValue("");
        // },



        // not needed

        onSaveFormula: function () {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel(); // OData V4 
            var sName = oView.byId("formulaNameInput").getValue();
            var sDescription = oView.byId("formulaDescriptionInput").getValue();
            var sRelation = oView.byId("relationInput").getValue();
            // var params = oModel.getProperty("/params");
            var oLocalModel = this.getView().getModel(); // unnamed
            var params = oLocalModel.getProperty("/params");
            var paramIds = params.map(p => p.id);
            var paramDescriptions = params.map(p => p.description);
            var numberOfParams = paramIds.length;

            if (!sName || !sDescription) {
                sap.m.MessageToast.show("Please fill in all required fields.");
                return;
            }
            var oPayload = {
                formula: sName,
                description: sDescription,
                numberOfParameters: numberOfParams,
                parameterIds: paramIds,
                parameterDescriptions: paramDescriptions,
                formulaLogic: sRelation,
                expression: sRelation
            };
            fetch("/odata/v4/sales-cloud/Formulas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to create formula: " + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    // sap.m.MessageToast.show("Formula created successfully!");
                    sap.m.MessageBox.success("Formula saved successfully!,Press OK To return to the main page", {
                        title: "Success",
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                                oRouter.navTo("formulas");
                            }
                        }.bind(this) 
                    });
                    console.log("Created Formula:", data);
                    var oModel = this.getView().getModel();
                    var aRecords = oModel.getProperty("/Formulas") || [];
                    aRecords.push(data);
                    oModel.setProperty("/Formulas", aRecords);
                })
                .catch(err => {
                    console.error("Error creating Formula:", err);
                    sap.m.MessageBox.error("Error: " + err.message);
                });
        },


        onNext: function () {
            var oWizard = this.getView().byId("wizard");
            var currentStep = oWizard.getCurrentStep();
            var oModel = this.getView().getModel();
            if (currentStep === "step1") {
                var paramCount = oModel.getProperty("/paramCount");
                if (paramCount > 0) {
                    oWizard.nextStep();
                    this.onParamCountChange({ getParameter: () => ({ value: paramCount }) });
                } else {
                    MessageToast.show("Please enter a number of parameters greater than 0.");
                }
            } else if (currentStep === "step2") {
                var params = oModel.getProperty("/params");
                var isValid = params.every(param => param.id && param.description);
                if (isValid) {
                    // Update paramIdsText with the list of ParamIDs
                    var paramIds = params.map(param => param.id).join(", ");
                    oModel.setProperty("/paramIdsText", "Parameters: " + paramIds);
                    oWizard.nextStep();
                } else {
                    MessageToast.show("Please fill in all ParamID and Param Description fields.");
                }
            } else if (currentStep === "step3") {
                oWizard.nextStep();
            }
        },
        onBack: function () {
            var oWizard = this.getView().byId("wizard");
            oWizard.previousStep();
        },
        onFinishWizard: function () {
            MessageToast.show("Formula setup completed!");
            this.getView().byId("wizard").discardProgress(this.getView().byId("step1")); // Reset wizard
        },
        onOperationSelect: function (oEvent) {
            var oTextArea = this.getView().byId("relationInput");
            var selectedKey = oEvent.getParameter("selectedItem").getKey();
            var currentValue = oTextArea.getValue();
            oTextArea.setValue(currentValue + " " + selectedKey + " ");
        },

        // onSaveFormula: function () {
        //     var oModel = this.getView().getModel();
        //     var formulaName = this.getView().byId("formulaNameInput").getValue();
        //     var description = this.getView().byId("formulaDescriptionInput").getValue();
        //     var ingredient1 = this.getView().byId("ingredient1Input").getValue();
        //     var ingredient2 = this.getView().byId("ingredient2Input").getValue();
        //     var baseQuantity = this.getView().byId("baseQuantityInput").getValue();
        //     var multiplier = this.getView().byId("multiplierInput").getValue();

        //     if (formulaName && description && ingredient1 && ingredient2 && baseQuantity && multiplier) {
        //         var reviewText = `Formula Name: ${formulaName}\nDescription: ${description}\nIngredients: ${ingredient1}, ${ingredient2}\nBase Quantity: ${baseQuantity}\nMultiplier: ${multiplier}`;
        //         oModel.setProperty("/formulaReview", reviewText);
        //         MessageToast.show("Formula saved successfully!");
        //         this.getView().byId("wizard").nextStep(); // Move to next step or close wizard
        //     } else {
        //         MessageToast.show("Please fill in all fields.");
        //     }
        // }
    });
});