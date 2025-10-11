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
  "sap/ui/model/FilterOperator",
  "sap/ui/unified/FileUploader"
], (Controller, MessageToast) => {
  "use strict";

  return Controller.extend("invoice.controller.invoice", {
    onInit() {

      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.getRoute("invoice").attachPatternMatched(this._onRouteMatched, this);

      //Set Dummy Data
      var oModel = new sap.ui.model.json.JSONModel({
        docNumber: "",
        itemNumber: "",
        MainItems: [],

      });
      this.getView().setModel(oModel);

    },

    _onRouteMatched: function (oEvent) {
      var oView = this.getView();
      var oModel = oView.getModel();

      var args = oEvent.getParameter("arguments");
      var docNumber = args.docNumber;
      var itemNumber = args.itemNumber;

      console.log("Params:", docNumber, itemNumber);
      oModel.setProperty("/docNumber", docNumber);
      oModel.setProperty("/itemNumber", itemNumber);

      // OData request URL
      var sUrl = `/odata/v4/sales-cloud/findByDebitMemoRequestAndItem?debitMemoRequest='${docNumber}'&debitMemoRequestItem='${itemNumber}'`;

      // Fetch the data
      fetch(sUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      })
        .then(response => response.json())
        .then(data => {
          console.log(data.value);
          oModel.setProperty("/MainItems", data.value);

          oView.byId("debitmemoTable").setModel(oModel);
        })
        .catch(err => {
          console.error("Error fetching MainItems", err);
        });

    },

    onExport: function () {

      var oModel = this.getView().getModel();
      // build column config (headers + property bindings)
      var aCols = [
        { label: "serviceInvoiceCode.", property: "serviceInvoiceCode" },
        { label: "executionOrderMainCode.", property: "executionOrderMainCode" },
        { label: "lineNumber", property: "lineNumber" },
        { label: "serviceNumberCode", property: "serviceNumberCode" },
        { label: "description", property: "description" },
        { label: "actualQuantity", property: "actualQuantity" },
        { label: "unitOfMeasurementCode", property: "unitOfMeasurementCode" },
        { label: "amountPerUnit", property: "amountPerUnit" },
        { label: "currencyCode", property: "currencyCode" },
        { label: "total", property: "total" },
        { label: "actualQuantity", property: "actualQuantity" },
        { label: "actualPercentage", property: "actualPercentage" },
        { label: "overFulfillmentPercent", property: "overFulfillmentPercent" },
        { label: "unlimitedOverFulfillment", property: "unlimitedOverFulfillment" },
        { label: "manualPriceEntryAllowed", property: "manualPriceEntryAllowed" },
        { label: "materialGroupCode", property: "materialGroupCode" },
        { label: "serviceTypeCode", property: "serviceTypeCode" },
        { label: "externalServiceNumber", property: "externalServiceNumber" },
        { label: "serviceText", property: "serviceText" },
        { label: "lineText", property: "lineText" },
        { label: "personnelNumberCode", property: "personnelNumberCode" },
        { label: "lineTypeCode", property: "lineTypeCode" },
        { label: "biddersLine", property: "biddersLine" },
        { label: "supplementaryLine", property: "supplementaryLine" },
        { label: "lotCostOne", property: "lotCostOne" }
      ];
      var oSettings = {
        workbook: { columns: aCols },
        dataSource: oModel.getProperty("/MainItems"),
        fileName: "Debit Memo Items.xlsx"
      };

      var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
      oSpreadsheet.build().finally(function () {
        oSpreadsheet.destroy();
      });
    },

    openOrdersDialog: function () {
      var that = this;
       var oView = this.getView();
      var oModel = oView.getModel();
      var docNumber = oModel.getProperty("/docNumber");
      var itemNumber = oModel.getProperty("/itemNumber");

      var oDialog = new sap.m.Dialog({
        title: "Select Rows to Copy",
        contentWidth: "90%",
        contentHeight: "70%",
        resizable: true,
        draggable: true,
        buttons: [
          new sap.m.Button({
            text: "Copy Selected",
            type: "Emphasized",
            press: function () {
              var aSelectedItems = oTable.getSelectedItems();
              if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Please select at least one row.");
                return;
              }

              var oView = that.getView();
              var oMainModel = oView.getModel();

              var aMainItems = oMainModel.getProperty("/MainItems") || [];

              aSelectedItems.forEach(function (oItem) {
                var oData = oItem.getBindingContext().getObject();

                // Map fields properly to match your table’s bindings
                aMainItems.push({
                  executionOrderMainCode: oData.invoiceMainItemCode,
                  lineNumber: "", // if you want to auto-generate, use aMainItems.length + 1
                  serviceNumberCode: oData.serviceNumberCode,
                  description: oData.description,
                  actualQuantity: oData.quantity,
                  unitOfMeasurementCode: oData.unitOfMeasurementCode,
                  amountPerUnit: oData.amountPerUnit,
                  currencyCode: oData.currencyCode,
                  total: oData.quantity * oData.amountPerUnit
                });
              });

              oMainModel.setProperty("/MainItems", aMainItems);

              var oExecTable = oView.byId("debitmemoTable");
              if (oExecTable && oExecTable.getBinding("rows")) {
                oExecTable.getBinding("rows").refresh();
              }

              console.log(" MainItems after copy:", oMainModel.getProperty("/MainItems"));
              sap.m.MessageToast.show("Selected rows copied to Main Items table!");
              oDialog.close();
            }
          }),
          new sap.m.Button({
            text: "Cancel",
            type: "Reject",
            press: function () {
              oDialog.close();
            }
          })
        ]
      });

      // Create orders list
      var oTable = new sap.m.Table({
        mode: "MultiSelect",
        inset: false,
        columns: [
          new sap.m.Column({ header: new sap.m.Label({ text: "MainItem.NO" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Service Number" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "UOM" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Quantity" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "AmountPerUnit" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Currency" }) })
        ]
      });

      oDialog.addContent(oTable);

      // Fetch orders data
      $.ajax({
        url: `/odata/v4/sales-cloud/fetchExecutionOrderMainByDebitMemoFunction?debitMemoRequest='${docNumber}'&debitMemoRequestItem='${itemNumber}'`,
        method: "GET",
        success: function (data) {
          var oModel = new sap.ui.model.json.JSONModel(data.value || data);
          oTable.setModel(oModel);
          oTable.bindItems("/", new sap.m.ColumnListItem({
            cells: [
              new sap.m.Text({ text: "{invoiceMainItemCode}" }),
              new sap.m.Text({ text: "{serviceNumberCode}" }),
              new sap.m.Text({ text: "{description}" }),
              new sap.m.Text({ text: "{unitOfMeasurementCode}" }),
              new sap.m.Text({ text: "{quantity}" }),
              new sap.m.Text({ text: "{amountPerUnit}" }),
              new sap.m.Text({ text: "{currencyCode}" })
            ]
          }));
        },
        error: function () {
          sap.m.MessageToast.show("Failed to fetch orders data.");
        }
      });

      oDialog.open();
    },

    onDeleteItem: function (oEvent) {
      var oBindingContext = oEvent.getSource().getBindingContext();
      if (oBindingContext) {
        var sPath = oBindingContext.getPath();
        var oModel = this.getView().getModel();
        var oItem = oModel.getProperty(sPath);

        sap.m.MessageBox.confirm(
          "Are you sure you want to delete item " + (oItem.serviceInvoiceCode || "") + "?",
          {
            title: "Confirm Deletion",
            onClose: function (oAction) {
              if (oAction === sap.m.MessageBox.Action.OK) {
                var aItems = oModel.getProperty("/MainItems");
                var iIndex = parseInt(sPath.split("/")[2]);
                if (iIndex > -1) {
                  aItems.splice(iIndex, 1);
                  oModel.setProperty("/MainItems", aItems);
                  oModel.refresh(true);
                  sap.m.MessageToast.show("Item deleted successfully!");
                }
              }
            }
          }
        );
      }
    },
    onSaveDocument: function () {
      const oModel = this.getView().getModel(); // default model
      const MainItems = oModel.getProperty("/MainItems") || [];

      // Map MainItems to match API payload structure
      const serviceInvoiceCommands = MainItems.map(item => ({
        //referenceSDDocument: item.referenceSDDocument || "",
        //salesOrderItem: item.salesOrderItem || "",
        //debitMemoRequestItem: item.debitMemoRequestItem || "",
        //salesOrderItemText: item.salesOrderItemText || "",
        executionOrderMainCode: item.executionOrderMainCode || 0,
        referenceId: oModel.getProperty("/docNumber") || "",
        serviceNumberCode: parseInt(item.serviceNumberCode) || 0,
        description: item.description || "",
        unitOfMeasurementCode: item.unitOfMeasurementCode || "",
        currencyCode: item.currencyCode || "",
        materialGroupCode: item.materialGroupCode || "",
        personnelNumberCode: item.personnelNumberCode || "",
        lineTypeCode: item.lineTypeCode || "",
        serviceTypeCode: item.serviceTypeCode || "",
        totalQuantity: item.totalQuantity || 0,
        remainingQuantity: item.remainingQuantity || 0,
        amountPerUnit: item.amountPerUnit || 0,
        total: item.total || 0,
        totalHeader: item.totalHeader || 0,
        actualQuantity: item.actualQuantity || 0,
        previousQuantity: item.previousQuantity || 0,
        actualPercentage: item.actualPercentage || 0,
        overFulfillmentPercent: item.overFulfillmentPercent || 0,
        unlimitedOverFulfillment: item.unlimitedOverFulfillment !== undefined ? item.unlimitedOverFulfillment : true,
        manualPriceEntryAllowed: item.manualPriceEntryAllowed !== undefined ? item.manualPriceEntryAllowed : true,
        externalServiceNumber: item.externalServiceNumber || "",
        serviceText: item.serviceText || "",
        lineText: item.lineText || "",
        lineNumber: item.lineNumber || "",
        biddersLine: item.biddersLine !== undefined ? item.biddersLine : true,
        supplementaryLine: item.supplementaryLine !== undefined ? item.supplementaryLine : true,
        lotCostOne: item.lotCostOne !== undefined ? item.lotCostOne : true,
        doNotPrint: item.doNotPrint !== undefined ? item.doNotPrint : true,
        deletionIndicator: item.deletionIndicator !== undefined ? item.deletionIndicator : true
      }));
      const body = {
        serviceInvoiceCommands: serviceInvoiceCommands,
        debitMemoRequest: oModel.getProperty("/docNumber") || "",
        debitMemoRequestItem: oModel.getProperty("/itemNumber") || "",
        pricingProcedureStep: 10,
        pricingProcedureCounter: 1,
        customerNumber: "120000"
        // oModel.getProperty("/customerNumber") || "120000"
      };

      console.log("Payload sent to API:", body);

      fetch("/odata/v4/sales-cloud/saveOrUpdateServiceInvoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to save: " + response.statusText);
          }
          return response.json();
        })
        .then(savedItem => {
          console.log(savedItem);
          oModel.setProperty("/MainItems", savedItem.value);
          sap.m.MessageToast.show("Document saved successfully!");

        })
        .catch(err => {
          console.error("Error saving document:", err);
          sap.m.MessageBox.error("Error: " + err.message);
        });
    },

    onPrint: function () {

    },
    onImport: function () {
      //Open Dialog built automatically
      if (!this._oValueHelpDialog) {
        this._oValueHelpDialog = new sap.m.Dialog({
          title: "Import From:",
          content: [
            new sap.m.HBox({
              justifyContent: "SpaceAround",
              class: "sapUiSmallMargin",
              items: [
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
    onAddIem: function () {
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
      if (total) {
        //Set Value
        this.byId("_IDGenText1").setText(total);
      }
    },
  });
});