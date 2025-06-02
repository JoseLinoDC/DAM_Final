sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "jquery"
], function (
    BaseController,
    JSONModel,
    Device,
    MessageBox,
    MessageToast,
    Filter,
    Fragment,
    FilterOperator,
    $
) {
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.catalogs.Values", {

        onInit: async function () {
            var oView = this.getView();
            oView.setModel(new JSONModel({
                values: [], selectedValue: null, selectedValueIn: false
            }), "values");
            oView.setModel(new JSONModel({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: "",
                LABELID: "",
                DETAIL_ROW: { ACTIVED: true },
                mode: "CREATE"
            }), "newValueModel");
            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            oView.setModel(oDeviceModel, "device");

            const envRes = await fetch("env.json");
            this.env = await envRes.json();

            this.loadValues();
        },

        // Método para cargar las etiquetas desde la API
        _loadLabels: function () {
            var oView = this.getView();
            var oValuesModel = oView.getModel("values");
            oView.setBusy(true);
            $.ajax({
                url: this.env.API_LABELSCATALOGOS_URL_BASE + "getAllLabels",
                method: "GET",
                success: function (data) {
                    var aRaw = data.value || data.data || data || [];
                    var aClean = aRaw.map(function (o) { return { LABELID: o.LABELID || o.labelid || o.LabelID }; });
                    oValuesModel.setProperty("/AllLabels", aClean); // Cambiado aquí
                },
                error: function () {
                    MessageToast.show("Error al cargar labels desde API_LABELSCATALOGOS_URL_BASE");
                },
                complete: function () {
                    oView.setBusy(false);
                }
            });
        },

        // Método para abrir el diálogo de valores
        openValueDialog: function (ruta) {
            var oView = this.getView();
            this._loadLabels();
            var selectedLabelId = oView.getModel("newValueModel").getProperty("/SELECTED_LABELID");
            if (selectedLabelId) {
                this.loadValuesByLabelId(selectedLabelId);
            } else {
                oView.getModel("values").setProperty("/FilteredValues", []);
            }
            if (!this._oDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.invertions.sapfiorimodinv.view.catalogs.fragments." + ruta,
                    controller: this
                }).then(function (dlg) {
                    this._oDialog = dlg;
                    oView.addDependent(dlg);
                    dlg.open();
                }.bind(this));
            } else {
                this._oDialog.open();
            }
        },

        // Método para abrir el diálogo de añadir valores
        onAddValues: function () {
            var oView = this.getView();
            var oLabelsModel = oView.getModel("labels");
            var selectedLabelId = oLabelsModel ? oLabelsModel.getProperty("/selectedLabelId") : "";

            // Inicializa el modelo con el LABELID seleccionado
            oView.getModel("newValueModel").setData({
                VALUEID: "",
                VALUE: "",
                VALUEPAID: "",
                ALIAS: "",
                IMAGE: "",
                DESCRIPTION: "",
                LABELID: selectedLabelId || "",
                DETAIL_ROW: { ACTIVED: true },
                mode: "CREATE"
            });
            oView.getModel("values").setProperty("/selectedValueIn", false);
            this.openValueDialog("AddValueDialog");
        },

        // Método para abrir el diálogo de edición de valores
        onEditValue: function () {
            const oSel = this.getView().getModel("values").getProperty("/selectedValue") || {};

            let selectedLabelId = "";
            let selectedValueId = "";
            if (oSel.VALUEPAID && oSel.VALUEPAID.includes("-")) {
                const parts = oSel.VALUEPAID.split("-");
                selectedLabelId = parts[0];
                selectedValueId = parts[1];
            }
            this.getView().getModel("newValueModel").setData({
                ...oSel,
                SELECTED_LABELID: selectedLabelId,
                SELECTED_VALUEID: selectedValueId,
                DETAIL_ROW: { ACTIVED: oSel.DETAIL_ROW?.ACTIVED ?? true },
                mode: "EDIT"
            });
            this.openValueDialog("EditValueDialog");
        },

        // Método para abrir el diálogo de selección de valores
        onItemSelect: function (oEvent) {
            var oData = oEvent.getParameter("listItem").getBindingContext("values").getObject();
            var oVals = this.getView().getModel("values");
            oVals.setProperty("/selectedValue", oData);
            oVals.setProperty("/selectedValueIn", true);
        },

        // Método cargar los values desde la API
        loadValues: function () {
            var oView = this.getView(), oModel = oView.getModel("values");
            oView.setBusy(true);
            $.ajax({
                url: this.env.API_VALUES_URL_BASE + "getAllValues",
                method: "GET",
                success: function (res) {
                    var aItems = res.value || res;
                    oModel.setProperty("/values", aItems);
                },
                error: function () {
                    MessageToast.show("Error al obtener valores");
                },
                complete: function () {
                    oView.setBusy(false);
                }
            });
        },

        // Método para cargar los valores filtrados por LABELID
        loadValuesByLabelId: function (labelid) {
            var oView = this.getView();
            var oValuesModel = oView.getModel("values");

            if (!labelid) {
                oValuesModel.setProperty("/FilteredValues", []);
                return;
            }

            oView.setBusy(true);

            $.ajax({
                url: this.env.API_VALUES_URL_BASE + "getLabelById?labelid=" + encodeURIComponent(labelid),
                method: "GET",
                success: function (res) {
                    var aItems = res.value || res || [];
                    oValuesModel.setProperty("/FilteredValues", aItems);
                },
                error: function () {
                    MessageToast.show("Error al obtener valores filtrados por LABELID");
                    oValuesModel.setProperty("/FilteredValues", []);
                },
                complete: function () {
                    oView.setBusy(false);
                }
            });
        },

        // Métodos para manejar los cambios en los ComboBox de LABELID y VALUEID
        onLabelIdChange: function (oEvent) {
            var selectedLabelId = oEvent.getParameter("selectedItem").getKey();
            var oModel = this.getView().getModel("newValueModel");
            oModel.setProperty("/SELECTED_LABELID", selectedLabelId);
            oModel.setProperty("/SELECTED_VALUEID", "");
            this.loadValuesByLabelId(selectedLabelId);
        },

        // Método para manejar el cambio en el ComboBox de VALUEID
        onValueIdComboBoxChange: function (oEvent) {
            var oModel = this.getView().getModel("newValueModel");
            var selectedValueId = oEvent.getParameter("selectedItem").getKey();
            oModel.setProperty("/SELECTED_VALUEID", selectedValueId);

        },

        // Método para guardar los valores
        onSaveValues: function () {
            var oView = this.getView(), oForm = oView.getModel("newValueModel").getData();

            // Validación de campos obligatorios
            var labelAux = oForm.SELECTED_LABELID;
            var valueAux = oForm.SELECTED_VALUEID;
            if (labelAux && valueAux) {
                oForm.VALUEPAID = labelAux + "-" + valueAux;
            } else {
                oForm.VALUEPAID = "";
            }

            if (!oForm.VALUEID || !oForm.VALUE || !oForm.LABELID) {
                MessageToast.show("VALUEID, VALUE y LABELID son obligatorios");
                return;
            }

            var bSwitchState = oView.byId("addValueDialog")?.getContent()[0]?.getContent()
                .find(ctrl => ctrl.isA && ctrl.isA("sap.m.Switch"));
            if (bSwitchState) {
                oForm.DETAIL_ROW = oForm.DETAIL_ROW || {};
                oForm.DETAIL_ROW.ACTIVED = bSwitchState.getState();
            }

            // Validación de campos adicionales
            oView.setBusy(true);
            var allowedFields = [
                "VALUEID",
                "VALUE",
                "VALUEPAID",
                "ALIAS",
                "IMAGE",
                "DESCRIPTION",
                "LABELID",
                "DETAIL_ROW"
            ];
            // Filtrar los campos permitidos
            var oPayload = {};
            allowedFields.forEach(function (field) {
                if (oForm[field] !== undefined) {
                    oPayload[field] = oForm[field];
                }
            });

            // Preparar la URL y el método según el modo (CREATE o EDIT)
            var url, method, body;
            if (oForm.mode === "CREATE") {
                url = this.env.API_VALUES_URL_BASE + "view";
                method = "POST";
                body = JSON.stringify({ value: oPayload });
            } else {
                url = this.env.API_VALUES_URL_BASE + "updateValue";
                method = "POST";
                body = JSON.stringify({ valueid: oForm.VALUEID, value: oPayload });
            }

            // Realizar la llamada AJAX para guardar el valor
            $.ajax({
                url: url,
                method: method,
                contentType: "application/json",
                data: body,
                success: function () {
                    MessageToast.show("Valor " + (oForm.mode === "CREATE" ? "creado" : "actualizado") + " correctamente");
                    oView.getModel("values").setProperty("/selectedValue", null);
                    oView.getModel("values").setProperty("/selectedValueIn", false);
                    this.loadValuesByLabelId(oForm.LABELID);
                    this.onCancelDialog();
                }.bind(this),
                error: function () {
                    MessageToast.show("Error al " + (oForm.mode === "CREATE" ? "crear" : "actualizar") + " valor");
                },
                complete: function () {
                    oView.setBusy(false);
                }
            });
        },

        // Método para manejar el cambio en el filtro de búsqueda
        onFilterChange: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue").toLowerCase();
            var oTable = this.byId("valuesTable");
            var aItems = oTable.getItems();

            aItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("values");
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

        // Métodos para activar y desactivar valores
        onActivateValue: function () { this._toggleActive(true); },
        onDeactivateValue: function () { this._toggleActive(false); },

        // Método para activar o desactivar un valor
        _toggleActive: function (bActivate) {
            var oSel = this.getView().getModel("values").getProperty("/selectedValue");
            if (!oSel) {
                MessageToast.show("Selecciona un valor primero");
                return;
            }
            // Verifica si el valor ya está en el estado deseado
            var payload = { valueid: oSel.VALUEID, reguser: oSel.VALUEID };
            var sUrl = this.env.API_VALUES_URL_BASE + (bActivate ? "activateValue" : "deactivateValue");

            // Si el valor ya está en el estado deseado, no hacemos nada
            this.getView().setBusy(true);
            $.ajax({
                url: sUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function () {
                    MessageToast.show(bActivate ? "Valor activado correctamente" : "Valor desactivado correctamente");
                    this.loadValues();
                }.bind(this),
                error: function () {
                    MessageToast.show(bActivate ? "Error al activar valor" : "Error al desactivar valor");
                },
                complete: function () {
                    this.getView().setBusy(false);
                }.bind(this)
            });
        },

        // Método para eliminar un valor permanentemente
        onDeleteValue: function () {
            var oSel = this.getView().getModel("values").getProperty("/selectedValue");
            if (!oSel) {
                MessageToast.show("Selecciona un valor primero");
                return;
            }
            var payload = { valueid: oSel.VALUEID };
            MessageBox.confirm("¿Eliminar valor permanentemente?", {
                title: "Confirmar eliminación",
                onClose: function (action) {
                    if (action === MessageBox.Action.OK) {
                        this.getView().setBusy(true);
                        $.ajax({
                            url: this.env.API_VALUES_URL_BASE + "deleteview",
                            method: "POST",
                            contentType: "application/json",
                            data: JSON.stringify(payload),
                            success: function () {
                                MessageToast.show("Valor eliminado permanentemente");
                                this.loadValues();
                            }.bind(this),
                            error: function () {
                                MessageToast.show("Error al eliminar valor");
                            },
                            complete: function () {
                                this.getView().setBusy(false);
                            }.bind(this)
                        });
                    }
                }.bind(this)
            });
        },

        // Métodos para manejar el diálogo de valores
        onCancelDialog: function () {
            if (this._oDialog) {
                this._oDialog.close();
            }
            this.getView().getModel("newValueModel").setData({
                VALUEID: "", VALUE: "", VALUEPAID: "", ALIAS: "", IMAGE: "", DESCRIPTION: "", LABELID: "", mode: "CREATE"
            });
        },

        // Método para cancelar la acción de añadir o editar valores
        onCancelValues: function () {
            const oDialog = this.byId("addValueDialog");
            if (oDialog) {
                oDialog.close();
            }
        },

        // Método para cancelar la acción de editar valores
        onEditCancelValue: function () {
            const oDialog = this.byId("editDialogValue");
            if (oDialog) {
                oDialog.close();
            }
        },

        // Método para manejar el cambio del switch de activación
        onSwitchChange: function (oEvent) {
            var bState = oEvent.getParameter("state");
            this.getView().getModel("newValueModel").setProperty("/DETAIL_ROW/ACTIVED", bState);
        }

    });
});
