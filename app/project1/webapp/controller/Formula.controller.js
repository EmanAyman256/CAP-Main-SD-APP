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
                operations: [
                    { key: "+", text: "+" },
                    { key: "-", text: "-" },
                    { key: "*", text: "*" },
                    { key: "/", text: "/" }
                ]
            });
            this.getView().setModel(oModel);
            this.getView().getModel().setProperty("/wizard/currentStep", "step1"); // Track current step
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
            oModel.setProperty("/params", params);

            // Update paramIdsText with current ParamIDs (initially empty)
            var paramIds = params.map(param => param.id).join(", ");
            console.log(paramIds);

            oModel.setProperty("/paramIdsText", "Parameters: " + (paramIds || "None entered yet"));
            oModel.refresh(true); // Force refresh to ensure binding updates
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
        onSaveFormula: function () {
            var oModel = this.getView().getModel();
            var formulaName = this.getView().byId("formulaNameInput").getValue();
            var description = this.getView().byId("formulaDescriptionInput").getValue();
            var ingredient1 = this.getView().byId("ingredient1Input").getValue();
            var ingredient2 = this.getView().byId("ingredient2Input").getValue();
            var baseQuantity = this.getView().byId("baseQuantityInput").getValue();
            var multiplier = this.getView().byId("multiplierInput").getValue();

            if (formulaName && description && ingredient1 && ingredient2 && baseQuantity && multiplier) {
                var reviewText = `Formula Name: ${formulaName}\nDescription: ${description}\nIngredients: ${ingredient1}, ${ingredient2}\nBase Quantity: ${baseQuantity}\nMultiplier: ${multiplier}`;
                oModel.setProperty("/formulaReview", reviewText);
                MessageToast.show("Formula saved successfully!");
                this.getView().byId("wizard").nextStep(); // Move to next step or close wizard
            } else {
                MessageToast.show("Please fill in all fields.");
            }
        }
    });
});