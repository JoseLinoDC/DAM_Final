/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable no-console */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
  ],
  function (Controller, JSONModel, MessageBox, Fragment, MessageToast) {
    "use strict";

    return Controller.extend(
      "com.invertions.sapfiorimodinv.controller.catalogs.Catalogs",
      {
        onInit: function () {
          var oModel = new JSONModel();
          this._oDialog = null;
          this.getView().setModel(oModel);
          this.loadLabels();
        },

        loadLabels: async function () {
          try {
            const oModel = this.getView().getModel();
            const envRes = await fetch("env.json");
            const env = await envRes.json();
            const url = env.API_LABELSCATALOGOS_URL_BASE + "getAllLabels";

            const res = await fetch(url);
            if (!res.ok) throw new Error("Error cargando labels");

            const data = await res.json();
            // console.log(data);
            oModel.setData({ value: data.value });
          } catch (error) {
            MessageToast.show("Error al cargar labels: " + error.message);
          }
        },

        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getSource().getValue();
          var oTable = this.byId("catalogTable");
          var aItems = oTable.getItems();

          if (!sQuery) {
            aItems.forEach(function (oItem) {
              oItem.setVisible(true);
            });
            return;
          }

          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext();
            if (!oContext) return;

            var oData = oContext.getObject();
            var bVisible = Object.keys(oData).some(function (sKey) {
              var value = oData[sKey];

              if (typeof value === "string") {
                return value.toLowerCase().includes(sQuery.toLowerCase());
              } else if (typeof value === "number") {
                return value.toString().includes(sQuery);
              }

              return false;
            });

            oItem.setVisible(bVisible);
          });
        },

        onAddCatalog: function () {
          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "seguridad",
            SEQUENCE: 10,
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
              DETAIL_ROW_REG: [
                {
                  CURRENT: false,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
                {
                  CURRENT: true,
                  REGDATE: new Date().toISOString(),
                  REGTIME: new Date().toISOString(),
                  REGUSER: "FIBARRAC",
                },
              ],
            },
          });

          this.getView().setModel(oModel, "addCatalogModel");

          if (!this._oAddDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.AddCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oAddDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oAddDialog.open();
          }
        },

        onSaveCatalog: async function () {
          var oModel = this.getView().getModel("addCatalogModel");
          var oData = oModel.getData();

          if (!oData.LABELID || !oData.LABEL) {
            MessageToast.show("LABELID y LABEL son campos requeridos");
            return;
          }

          var labelPayload = {
            LABELID: oData.LABELID,
            LABEL: oData.LABEL,
            INDEX: oData.INDEX,
            COLLECTION: oData.COLLECTION,
            SECTION: oData.SECTION,
            SEQUENCE: oData.SEQUENCE,
            IMAGE: oData.IMAGE,
            DESCRIPTION: oData.DESCRIPTION,
          };

          var payload = {
            label: labelPayload,
          };

          try {
            const envRes = await fetch("env.json");
            const env = await envRes.json();
            const url = env.API_LABELSCATALOGOS_URL_BASE + "createLabel";

            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // Se puede añadir Authorization si se usa token: "Authorization": "Bearer " + env.API_TOKEN,
              },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const err = await res.text();
              throw new Error(err || "Error al guardar label");
            }

            MessageToast.show("Catálogo agregado correctamente");
            this._oAddDialog.close();

            var oTableModel = this.getView().getModel();
            var aData = oTableModel.getProperty("/value") || [];
            aData.push(oData);
            oTableModel.setProperty("/value", aData);
          } catch (error) {
            MessageToast.show("Error al guardar: " + error.message);
          }
        },

        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        onEditPressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          var oEditModel = new JSONModel($.extend(true, {}, oData));
          this.getView().setModel(oEditModel, "editModel");

          if (!this._oEditDialog) {
            Fragment.load({
              id: this.getView().getId(),
              name: "com.invertions.sapfiorimodinv.view.catalogs.fragments.EditCatalogDialog",
              controller: this,
            }).then(
              function (oDialog) {
                this._oEditDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
              }.bind(this)
            );
          } else {
            this._oEditDialog.open();
          }
        },

        onSaveEdit: async function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          var payload = {
            labelid: oEditedData.LABELID,
            label: {
              LABEL: oEditedData.LABEL,
              INDEX: oEditedData.INDEX,
              COLLECTION: oEditedData.COLLECTION,
              SEQUENCE: oEditedData.SEQUENCE,
              IMAGE: oEditedData.IMAGE,
              DESCRIPTION: oEditedData.DESCRIPTION,
              SECTION: oEditedData.SECTION,
            },
          };

          try {
            const envRes = await fetch("env.json");
            const env = await envRes.json();
            const url = env.API_LABELSCATALOGOS_URL_BASE + "updateLabel";

            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const err = await res.text();
              throw new Error(err || "Error al actualizar label");
            }

            MessageToast.show("Registro actualizado correctamente");
            this._oEditDialog.close();

            var updatedIndex = aData.findIndex(
              (item) => item.LABELID === oEditedData.LABELID
            );

            if (updatedIndex !== -1) {
              aData[updatedIndex] = {
                ...aData[updatedIndex],
                ...payload.label,
                LABELID: oEditedData.LABELID,
              };
              oTableModel.setProperty("/value", aData);
            }
          } catch (error) {
            MessageToast.show("Error al actualizar: " + error.message);
          }
        },

        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },

        onDeletePressed: function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          MessageBox.confirm("¿Está seguro de eliminar este registro?", {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: async function (sAction) {
              if (sAction === MessageBox.Action.YES) {
                try {
                  const envRes = await fetch("env.json");
                  const env = await envRes.json();
                  const url = env.API_LABELSCATALOGOS_URL_BASE + "deleteLabel";

                  const res = await fetch(url, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ labelid: oData.LABELID }),
                  });

                  if (!res.ok) {
                    const err = await res.text();
                    throw new Error(err || "Error al eliminar label");
                  }

                  MessageToast.show("Registro eliminado");

                  var oTableModel = this.getView().getModel();
                  var aData = oTableModel.getProperty("/value") || [];

                  var index = aData.findIndex(
                    (item) => item.LABELID === oData.LABELID
                  );
                  if (index !== -1) {
                    aData.splice(index, 1);
                    oTableModel.setProperty("/value", aData);
                  }
                } catch (error) {
                  MessageToast.show("Error al eliminar: " + error.message);
                }
              }
            }.bind(this),
          });
        },

        onActivatePressed: function () {
          this._changeStatus(true);
        },

        onDeactivatePressed: function () {
          this._changeStatus(false);
        },

        _changeStatus: async function (bActivate) {
          if (!this._oSelectedItem) {
            console.log("No hay ítem seleccionado");
            return;
          }

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          var sStatusMessage = bActivate ? "activado" : "desactivado";

          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          try {
            const envRes = await fetch("env.json");
            const env = await envRes.json();

            var url = bActivate
              ? env.API_LABELSCATALOGOS_URL_BASE + "ActivateLabel"
              : env.API_LABELSCATALOGOS_URL_BASE + "deactivateLabel";

            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                labelid: oData.LABELID,
              }),
            });

            if (!res.ok) {
              const err = await res.text();
              throw new Error(err || "Error en cambio de estado");
            }

            var index = aData.findIndex(
              (item) => item.LABELID === oData.LABELID
            );
            if (index !== -1) {
              aData[index].DETAIL_ROW.ACTIVED = bActivate;
              oTableModel.setProperty("/value", aData);
            }

            this.byId("activateButton").setVisible(!bActivate);
            this.byId("activateButton").setEnabled(!bActivate);
            this.byId("deactivateButton").setVisible(bActivate);
            this.byId("deactivateButton").setEnabled(bActivate);

            MessageToast.show(
              "Registro " + oData.LABELID + ": " + sStatusMessage
            );
          } catch (error) {
            MessageToast.show("Error: " + error.message);
          }
        },

        loadValuesByLabelId: async function (labelId) {
          try {
            const envRes = await fetch("env.json");
            const env = await envRes.json();

            const url = `${env.API_VALUES_URL_BASE}getLabelById?labelid=${encodeURIComponent(labelId)}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error("Error cargando valores para LABELID " + labelId);

            const data = await res.json();

            const oValuesModel = new JSONModel({
              values: data.value || [],
              selectedValueIn: false
            });

            this.getView().byId("XMLViewValues").setModel(oValuesModel, "values");

          } catch (error) {
            MessageToast.show("Error al cargar valores: " + error.message);
          }
        },

        onSelectionChange: function (oEvent) {
          var oTable = oEvent.getSource();
          var oSelectedItem = oTable.getSelectedItem();

          this._oSelectedItem = oSelectedItem;

          var oContext = oSelectedItem ? oSelectedItem.getBindingContext() : null;
          var oData = oContext ? oContext.getObject() : null;

          var oEditButton = this.byId("editButton");
          var oActivateButton = this.byId("activateButton");
          var oDeactivateButton = this.byId("deactivateButton");
          var oDeleteButton = this.byId("deleteButton");

          if (oData) {
            oEditButton.setEnabled(true);
            oDeleteButton.setEnabled(true);

            var bActive = oData.DETAIL_ROW && oData.DETAIL_ROW.ACTIVED;

            oActivateButton.setVisible(!bActive);
            oActivateButton.setEnabled(!bActive);

            oDeactivateButton.setVisible(bActive);
            oDeactivateButton.setEnabled(bActive);

            // 🚨 Cargar los valores correspondientes a este LABELID
            this.loadValuesByLabelId(oData.LABELID);

            // 🔥 Opcional: Abrir el panel derecho (si está colapsado)
            this.getView().byId("mainSplitter").getContentAreas()[1].setLayoutData(
              new sap.ui.layout.SplitterLayoutData({ size: "40%" })
            );

          } else {
            oEditButton.setEnabled(false);
            oActivateButton.setEnabled(false);
            oActivateButton.setVisible(true);
            oDeactivateButton.setEnabled(false);
            oDeactivateButton.setVisible(false);
            oDeleteButton.setEnabled(false);
          }
        },

        onItemSelect: function (oEvent) {
          var oSelectedItem = oEvent.getParameter("listItem");
          var oContext = oSelectedItem.getBindingContext("values");
          var oSelectedData = oContext.getObject();

          var oValuesModel = oContext.getModel();
          oValuesModel.setProperty("/selectedValueIn", true);
          oValuesModel.setProperty("/selectedValue", oSelectedData);
        },

        onCloseDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("0px");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("100%");
          }
        },

        onCenterDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("50%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("50%");
          }
        },

        onExpandDetailPanel: function () {
          var oSplitter = this.byId("mainSplitter");
          var oDetailPanel = this.byId("detailPanel");
          var oLayoutData = oDetailPanel.getLayoutData();
          if (oLayoutData) {
            oLayoutData.setSize("100%");
          }
          var oLeftPanel = oSplitter.getContentAreas()[0];
          var oLeftLayoutData = oLeftPanel.getLayoutData();
          if (oLeftLayoutData) {
            oLeftLayoutData.setSize("0px");
          }
        },

      }
    );
  }
);
