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
    // Traer todos los usuarios desde la API
    const response = await fetch("http://localhost:3333/api/security/users/getAllUsers", {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`Error en la respuesta del servidor: ${response.status}`);
    }

    const result = await response.json();
    const userList = Array.isArray(result.value) ? result.value : [];

    console.log("Email ingresado:", oLogin.email);
    console.log("Contraseña ingresada:", oLogin.password);

    // Limpiar y validar inputs
    const inputEmail = (oLogin.email || "").trim().toLowerCase();
    const inputPassword = (oLogin.password || "").trim();

    if (!inputEmail || !inputPassword) {
      MessageToast.show("Por favor ingresa correo y contraseña.");
      return;
    }

    // Buscar coincidencia exacta de email y contraseña
    const user = userList.find(u =>
      (u.EMAIL || "").trim().toLowerCase() === inputEmail &&
      (u.PASSWORD || "").trim() === inputPassword
    );

    if (!user) {
      MessageToast.show("Correo o contraseña incorrectos");
      return;
    }

    // Crear iniciales del usuario (opcional)
    const first = (user.FIRSTNAME || "").trim();
    const last = (user.LASTNAME || "").trim();
    user.initials = first && last
      ? first.charAt(0).toUpperCase() + last.charAt(0).toUpperCase()
      : "US";

    // Guardar usuario autenticado en modelo appView
    const oAppModel = this.getOwnerComponent().getModel("appView");
    oAppModel.setProperty("/isLoggedIn", true);
    oAppModel.setProperty("/currentUser", user);

    // Redirigir a la vista principal
    this.getOwnerComponent().getRouter().navTo("RouteMain");

  } catch (error) {
    console.error("Error al autenticar:", error);
    MessageToast.show("Error al conectar con la API");
  }
},


      //Funcion para el ojito
    onVerContraseña: function () {
      const oInput = this.byId("passwordInput");
      const bCurrentType = oInput.getType() === "Text";
      oInput.setType(bCurrentType ? "Password" : "Text");
      this.byId("showPasswordButton").setIcon(bCurrentType ? "sap-icon://show" : "sap-icon://hide");
    }
    
  });
});
