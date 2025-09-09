sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
  "sap/m/HBox",
  "sap/m/VBox",
  "sap/m/Text",
  "sap/m/Button",
  "sap/ui/export/Spreadsheet"
], (Controller,MessageToast) => {
    "use strict";

    return Controller.extend("invoice.controller.View1", {
             onInit() {

        // //For Navigate with Parameter Purpose
        //   var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        //   oRouter.getRoute("invoice").attachPatternMatched(this._onObjectMatched, this);

          //Set Dummy Data
          var ItemModel = new sap.ui.model.json.JSONModel({
            Items : [
              {MainItemNo : "10" , LineNR : "101" , ServiceNo : "33" , Description : "Item Order 1" ,QTY : "2" , AmountPerUnit: "2000" ,Total: "4000"},
              {MainItemNo : "20" , LineNR : "102" , ServiceNo : "44" , Description : "Item Order 2" , QTY : "3" , AmountPerUnit: "3000" ,Total: "9000"}
            ]
          });
          this.getView().setModel(ItemModel);
      },

      _onObjectMatched: function (oEvent) {
      var documentID = decodeURIComponent(oEvent.getParameter("arguments").documentID);
      var itemName = decodeURIComponent(oEvent.getParameter("arguments").ItemName);
      this.byId("_IDGenLabel1").setText("Document: " + documentID + " - " + itemName);

    },

      onSaveDocument: function(){

      },
      onPrint: function(){

      },
      onExport: function(){

            var oModel = this.getView().getModel();
            // build column config (headers + property bindings)
            var aCols = [
                { label: "Main Item No.", property: "MainItemNo" },
                { label: "Line NR", property: "LineNR" },
                { label: "Service No.", property: "ServiceNo" },
                { label: "Description", property: "Description" },
                { label: "QTY", property: "QTY" },
                { label: "UOM", property: "UOM" },
                { label: "Amount Per Unit", property: "AmountPerUnit" },
                { label: "Currency", property: "Currency" },
                { label: "Total", property: "Total" },
                { label: "Actual QTY", property: "ActualQTY" },
                { label: "Actual Percentage %", property: "ActualPercentage" },
                { label: "Over Fulfillment %", property: "OverFulfillment" },
                { label: "Unlimited Over Fulfillment %", property: "UnlimitedOverFulfillment"},
                { label: "Manual Price Entery Allowd", property: "ManualPriceEnteryAllowd" },
                { label: "Material Group", property: "MaterialGrp" },
                { label: "Service Type", property: "ServiceType" },
                { label: "External Service Number", property: "ExternalServiceNumber" },
                { label: "service Text", property: "ServiceText" },
                { label: "line Text", property: "LineText" },
                { label: "personnel No.", property: "PersonnelNR" },
                { label: "line Type", property: "LineType" },
                { label: "Bidders' line", property: "Biddersline" },
                { label: "Supplementary line", property: "Supplementaryline"},
                { label: "Lot Cost One", property: "LotCostOne" }
            ];

            // data source (your model path)
            var oSettings = {
                workbook: { columns: aCols },
                dataSource: oModel.getProperty("/Items"), // array of objects
                fileName: "Service Invoice Items.xlsx"
            };

            var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
            oSpreadsheet.build().finally(function () {
                oSpreadsheet.destroy();
            });
      },
      onImport: function(){
        //Open Dialog built automatically
        if(!this._oValueHelpDialog){
          this._oValueHelpDialog = new sap.m.Dialog({
             title : "Import From:",
             content : [
              new sap.m.HBox({
                justifyContent: "SpaceAround",
                class : "sapUiSmallMargin",
                items : [
                  new sap.m.Button({
                    text: "Quotations?",
                    type: "Emphasized",
                  }),
                  new sap.m.Button({
                    text: "Model?",
                    type: "Emphasized",
                  }),
                  new sap.m.Button({
                    text: "Excel?",
                    type: "Emphasized",
                  })
                ]
              })
             ]
          //       buttons: [
          //       new sap.m.Button({
          //       text: "Option 1",
          //       type: "Emphasized",
          //       press: function () {
          //           sap.m.MessageToast.show("Option 1 clicked");
          //       }
          //   }),
          //   new sap.m.Button({
          //       text: "Option 2",
          //       type: "Default",
          //       press: function () {
          //           sap.m.MessageToast.show("Option 2 clicked");
          //       }
          //   }),
          // ]
             

          });
        }
        this._oValueHelpDialog.open();


      },
      onAddIem: function(){
        //Calc total Amount  = QTY * Amount Per Unit 
        //Re-Render
        this.byId("_IDGenText1").setText();
        
        var oModel = this.getView().getModel();
        var oData = oModel.getProperty("/Items");
        var total = 0;
        oData.forEach(oRow => {
          var price = oRow.AmountPerUnit;
          var qty = oRow.QTY;
          var multiply = price * qty;
          //Set Value in total Col.
          oRow.Total = multiply;
          total += multiply;
        });
        //Update Model with Calculated Total
        oModel.setProperty("/Items", oData);
        if(total){
          //Set Value
          this.byId("_IDGenText1").setText(total);
        }
      },
      onDeleteItem: function(oEvent){
        //Get Selected Item 
        
      }
    });
});