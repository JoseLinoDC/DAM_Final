/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("com.invertions.sapfiorimodinv.controller.Login", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        email: "",
        password: ""
      }), "loginModel");

    },

    onLoginPress: async function () {
      const oLogin = this.getView().getModel("loginModel").getData();
      try {
        // const response = await fetch("http://localhost:3333/api/users/getallusers", {
        //   method: "GET"
        // });

        // const result = await response.json();
        // const userList = Array.isArray(result.value) ? result.value : [];

        // console.log("email:", oLogin.email);
        // console.log("contra::", oLogin.password);

        // //  Búsqueda por EMAIL y PASSWORD reales
        // const user = userList.find(u =>
        //   (u.EMAIL || "admin").trim().toLowerCase() === oLogin.email.trim().toLowerCase() &&
        //   (u.PASSWORD || "admin").trim() === oLogin.password.trim()
        // );

        // if (!user) {
        //   MessageToast.show("Correo o contraseña incorrectos");
        //   return;
        // }

        // const first = user.FIRSTNAME || "";
        // const last = user.LASTNAME || "";
        // user.initials = first && last
        //   ? first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase()
        //   : "US";


        // Guarda el usuario autenticado en appView
        const system = "SYSTEM";
        const oAppModel = this.getOwnerComponent().getModel("appView");
        oAppModel.setProperty("/isLoggedIn", true);
        oAppModel.setProperty("/currentUser", system);


        // Navega a la vista principal
        this.getOwnerComponent().getRouter().navTo("RouteMain");

      } catch (error) {
        console.error(" Error al autenticar:", error);
        MessageToast.show("Error al conectar con la API");
      }
    } ,

      //Funcion para el ojito
    onVerContraseña: function () {
      const oInput = this.byId("passwordInput");
      const bCurrentType = oInput.getType() === "Text";
      oInput.setType(bCurrentType ? "Password" : "Text");
      this.byId("showPasswordButton").setIcon(bCurrentType ? "sap-icon://show" : "sap-icon://hide");
    }
    
  });
});
