sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment"
], function (
  BaseController,
  JSONModel,
  Log,
  MessageToast,
  MessageBox,
  Filter,
  FilterOperator,
  Fragment
) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesMaster", {

    onInit: function () {
      this._catalogsLoaded = false;
      this.initModels();

      // Crear modelo para estados UI
      const oUiStateModel = new JSONModel({
        editButtonEnabled: false,
        deleteButtonEnabled: false,
        desactivatedButtonEnabled: false  // botón deshabilitado inicialmente
      });
      this.getView().setModel(oUiStateModel, "uiState");

      this.loadRolesData();
    },


    initModels: function () {
      const view = this.getView();
      view.setModel(new JSONModel(), "selectedRole");

      view.setModel(new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      }), "newRoleModel");
    },

    loadCatalogsOnce: async function () {
      if (!this._catalogsLoaded) {
        await this.loadCatalog("IdProcess", "processCatalogModel");
        await this.loadCatalog("IdPrivileges", "privilegeCatalogModel");
        this._catalogsLoaded = true;
      }
    },

    onOpenDialog: async function () {
      await this.loadCatalogsOnce(); // ✅ para no volver a cargar

      if (!this._pDialog) {
        this._pDialog = await Fragment.load({
          name: "com.invertions.sapfiorimodinv.view.security.fragments.AddRoleDialog",
          controller: this
        });
        this.getView().addDependent(this._pDialog);
      }

      this.getView().setModel(new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        ACTIVO: true,
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      }), "newRoleModel");

      this._pDialog.setTitle("Crear Rol");
      this._pDialog.open();
    },


    onDialogClose: function () {
      if (this._pDialog) this._pDialog.close();
      if (this._pEditDialog) this._pEditDialog.close();
    },


    //agregar privilegios
    onAddPrivilege: function () {
      const oView = this.getView();

      const oModel = oView.getModel("roleDialogModel") || oView.getModel("newRoleModel");
      const oData = oModel.getData();

      const sProcess = oData.NEW_PROCESSID;
      const aPrivileges = oData.NEW_PRIVILEGES;

      if (!sProcess || !aPrivileges || aPrivileges.length === 0) {
        MessageToast.show("Selecciona un proceso y al menos un privilegio.");
        return;
      }

      // Validar que no exista ya este proceso
      const bExiste = oData.PRIVILEGES.some(p => p.PROCESSID === sProcess);
      if (bExiste) {
        MessageToast.show("Ya agregaste privilegios para este proceso.");
        return;
      }

      // Agregar UN objeto con el proceso y TODOS los privilegios juntos (arreglo)
      oData.PRIVILEGES.push({
        PROCESSID: sProcess,
        PRIVILEGEID: aPrivileges  // aquí todo el arreglo completo
      });

      // Limpiar las selecciones
      oData.NEW_PROCESSID = "";
      oData.NEW_PRIVILEGES = [];

      oModel.setData(oData);
    },

    //quitar privilegios
    onRemovePrivilege: function (oEvent) {
      const oSource = oEvent.getSource();

      // Detecta el contexto y el nombre del modelo (newRoleModel o editRole)
      const aModels = ["newRoleModel", "roleDialogModel"];
      let oContext, sModelName;

      for (let model of aModels) {
        oContext = oSource.getBindingContext(model);
        if (oContext) {
          sModelName = model;
          break;
        }
      }

      if (!oContext) {
        MessageBox.error("No se pudo obtener el contexto del privilegio.");
        return;
      }

      const oModel = oContext.getModel();          // Obtiene el modelo detectado
      const oData = oModel.getData();              // Datos del modelo
      const sPath = oContext.getPath();            // Ej: /PRIVILEGES/1
      const iIndex = parseInt(sPath.split("/")[2]);

      if (!isNaN(iIndex)) {
        oData.PRIVILEGES.splice(iIndex, 1);        // Elimina el elemento
        oModel.refresh(true);                      // Refresca la vista
      }
    },


    formatRegDate: function (detailRow) {
      return detailRow?.DETAIL_ROW_REG?.[0]?.REGDATE || "-";
    },
    formatRegTime: function (detailRow) {
      return detailRow?.DETAIL_ROW_REG?.[0]?.REGTIME || "-";
    },
    formatRegUser: function (detailRow) {
      return detailRow?.DETAIL_ROW_REG?.[0]?.REGUSER || "-";
    },

    onSaveRole: async function () {
      const oView = this.getView();
      const oModel = oView.getModel("newRoleModel");
      const roleData = oModel.getData();

      const { ROLEID, ROLENAME, DESCRIPTION, PRIVILEGES } = roleData;

      if (!ROLEID || !ROLENAME || !DESCRIPTION || PRIVILEGES.length === 0) {
        MessageBox.warning("Completa todos los campos requeridos y añade al menos un privilegio.");
        return;
      }

      const now = new Date();

      // Extraer todos los PRIVILEGEIDs como array de string
      const flatPrivilegeIds = PRIVILEGES.flatMap(p =>
        Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID : [p.PRIVILEGEID]
      );

      const payload = {
        roles: {
          ROLEID,
          ROLENAME,
          DESCRIPTION,
          ACTIVO: true,
          DETAIL_ROW: {
            DETAIL_ROW_REG: [{
              CURRENT: true,
              REGDATE: now.toISOString(),
              REGTIME: now.toISOString(),
              REGUSER: "admin"
            }]
          },
          PRIVILEGES: PRIVILEGES.flatMap(p =>
            p.PRIVILEGEID.map(privId => ({
              PROCESSID: p.PROCESSID,
              PRIVILEGEID: privId
            }))
          )
        }
      };

      // console.log("Payload a enviar:", JSON.stringify(payload, null, 2)); // debug

      try {
        const res = await fetch("http://localhost:3333/api/security/rol/addOne", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok) {
          MessageToast.show("Rol guardado correctamente");
          if (this._pDialog) {
            this.onDialogClose("dialogEditRole");
            this.loadRolesData();
          }
          this.loadRoles?.(); // si tienes método para recargar roles
        } else {
          MessageBox.error("Error: " + result.message);
        }

      } catch (e) {
        console.error("Error en fetch:", e);
        MessageBox.error("No se pudo conectar con el servidor");
      }
    },

    loadRolesData: function () {
      const oView = this.getView();
      const oModel = new JSONModel();

      fetch("http://localhost:3333/api/security/rol/getall")
        .then(res => res.json())
        .then(data => {
          oModel.setData({
            value: data.value,
            filterKey: "all"
          });
          oView.setModel(oModel, "roles");
        })
        .catch(error => {
          Log.error("Error al cargar roles", error);
          MessageBox.error("No se pudieron cargar los roles.");
        });
    },

    loadCatalog: async function (labelId, modelName) {
      try {
        const response = await fetch(`http://localhost:3333/api/security/catalog/getCatalogByLabelId?LabelId=${labelId}`);
        const data = await response.json();

        const values = data?.VALUES || [];
        const simplified = values.map(v => ({
          VALUEID: v.VALUEID,
          VALUENAME: v.VALUE  // Puedes usar VALUE, ALIAS, o DESCRIPTION
        }));
        console.log(`📦 Datos recibidos para ${labelId}:`, simplified);
        this.getView().setModel(new JSONModel({ values: simplified }), modelName);

      } catch (err) {
        Log.error(`Error al cargar catálogo ${labelId}`, err);
      }
    },

    loadCatalogData: async function (labelId) {
      try {
        const res = await fetch(`http://localhost:3333/api/security/catalog/getCatalogByLabelId?LabelId=${labelId}`);
        const data = await res.json();
        return data?.VALUES || [];
      } catch (e) {
        console.error(`Error al cargar catálogo ${labelId}`, e);
        return [];
      }
    },

    loadAllUsers: async function () {
      try {
        const res = await fetch("http://localhost:3333/api/security/users/getAllUsers");
        const data = await res.json();
        return data?.value || [];
      } catch (e) {
        console.error("Error al cargar usuarios:", e);
        return [];
      }
    },

    onRoleSelected: async function () {
      const oTable = this.byId("rolesTable");
      const iIndex = oTable.getSelectedIndex();

      const oUiStateModel = this.getView().getModel("uiState"); // ← ✅ Solo una vez

      // Activar o desactivar botones
      if (oUiStateModel) {
        const bIsSelected = iIndex !== -1;
        oUiStateModel.setProperty("/editButtonEnabled", bIsSelected);
        oUiStateModel.setProperty("/deleteButtonEnabled", bIsSelected);
        oUiStateModel.setProperty("/desactivatedButtonEnabled", bIsSelected); // ← ESTE BOTÓN
      }

      if (iIndex === -1) {
        MessageToast.show("Selecciona un rol válido.");
        return;
      }

      const oRolesView = this.getView().getParent().getParent(); // sube hasta Roles.view
      const oUiStateModelParent = oRolesView.getModel("uiState");

      if (oUiStateModelParent) {
        oUiStateModelParent.setProperty("/isDetailVisible", true);
      }

      const oRole = oTable.getContextByIndex(iIndex).getObject();
      this.getOwnerComponent().setModel(new JSONModel(oRole), "selectedRole");

      const sId = encodeURIComponent(oRole.ROLEID);

      try {
        // Obtener rol desde backend
        const res = await fetch(`http://localhost:3333/api/security/rol/getitem?ID=${sId}`);
        const role = await res.json();

        // Obtener catálogos necesarios
        const [processes, privileges] = await Promise.all([
          this.loadCatalogData("IdProcess"),
          this.loadCatalogData("IdPrivileges")
        ]);
        console.log("processes:", processes);
        // Enriquecer PRIVILEGES → PROCESSES
        role.PROCESSES = role.PRIVILEGES.map(p => {

          const proc = processes.find(pr => pr.VALUEID === p.PROCESSID);
          const privs = (Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID : [p.PRIVILEGEID])
            .map(pid => privileges.find(pr => pr.VALUEID === pid))
            .filter(Boolean);

          return {
            PROCESSID: p.PROCESSID,
            PROCESSNAME: proc?.VALUE || p.PROCESSID,
            APPLICATIONNAME: proc?.DESCRIPTION || "-",
            VIEWNAME: proc?.INDEX || "-",
            PRIVILEGES: privs.map(x => ({ PRIVILEGENAME: x.VALUE }))
          };
        });

        // 4. Cargar todos los usuarios y filtrar los del rol
        const users = await this.loadAllUsers();
        role.USERS = users
          .filter(u => u.ROLES?.some(r => r.ROLEID === role.ROLEID))
          .map(u => ({
            USERID: u.USERID,
            USERNAME: u.USERNAME || `${u.NAME ?? ""} ${u.LASTNAME ?? ""}`.trim()
          }));

        // 5. Asignar el modelo enriquecido
        this.getOwnerComponent().setModel(new JSONModel(role), "selectedRole");

      } catch (e) {
        MessageBox.error("Error al obtener el rol: " + e.message);
      }
    },

    //abrir ventana edit Role
    onUpdateRole: async function () {
      const oView = this.getView();
      const oSelectedRole = this.getOwnerComponent().getModel("selectedRole").getData();

      if (!oSelectedRole) {
        MessageToast.show("No hay datos del rol seleccionados.");
        return;
      }

      await this.loadCatalogsOnce();

      const privilegesFormatted = (oSelectedRole.PROCESSES || []).map(proc => ({
        PROCESSID: proc.PROCESSID,
        PRIVILEGEID: (proc.PRIVILEGES || []).map(p => p.PRIVILEGENAME)  // o PRIVILEGEID si corresponde
      }));

      const oModel = new JSONModel({
        OLD_ROLEID: oSelectedRole.ROLEID,
        ROLEID: oSelectedRole.ROLEID,
        ROLENAME: oSelectedRole.ROLENAME,
        DESCRIPTION: oSelectedRole.DESCRIPTION,
        PRIVILEGES: privilegesFormatted,
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        IS_EDIT: true
      });

      oView.setModel(oModel, "roleDialogModel");

      if (!this._pEditDialog) {
        this._pEditDialog = await Fragment.load({
          id: oView.getId(),
          name: "com.invertions.sapfiorimodinv.view.security.fragments.EditRoleDialog",
          controller: this
        });
        oView.addDependent(this._pEditDialog);
      }
      this._pEditDialog.open();
    },

    //FUNCION GUARDAR EDIT 
    onSaveRoleEdit: async function () {
      const oModel = this.getView().getModel("roleDialogModel");
      const data = oModel.getData();

      if (!data.ROLEID || !data.ROLENAME || !data.DESCRIPTION || !Array.isArray(data.PRIVILEGES) || data.PRIVILEGES.length === 0) {
        MessageBox.warning("Completa todos los campos y asigna al menos un privilegio.");
        return;
      }

      const now = new Date();

      const payload = {
        roles: {
          ROLEID: data.ROLEID,
          ROLENAME: data.ROLENAME,
          DESCRIPTION: data.DESCRIPTION,
          PRIVILEGES: data.PRIVILEGES.map(p => ({
            PROCESSID: p.PROCESSID,
            PRIVILEGEID: Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID.join(",") : p.PRIVILEGEID
          })),
          DETAIL_ROW: {
            DETAIL_ROW_REG: [{
              CURRENT: true,
              REGDATE: now.toISOString(),
              REGTIME: now.toISOString(),
              REGUSER: "admin"
            }]
          }
        }
      };

      try {
        const res = await fetch("http://localhost:3333/api/security/rol/updateItem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        // console.log("Status:", res.status);
        const result = await res.json();
        // console.log("Response body:", result);

        if (res.ok) {
          MessageToast.show("Rol actualizado correctamente");
          if (this._pEditDialog) {
            this._pEditDialog.close();
          }
          this.loadRolesData();
        } else {
          MessageBox.error("Error: " + (result.message || "Error desconocido"));
        }
      } catch (e) {
        console.error("Error en la actualización:", e);
        MessageBox.error("No se pudo conectar con el servidor");
      }
    },
    //ELMINAR FISICO ROL
    onDeleteRole: function () {
      const oTable = this.byId("rolesTable");
      const iIndex = oTable.getSelectedIndex();
      if (iIndex === -1) return MessageToast.show("Selecciona un rol.");

      const oContext = oTable.getContextByIndex(iIndex);
      const oData = oContext.getObject();

      MessageBox.confirm(`¿Deseas eliminar el rol ${oData.ROLENAME}?`, {
        title: "Confirmar eliminación",
        icon: MessageBox.Icon.WARNING,
        onClose: async (oAction) => {
          if (oAction === MessageBox.Action.OK) {
            try {
              const res = await fetch("http://localhost:3333/api/security/rol/deleteItem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ROLEID: oData.ROLEID })
              });
              if (!res.ok) throw new Error(await res.text());

              MessageToast.show("Rol eliminado correctamente.");
              this.loadRolesData();
            } catch (err) {
              MessageBox.error("Error al eliminar el rol: " + err.message);
            }
          }
        }
      });
    },

    //borrado logico
    onDesactivateRole: function () {
      this._handleRoleAction({
        dialogType: "confirm",
        message: "¿Estás seguro de que deseas desactivar el rol \"{ROLENAME}\"?",
        title: "Confirmar desactivación",
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        emphasizedAction: MessageBox.Action.YES,
        confirmAction: MessageBox.Action.YES,
        method: "POST",
        url: "http://localhost:3333/api/security/rol/deleteLogic",
        successMessage: "Rol desactivado correctamente."
      });
    },

    _handleRoleAction: function (options) {
      const oView = this.getView();
      const oTable = this.byId("rolesTable");
      const iIndex = oTable.getSelectedIndex();

      if (iIndex === -1) {
        MessageToast.show("Selecciona un rol válido para la acción.");
        return;
      }

      const oRole = oTable.getContextByIndex(iIndex).getObject();

      MessageBox[options.dialogType || "confirm"](options.message.replace("{ROLENAME}", oRole.ROLENAME), {
        title: options.title || "Confirmar acción",
        actions: options.actions || [MessageBox.Action.YES, MessageBox.Action.NO],
        emphasizedAction: options.emphasizedAction || MessageBox.Action.YES,
        onClose: async (sAction) => {
          if (sAction === options.confirmAction) {
            try {
              const res = await fetch(options.url, {
                method: options.method || "POST",
                headers: { "Content-Type": "application/json" },
                body: options.body || JSON.stringify({ ROLEID: oRole.ROLEID })
              });
              const result = await res.json();

              if (res.ok) {
                MessageToast.show(options.successMessage || "Acción realizada con éxito");
                this.loadRolesData();
              } else {
                MessageBox.error("Error: " + (result.message || "Error desconocido"));
              }
            } catch (e) {
              MessageBox.error("No se pudo conectar con el servidor");
            }
          }
        }
      });
    },

    // ...existing code...
    onMultiSearch: function () {
      const sQueryRaw = this.byId("searchRoleName").getValue();
      const sQuery = this._normalizeText(sQueryRaw);
      const oBinding = this.byId("rolesTable").getBinding("rows");

      if (sQuery) {
        // Campos a buscar
        const aSearchFields = [
          "ROLEID",
          "ROLENAME",
          "DESCRIPTION"
        ];

        // Filtros por campos de texto
        const aFilters = aSearchFields.map(sField =>
          new sap.ui.model.Filter({
            path: sField,
            operator: sap.ui.model.FilterOperator.Contains,
            value1: sQueryRaw
          })
        );

        // Filtro por estado (Activo/Inactivo)
        const oStatusFilter = new sap.ui.model.Filter({
          path: "",
          test: (oContext) => {
            const bActive = oContext?.ACTIVO ?? oContext?.DETAIL_ROW?.ACTIVED;
            const sStatus = this._normalizeText(bActive === true || bActive === "true" ? "activo" : "inactivo");
            // Si la búsqueda es exactamente "activo" o "inactivo", solo muestra los que coinciden exactamente
            if (sQuery === "activo" || sQuery === "inactivo") {
              return sStatus === sQuery;
            }
            // Si la búsqueda es parcial, solo busca si empieza por la palabra (pero no permite que "activo" coincida con "inactivo")
            return sStatus.startsWith(sQuery) && (sStatus === "activo" || sStatus === "inactivo");
          }
        });

        // Combinar todos los filtros (OR)
        const oCombinedFilter = new sap.ui.model.Filter([
          ...aFilters,
          oStatusFilter
        ], false);

        oBinding.filter(oCombinedFilter);
      } else {
        oBinding.filter([]);
      }
    },

    // Añade esta función auxiliar si no la tienes:
    _normalizeText: function (sText) {
      if (!sText) return "";
      return sText.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    },



  });
});
