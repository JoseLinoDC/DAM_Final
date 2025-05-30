sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.Roles", {
    onInit: function () {
      const oModel = new JSONModel({
        isDetailVisible: false
      });
      this.getView().setModel(oModel, "uiState");
    }
  });
});
