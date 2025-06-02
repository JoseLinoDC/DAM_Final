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

        // Método para cargar los labels desde el servicio
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

        // Método para manejar el evento de búsqueda en la tabla
        onFilterChange: function (oEvent) {
          var sQuery = oEvent.getParameter("newValue").toLowerCase();
          var oTable = this.byId("catalogTable");
          var aItems = oTable.getItems();

          aItems.forEach(function (oItem) {
            var oContext = oItem.getBindingContext();
            if (!oContext) return;
            var oData = oContext.getObject();

            // Filtro especial para "ina" o "act"
            if (sQuery === "inactivo") {
              oItem.setVisible(oData.DETAIL_ROW && oData.DETAIL_ROW.ACTIVED === false);
              return;
            }
            if (sQuery === "activo") {
              oItem.setVisible(oData.DETAIL_ROW && oData.DETAIL_ROW.ACTIVED === true);
              return;
            }

            // Búsqueda en todos los campos (incluyendo subcampos)
            var bVisible = Object.keys(oData).some(function (sKey) {
              var value = oData[sKey];
              if (typeof value === "string") {
                return value.toLowerCase().includes(sQuery);
              } else if (typeof value === "number") {
                return value.toString().includes(sQuery);
              } else if (typeof value === "object" && value !== null) {
                return Object.values(value).some(function (subval) {
                  return String(subval).toLowerCase().includes(sQuery);
                });
              }
              return false;
            });
            oItem.setVisible(bVisible);
          });
        },

        // Método para abrir el diálogo de adición de un nuevo catálogo
        onAddCatalog: function () {
          var oModel = new JSONModel({
            COMPANYID: "0",
            CEDIID: "0",
            LABELID: "",
            LABEL: "",
            INDEX: "",
            COLLECTION: "",
            SECTION: "",
            SEQUENCE: 0,
            IMAGE: "",
            DESCRIPTION: "",
            DETAIL_ROW: {
              ACTIVED: true,
              DELETED: false,
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

        // Método para guardar un nuevo catálogo
        onSaveCatalog: async function () {
          var oModel = this.getView().getModel("addCatalogModel");
          var oData = oModel.getData();

          if (!oData.LABELID || !oData.LABEL) {
            MessageToast.show("LABELID y LABEL son campos requeridos");
            return;
          }

          // Validación de campos requeridos
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

        // Método para cancelar la adición de un nuevo catálogo
        onCancelAddCatalog: function () {
          if (this._oAddDialog) {
            this._oAddDialog.close();
          }
        },

        // Método para abrir el diálogo de edición de un registro
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

        // Método para guardar los cambios realizados en la edición de un registro
        onSaveEdit: async function () {
          var oEditModel = this.getView().getModel("editModel");
          var oEditedData = oEditModel.getData();

          var oTableModel = this.getView().getModel();
          var aData = oTableModel.getProperty("/value") || [];

          // Prepara el payload para la actualización
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
              DETAIL_ROW: {
                ACTIVED: oEditedData.DETAIL_ROW?.ACTIVED ?? true
              }
            },
          };

          // Ejecuta la petición para actualizar el label
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

            // Actualiza el modelo de la tabla con los nuevos datos
            var updatedIndex = aData.findIndex(
              (item) => item.LABELID === oEditedData.LABELID
            );

            // Si se encuentra el índice, actualiza el registro
            if (updatedIndex !== -1) {
              aData[updatedIndex] = {
                ...aData[updatedIndex],
                ...payload.label,
                LABELID: oEditedData.LABELID,
              };
              oTableModel.setProperty("/value", aData);

              // Selecciona el ítem actualizado en la tabla
              var oTable = this.byId("catalogTable");
              var oItems = oTable.getItems();
              var oItemToSelect = oItems.find(item => {
                var ctx = item.getBindingContext();
                return ctx && ctx.getObject().LABELID === oEditedData.LABELID;
              });
              if (oItemToSelect) {
                oTable.setSelectedItem(oItemToSelect);
                this.onSelectionChange({ getSource: () => oTable });
              }

            }
          } catch (error) {
            MessageToast.show("Error al actualizar: " + error.message);
          }
        },

        // Método para cancelar la edición de un registro
        onCancelEdit: function () {
          if (this._oEditDialog) {
            this._oEditDialog.close();
          }
        },

        // Método para manejar la eliminación de un registro
        onDeletePressed: async function () {
          if (!this._oSelectedItem) return;

          var oContext = this._oSelectedItem.getBindingContext();
          var oData = oContext.getObject();

          try {
            const envRes = await fetch("env.json");
            const env = await envRes.json();
            const url = env.API_VALUES_URL_BASE + "getLabelById?labelid=" + encodeURIComponent(oData.LABELID);

            // Consulta los values asociados a este LABELID
            const res = await fetch(url);
            let hasValues = false;
            if (res.ok) {
              const data = await res.json();
              hasValues = Array.isArray(data.value) && data.value.length > 0;
            }

            let sMessage = "¿Está seguro de eliminar este registro?";
            if (hasValues) {
              sMessage += "\n\n⚠️ Se eliminarán de este catálogo TODOS los valores asociados.";
            }

            MessageBox.confirm(sMessage, {
              actions: [MessageBox.Action.YES, MessageBox.Action.NO],
              onClose: async function (sAction) {
                if (sAction === MessageBox.Action.YES) {
                  await this._deleteLabelAndRefresh(oData);
                }
              }.bind(this),
            });
          } catch (error) {
            MessageToast.show("Error al verificar valores: " + error.message);
          }
        },

        // Agrega este método privado en tu controlador:
        _deleteLabelAndRefresh: async function (oData) {
          try {
            const envRes = await fetch("env.json");
            const env = await envRes.json();
            const urlDelete = env.API_LABELSCATALOGOS_URL_BASE + "deleteLabel";
            const resDelete = await fetch(urlDelete, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ labelid: oData.LABELID }),
            });

            if (!resDelete.ok) {
              const err = await resDelete.text();
              throw new Error(err || "Error al eliminar label");
            }

            MessageToast.show("Registro eliminado");

            var oValuesView = this.byId("XMLViewValues");
            if (oValuesView && oValuesView.getController && oValuesView.getController()) {
              oValuesView.getController().loadValues();
            }

            var oTableModel = this.getView().getModel();
            var aData = oTableModel.getProperty("/value") || [];
            var index = aData.findIndex((item) => item.LABELID === oData.LABELID);
            if (index !== -1) {
              aData.splice(index, 1);
              oTableModel.setProperty("/value", aData);
            }
          } catch (error) {
            MessageToast.show("Error al eliminar: " + error.message);
          }
        },

        // Método para manejar la activación de un registro
        onActivatePressed: function () {
          this._changeStatus(true);
        },

        // Método para manejar la desactivación de un registro
        onDeactivatePressed: function () {
          this._changeStatus(false);
        },

        // Método para cambiar el estado de un registro (activar/desactivar)
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

            this.onSelectionChange({ getSource: () => this.byId("catalogTable") });

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

        // Método para cargar los valores asociados a un LABELID
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

        // Método para manejar el cambio de selección en la tabla
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

            // 🚩 Guardar el LABELID seleccionado en el modelo "labels" de la vista principal
            var oLabelsModel = this.getView().getModel("labels");
            if (!oLabelsModel) {
              oLabelsModel = new sap.ui.model.json.JSONModel();
              this.getView().setModel(oLabelsModel, "labels");
            }
            oLabelsModel.setProperty("/selectedLabelId", oData.LABELID);

            // 🚩 Guardar el LABELID seleccionado en el modelo "labels" de la vista embebida de Values
            var oValuesView = this.byId("XMLViewValues");
            if (oValuesView) {
              var oLabelsModelValues = oValuesView.getModel("labels");
              if (oValuesView && oValuesView.getController && oValuesView.getController()) {
                oValuesView.getController().loadValues();
              }
              oLabelsModelValues.setProperty("/selectedLabelId", oData.LABELID);
            }

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

            // Limpia el LABELID en ambos modelos "labels"
            var oLabelsModel = this.getView().getModel("labels");
            if (oLabelsModel) {
              oLabelsModel.setProperty("/selectedLabelId", "");
            }
            var oValuesView = this.byId("XMLViewValues");
            if (oValuesView) {
              var oLabelsModelValues = oValuesView.getModel("labels");
              if (oLabelsModelValues) {
                oLabelsModelValues.setProperty("/selectedLabelId", "");
              }
            }
          }
        },

        // Método para manejar la selección de un item en la lista de valores
        onItemSelect: function (oEvent) {
          var oSelectedItem = oEvent.getParameter("listItem");
          var oContext = oSelectedItem.getBindingContext("values");
          var oSelectedData = oContext.getObject();

          var oValuesModel = oContext.getModel();
          oValuesModel.setProperty("/selectedValueIn", true);
          oValuesModel.setProperty("/selectedValue", oSelectedData);
        },

        // Método para colapsar el panel derecho al 0% y expandir el izquierdo
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

        // Método para centrar el panel derecho al 50% y el izquierdo al 50%
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

        // Método para expandir el panel derecho al 100% y colapsar el izquierdo
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
