sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("execution.controller.Home", {
        onInit() { 

        },

        onDocumentChange: function(oEvent){
            var documentID = oEvent.getParameter("value");
            if(documentID){
                //Set Dummy Data
                var Items =  new sap.ui.model.json.JSONModel({
                      Items : [
                        {ItemKey: "10", ItemName: "Project Service"},
                        {ItemKey: "20", ItemName: "Project Service 2"}
                      ]
                });
                this.getView().setModel(Items);
            }
            else{
                //Clear
                 this.getView().setModel();
            }
        },

        onNext(){
            //Restrict Navigation in case Empty Item
            var oItemValue = this.byId("_IDGenComboBox").getValue();
            if(oItemValue){
                 this.getOwnerComponent().getRouter().navTo("ExecutionOrderView");
            }
            else{
                sap.m.MessageToast.show("Please, Choose an Item");
                return;
            }
           
        }

        //For Rendering Updates and Styling
        // onAfterRendering: function () {
        //    //Instead Of CSS Style
        //     var oVBox = this.byId("_IDGenVBox1");
        //     if (oVBox && oVBox.getDomRef()) {
        //         oVBox.getDomRef().style.backgroundColor = "#0070F2"; // Light gray background
        //     } else {
        //         console.warn("VBox with ID 'myVBox' not found or not yet rendered.");
        //     }

        // }
    });
});