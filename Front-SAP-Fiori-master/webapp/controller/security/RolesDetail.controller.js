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
      this.applications = this.loadCatalogData("IdApplication");
    },

    // Función para cargar los datos del rol desde backend y enriquecer procesos y usuarios
    // async loadRoleDetails(sRoleId) {
    //   try {
    //     const res = await fetch(`http://localhost:3333/api/security/rol/getitem?ID=${encodeURIComponent(sRoleId)}`);
    //     const role = await res.json();

    //     // Carga catálogos de aplicaciones y privilegios
    //     const [applications, privileges] = await Promise.all([
    //       this.loadCatalogData("IdApplication"),
    //       this.loadCatalogData("IdPrivileges")
    //     ]);

    //     // Enriquecer cada proceso con los nombres de privilegios
    //     // ...existing code...
    //     // Enriquecer cada proceso con los nombres de privilegios
    //     role.PROCESSES = (role.PRIVILEGES || []).map(p => {
    //       const appObj = applications.find(a => a.VALUEID === p.APLICATIONID) || {};
    //       // Asegúrate de que PRIVILEGEID sea un array
    //       const privilegeIds = Array.isArray(p.PRIVILEGEID) ? p.PRIVILEGEID : [p.PRIVILEGEID];
    //       const privilegeNames = privilegeIds.map(pid => {
    //         const priv = privileges.find(x => x.VALUEID === pid);
    //         return priv ? priv.VALUENAME : pid;
    //       });

    //       const enriched = {
    //         APLICATIONID: p.APLICATIONID,
    //         APLICATIONNAME: appObj.VALUENAME || p.APLICATIONID || "-",
    //         VIEWID: p.VIEWID,
    //         VIEWNAME: p.viewInfo?.viewName || p.VIEWID || "-",
    //         PROCESSID: p.PROCESSID,
    //         PROCESSNAME: p.processInfo?.name || p.PROCESSID || "-",
    //         PRIVILEGEID: privilegeIds,
    //         PRIVILEGENAMES: privilegeNames // <-- Esto es lo que la vista espera
    //       };

    //       // Mostrar en consola los datos originales y enriquecidos
    //       console.log("🔎 Proceso original:", p);
    //       console.log("✅ Proceso enriquecido:", enriched);

    //       return enriched;
    //     });

    //   } catch (error) {
    //     MessageBox.error("Error al cargar los detalles del rol: " + error.message);
    //   }
    // },

    // Función para obtener catálogo (IdProcesses, IdPrivileges)
    async loadCatalogData(labelId) {
      const res = await fetch(`http://localhost:3333/api/security/values/getLabelById?labelid=${encodeURIComponent(labelId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
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
