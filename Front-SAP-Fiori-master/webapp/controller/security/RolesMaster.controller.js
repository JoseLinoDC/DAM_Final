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
        desactivatedButtonEnabled: false
      });
      this.getView().setModel(oUiStateModel, "uiState");

      this.getView().setModel(new JSONModel({
        selectedRole: {
          // ... otros datos del rol
          PRIVILEGES: []
        }
      }), "selectedRole");

      this.loadRolesData();

    },

    // Inicializa los modelos necesarios
    initModels: function () {
      const view = this.getView();
      view.setModel(new JSONModel(), "selectedRole");

      view.setModel(new JSONModel({
        ROLEID: "",
        ROLENAME: "",
        DESCRIPTION: "",
        NEW_APLICATIONID: "",
        NEW_VIEWID: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        PRIVILEGES: []
      }), "newRoleModel");
    },

    // Carga los catálogos una sola vez
    loadCatalogsOnce: async function () {
      if (!this._catalogsLoaded) {
        await this.loadCatalog("IdProcess", "processCatalogModel");
        await this.loadCatalog("IdPrivileges", "privilegeCatalogModel");
        await this.loadPrivilegesCatalog();
        this._catalogsLoaded = true;
      }
    },

    // Abre el diálogo para crear un nuevo rol
    onOpenDialog: async function () {
      await this.loadApplications();
      await this.loadCatalogsOnce(); // ✅ para no volver a cargar

      // Verifica si el diálogo ya está creado
      if (!this._pDialog) {
        this._pDialog = await Fragment.load({
          name: "com.invertions.sapfiorimodinv.view.security.fragments.AddRoleDialog",
          controller: this
        });
        this.getView().addDependent(this._pDialog);
      }

      // Reinicia el modelo del diálogo
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

    // Cierra el diálogo de creación o edición de rol
    onDialogClose: function () {
      if (this._pDialog) this._pDialog.close();
      if (this._pEditDialog) this._pEditDialog.close();
    },


    //agregar privilegios
    onAddPrivilege: function () {
      const oView = this.getView();

      // Detecta el modelo correcto
      let oModel, oData;
      if (
        oView.getModel("roleDialogModel") &&
        oView.getModel("roleDialogModel").getData().IS_EDIT
      ) {
        oModel = oView.getModel("roleDialogModel");
        oData = oModel.getData();
      } else {
        oModel = oView.getModel("newRoleModel");
        oData = oModel.getData();
      }

      const sAppId = oData.NEW_APLICATIONID;
      const sViewId = oData.NEW_VIEWID;
      const sProcessId = oData.NEW_PROCESSID;
      const aPrivileges = oData.NEW_PRIVILEGES;

      // Solo validamos aplicación y privilegios
      if (!sAppId || !aPrivileges || aPrivileges.length === 0) {
        MessageToast.show("Selecciona aplicación y al menos un privilegio.");
        return;
      }

      // Busca los nombres en los modelos correspondientes
      const aApps = oView.getModel("applicationCatalogModel").getProperty("/values") || [];
      const aViews = oView.getModel("processCatalogModel").getProperty("/values") || [];
      const aProcesses = oView.getModel("processListModel").getProperty("/values") || [];
      const aPrivs = oView.getModel("privilegeCatalogModel").getProperty("/values") || [];

      const appObj = aApps.find(a => a.VALUEID === sAppId) || {};
      const viewObj = aViews.find(v => v.VALUEID === sViewId) || {};
      // Si no hay proceso, coloca "Sin datos"
      const processObj = aProcesses.find(p => p.VALUEID === sProcessId) || { VALUEID: "", VALUENAME: "Sin datos" };

      // Obtén los nombres de los privilegios seleccionados
      const privilegeNames = aPrivileges.map(pid => {
        const priv = aPrivs.find(p => p.VALUEID === pid);
        return priv ? priv.VALUENAME : pid;
      });

      oData.PRIVILEGES.push({
        APLICATIONID: appObj.VALUEID,
        APLICATIONNAME: appObj.VALUENAME,
        VIEWID: viewObj.VALUEID,
        VIEWNAME: viewObj.VALUENAME,
        PROCESSID: processObj.VALUEID,
        PROCESSNAME: processObj.VALUENAME,
        PRIVILEGEID: aPrivileges,
        PRIVILEGENAMES: privilegeNames
      });

      // Limpiar las selecciones
      oData.NEW_APLICATIONID = "";
      oData.NEW_VIEWID = "";
      oData.NEW_PROCESSID = "";
      oData.NEW_PRIVILEGES = [];

      // Forzar actualización del modelo y del array
      oData.PRIVILEGES = oData.PRIVILEGES.slice();
      oModel.setData(Object.assign({}, oData));
    },

    //quitar privilegios
    onRemovePrivilege: function (oEvent) {
      const oSource = oEvent.getSource();

      // Detecta el contexto y el nombre del modelo (newRoleModel o editRole)
      const aModels = ["newRoleModel", "roleDialogModel"];
      let oContext, sModelName;

      // Busca el contexto en los modelos
      for (let model of aModels) {
        oContext = oSource.getBindingContext(model);
        if (oContext) {
          sModelName = model;
          break;
        }
      }

      // Si no se encontró el contexto, muestra un error
      if (!oContext) {
        MessageBox.error("No se pudo obtener el contexto del privilegio.");
        return;
      }

      // Obtiene el modelo y los datos
      const oModel = oContext.getModel();          // Obtiene el modelo detectado
      const oData = oModel.getData();              // Datos del modelo
      const sPath = oContext.getPath();            // Ej: /PRIVILEGES/1
      const iIndex = parseInt(sPath.split("/")[2]);

      // Verifica si el índice es un número válido
      if (!isNaN(iIndex)) {
        oData.PRIVILEGES.splice(iIndex, 1);        // Elimina el elemento
        oModel.refresh(true);                      // Refresca la vista
      }
    },

    // Formateadores para mostrar datos en la vista
    formatRegDate: function (detailRow) {
      return detailRow?.DETAIL_ROW_REG?.[0]?.REGDATE || "-";
    },
    formatRegTime: function (detailRow) {
      return detailRow?.DETAIL_ROW_REG?.[0]?.REGTIME || "-";
    },
    formatRegUser: function (detailRow) {
      return detailRow?.DETAIL_ROW_REG?.[0]?.REGUSER || "-";
    },

    // Función para guardar el nuevo rol
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
      // const flatPrivilegeIds = PRIVILEGES.flatMap(p =>
      //   Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID : [p.PRIVILEGEID]
      // );

      // Prepara el payload para el backend
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
              APLICATIONID: p.APLICATIONID,
              VIEWID: p.VIEWID,
              PROCESSID: p.PROCESSID,
              PRIVILEGEID: privId
            }))
          )
        }
      };

      // console.log("Payload a enviar:", JSON.stringify(payload, null, 2)); // debug

      // Realiza la petición al backend
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
          // this.loadRoles?.(); // si tienes método para recargar roles
        } else {
          MessageBox.error("Error: " + result.message);
        }

      } catch (e) {
        console.error("Error en fetch:", e);
        MessageBox.error("No se pudo conectar con el servidor");
      }
    },

    // Carga los roles desde el backend
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

    // Carga el catálogo de privilegios
    loadPrivilegesCatalog: async function () {
      try {
        const response = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdPrivileges");
        const data = await response.json();
        const values = data?.value || [];
        const simplified = values.map(v => ({
          VALUEID: v.VALUEID,
          VALUENAME: v.VALUE
        }));
        this.getView().setModel(new JSONModel({ values: simplified }), "privilegeCatalogModel");
      } catch (err) {
        Log.error("Error al cargar catálogo de privilegios", err);
        MessageBox.error("No se pudieron cargar los privilegios.");
      }
    },

    // Carga un catálogo específico por su ID
    loadCatalog: async function (labelId, modelName) {
      try {
        const response = await fetch(`http://localhost:3333/api/security/values/getLabelById?labelid=${labelId}`);
        const data = await response.json();

        const values = data?.VALUES || [];
        const simplified = values.map(v => ({
          VALUEID: v.VALUEID,
          VALUENAME: v.VALUE
        }));
        console.log(`📦 Datos recibidos para ${labelId}:`, simplified);
        this.getView().setModel(new JSONModel({ values: simplified }), modelName);

      } catch (err) {
        Log.error(`Error al cargar catálogo ${labelId}`, err);
      }
    },

    // Carga los datos de un catálogo específico por su ID
    loadCatalogData: async function (labelId) {
      try {
        const res = await fetch(`http://localhost:3333/api/security/values/getLabelById?labelid=${labelId}`);
        const data = await res.json();
        return data?.VALUES || [];
      } catch (e) {
        console.error(`Error al cargar catálogo ${labelId}`);
        return [];
      }
    },

    // Carga todos los usuarios del sistema
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

    // Carga el catálogo de aplicaciones
    loadApplications: async function () {
      try {
        const res = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdApplication");
        const data = await res.json();
        const values = data.value || [];
        // Ordenar por VALUENAME (nombre de la aplicación)
        const simplified = values
          .map(v => ({
            VALUEID: v.VALUEID,
            VALUENAME: v.VALUE
          }))
          .sort((a, b) => a.VALUENAME.localeCompare(b.VALUENAME));
        this.getView().setModel(new sap.ui.model.json.JSONModel({ values: simplified }), "applicationCatalogModel");
      } catch (err) {
        MessageToast.show("Error al cargar aplicaciones");
      }
    },

    // Evento al seleccionar un rol en la tabla
    onRoleSelected: async function () {
      const oTable = this.byId("rolesTable");
      const iIndex = oTable.getSelectedIndex();
      // const oModel = this.getView().getModel("selectedRole");
      const oUiStateModel = this.getView().getModel("uiState");

      // Activar o desactivar botones
      if (oUiStateModel) {
        const bIsSelected = iIndex !== -1;
        oUiStateModel.setProperty("/editButtonEnabled", bIsSelected);
        oUiStateModel.setProperty("/deleteButtonEnabled", bIsSelected);
        oUiStateModel.setProperty("/activateButtonEnabled", false);
        oUiStateModel.setProperty("/deactivateButtonEnabled", false);
      }

      if (iIndex === -1) {
        MessageToast.show("Selecciona un rol válido.");
        return;
      }

      const oRolesView = this.getView().getParent().getParent();
      const oUiStateModelParent = oRolesView.getModel("uiState");

      if (oUiStateModelParent) {
        oUiStateModelParent.setProperty("/isDetailVisible", true);
      }

      const oRole = oTable.getContextByIndex(iIndex).getObject();
      this.getOwnerComponent().setModel(new JSONModel(oRole), "selectedRole");

      const bActive = oRole.ACTIVO === true || oRole.ACTIVO === "true" ||
        oRole.DETAIL_ROW?.ACTIVED === true || oRole.DETAIL_ROW?.ACTIVED === "true";

      oUiStateModel.setProperty("/activateButtonEnabled", !bActive);
      oUiStateModel.setProperty("/deactivateButtonEnabled", bActive);

      const sId = encodeURIComponent(oRole.ROLEID);

      try {
        // 1. Obtener rol desde backend
        const res = await fetch(`http://localhost:3333/api/security/rol/getitem?ID=${sId}`);
        const role = await res.json();

        // 2. Obtener catálogo de privilegios
        const privilegesCatalog = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdPrivileges")
          .then(r => r.json())
          .then(d => d.value || []);

        // 3. Agrupar privilegios por combinación de proceso y vista
        const processMap = {};
        (role.PRIVILEGES || []).forEach(p => {
          const key = `${p.PROCESSID}__${p.VIEWID}`;
          if (!processMap[key]) {
            processMap[key] = {
              PROCESSID: p.PROCESSID,
              PROCESSNAME: p.processInfo?.name || p.PROCESSID || "-",
              APLICATIONNAME: p.viewInfo?.viewDescription || "-",
              VIEWNAME: p.viewInfo?.viewName || p.VIEWID || "-",
              PRIVILEGENAMES: [],
            };
          }
          // Buscar el nombre del privilegio en el catálogo
          const privObj = privilegesCatalog.find(pr => pr.VALUEID === p.PRIVILEGEID);
          processMap[key].PRIVILEGENAMES.push(privObj ? privObj.VALUE : p.PRIVILEGEID);
        });

        // 4. Asignar el arreglo de procesos agrupados al modelo
        role.PROCESSES = Object.values(processMap);

        // 5. (Opcional) Usuarios del rol
        const users = await this.loadAllUsers();
        role.USERS = users
          .filter(u => u.ROLES?.some(r => r.ROLEID === role.ROLEID))
          .map(u => ({
            USERID: u.USERID,
            USERNAME: u.USERNAME || `${u.NAME ?? ""} ${u.LASTNAME ?? ""}`.trim()
          }));

        // 6. Asignar el modelo enriquecido
        this.getOwnerComponent().setModel(new JSONModel(role), "selectedRole");

      } catch (e) {
        MessageBox.error("Error al obtener el rol: " + e.message);
      }
    },

    // Evento al cambiar la aplicación seleccionada
    onApplicationChange: async function (oEvent) {
      const oSource = oEvent.getSource();
      // Detecta el modelo correcto
      const oContext = oSource.getBindingContext("newRoleModel") || oSource.getBindingContext("roleDialogModel");
      const sModelName = oContext ? oContext.getModel().sName : "newRoleModel";
      const oModel = this.getView().getModel(sModelName);

      const sAppId = oSource.getSelectedKey();
      if (!sAppId) {
        this.getView().setModel(new sap.ui.model.json.JSONModel({ values: [] }), "processCatalogModel");
        this.getView().setModel(new sap.ui.model.json.JSONModel({ values: [] }), "processListModel");
        return;
      }

      // Limpia la vista y proceso seleccionados
      oModel.setProperty("/NEW_VIEWID", "");
      oModel.setProperty("/NEW_PROCESSID", "");

      try {
        const res = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdViews");
        const data = await res.json();
        const allViews = data.value || [];
        const filtered = allViews
          .filter(v => v.VALUEPAID === `IdApplication-${sAppId}`)
          .map(v => ({
            VALUEID: v.VALUEID,
            VALUENAME: v.VALUE,
          }))
          .sort((a, b) => a.VALUENAME.localeCompare(b.VALUENAME));

        this.getView().setModel(new sap.ui.model.json.JSONModel({ values: filtered }), "processCatalogModel");
      } catch (err) {
        MessageToast.show("Error al cargar vistas");
      }
    },

    // Evento al cambiar la vista seleccionada
    onViewChange: async function (oEvent) {
      const oSource = oEvent.getSource();
      // Detecta el modelo correcto
      const oContext = oSource.getBindingContext("newRoleModel") || oSource.getBindingContext("roleDialogModel");
      const sModelName = oContext ? oContext.getModel().sName : "newRoleModel";
      const oModel = this.getView().getModel(sModelName);

      const sViewId = oSource.getSelectedKey();
      if (!sViewId) {
        this.getView().setModel(new sap.ui.model.json.JSONModel({ values: [] }), "processListModel");
        return;
      }

      // Limpia el proceso seleccionado
      oModel.setProperty("/NEW_PROCESSID", "");

      try {
        const res = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdProcess");
        const data = await res.json();
        const allProcesses = data.value || [];
        const filtered = allProcesses
          .filter(p => p.VALUEPAID === `IdViews-${sViewId}`)
          .map(p => ({
            VALUEID: p.VALUEID,
            VALUENAME: p.VALUE
          }))
          .sort((a, b) => a.VALUENAME.localeCompare(b.VALUENAME));

        if (filtered.length === 0) {
          filtered.push({
            VALUEID: "",
            VALUENAME: "Sin datos",
            DISABLED: true
          });
        }

        this.getView().setModel(new sap.ui.model.json.JSONModel({ values: filtered }), "processListModel");
      } catch (err) {
        MessageToast.show("Error al cargar procesos");
      }
    },

    // Función auxiliar para agrupar privilegios por vista (opcional)
    // _groupPrivilegesByView: function (role) {
    //   const grouped = {};

    //   role.PRIVILEGES.forEach(p => {
    //     const viewKey = p.viewInfo?.viewName || "Sin vista asignada";
    //     if (!grouped[viewKey]) {
    //       grouped[viewKey] = {
    //         VIEWNAME: viewKey,
    //         VIEWDESCRIPTION: p.viewInfo?.viewDescription || "",
    //         VIEWIMAGE: p.viewInfo?.viewImage || "",
    //         PRIVILEGES: []
    //       };
    //     }
    //     grouped[viewKey].PRIVILEGES.push(p);
    //   });

    //   role.GROUPED_PRIVILEGES = Object.values(grouped);
    //   return role;
    // },
    // Evento para actualizar un rol existente
    onUpdateRole: async function () {
      await this.loadApplications();
      const oView = this.getView();
      const oSelectedRole = this.getOwnerComponent().getModel("selectedRole").getData();

      if (!oSelectedRole) {
        MessageToast.show("No hay datos del rol seleccionados.");
        return;
      }

      await this.loadCatalogsOnce();
      const aPrivs = this.getView().getModel("privilegeCatalogModel").getProperty("/values") || [];

      // Puedes dejar los campos de nuevo privilegio vacíos o con los valores del primer privilegio si quieres precargar
      const firstPrivilege = (oSelectedRole.PRIVILEGES && oSelectedRole.PRIVILEGES[0]) || {};
      const sAppId = firstPrivilege.APLICATIONID || "";
      const sViewId = firstPrivilege.VIEWID || "";
      const sProcessId = firstPrivilege.PROCESSID || "";
      const aApps = this.getView().getModel("applicationCatalogModel").getProperty("/values") || [];

      // Mapea los privilegios para la tabla
      const privilegesFormatted = (oSelectedRole.PRIVILEGES || []).map(p => {
        const appObj = aApps.find(a => a.VALUEID === p.APLICATIONID) || {};
        return {
          APLICATIONID: p.APLICATIONID,
          APLICATIONNAME: appObj.VALUENAME || p.APLICATIONID || "-",
          VIEWID: p.VIEWID,
          VIEWNAME: p.viewInfo?.viewName || p.VIEWID || "-",
          PROCESSID: p.PROCESSID,
          PROCESSNAME: p.processInfo?.name || p.PROCESSID || "-",
          PRIVILEGEID: Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID : [p.PRIVILEGEID],
          PRIVILEGENAMES: (Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID : [p.PRIVILEGEID]).map(pid => {
            const priv = aPrivs.find(x => x.VALUEID === pid);
            return priv ? priv.VALUENAME : pid;
          })
        };
      });

      // Prepara el modelo de edición
      
      const oModel = new JSONModel({
        OLD_ROLEID: oSelectedRole.ROLEID,
        ROLEID: oSelectedRole.ROLEID,
        ROLENAME: oSelectedRole.ROLENAME,
        DESCRIPTION: oSelectedRole.DESCRIPTION,
        PRIVILEGES: privilegesFormatted,
        NEW_APLICATIONID: "",
        NEW_VIEWID: "",
        NEW_PROCESSID: "",
        NEW_PRIVILEGES: [],
        IS_EDIT: true
      });

      oView.setModel(oModel, "roleDialogModel");

      // --- Filtra las vistas según la aplicación seleccionada ---
      if (sAppId) {
        try {
          const resViews = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdViews");
          const dataViews = await resViews.json();
          const allViews = dataViews.value || [];
          const filteredViews = allViews
            .filter(v => v.VALUEPAID === `IdApplication-${sAppId}`)
            .map(v => ({
              VALUEID: v.VALUEID,
              VALUENAME: v.VALUE,
            }));
          oView.setModel(new sap.ui.model.json.JSONModel({ values: filteredViews }), "processCatalogModel");
        } catch (err) {
          MessageToast.show("Error al cargar vistas");
        }
      }

      // --- Filtra los procesos según la vista seleccionada ---
      if (sViewId) {
        try {
          const resProc = await fetch("http://localhost:3333/api/security/values/getLabelById?labelid=IdProcess");
          const dataProc = await resProc.json();
          const allProc = dataProc.value || [];
          const filteredProc = allProc
            .filter(p => p.VALUEPAID === `IdViews-${sViewId}`)
            .map(p => ({
              VALUEID: p.VALUEID,
              VALUENAME: p.VALUE
            }));
          oView.setModel(new sap.ui.model.json.JSONModel({ values: filteredProc }), "processListModel");
        } catch (err) {
          MessageToast.show("Error al cargar procesos");
        }
      }

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

    // Activar rol
    onActivateRole: async function () {
      const oRole = this.getView().getModel("selectedRole").getData();
      if (!oRole || !oRole.ROLEID) return MessageToast.show("Selecciona un rol.");

      try {
        const res = await fetch("http://localhost:3333/api/security/rol/activateRole", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ROLEID: oRole.ROLEID })
        });
        if (!res.ok) throw new Error(await res.text());
        MessageToast.show("Rol activado correctamente.");
        this.loadRolesData();
      } catch (err) {
        MessageBox.error("Error al activar el rol: " + err.message);
      }
    },

    // Desactivar rol
    onDeactivateRole: function () {
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

    // Función genérica para manejar acciones de rol (activar, desactivar, eliminar)
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

    // Para la multibusqueda de los roles
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
