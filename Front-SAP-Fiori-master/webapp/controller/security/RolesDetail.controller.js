sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/core/Fragment"
], function (BaseController, JSONModel, Log, MessageToast, MessageBox, Fragment) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesDetail", {

    onInit: function () {
      const oModel = this.getView().getModel("selectedRole");
      if (oModel) {
        // console.log("selectedRole data", oModel.getData());
      } else {
        console.warn("Modelo 'selectedRole' no está disponible");
      }
    },

    // Función para cargar los datos del rol desde backend y enriquecer procesos y usuarios
    async loadRoleDetails(sRoleId) {
      try {
        // 1. Obtener rol desde backend
        const res = await fetch(`http://localhost:3333/api/security/rol/getitem?ID=${encodeURIComponent(sRoleId)}`);
        const role = await res.json();

        // 2. Obtener catálogos necesarios
        const [processes, privileges] = await Promise.all([
          this.loadCatalogData("IdProcess"),
          this.loadCatalogData("IdPrivileges")
        ]);

        // 3. Enriquecer PRIVILEGES → PROCESSES
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
        // 4. Cargar usuarios con este rol
        const users = await this.loadAllUsers();
        role.USERS = users
          .filter(u => u.ROLES?.some(r => r.ROLEID === role.ROLEID))
          .map(u => ({
            USERID: u.USERID,
            USERNAME: u.USERNAME,
            COMPANYNAME: u.COMPANYNAME,
            EMPLOYEEID: u.EMPLOYEEID,
            DEPARTMENT: u.DEPARTMENT
          }));

        // 5. Asignar el rol enriquecido al modelo
        this.getView().getModel("selectedRole").setData(role);

      } catch (error) {
        MessageBox.error("Error al cargar los detalles del rol: " + error.message);
      }
    },

    // Función para obtener catálogo (IdProcesses, IdPrivileges)
    async loadCatalogData(labelId) {
      const res = await fetch(`http://localhost:3333/api/security/catalog/getCatalogByLabelId`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId })
      });
      const data = await res.json();
      return data.value || [];
    },

    // Función para cargar todos los usuarios
    async loadAllUsers() {
      const res = await fetch(`http://localhost:3333/api/security/users/getAllUsers`);
      const data = await res.json();
      return data.value || [];
    },

    onOpenCatalogs: function () {
      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.navTo("RouteCatalogs");
    },

    onOpenUsers: function () {
      const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      oRouter.navTo("RouteUsersList");
    }

  });
});
