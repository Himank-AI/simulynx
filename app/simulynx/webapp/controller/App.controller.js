"use strict";
const NAV = {
    overview: 'overview',
    workforce: 'workforce',
    personas: 'personas',
    studio: 'studio',
    simulations: 'simulations',
    compare: 'compare',
    skills: 'skills',
    stress: 'stress',
    brief: 'brief',
    history: 'history',
    joule: 'joule',
    settings: 'settings',
};
sap.ui.define(['sap/ui/core/mvc/Controller'], function (Controller) {
    return Controller.extend('simulynx.controller.App', {
        onInit() {
            this.getOwnerComponent().getRouter().attachRouteMatched((event) => {
                const name = event.getParameter('name');
                const item = this.byId('navList').getItems().find((entry) => entry.getKey() === name);
                if (item)
                    this.byId('sideNav').setSelectedItem(item);
            });
        },
        onNav(event) {
            const key = event.getParameter('item').getKey();
            const route = NAV[key];
            if (route)
                this.getOwnerComponent().getRouter().navTo(route);
        },
    });
});
