"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/Filter', 'sap/ui/model/FilterOperator', 'sap/ui/core/Item'], function (Controller, Filter, FilterOperator, Item) {
    return Controller.extend('simulynx.controller.Personas', {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute('personas').attachPatternMatched(this.prepare.bind(this));
        },
        prepare() {
            const select = this.byId('department');
            if (select.getItems().length)
                return;
            select.addItem(new Item({ key: '', text: 'All departments' }));
            const model = this.getOwnerComponent().getModel('workforce');
            const list = model.bindList('/Departments', null, null, null, { $orderby: 'name' });
            list.requestContexts().then((contexts) => {
                for (const context of contexts) {
                    const row = context.getObject();
                    select.addItem(new Item({ key: row.ID, text: row.name }));
                }
            });
        },
        apply() {
            const query = this._query || '';
            const department = this._department || '';
            const filters = [];
            if (query)
                filters.push(new Filter('personaCode', FilterOperator.Contains, query));
            if (department)
                filters.push(new Filter('department_ID', FilterOperator.EQ, department));
            this.byId('personas').getBinding('items').filter(filters.length ? new Filter({ filters, and: true }) : []);
        },
        onFilter(event) {
            this._query = event.getParameter('newValue') || '';
            this.apply();
        },
        onDepartment(event) {
            this._department = event.getParameter('selectedItem').getKey();
            this.apply();
        },
    });
});
