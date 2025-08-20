sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("project1.controller.AddModel", {
        onInit() {
        },
        
        onAddModel : function(){


            const modelServSpec = this.byId("_IDGenInput").getValue();
           const blockingIndicator = this.byId("_IDGenCheckBox").getSelected();
            const ServiceSelection = this.byId("_IDGenCheckBox2").getSelected(); //return true / false
            const Odescription = this.byId("_IDGenInput6");
            const Description = Odescription.getValue();
            const SearchTerm = this.byId("_IDGenInput7").getValue();
            const Currency = this.byId("_IDGenInput8").getValue();


            //Check on mandatories
            if(!Description)
            {
                Odescription.setValueState("Error");
                Odescription.setValueStateText("Description is required");
                sap.m.MessageToast.show("Description is required");
                 return; 
                
            }

            

            //Create new model
            // const oTable = this.byId("modelTable");
            // const oBinding = oTable.getBinding("items");

            

            const oData = {};

            oBinding.create(oData).created().then(() => {
            sap.m.MessageToast.show("Model is created");
            this.byId("MaterialInput").setValue("");
            }).catch((err) => {
            sap.m.MessageToast.show("Failed to create Model");
            console.error(err);
            });

        }

    });
});