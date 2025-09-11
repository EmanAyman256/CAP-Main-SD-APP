sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/HBox",
  "sap/m/VBox",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/CheckBox",
  "sap/m/Text",
  "sap/m/Button",
  "sap/ui/export/Spreadsheet",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], (Controller) => {
  "use strict";

  return Controller.extend("execution.controller.ExecutionOrder", {
      onInit() {

        //For Navigate with Parameter Purpose
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.getRoute("ExecutionOrderView").attachPatternMatched(this._onObjectMatched, this);

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
    onSearchItem : function(oEvent){
      // Get the search query
      var sQuery = oEvent.getSource().getValue();
      // Get the table binding
      var oTable = this.byId("_IDGenTable");
      var oBinding = oTable.getBinding("rows"); //as we use sap.ui.table not sap.m.table so aggregation rows instead of items

      // Create a filter for MainItemNo
      var aFilters = [];
      if (sQuery && sQuery.length > 0) {

        new sap.ui.model.Filter("MainItemNo", sap.ui.model.FilterOperator.EQ, sQuery);

        var oFinalFilter = new sap.ui.model.Filter({
          filters: aFilters,
              and: false
        });
        oBinding.filter([oFinalFilter]);
      }
      else
      {
          // Clear filter if empty search
          oBinding.filter([]);
      } 
       
    },
      onSaveDocument: function(){
                
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
                fileName: "Execution Order Items.xlsx"
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
             content : new sap.m.HBox({
                justifyContent: "SpaceAround",
                class : "sapUiSmallMargin",
                items : [
                  new sap.m.Button({
                    text: "Quotations?",
                    type: "Emphasized",
                    class : ""
                  }),
                  new sap.m.Button({
                    text: "Model?",
                    type: "Emphasized",
                  }),
                  new sap.m.Button({
                    text: "Excel?",
                    type: "Emphasized",
                    class : ""
                  })
                ]
              })
          });
        }
        this._oValueHelpDialog.open();
      },
      onEditItem: function(){
         if(!this._EditItemDialog){
            this._EditItemDialog = new sap.m.Dialog({
              title : "Edit Item No : ",
              content : new sap.m.VBox({
                items : [
                  

                ]
              })
            })
         }
         this._EditItemDialog.open();
      },
      onAddMianItem: function(){

        //Open Custom Dialog 
        if(!this._AddItemDialog){
          this._AddItemDialog = new sap.m.Dialog({
            title : "Add New Item",
            content : new sap.m.VBox({
                items : [
                  new sap.m.Label({ text: "Service No" }),
                  new sap.m.Input( this.createId("itemServiceNo")),
                  new sap.m.Label({ text: "Description" }),
                  new sap.m.Input(this.createId("itemDescription")),
                  new sap.m.Label({ text: "QTY" }),
                  new sap.m.Input(this.createId("itemQTY")),
                  new sap.m.Label({ text: "UOM" }),
                  new sap.m.Input(this.createId("itemUOM")),
                  new sap.m.Label({ text: "Amount Per Unit" }),
                  new sap.m.Input(this.createId("itemAmountPerUnit")),
                  new sap.m.Label({ text: "Over Fulfillment %" }),
                  new sap.m.Input(this.createId("itemOverFulf")),
                  new sap.m.Label({ text: "Unlimited Over Fulfillment %" }),
                  new sap.m.CheckBox(this.createId("itemUlimitedOFul")),
                  new sap.m.Label({ text: "Manual Price Entery Allowd" }),
                  new sap.m.CheckBox(this.createId("itemManualPrice")),
                  new sap.m.Label({ text: "Select Material Grp" }),
                  new sap.m.Input(this.createId("itemMaterialGrp")),
                  new sap.m.Label({ text: "Service Type" }),
                  new sap.m.Input(this.createId("itemSrvType")),
                  new sap.m.Label({ text: "Excternal Service Number" }),
                  new sap.m.Input(this.createId("itemExtSrvNo")),
                  new sap.m.Label({ text: "Service Text" }),
                  new sap.m.Input(this.createId("itemSrvText")),
                  new sap.m.Label({ text: "Line Text" }),
                  new sap.m.Input(this.createId("itemLineText")),
                  new sap.m.Label({ text: "Personnel NR" }),
                  new sap.m.Input(this.createId("itemPersoNr")),
                  new sap.m.Label({ text: "Line Type" }),
                  new sap.m.Input(this.createId("itemLineType")),
                  new sap.m.Label({ text: "Bidders' Line" }),
                  new sap.m.CheckBox(this.createId("itemBiddersLine")),
                  new sap.m.Label({ text: "Supplementary Line" }),
                  new sap.m.CheckBox(this.createId("itemSuppLine")),
                  new sap.m.Label({ text: "Lost Cost one" }),
                  new sap.m.CheckBox(this.createId("itemLCO")),
                ]
              }),
              beginButton: new sap.m.Button({
                text: "Add",
                type: "Emphasized",
                press: function () {
                  //Create New Line in Table
                  var oItem = this.getView().getModel().getProperty("/Items");
                  var newItem = {
                    MainItemNo : 55,
                    ServiceNo : this.byId("itemServiceNo").getValue(),
                    Description : this.byId("itemDescription").getValue(),
                    QTY : this.byId("itemQTY").getValue(),
                    UOM : this.byId("itemUOM").getValue(),
                    AmountPerUnit: this.byId("itemAmountPerUnit").getValue(),
                    Total : this.byId("itemAmountPerUnit").getValue() * this.byId("itemQTY").getValue(),
                    OverFulfillment: this.byId("itemOverFulf").getValue(),
                    UnlimitedOverFulfillment: this.byId("itemUlimitedOFul").getSelected(),
                    ManualPriceEnteryAllowd: this.byId("itemManualPrice").getSelected(),
                    MaterialGrp: this.byId("itemMaterialGrp").getValue(),
                    ServiceType: this.byId("itemSrvType").getValue(),
                    ExternalServiceNumber: this.byId("itemExtSrvNo").getValue(),
                    ServiceText: this.byId("itemSrvText").getValue(),
                    LineText : this.byId("itemLineText").getValue(),
                    PersonnelNR : this.byId("itemPersoNr").getValue(),
                    LineType: this.byId("itemLineType").getValue(),
                    Biddersline : this.byId("itemBiddersLine").getSelected(), 
                    Supplementaryline : this.byId("itemSuppLine").getSelected(),
                    LotCostOne : this.byId("itemLCO").getSelected()
                  };
                  oItem.push(newItem);
                  var oModel = this.getView().getModel();
                  var oItemCreated = oModel.setProperty("/Items", oItem);
                  //Show Message
                  if(oItemCreated){
                      sap.m.MessageToast.show("New line has been created successfully!");
                  }
                  this._AddItemDialog.close();
                  //For re-render when i open again
                  this._AddItemDialog.destroy();
                  this._AddItemDialog = null;
                }.bind(this)
            }),
            endButton: new sap.m.Button({
                text: "Cancel",
                press: function () {
                   this._AddItemDialog.close();
                }.bind(this)
            })
            
          })
          this.getView().addDependent(this._AddItemDialog);
        }
        this._AddItemDialog.open();
      },
      onDeleteItem: function(oEvent){

        //Get Selected Item  "Context"
        var oBindingContext = oEvent.getSource();//.getBindingContext();
          if (oBindingContext) {
            var sPath = oBindingContext.getPath();
            var oModel = this.getView().getModel();
            var oItem = oModel.getProperty(sPath);

                MessageBox.confirm("Are you sure you want to delete " + oItem.Code + "?", {
                    title: "Confirm Deletion",
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            var aItems = oModel.getProperty("/Items");
                            var iIndex = aItems.indexOf(oItem);
                            if (iIndex > -1) {
                                aItems.splice(iIndex, 1);
                                oModel.setProperty("/Items", aItems);
                            }
                        }
                    }
                });
            }
      }
  });
});

// Attached to the controller instance (this refers to your controller).
// Lives as long as the controller/view lives.
// Can be accessed in other functions inside the same controller.