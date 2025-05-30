
sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, Log, Fragment, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.UsersList", {

        onInit: function () {

            // Esto desactiva los botones cuando entras a la vista, hasta que selecciones un usuario en la tabla se activan
            var oViewModel = new JSONModel({
                buttonsEnabled: false
            });
            this.getView().setModel(oViewModel, "viewModel");
            // Carga los usuarios
            this.loadUsers();
        },

        prepareUserPayload: function (userData, aSelectedRoles, isEdit = false) {
            const now = new Date();
            const payload = {
                user: {
                    USERID: userData.USERID,
                    PASSWORD: isEdit && userData.PASSWORD === "******" ? undefined : userData.PASSWORD,
                    ALIAS: userData.ALIAS,
                    FIRSTNAME: userData.FIRSTNAME,
                    LASTNAME: userData.LASTNAME,
                    EMPLOYEEID: userData.EMPLOYEEID,
                    EXTENSION: userData.EXTENSION,
                    USERNAME: userData.USERNAME,
                    EMAIL: userData.EMAIL,
                    PHONENUMBER: userData.PHONENUMBER,
                    BIRTHDAYDATE: userData.BIRTHDAYDATE ? this.formatDateToString(userData.BIRTHDAYDATE) : null,
                    AVATAR: userData.AVATAR,
                    COMPANYID: userData.COMPANYID,
                    COMPANYNAME: userData.COMPANYNAME,
                    DEPARTMENT: userData.DEPARTMENT,
                    DEPARTMENT_ID: userData.DEPARTMENT_ID,
                    FUNCTION: userData.FUNCTION,
                    STREET: userData.STREET,
                    POSTALCODE: userData.POSTALCODE,
                    CITY: userData.CITY,
                    REGION: userData.REGION,
                    STATE: userData.STATE,
                    COUNTRY: userData.COUNTRY,
                    ACTIVO: true,
                    DETAIL_ROW: {
                        DETAIL_ROW_REG: [{
                            CURRENT: true,
                            REGDATE: now.toISOString(),
                            REGTIME: now.toISOString(),
                            REGUSER: "admin"
                        }]
                    },
                    ROLES: aSelectedRoles.map(oRole => ({
                        ROLEID: oRole.ROLEID,
                        ROLENAME: oRole.ROLENAME
                    }))
                }
            };
            if (payload.user.PASSWORD === undefined) delete payload.user.PASSWORD;
            return payload;
        },

        //=========================================================================================================================================================
        //=============== AÑADIR USUARIO ==========================================================================================================================
        //=========================================================================================================================================================

        // ---- Vista para Crear usuario ----
        onAddUser: function () {
            var oView = this.getView();

            // 1. Verificar si ya tenemos el diálogo
            if (!this._oCreateUserDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.invertions.sapfiorimodinv.view.security.fragments.AddUserDialog",
                    controller: this
                }).then((oDialog) => {
                    this._oCreateUserDialog = oDialog;
                    oView.addDependent(oDialog);

                    const oNewUserModel = new JSONModel({
                        USERID: "",
                        USERNAME: "",
                        EMAIL: "",
                        PHONENUMBER: "",
                        BIRTHDAYDATE: null,
                        COMPANYID: "",
                        DEPARTMENTID: "",
                        FUNCTION: "",
                        selectedRoles: []
                    });

                    oView.setModel(oNewUserModel, "newUser");

                    this.loadRoles();
                    this.loadCompanies();

                    this._oCreateUserDialog.open();
                });

            } else {
                this.resetNewUserModel();
                this._oCreateUserDialog.open();
            }
        },

        // Lógica para guardar la creación del usuario
        onSaveUser: async function () {
            const oView = this.getView();
            const oNewUser = oView.getModel("newUser").getData();
            var oModel = this.getView().getModel("newUser");

            oNewUser.USERNAME = `${oNewUser.FIRSTNAME || ""} ${oNewUser.LASTNAME || ""}`.trim();

            // Lista de campos obligatorios
            const requiredFields = [
                "USERID", "PASSWORD", "ALIAS", "FIRSTNAME", "LASTNAME", "EMPLOYEEID", "EXTENSION",
                "USERNAME", "EMAIL", "PHONENUMBER", "BIRTHDAYDATE", "AVATAR", "COMPANYID",
                "DEPARTMENT", "FUNCTION", "STREET", "POSTALCODE", "CITY", "REGION", "STATE", "COUNTRY"
            ];

            for (const field of requiredFields) {
                if (
                    oNewUser[field] === undefined ||
                    oNewUser[field] === null ||
                    oNewUser[field] === "" ||
                    (field === "POSTALCODE" && (oNewUser[field] === "" || isNaN(oNewUser[field])))
                ) {
                    MessageBox.warning(`El campo obligatorio "${field}" está vacío o es inválido.`);
                    return;
                }
            }

            var aSelectedRoles = oModel.getProperty("/selectedRoles") || [];

            if (aSelectedRoles.length === 0) {
                MessageBox.error("Debe seleccionar al menos un rol");
                return;
            }

            // Lllama el payload
            const payload = this.prepareUserPayload(oNewUser, aSelectedRoles, false);

            // console.log("Payload de usuario:", payload);

            try {
                // Obtener configuración del entorno
                const envRes = await fetch("env.json");
                const env = await envRes.json();
                const url = env.API_USERS_URL_BASE + "createUser";

                // Enviar petición POST
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + env.API_TOKEN
                    },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (res.ok) {
                    MessageToast.show("Usuario creado exitosamente");
                    this.byId("AddUserDialog").close();
                    this.loadUsers();

                } else {
                    MessageBox.error("Error: " + (result.message || "No se pudo crear el usuario"));
                }

            } catch (e) {
                console.error("Error al guardar usuario:", e);
                MessageBox.error("Error de conexión con el servidor.");
            }
        },

        // Cancelar la creación del usuario
        onCancelUser: function () {
            const oDialog = this.byId("AddUserDialog");
            if (oDialog) {
                oDialog.close(); // Cerrar
            }

            this.resetNewUserModel(); // limpiar los campos
        },

        //=========================================================================================================================================================
        //=============== EDITAR USUARIO ==========================================================================================================================
        //=========================================================================================================================================================

        // --- Abrir modal para editar usuario --- 
        onEditUser: function () {
            var oView = this.getView();

            if (!this.selectedUser) {
                MessageToast.show("Selecciona un usuario primero");
                return;
            }

            if (this._oEditUserDialog) {
                this._oEditUserDialog.destroy();
                this._oEditUserDialog = null;
            }

            if (!this._oEditUserDialog) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.invertions.sapfiorimodinv.view.security.fragments.EditUserDialog",
                    controller: this
                }).then(async oDialog => {
                    this._oEditUserDialog = oDialog;
                    oView.addDependent(oDialog);

                    // Cargar datos del usuario antes de abrir el diálogo
                    await this._loadUserDataForEdit(this.selectedUser.USERID);

                    this._oEditUserDialog.open();
                });
            } else {
                this._loadUserDataForEdit(this.selectedUser.USERID).then(() => {
                    this._oEditUserDialog.open();
                });
            }
        },

        onEditSaveUser: async function () {
            try {
                const oView = this.getView();
                oView.setBusy(true);

                // 1. Obtener datos del modelo de edición
                const oEditModel = oView.getModel("editUser");
                const oUserData = oEditModel.getData();

                // 2. Validación detallada de campos obligatorios
                // const requiredFields = [
                //     "USERID", "PASSWORD", "ALIAS", "FIRSTNAME", "LASTNAME", "EMPLOYEEID", "EXTENSION",
                //     "USERNAME", "EMAIL", "PHONENUMBER", "BIRTHDAYDATE", "AVATAR", "COMPANYID",
                //     "DEPARTMENT_ID", "FUNCTION", "STREET", "POSTALCODE", "CITY", "REGION", "STATE", "COUNTRY"
                // ];

                // for (const field of requiredFields) {
                //     if (
                //         oUserData[field] === undefined ||
                //         oUserData[field] === null ||
                //         oUserData[field] === "" ||
                //         (field === "POSTALCODE" && (oUserData[field] === "" || isNaN(oUserData[field])))
                //     ) {
                //         MessageBox.warning(`El campo obligatorio "${field}" está vacío o es inválido.`);
                //         oView.setBusy(false);
                //         return;
                //     }
                // }

                // 3. Validar al menos un rol
                var aSelectedRoles = oEditModel.getProperty("/selectedRoles") || [];
                if (aSelectedRoles.length === 0) {
                    MessageBox.error("Debe seleccionar al menos un rol");
                    oView.setBusy(false);
                    return;
                }

                // 4. Obtener el nombre del departamento basado en DEPARTMENT_ID
                const aDeptos = oView.getModel("deptosModel").getData().value || [];
                const oSelectedDepto = aDeptos.find(dept => dept.VALUEID === oUserData.DEPARTMENT_ID);

                if (!oSelectedDepto) {
                    MessageBox.error("El departamento seleccionado no es válido");
                    return;
                }

                // Asignar el nombre del departamento
                const sDepartmentName = oSelectedDepto.VALUE;
                oEditModel.setProperty("/DEPARTMENT", sDepartmentName);

                // 5. Construir payload con TODOS los campos
                const payload = this.prepareUserPayload(oUserData, aSelectedRoles, true);

                // Elimina la propiedad PASSWORD si no fue cambiada
                if (payload.user.PASSWORD === undefined) {
                    delete payload.user.PASSWORD;
                }

                // console.log("Payload de actualización:", payload);

                // 6. Obtener configuración del entorno
                const envRes = await fetch("env.json");
                const env = await envRes.json();
                const url = `${env.API_USERS_URL_BASE}updateone?USERID=${encodeURIComponent(oUserData.USERID)}`;

                // 7. Enviar petición PUT
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + env.API_TOKEN
                    },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (res.ok) {
                    MessageToast.show("Usuario actualizado exitosamente");
                    this.onEditCancelUser();
                    this.loadUsers();
                } else {
                    MessageBox.error("Error: " + (result.message || "No se pudo actualizar el usuario"));
                }

            } catch (e) {
                console.error("Error al actualizar usuario:", e);
                MessageBox.error("Error de conexión con el servidor.");
            } finally {
                this.getView().setBusy(false);
            }
        },

        onEditRoleSelected: function (oEvent) {
            const oSelectedItem = oEvent.getSource().getSelectedItem();
            if (!oSelectedItem) return;

            const sRoleId = oSelectedItem.getKey();
            const sRoleName = oSelectedItem.getText();

            const oModel = this.getView().getModel("editUser");
            const aRoles = oModel.getProperty("/selectedRoles") || [];

            // Verificar por nombre de rol
            if (aRoles.some(role => role.ROLENAME === sRoleName)) {
                MessageToast.show("Este rol ya fue agregado.");
                oEvent.getSource().setSelectedKey(null);
                return;
            }

            aRoles.push({
                ROLEID: sRoleId,
                ROLENAME: sRoleName
            });
            oModel.setProperty("/selectedRoles", aRoles);

            this._updateSelectedRolesView(aRoles, true);
            oEvent.getSource().setSelectedKey(null);
        },

        // Cancelar la edición del usuario
        onEditCancelUser: function () {
            if (this._oEditUserDialog) {
                this._oEditUserDialog.close();
                this._oEditUserDialog.destroy();
                this._oEditUserDialog = null;
            }
        },


        // =========================================================================================================================================================
        // ========= ELIMINAR USUARIO FISICAMENTE ==================================================================================================================
        // =========================================================================================================================================================

        /**
         * Función onDeleteUser .
         */
        onDeleteUser: function () {
            if (this.selectedUser) {
                var that = this;
                MessageBox.confirm("¿Deseas eliminar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar eliminación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.deleteUser(that.selectedUser.USERID);
                        }
                    }
                });
            } else {
                MessageToast.show("Selecciona un usuario para eliminar de la base de datos");
            }
        },

        async deleteUser(UserId) {
            await this._executeUserAction(
                UserId,
                "physicalDeleteUser",
                "Usuario eliminado correctamente",
                "eliminación"
            );
        },


        // =========================================================================================================================================================
        // ============ DESACTIVAR EL USUARIO (ELIMINADOR LÓGICO) ==================================================================================================
        // =========================================================================================================================================================

        // Modal para desactivar usuario (eliminar lógico)
        onDesactivateUser: function () {
            if (this.selectedUser) {
                // Validar si ya está inactivo
                if (this.selectedUser.DETAIL_ROW?.ACTIVED === false) {
                    MessageToast.show("El usuario ya está inactivo.");
                    return;
                }
                var that = this;
                MessageBox.confirm("¿Deseas desactivar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar desactivación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.desactivateUser(that.selectedUser.USERID);
                        }
                    }
                });
            } else {
                MessageToast.show("Selecciona un usuario para desactivar");
            }
        },

        // Lógica para desactivar usuario (eliminar lógico)
        async desactivateUser(UserId) {
            await this._executeUserAction(
                UserId,
                "deleteusers",
                "Usuario desactivado correctamente",
                "desactivación"
            );
        },

        // =========================================================================================================================================================
        // ============== ACTIVAR EL USUARIO =======================================================================================================================
        // =========================================================================================================================================================

        onActivateUser: function () {
            if (this.selectedUser) {
                // Validar si ya está activo
                if (this.selectedUser.DETAIL_ROW?.ACTIVED === true) {
                    MessageToast.show("El usuario ya está activo.");
                    return;
                }
                var that = this;
                MessageBox.confirm("¿Deseas activar el usuario con nombre: " + this.selectedUser.USERNAME + "?", {
                    title: "Confirmar activación",
                    icon: MessageBox.Icon.WARNING,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            that.activateUser(that.selectedUser.USERID);
                        }
                    }
                });
            } else {
                MessageToast.show("Selecciona un usuario para activar");
            }
        },

        async activateUser(UserId) {
            await this._executeUserAction(
                UserId,
                "activateusers",
                "Usuario activado correctamente",
                "activación"
            );
        },

        //============================================================================================================================================
        //=============== FUNCIONES DE LA TABLA ======================================================================================================
        //============================================================================================================================================

        /**
         * Función que obtiene el usuario que se selecciona en la tabla en this.selectedUser se guarda todo el usuario
         * Además activa los botones de editar/eliminar/desactivar y activar
         */
        onUserRowSelected: function () {
            var oTable = this.byId("IdTable1UsersManageTable");
            var iSelectedIndex = oTable.getSelectedIndex();

            if (iSelectedIndex < 0) {
                this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);
                return;
            }

            var oContext = oTable.getContextByIndex(iSelectedIndex);
            var UserData = oContext.getObject();

            this.selectedUser = UserData;

            // Activa los botones
            this.getView().getModel("viewModel").setProperty("/buttonsEnabled", true);
        },

        onSearchUser: function (oEvent) {
            try {
                const sQueryRaw = oEvent.getSource().getValue();
                const sQuery = this._normalizeText(sQueryRaw);
                const oTable = this.getView().byId("IdTable1UsersManageTable");

                if (sQuery) {
                    const aSearchFields = [
                        "USERID",
                        "USERNAME",
                        "BIRTHDAYDATE",
                        "COMPANYNAME",
                        "EMAIL",
                        "PHONENUMBER",
                        "FUNCTION"
                    ];

                    const aFilters = aSearchFields.map(sField => {
                        return new sap.ui.model.Filter({
                            path: sField,
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sQueryRaw
                        });
                    });

                    // Filtro para ROLES
                    const oRolesFilter = new sap.ui.model.Filter({
                        path: "ROLES",
                        test: (aRoles) => {
                            const sFormattedRoles = this._normalizeText(this.formatRoles(aRoles));
                            return sFormattedRoles.includes(sQuery);
                        }
                    });

                    // Filtro para estado Activo/Inactivo
                    // Busca tanto por la palabra completa, o por las primeras letras que coinciden
                    const oStatusFilter = new sap.ui.model.Filter({
                        path: "",
                        test: (oContext) => {
                            const bActive = oContext?.DETAIL_ROW?.ACTIVED;
                            const sStatus = this._normalizeText(this.formatStatusText(bActive));
                            const sNormalizedQuery = this._normalizeText(sQuery);

                            return sStatus.startsWith(sNormalizedQuery);
                        }
                    });


                    // Filtro para nombre parcial del DEPARTAMENTO
                    const oDepartmentFilter = new sap.ui.model.Filter({
                        path: "DEPARTMENT",
                        test: (sDepartmentName) => {
                            const sDept = this._normalizeText(sDepartmentName);
                            return sDept.includes(sQuery);
                        }
                    });

                    // Combinar filtros
                    const oCombinedFilter = new sap.ui.model.Filter([
                        ...aFilters,
                        oRolesFilter,
                        oStatusFilter,
                        oDepartmentFilter
                    ], false);

                    oTable.getBinding("rows").filter(oCombinedFilter);
                } else {
                    oTable.getBinding("rows").filter([]);
                }
            } catch (error) {
                console.error("Error en búsqueda:", error);
                MessageBox.error("Error al realizar la búsqueda");
            }
        },


        // Función auxiliar para normalizar texto
        _normalizeText: function (sText) {
            if (!sText) return "";
            return sText.toString()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
        },


        onRefresh: function () {
            this.loadUsers();
        },



        //====================================================================================================================================================================
        //=========== FUNCIONES PARA CARGAR INFORMACIÓN ======================================================================================================================
        //====================================================================================================================================================================

        /*
            Funcion para cargar la lista de usuarios en la tabla
        */
        loadUsers: function () {
            var oTable = this.byId("IdTable1UsersManageTable");
            var oModel = new JSONModel();
            var that = this;
            /*
                En nuestro proyecto nosotros creamos un archivo llamado en.json para cargar la url de las apis
                Cambiar esto segun su backend
            */
            fetch("env.json")
                .then(res => res.json())
                .then(env => fetch(env.API_USERS_URL_BASE + "getAllUsers"))
                .then(res => res.json())
                .then(data => {
                    data.value.forEach(user => {
                        // user.ROLES = that.formatRoles(user.ROLES);
                    });
                    oModel.setData(data);
                    that.getView().setModel(oModel);

                })
                .catch(err => {
                    if (err.message === ("Cannot read properties of undefined (reading 'setModel')")) {
                        return;
                    } else {
                        MessageToast.show("Error al cargar usuarios: " + err.message);
                    }
                });
        },
        /* 
            Carga las compañias que se encuentran registradas en la base de datos.
            Las compañias tendran diferentes departamentos registrados, por lo que es primero elegir una
            compañia antes que un departamento.
        */
        loadCompanies: function () {
            var that = this;
            var oModel = new JSONModel();

            fetch("env.json")
                .then(res => res.json())
                .then(env => fetch(env.API_VALUES_URL_BASE + "getLabelById?labelid=IdCompanies"))
                .then(res => res.json())
                .then(data => {
                    oModel.setData(data);
                    that.getView().setModel(oModel, "companiesModel");
                    this.loadDeptos();
                })
                .catch(err => {
                    MessageToast.show("Error al cargar las compañías: " + err.message);
                });
        },

        /* 
            Carga los departamentos que se encuentran en la base de datos.
            Esta función mostrará información diferente dependiendo de los departamentos
            registrados en cada compañia, por lo que primero tiene que hacer la consulta
            de las compañias y elegir una para ejecutar esta función.
        */
        loadDeptos: function (companyId, selectedDepto = "") {
            // console.log("🔧 Entrando a loadDeptos con companyId:", companyId);

            if (!companyId) {
                console.warn("⚠️ companyId está vacío o undefined. Abortando fetch.");
                return;
            }

            var that = this;
            var oModel = new JSONModel();

            fetch("env.json")
                .then(res => res.json())
                .then(env => {
                    var url = env.API_VALUES_URL_BASE + "getCompanyById?companyid=" + encodeURIComponent(companyId);
                    // console.log("🌐 URL de fetch departamentos:", url);
                    return fetch(url);
                })
                .then(res => res.json())
                .then(data => {
                    if (!data.value && Array.isArray(data)) {
                        data = { value: data };
                    }

                    oModel.setData(data);
                    that.getView().setModel(oModel, "deptosModel");

                    if (selectedDepto) {
                        const oEditModel = that.getView().getModel("editUser");
                        if (oEditModel) {
                            const deptExists = data.value.some(dept => dept.DEPARTMENTID === selectedDepto);
                            if (deptExists) {
                                oEditModel.setProperty("/DEPARTMENT", selectedDepto);
                                // console.log("🏢 Departamento seleccionado en el modelo editUser:", selectedDepto);
                                const oDeptoCombo = that.byId("comboBoxEditCedis");
                                if (oDeptoCombo) {
                                    oDeptoCombo.setSelectedKey(selectedDepto);
                                }
                            } else {
                                console.warn("El departamento del usuario no existe en la lista de departamentos de la compañía");
                            }
                        }
                    }
                })
                .catch(err => {
                    MessageToast.show("Error al cargar los departamentos: " + err.message);
                });
        },


        /*
            Funciones para cargar en los combobox para creación y edición de usuario
            Asi como tambien el formato que se mostrará en la tabla
         */
        loadRoles: function () {
            var oView = this.getView();
            var oRolesModel = new JSONModel();

            return fetch("env.json")
                .then(res => res.json())
                .then(env => fetch(env.API_ROLES_URL_BASE + "getall"))
                .then(res => res.json())
                .then(data => {
                    const uniqueRoles = [];
                    const seenNames = new Set();

                    data.value.forEach(role => {
                        const roleName = role.ROLEIDSAP || role.ROLENAME || role.ROLEID;

                        if (!seenNames.has(roleName)) {
                            seenNames.add(roleName);
                            uniqueRoles.push({
                                ROLEID: role.ROLEID,
                                ROLENAME: roleName,
                                ROLEIDSAP: role.ROLEIDSAP
                            });
                        }
                    });

                    uniqueRoles.sort((a, b) => a.ROLENAME.localeCompare(b.ROLENAME));

                    oRolesModel.setData({ roles: uniqueRoles });
                    oView.setModel(oRolesModel, "rolesModel");
                })
                .catch(err => {
                    MessageToast.show("Error al cargar roles: " + err.message);
                    console.error("Error loading roles:", err);
                });
        },

        onRoleSelected: function (oEvent) {
            const oComboBox = oEvent.getSource();
            const sSelectedKey = oComboBox.getSelectedKey();
            const sSelectedText = oComboBox.getSelectedItem().getText();

            const oModel = this.getView().getModel("newUser");
            const aSelectedRoles = oModel.getProperty("/selectedRoles") || [];

            if (aSelectedRoles.some(role => role.ROLENAME === sSelectedText)) {
                MessageToast.show("Este rol ya fue seleccionado");
                oComboBox.setSelectedKey(null);
                return;
            }

            aSelectedRoles.push({
                ROLEID: sSelectedKey,
                ROLENAME: sSelectedText
            });

            oModel.setProperty("/selectedRoles", aSelectedRoles);
            this._updateSelectedRolesView(aSelectedRoles, false);

            // Limpiar selección
            oComboBox.setSelectedKey(null);
        },

        _updateSelectedRolesView: function (aRoles, bIsEditDialog) {
            var oVBox = this.byId(bIsEditDialog ? "selectedEditRolesVBox" : "selectedRolesVBox");
            oVBox.destroyItems();

            aRoles.forEach(function (oRole) {
                var oHBox = new sap.m.HBox({
                    items: [
                        new sap.m.Label({
                            text: oRole.ROLENAME || oRole.ROLEID
                        }).addStyleClass("sapUiSmallMarginEnd"),
                        new sap.m.Button({
                            icon: "sap-icon://decline",
                            type: sap.m.ButtonType.Transparent,
                            press: this._onRemoveRole.bind(this, oRole.ROLEID, bIsEditDialog)
                        })
                    ]
                });
                oHBox.data("roleId", oRole.ROLEID);
                oVBox.addItem(oHBox);
            }.bind(this));
        },

        /*
           Para eliminar los roles al añadir o editar usuario.
       */
        _onRemoveRole: function (sRoleId, bIsEditDialog) {
            const sModelName = bIsEditDialog ? "editUser" : "newUser";
            const oModel = this.getView().getModel(sModelName);

            const aSelectedRoles = oModel.getProperty("/selectedRoles").filter(
                role => role.ROLEID !== sRoleId
            );

            oModel.setProperty("/selectedRoles", aSelectedRoles);
            this._updateSelectedRolesView(aSelectedRoles, bIsEditDialog);
        },

        /*
            Formato que se muestren de los roles en la tabla.
        */
        formatRoles: function (aRoles) {
            if (!Array.isArray(aRoles)) {
                return "";
            }

            const aRoleNames = aRoles.map(function (oRole) {
                return oRole.ROLEIDSAP?.trim() || oRole.ROLEID?.trim() || "";
            }).filter(Boolean); // Eliminar valores vacíos

            return aRoleNames.join(", ");
        },

        //=======================================================================================================================================================
        //=========== Funciones de validaciones o extras ========================================================================================================
        //=======================================================================================================================================================

        // ...existing code...
        resetNewUserModel: function () {
            const oView = this.getView();
            // Limpia el modelo de datos
            oView.setModel(new sap.ui.model.json.JSONModel({
                USERID: "",
                PASSWORD: "",
                ALIAS: "",
                FIRSTNAME: "",
                LASTNAME: "",
                EMPLOYEEID: "",
                EXTENSION: "",
                EMAIL: "",
                PHONENUMBER: "",
                BIRTHDAYDATE: null,
                AVATAR: "",
                COMPANYID: "",
                DEPARTMENT: "",
                FUNCTION: "",
                STREET: "",
                POSTALCODE: "",
                CITY: "",
                REGION: "",
                STATE: "",
                COUNTRY: "",
                selectedRoles: []
            }), "newUser");
            // Limpia la vista de roles seleccionados
            const rolesVBox = oView.byId("selectedRolesVBox");
            if (rolesVBox) {
                rolesVBox.removeAllItems();
            }
        },

        //----------------------------------------------------------------------------------------------------------------------------------------------------
        // Formato del texto para la columna de STATUS
        formatStatusText: function (bIsActive) {
            return bIsActive ? "Activo" : "Inactivo";
        },

        formatStatusState: function (bIsActive) {
            return bIsActive ? "Success" : "Warning";
        },
        //----------------------------------------------------------------------------------------------------------------------------------------------------
        // Para guardar el VALUEID al seleccionar compañia
        onCompanySelected: function (oEvent) {
            const oView = this.getView();
            const oComboBox = oEvent.getSource();
            const oSelectedItem = oComboBox.getSelectedItem();

            if (!oSelectedItem) { return; }

            const sCompanyId = oSelectedItem.getKey();
            const sCompanyName = oSelectedItem.getText();

            // 1. Limpiar ComboBox de departamentos
            const oDeptosModel = new sap.ui.model.json.JSONModel({ value: [] });
            oView.setModel(oDeptosModel, "deptosModel");

            // 2. Limpiar selección visual de departamentos
            const oCedisComboBox = oView.byId("comboBoxCedis");
            // oCedisComboBox.setSelectedKey(null);
            oCedisComboBox.setValue("");

            // 3. Actualizar el modelo del nuevo usuario
            const oUserModel = oView.getModel("newUser");
            oUserModel.setProperty("/COMPANYID", sCompanyId);
            oUserModel.setProperty("/COMPANYNAME", sCompanyName);
            oUserModel.setProperty("/CEDIID", "");
            oUserModel.setProperty("/CEDINAME", "");

            // 4. Llamar a la función para cargar departamentos
            this.loadDeptos(sCompanyId);
        },

        formatDateToString: function (date) {
            if (!date) return null;

            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();

            return `${day}.${month}.${year}`;
        },

        /*
            Función que permite reutilizar codigo para aquellas rutas que tienen la misma estructura
        */
        async _executeUserAction(UserId, sEndpoint, sSuccessMessage, sActionName) {
            try {
                const oView = this.getView();
                oView.setBusy(true);

                // 1. Cargar configuración del entorno
                const envRes = await fetch("env.json");
                const env = await envRes.json();


                const sUrl = `${env.API_USERS_URL_BASE}${sEndpoint}?${sEndpoint === 'physicalDeleteUser' ? 'userid' : 'USERID'}=${encodeURIComponent(UserId)}`;

                // 2. Configurar y enviar petición
                const response = await fetch(sUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${env.API_TOKEN}`
                    }
                });

                // 3. Procesar respuesta de forma segura
                let result = {};
                try {
                    result = await response.json();
                } catch (parseError) {
                    console.error(`Error al parsear la respuesta JSON (${sActionName}):`, parseError);
                    MessageBox.error("Respuesta del servidor no válida");
                    return;
                }

                // 4. Validar éxito de la operación
                if (response.ok || result.success === true || result.deleted === true || result.status === "success") {
                    MessageToast.show(sSuccessMessage);
                    this.loadUsers();

                    // Limpiar selección
                    this.selectedUser = null;
                    this.getView().getModel("viewModel").setProperty("/buttonsEnabled", false);
                } else {
                    const sMessage = result.message || result.error || `El usuario no pudo ser ${sActionName === 'eliminación' ? 'eliminado' : 'desactivado'}`;
                    MessageBox.error(sMessage);
                }

            } catch (error) {
                console.error(`Error en ${sActionName}:`, error);

                let sErrorMessage = `Error durante la ${sActionName}`;
                if (error.message.includes("Failed to fetch")) {
                    sErrorMessage = "Error de conexión con el servidor";
                } else if (error.message.includes("404")) {
                    sErrorMessage = "El usuario ya no existe";
                }

                MessageBox.error(`${sErrorMessage}: ${error.message}`);
            } finally {
                this.getView().setBusy(false);
            }
        },

        // Cargar los datos en la vista de Editar
        async _loadUserDataForEdit(UserId) {
            try {
                const oView = this.getView();
                oView.setBusy(true);

                // 1. Cargar configuración del entorno
                const envRes = await fetch("env.json");
                const env = await envRes.json();

                // 2. Obtener datos del usuario
                const sUserUrl = `${env.API_USERS_URL_BASE}getUserById?userid=${encodeURIComponent(UserId)}`;
                const userResponse = await fetch(sUserUrl, {
                    headers: {
                        "Authorization": `Bearer ${env.API_TOKEN}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error(`Error ${userResponse.status}`);
                }

                const oUserData = await userResponse.json();

                // 3. Parsear fecha de nacimiento
                let parsedBirthdayDate = this._parseDateString(oUserData.BIRTHDAYDATE);
                if (!parsedBirthdayDate || Object.prototype.toString.call(parsedBirthdayDate) !== "[object Date]") {
                    parsedBirthdayDate = null;
                }

                // 4. Crear modelo para el formulario de edición
                const oEditModel = new JSONModel({
                    USERID: oUserData.USERID,
                    PASSWORD: "******", // Mostrar encriptado
                    ALIAS: oUserData.ALIAS || "",
                    FIRSTNAME: oUserData.FIRSTNAME || "",
                    LASTNAME: oUserData.LASTNAME || "",
                    EMPLOYEEID: oUserData.EMPLOYEEID || "",
                    EXTENSION: oUserData.EXTENSION || "",
                    USERNAME: oUserData.USERNAME || "",
                    EMAIL: oUserData.EMAIL || "",
                    PHONENUMBER: oUserData.PHONENUMBER || "",
                    BIRTHDAYDATE: parsedBirthdayDate,
                    AVATAR: oUserData.AVATAR || "",
                    COMPANYID: oUserData.COMPANYID || "",
                    COMPANYNAME: oUserData.COMPANYNAME || "",
                    DEPARTMENT: oUserData.DEPARTMENT || "",
                    DEPARTMENT_ID: "",
                    FUNCTION: oUserData.FUNCTION || "",
                    STREET: oUserData.STREET || "",
                    POSTALCODE: oUserData.POSTALCODE || "",
                    CITY: oUserData.CITY || "",
                    REGION: oUserData.REGION || "",
                    STATE: oUserData.STATE || "",
                    COUNTRY: oUserData.COUNTRY || "",
                    selectedRoles: oUserData.ROLES || []
                });

                oView.setModel(oEditModel, "editUser");

                // 5. Cargar combo de compañías
                await this.loadCompanies();

                // 6. Si tenemos COMPANYID, cargar los departamentos
                if (oUserData.COMPANYID) {
                    // Cargar departamentos de la compañía
                    const sDeptUrl = `${env.API_VALUES_URL_BASE}getCompanyById?companyid=${encodeURIComponent(oUserData.COMPANYID)}`;
                    const deptResponse = await fetch(sDeptUrl);
                    const oDeptData = await deptResponse.json();

                    if (oDeptData.value) {
                        // Crear modelo de departamentos
                        const oDeptModel = new JSONModel({
                            value: oDeptData.value
                        });
                        oView.setModel(oDeptModel, "deptosModel");

                        // Buscar el departamento que coincide con el nombre del usuario
                        const foundDept = oDeptData.value.find(dept =>
                            dept.VALUE === oUserData.DEPARTMENT
                        );

                        // Si encontramos el departamento, actualizar el modelo con el VALUEID
                        if (foundDept) {
                            oEditModel.setProperty("/DEPARTMENT_ID", foundDept.VALUEID);

                            // Forzar la selección visual en el combobox
                            const oDeptCombo = oView.byId("comboBoxEditCedis");
                            if (oDeptCombo) {
                                oDeptCombo.setSelectedKey(foundDept.VALUEID);
                            }
                        }
                    }
                }

                // 7. Cargar roles
                await this.loadRoles();

                // 8. Mostrar roles seleccionados

                const aAllRoles = oView.getModel("rolesModel").getProperty("/roles") || [];
                const aUserRoles = (oUserData.ROLES || []).map(userRole => {
                    const found = aAllRoles.find(r => r.ROLEID === userRole.ROLEID || r.ROLEID === userRole);
                    return {
                        ROLEID: userRole.ROLEID || userRole,
                        ROLENAME: found ? found.ROLENAME : (userRole.ROLENAME || userRole.ROLEID || userRole)
                    };
                });
                oEditModel.setProperty("/selectedRoles", aUserRoles);

                this._updateSelectedRolesView(aUserRoles, true);

                // 9. Forzar la selección visual en los combobox
                if (oUserData.COMPANYID) {
                    const oCompanyCombo = oView.byId("comboBoxEditCompanies");
                    oCompanyCombo.setSelectedKey(oUserData.COMPANYID);
                }

                // 10. Establecer la función en el input
                const oFunctionInput = oView.byId("inputEditUserFunction");
                if (oUserData.FUNCTION) {
                    oFunctionInput.setValue(oUserData.FUNCTION);
                }

            } catch (error) {
                console.error("Error al cargar datos del usuario:", error);
                MessageBox.error(`Error al cargar datos: ${error.message}`);
            } finally {
                this.getView().setBusy(false);
            }
        },

        // Formato de la fecha de la API
        _formatDateForAPI: function (oDate) {
            if (!oDate) return null;

            // Si ya es string en formato DD.MM.YYYY, devolverlo así
            if (typeof oDate === 'string' && oDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                return oDate;
            }

            // Si es objeto Date, formatear a DD.MM.YYYY
            if (oDate instanceof Date) {
                const day = String(oDate.getDate()).padStart(2, '0');
                const month = String(oDate.getMonth() + 1).padStart(2, '0');
                const year = oDate.getFullYear();
                return `${day}.${month}.${year}`;
            }

            return null;
        },

        //Revisa si ya es de tipo DATE,
        _parseDateString: function (sDate) {
            if (!sDate) return null;

            // Formato DD.MM.YYYY (09.05.2025)
            const ddmmyyyyMatch = sDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (ddmmyyyyMatch) {
                const [_, day, month, year] = ddmmyyyyMatch;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }

            // Formato ISO o Date existente
            if (Object.prototype.toString.call(sDate) === "[object Date]") {
                return sDate;
            }

            // Intentar parsear como fecha ISO
            const parsedDate = new Date(sDate);
            return isNaN(parsedDate.getTime()) ? null : parsedDate;
        },


        onEditCompanySelected: async function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) return;

            const sCompanyId = oSelectedItem.getKey();
            const sCompanyName = oSelectedItem.getText();
            const oView = this.getView();
            const oEditModel = oView.getModel("editUser");

            // Actualizar el modelo
            oEditModel.setProperty("/COMPANYID", sCompanyId);
            oEditModel.setProperty("/COMPANYNAME", sCompanyName);

            oEditModel.setProperty("/DEPARTMENT_ID", "");
            oEditModel.setProperty("/DEPARTMENT", "");

            // Cargar los departamentos de la nueva compañía
            try {
                const envRes = await fetch("env.json");
                const env = await envRes.json();

                const sDeptUrl = `${env.API_VALUES_URL_BASE}getCompanyById?companyid=${encodeURIComponent(sCompanyId)}`;
                const deptResponse = await fetch(sDeptUrl);
                const oDeptData = await deptResponse.json();

                if (oDeptData.value) {
                    const oDeptModel = new JSONModel({
                        value: oDeptData.value
                    });
                    oView.setModel(oDeptModel, "deptosModel");
                }
            } catch (error) {
                console.error("Error al cargar departamentos:", error);
                MessageToast.show("Error al cargar departamentos");
            }
        },


        onPhoneNumberLiveChange: function (oEvent) {
            let sValue = oEvent.getParameter("value") || "";
            // Solo números
            sValue = sValue.replace(/\D/g, "");
            // Máximo 10 dígitos
            sValue = sValue.substring(0, 10);

            // Formato 311-247-9021
            let sFormatted = sValue;
            if (sValue.length > 6) {
                sFormatted = sValue.replace(/(\d{3})(\d{3})(\d{1,4})/, "$1-$2-$3");
            } else if (sValue.length > 3) {
                sFormatted = sValue.replace(/(\d{3})(\d{1,3})/, "$1-$2");
            }

            // Detectar modelo (editUser o newUser)
            const oInput = oEvent.getSource();
            const oBinding = oInput.getBinding("value");
            const sModelName = oBinding && oBinding.getModel().sName; // "editUser" o "newUser"
            const oModel = this.getView().getModel(sModelName);

            if (oModel) {
                oModel.setProperty("/PHONENUMBER", sFormatted);
            }
            oInput.setValue(sFormatted);
        },


    });


});
