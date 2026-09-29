"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller, JSONModel, api) {
    return Controller.extend('simulynx.controller.Stress', {
        onInit() {
            this._model = new JSONModel({ scenario: '', factors: [] });
            this.getView().setModel(this._model, 'stress');
            this.getOwnerComponent().getRouter().getRoute('stress').attachPatternMatched(this.load.bind(this));
        },
        async load() {
            const active = api.unpack(await api.read('/odata/v4/simulation/active()'));
            const payload = api.unpack(await api.read(`/odata/v4/analytics/stress(runId='${active.run.ID}')`));
            this._model.setData(payload);
        },
    });
});
