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
  "sap/ui/unified/FileUploader",
  "sap/ui/layout/form/SimpleForm",
  "sap/ui/layout/form/ResponsiveGridLayout"
], (Controller, FileUploader, SimpleForm, ResponsiveGridLayout) => {
  "use strict";

  return Controller.extend("execution.controller.ExecutionOrder", {
    onInit() {
      var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.getRoute("ExecutionOrder").attachPatternMatched(this._onRouteMatched, this);
      var oModel = new sap.ui.model.json.JSONModel({
        docNumber: "",
        itemNumber: "",
        MainItems: [],
        Uom: [],
        ServiceTypes: [],
        MaterialGroup: [],
        ServiceNumbers: []

      });
      this.getView().setModel(oModel);
      fetch("/odata/v4/sales-cloud/ServiceNumbers")
        .then(response => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json();
        })
        .then(data => {
          console.log("Fetched ServiceNumbers:", data.value);

          if (data && data.value) {
            const ServiceNumbers = data.value.map(item => ({
              serviceNumberCode: item.serviceNumberCode,
              description: item.description
            }));
            this.getView().getModel().setProperty("/ServiceNumbers", ServiceNumbers);

            console.log("ServiceNumbers:", ServiceNumbers);
          }
        })
        .catch(err => {
          console.error("Error fetching ServiceNumbers:", err);
        });
      fetch("/odata/v4/sales-cloud/UnitOfMeasurements")
        .then(r => r.json())
          .then(data => {
          console.log("Fetched UnitOfMeasurements:", data.value);

          if (data && data.value) {
            const UOM = data.value.map(item => ({
              code: item.code,
              description: item.description
            }));
            this.getView().getModel().setProperty("/Uom", UOM);

            console.log("UnitOfMeasurements:", UOM);
          }
        });
      fetch("/odata/v4/sales-cloud/ServiceTypes")
        .then(response => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json();
        })
        .then(data => {
          console.log("Fetched ServiceTypes:", data.value);

          if (data && data.value) {
            const ServiceTypes = data.value.map(item => ({
              serviceTypeCode: item.serviceTypeCode,
              description: item.description
            }));
            this.getView().getModel().setProperty("/ServiceTypes", ServiceTypes);

            console.log("ServiceTypes:", ServiceTypes);
          }
        })
        .catch(err => {
          console.error("Error fetching ServiceTypes:", err);
        });
      fetch("/odata/v4/sales-cloud/MaterialGroups")
        .then(response => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json();
        })
        .then(data => {
          console.log("Fetched MaterialGroups:", data.value);

          if (data && data.value) {
            const MaterialGroups = data.value.map(item => ({
              materialGroupCode: item.materialGroupCode,
              description: item.description
            }));
            this.getView().getModel().setProperty("/MaterialGroup", MaterialGroups);

            console.log("MaterialGroups:", MaterialGroups);
          }
        })
        .catch(err => {
          console.error("Error fetching MaterialGroups:", err);
        });

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
      //var sUrl = `/odata/v4/sales-cloud/getExecutionOrderMainByReferenceId(SalesOrder='${docNumber}',SalesOrderItem='${itemNumber}')`;
      var sUrl = `/odata/v4/sales-cloud/getExecutionOrderMainByReferenceId?referenceId='${docNumber}'&salesOrderItem='${itemNumber}'`;

      // Fetch the data
      fetch(sUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        // body: JSON.stringify({
        //   referenceId: docNumber,
        //   salesOrderItem: itemNumber
        // })
      })
        .then(response => response.json())
        .then(data => {
          console.log(data.value);
          oModel.setProperty("/MainItems", data.value);

          // if it's an array, do:
          // oModel.setProperty("/MainItems", data.value);
          oView.byId("executionTable").setModel(oModel);
        })
        .catch(err => {
          console.error("Error fetching MainItems", err);
        });

    },
    onSearchItem: function (oEvent) {
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
      else {
        // Clear filter if empty search
        oBinding.filter([]);
      }

    },
    onSaveDocument: function () {

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
    onPrint: function () {
    },
    onExport: function () {

      var oModel = this.getView().getModel();
      // build column config (headers + property bindings)
      var aCols = [
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
        fileName: "Execution Order Items.xlsx"
      };

      var oSpreadsheet = new sap.ui.export.Spreadsheet(oSettings);
      oSpreadsheet.build().finally(function () {
        oSpreadsheet.destroy();
      });
    },
    onImport: function () {
      var that = this;

      if (!this._oValueHelpDialog) {
        this._oValueHelpDialog = new sap.m.Dialog({
          title: "Import From:",
          contentWidth: "400px",
          contentHeight: "150px",
          resizable: false,
          draggable: true,
          content: new sap.m.HBox({
            justifyContent: "SpaceAround",
            alignItems: "Center",
            class: "sapUiSmallMargin",
            items: [
              new sap.m.Button({
                text: "Quotations",
                type: "Emphasized",
                press: function () {
                  that._oValueHelpDialog.close();
                  that._openQuotationsDialog();
                }
              }),
              new sap.m.Button({
                text: "Models",
                type: "Emphasized",
                press: function () {
                  that._oValueHelpDialog.close();
                  that._openModelsDialog();
                }
              }),
              new sap.m.Button({
                text: "Excel",
                type: "Emphasized",
                press: function () {
                  that._oValueHelpDialog.close();
                  that._openExcelUploadDialog();
                }
              })
            ]
          }),

          beginButton: new sap.m.Button({
            text: "Cancel",
            type: "Reject",
            press: function () {
              that._oValueHelpDialog.close();
            }
          })
        });
      }

      this._oValueHelpDialog.open();
    },

    _openQuotationsDialog: function () {
      var that = this;

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

              var oExecTable = oView.byId("executionTable");
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

      // Create quotations list
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

      // Fetch quotation data
      $.ajax({
        url: "/odata/v4/sales-cloud/InvoiceMainItems",
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
          sap.m.MessageToast.show("Failed to fetch quotations data.");
        }
      });

      oDialog.open();
    },

    _openModelsDialog: function () {
      var that = this;

      var oDialog = new sap.m.Dialog({
        title: "Models List",
        contentWidth: "80%",
        contentHeight: "60%",
        resizable: true,
        draggable: true,
        buttons: [
          new sap.m.Button({
            text: "Close",
            press: function () {
              oDialog.close();
            }
          })
        ]
      });

      var oTable = new sap.m.Table({
        inset: false,
        columns: [
          new sap.m.Column({ header: new sap.m.Label({ text: "Model ID" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Model Spec" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Model Description" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Currency" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Services" }) }),
        ]
      });

      oDialog.addContent(oTable);

      $.ajax({
        url: "/odata/v4/sales-cloud/ModelSpecifications",
        method: "GET",
        success: function (data) {
          console.log("Data:", data);
          var oModel = new sap.ui.model.json.JSONModel(data);
          oTable.setModel(oModel);
          oTable.bindItems("/value", new sap.m.ColumnListItem({
            cells: [
              new sap.m.Text({ text: "{modelSpecCode}" }),
              new sap.m.Text({ text: "{modelServSpec}" }),
              new sap.m.Text({ text: "{description}" }),
              new sap.m.Text({ text: "{currencyCode}" }),
              new sap.m.Button({
                text: "Services",
                type: "Emphasized",
                press: function (oEvent) {
                  var sModelCode = oEvent.getSource().getBindingContext().getProperty("modelSpecCode");
                  that._getModelServices(sModelCode);
                }
              })
            ]
          }));
        },
        error: function () {
          sap.m.MessageToast.show("Failed to fetch models data.");
        }
      });

      oDialog.open();
    },

    _getModelServices: function (modelSpecCode) {
      var that = this;

      // Create dialog for services
      var oDialog = new sap.m.Dialog({
        title: "Services for Model: " + modelSpecCode,
        contentWidth: "70%",
        contentHeight: "50%",
        resizable: true,
        draggable: true,
        buttons: [
          new sap.m.Button({
            text: "Copy Selected",
            type: "Emphasized",
            press: function () {
              var aSelectedItems = oTable.getSelectedItems();
              if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Please select at least one service to copy.");
                return;
              }
              var oView = that.getView();
              var oMainModel = oView.getModel();
              var aMainItems = oMainModel.getProperty("/MainItems") || [];
              aSelectedItems.forEach(function (oItem) {
                var oServiceData = oItem.getBindingContext().getObject();
                aMainItems.push({
                  //invoiceMainItemCode: oServiceData.modelSpecDetailsCode,
                  //
                  serviceNumberCode: oServiceData.serviceNumberCode,
                  unitOfMeasurementCode: oServiceData.unitOfMeasurementCode,
                  currencyCode: oServiceData.currencyCode,
                  description: oServiceData.shortText,
                  materialGroupCode: oServiceData.materialGroupCode,
                  serviceTypeCode: oServiceData.serviceTypeCode,
                  personnelNumberCode: oServiceData.personnelNumberCode,
                  lineTypeCode: oServiceData.lineTypeCode,
                  totalQuantity: oServiceData.quantity,
                  amountPerUnit: oServiceData.grossPrice,
                  total: oServiceData.netValue,
                  actualQuantity: oServiceData.actualQuantity,
                  actualPercentage: oServiceData.actualPercentage,
                  overFulfillmentPercentage: oServiceData.overFulfilmentPercentage,
                  unlimitedOverFulfillment: oServiceData.unlimitedOverFulfillment,
                  manualPriceEntryAllowed: oServiceData.manualPriceEntryAllowed,
                  externalServiceNumber: oServiceData.externalServiceNumber,
                  serviceText: oServiceData.serviceText,
                  lineText: oServiceData.lineText,
                  lineNumber: oServiceData.lineNumber,
                  biddersLine: oServiceData.biddersLine,
                  supplementaryLine: oServiceData.supplementaryLine,
                  lotCostOne: oServiceData.lotSizeForCostingIsOne,
                });
              });
              oMainModel.setProperty("/MainItems", aMainItems);
              oView.byId("executionTable").getBinding("rows").refresh();
              sap.m.MessageToast.show("Selected services copied to Main Items table.");
              oDialog.close();
            }
          }),
          new sap.m.Button({
            text: "Close",
            press: function () {
              oDialog.close();
            }
          })
        ]
      });

      var oTable = new sap.m.Table({
        mode: "MultiSelect",
        inset: false,
        columns: [
          new sap.m.Column({ header: new sap.m.Label({ text: "Service ID" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Service Number" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "UOM" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Quantity" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Amount/Unit" }) }),
          new sap.m.Column({ header: new sap.m.Label({ text: "Currency" }) }),
        ]
      });

      oDialog.addContent(oTable);
      $.ajax({
        //url: `/odata/v4/sales-cloud/ModelSpecificationsDetails?$filter=modelSpecCode eq '${modelSpecCode}'`,
        url: `/odata/v4/sales-cloud/ModelSpecificationsDetails`,
        method: "GET",
        success: function (data) {
          var oModel = new sap.ui.model.json.JSONModel(data);
          oTable.setModel(oModel);
          oTable.bindItems("/value", new sap.m.ColumnListItem({
            type: "Active",
            cells: [
              new sap.m.Text({ text: "{modelSpecDetailsCode}" }),
              new sap.m.Text({ text: "{serviceText}" }),
              new sap.m.Text({ text: "{shortText}" }),
              new sap.m.Text({ text: "{unitOfMeasurementCode}" }),
              new sap.m.Text({ text: "{quantity}" }),
              new sap.m.Text({ text: "{pricePerUnitOfMeasurement}" }),
              new sap.m.Text({ text: "{currencyCode}" })
            ]
          }));
        },
        error: function () {
          sap.m.MessageToast.show("Failed to fetch services for this model.");
        }
      });

      oDialog.open();
    },
    _openExcelUploadDialog: function () {
      var that = this;
      var selectedFile;

      var oFileUploader = new sap.ui.unified.FileUploader({
        width: "100%",
        fileType: ["xls", "xlsx"],
        sameFilenameAllowed: true,
        change: function (oEvent) {
          selectedFile = oEvent.getParameter("files")[0];
        }
      });

      var oExcelDialog = new sap.m.Dialog({
        title: "Import from Excel",
        contentWidth: "400px",
        contentHeight: "200px",
        content: [oFileUploader],
        buttons: [
          new sap.m.Button({
            text: "Upload",
            type: "Emphasized",
            press: function () {
              if (!selectedFile) {
                sap.m.MessageToast.show("Please select a file first!");
                return;
              }

              var reader = new FileReader();
              reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                var workbook = XLSX.read(data, { type: "array" });
                var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                var jsonData = XLSX.utils.sheet_to_json(firstSheet);

                console.log("Excel Data:", jsonData);

                var oModel = that.getView().getModel();
                var aMainItems = oModel.getProperty("/MainItems") || [];

                jsonData.forEach(function (row) {
                  aMainItems.push({
                    executionOrderMainCode: row.executionOrderMainCode || "",
                    lineNumber: row.lineNumber || "",
                    serviceNumberCode: row.serviceNumberCode || "",
                    description: row.description || "",
                    actualQuantity: row.actualQuantity || 0,
                    unitOfMeasurementCode: row.unitOfMeasurementCode || "",
                    amountPerUnit: row.amountPerUnit || 0,
                    currencyCode: row.currencyCode || "",
                    total: row.total || 0,
                    actualPercentage: row.actualPercentage || 0,
                    overFulfillmentPercent: row.overFulfillmentPercent || 0,
                    unlimitedOverFulfillment: row.unlimitedOverFulfillment || false,
                    manualPriceEntryAllowed: row.manualPriceEntryAllowed || false,
                    materialGroupCode: row.materialGroupCode || "",
                    serviceTypeCode: row.serviceTypeCode || "",
                    externalServiceNumber: row.externalServiceNumber || "",
                    serviceText: row.serviceText || "",
                    lineText: row.lineText || "",
                    personnelNumberCode: row.personnelNumberCode || "",
                    lineTypeCode: row.lineTypeCode || "",
                    biddersLine: row.biddersLine || false,
                    supplementaryLine: row.supplementaryLine || false,
                    lotCostOne: row.lotCostOne || false
                  });
                });

                // Update model
                oModel.setProperty("/MainItems", aMainItems);
                that.getView().byId("executionTable").getModel().refresh(true);

                sap.m.MessageToast.show("Excel data imported successfully!");
                oExcelDialog.close();
              };

              reader.readAsArrayBuffer(selectedFile);
            }
          }),
          new sap.m.Button({
            text: "Cancel",
            press: function () {
              oExcelDialog.close();
            }
          })
        ]
      });

      oExcelDialog.open();
    },
    onEditItem: function (oEvent) {
      // Get the row context from the button's parent (the row)
      var oButton = oEvent.getSource();
      var oContext = oButton.getBindingContext(); // Simplified: button has the context directly
      if (!oContext) {
        sap.m.MessageToast.show("No item context found.");
        return;
      }
      var oData = oContext.getObject();
      var oModel = this.getView().getModel();
      // keep the edit path for saving later
      this._editPath = oContext.getPath();
      // copy the row data to a temp model property
      oModel.setProperty("/editRow", Object.assign({}, oData));
      console.log("Editing item:", oData); // Debug: remove after testing
      if (!this._EditItemDialog) {
        var oForm = new sap.ui.layout.form.SimpleForm({
          layout: "ResponsiveGridLayout",
          editable: true,
          labelSpanXL: 4,
          labelSpanL: 4,
          labelSpanM: 4,
          labelSpanS: 12,
          adjustLabelSpan: false,
          emptySpanXL: 1,
          emptySpanL: 1,
          emptySpanM: 1,
          emptySpanS: 0,
          columnsXL: 1,
          columnsL: 1,
          columnsM: 1,
          content: [
            new sap.m.Label({ text: "Service No" }),
            new sap.m.Input({ value: "{/editRow/serviceNumberCode}" }),

            new sap.m.Label({ text: "Description" }),
            new sap.m.Input({ value: "{/editRow/description}" }),

            new sap.m.Label({ text: "Quantity" }),
            new sap.m.Input({ value: "{/editRow/actualQuantity}", type: "Number", liveChange: this._onValueChange.bind(this) }),

            new sap.m.Label({ text: "UOM" }),
            new sap.m.Select(this.createId("editUOM"), {
              selectedKey: "{/editRow/unitOfMeasurementCode}",
              forceSelection: false,
              items: {
                path: "/Uom",
                forceSelection: false,
                template: new sap.ui.core.Item({
                  key: "{unitOfMeasurementCode}",
                  text: "{description}"
                })
              }
            }),

            new sap.m.Label({ text: "Amount Per Unit" }),
            new sap.m.Input({ value: "{/editRow/amountPerUnit}", type: "Number", liveChange: this._onValueChange.bind(this) }),

            new sap.m.Label({ text: "Over Fulfillment %" }),
            new sap.m.Input({ value: "{/editRow/overFulfillmentPercent}", type: "Number" }),

            new sap.m.Label({ text: "Unlimited Over Fulfillment" }),
            new sap.m.CheckBox({ selected: "{/editRow/unlimitedOverFulfillment}" }),

            new sap.m.Label({ text: "Manual Price Entry Allowed" }),
            new sap.m.CheckBox({ selected: "{/editRow/manualPriceEntryAllowed}" }),

            new sap.m.Label({ text: "Material Group" }),
             new sap.m.Select(this.createId("editMaterialGroup"), {
              selectedKey: "{/editRow/materialGroupCode}",
              forceSelection: false,
              items: {
                path: "/MaterialGroup",
                template: new sap.ui.core.Item({
                  key: "{materialGroupCode}",
                  text: "{description}"
                })
              }
            }),

            new sap.m.Label({ text: "Service Type" }),
            new sap.m.Select(this.createId("editServiceType"), {
              selectedKey: "{/editRow/serviceTypeCode}",
              forceSelection: false,
              items: {
                path: "/ServiceTypes",
                template: new sap.ui.core.Item({
                  key: "{serviceTypeCode}",
                  text: "{description}"
                })
              }
            }),

            new sap.m.Label({ text: "External Service Number" }),
            new sap.m.Input({ value: "{/editRow/externalServiceNumber}" }),

            new sap.m.Label({ text: "Service Text" }),
            new sap.m.Input({ value: "{/editRow/serviceText}" }),

            new sap.m.Label({ text: "Line Text" }),
            new sap.m.Input({ value: "{/editRow/lineText}" }),

            new sap.m.Label({ text: "Personnel Number" }),
            new sap.m.Input({ value: "{/editRow/personnelNumberCode}" }),

            new sap.m.Label({ text: "Line Type" }),
            new sap.m.Input({ value: "{/editRow/lineTypeCode}" }),

            new sap.m.Label({ text: "Bidders Line" }),
            new sap.m.CheckBox({ selected: "{/editRow/biddersLine}" }),

            new sap.m.Label({ text: "Supplementary Line" }),
            new sap.m.CheckBox({ selected: "{/editRow/supplementaryLine}" }),

            new sap.m.Label({ text: "Lot Cost One" }),
            new sap.m.CheckBox({ selected: "{/editRow/lotCostOne}" }),

            new sap.m.Label({ text: "Total" }),
            new sap.m.Input({ value: "{/editRow/total}", editable: false })
          ]
        });

        this._EditItemDialog = new sap.m.Dialog({
          title: "Edit Item",
          contentWidth: "700px",
          contentHeight: "auto",
          resizable: true,
          draggable: true,
          content: [oForm],
          beginButton: new sap.m.Button({
            text: "Save",
            type: "Emphasized",
            press: this.onSaveEdit.bind(this)
          }),
          endButton: new sap.m.Button({
            text: "Cancel",
            press: function () {
              this._EditItemDialog.close();
              this._EditItemDialog.destroy();
              this._EditItemDialog = null;
            }.bind(this)
          })
        });
        this.getView().addDependent(this._EditItemDialog);
      }

      this._EditItemDialog.open();
    },

    _onValueChange: function (oEvent) {
      var oModel = this.getView().getModel();
      var qty = parseFloat(oModel.getProperty("/editRow/actualQuantity")) || 0;
      var amount = parseFloat(oModel.getProperty("/editRow/amountPerUnit")) || 0;
      oModel.setProperty("/editRow/total", qty * amount);
    },

    onSaveEdit: function () {
      var oModel = this.getView().getModel();
      var oEditRow = oModel.getProperty("/editRow");
      // Ensure total is calculated
      var qty = parseFloat(oEditRow.actualQuantity) || 0;
      var amount = parseFloat(oEditRow.amountPerUnit) || 0;
      oEditRow.total = qty * amount;
      console.log("Saving UOM:", oEditRow.unitOfMeasurementCode); // Debug: should log the new selected code
      // Update the original row object in the model
      oModel.setProperty(this._editPath, oEditRow);
      console.log("Updated model UOM at path:", oModel.getProperty(this._editPath + "/unitOfMeasurementCode")); // Debug: confirm it stuck
      // Explicitly refresh the table's row binding to force UI update
      var oTable = this.byId("executionTable");
      if (oTable && oTable.getBinding("rows")) {
        oTable.getBinding("rows").refresh(true);
      }
      // Optional: Full model refresh as fallback
      oModel.refresh(true);
      sap.m.MessageToast.show("Item updated successfully!");
      this._EditItemDialog.close();
      this._EditItemDialog.destroy();
      this._EditItemDialog = null;
    },
    onDeleteItem: function (oEvent) {
      var oBindingContext = oEvent.getSource().getBindingContext();
      if (oBindingContext) {
        var sPath = oBindingContext.getPath();
        var oModel = this.getView().getModel();
        var oItem = oModel.getProperty(sPath);

        sap.m.MessageBox.confirm(
          "Are you sure you want to delete item " + (oItem.executionOrderMainCode || "") + "?",
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
      const executionOrders = MainItems.map(item => ({
        //referenceSDDocument: item.referenceSDDocument || "",
        //salesOrderItem: item.salesOrderItem || "",
        //debitMemoRequestItem: item.debitMemoRequestItem || "",
        //salesOrderItemText: item.salesOrderItemText || "",
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
        executionOrders: executionOrders,
        salesOrder: oModel.getProperty("/docNumber") || "",
        salesOrderItem: oModel.getProperty("/itemNumber") || "",
        pricingProcedureStep: 10,
        pricingProcedureCounter: 1,
        customerNumber: "120000"
        // oModel.getProperty("/customerNumber") || "120000"
      };

      console.log("Payload sent to API:", body);

      fetch("/odata/v4/sales-cloud/saveOrUpdateExecutionOrders", {
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

    onAddMianItem: function () {

      //Open Custom Dialog 
      if (!this._AddItemDialog) {
        this._AddItemDialog = new sap.m.Dialog({
          title: "Add New Item",
          content: new sap.m.VBox({
            items: [
              new sap.m.Label({ text: "Service No" }),
              new sap.m.Input(this.createId("itemServiceNo")),
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
                MainItemNo: 55,
                ServiceNo: this.byId("itemServiceNo").getValue(),
                Description: this.byId("itemDescription").getValue(),
                QTY: this.byId("itemQTY").getValue(),
                UOM: this.byId("itemUOM").getValue(),
                AmountPerUnit: this.byId("itemAmountPerUnit").getValue(),
                Total: this.byId("itemAmountPerUnit").getValue() * this.byId("itemQTY").getValue(),
                OverFulfillment: this.byId("itemOverFulf").getValue(),
                UnlimitedOverFulfillment: this.byId("itemUlimitedOFul").getSelected(),
                ManualPriceEnteryAllowd: this.byId("itemManualPrice").getSelected(),
                MaterialGrp: this.byId("itemMaterialGrp").getValue(),
                ServiceType: this.byId("itemSrvType").getValue(),
                ExternalServiceNumber: this.byId("itemExtSrvNo").getValue(),
                ServiceText: this.byId("itemSrvText").getValue(),
                LineText: this.byId("itemLineText").getValue(),
                PersonnelNR: this.byId("itemPersoNr").getValue(),
                LineType: this.byId("itemLineType").getValue(),
                Biddersline: this.byId("itemBiddersLine").getSelected(),
                Supplementaryline: this.byId("itemSuppLine").getSelected(),
                LotCostOne: this.byId("itemLCO").getSelected()
              };
              oItem.push(newItem);
              var oModel = this.getView().getModel();
              var oItemCreated = oModel.setProperty("/Items", oItem);
              //Show Message
              if (oItemCreated) {
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

  });
});
