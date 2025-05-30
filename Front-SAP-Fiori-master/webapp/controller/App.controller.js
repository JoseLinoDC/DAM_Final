sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.invertions.sapfiorimodinv.controller.App", {

        onInit: function () {
            // Redirige automáticamente a la vista principal al iniciar
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteMain");
        },


        onToggleSideNav: function () {
            const oToolPage = this.byId("mainToolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onItemSelect: function (oEvent) {
            const sKey = oEvent.getParameter("item").getKey();
            const oRouter = this.getOwnerComponent().getRouter();

            switch (sKey) {
                case "roles":
                    oRouter.navTo("RouteRoles");
                    break;
                case "users":
                    oRouter.navTo("RouteUsersList");
                    break;
                case "catalogs":
                    oRouter.navTo("RouteCatalogs");
                    break;
                case "investments":
                    oRouter.navTo("RouteInvestments");
                    break;
                default:
                    oRouter.navTo("RouteMain");
            }
        }

    });
});
