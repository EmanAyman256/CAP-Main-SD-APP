sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/m/Dialog",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/Button"
], function (Controller, JSONModel, MessageToast, MessageBox, Dialog, Label, Input, Button) {
  "use strict";

  return Controller.extend("project1.controller.Example", {
    onInit: function () {
      this.oModel = new JSONModel();
      this.getView().setModel(this.oModel);
      this.loadServiceNumbers();
    },

    // Load all data
    loadServiceNumbers: function () {
      fetch("/odata/v4/sales-cloud/ServiceNumbers")
        .then(res => res.json())
        .then(data => {
          this.oModel.setData({ ServiceNumbers: data.value });
        })
        .catch(err => console.error("Error fetching:", err));
    },

    // ADD
    onAdd: function () {
      const newEntry = {
        serviceNumberCode: "SN" + Date.now(),
        description: "New Service Number",
        createdBy: "UI5"
      };

      fetch("/odata/v4/sales-cloud/ServiceNumbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry)
      })
      .then(() => {
        MessageToast.show("Service Number Added");
        this.loadServiceNumbers();
      });
    },

    // UPDATE
    onUpdate: function () {
      const oTable = this.byId("serviceNumbersTable");
      const oSelected = oTable.getSelectedItem();
      if (!oSelected) {
        MessageBox.warning("Select a row to update");
        return;
      }

      const data = oSelected.getBindingContext().getObject();

      // Create popup dialog
      const oDialog = new Dialog({
        title: "Update Service Number",
        content: [
          new Label({ text: "Code" }),
          new Input({ value: data.serviceNumberCode, editable: false }),
          new Label({ text: "Description" }),
          new Input("descInput", { value: data.description }),
          new Label({ text: "Created By" }),
          new Input("createdByInput", { value: data.createdBy })
        ],
        beginButton: new Button({
          text: "Save",
          press: () => {
            const updatedEntry = {
              serviceNumberCode: data.serviceNumberCode,
              description: sap.ui.getCore().byId("descInput").getValue(),
              createdBy: sap.ui.getCore().byId("createdByInput").getValue()
            };

            fetch(`/odata/v4/sales-cloud/ServiceNumbers('${data.serviceNumberCode}')`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedEntry)
            })
            .then(() => {
              MessageToast.show("Service Number Updated");
              this.loadServiceNumbers();
            });

            oDialog.close();
          }
        }),
        endButton: new Button({
          text: "Cancel",
          press: () => oDialog.close()
        }),
        afterClose: () => oDialog.destroy()
      });

      oDialog.open();
    },

    // DELETE
    onDelete: function () {
      const oTable = this.byId("serviceNumbersTable");
      const oSelected = oTable.getSelectedItem();
      if (!oSelected) {
        MessageBox.warning("Select a row to delete");
        return;
      }

      const data = oSelected.getBindingContext().getObject();

      MessageBox.confirm(`Delete Service Number '${data.serviceNumberCode}'?`, {
        onClose: (sAction) => {
          if (sAction === "OK") {
            fetch(`/odata/v4/sales-cloud/ServiceNumbers('${data.serviceNumberCode}')`, {
              method: "DELETE"
            })
            .then(() => {
              MessageToast.show("Service Number Deleted");
              this.loadServiceNumbers();
            });
          }
        }
      });
    }
  });
});
