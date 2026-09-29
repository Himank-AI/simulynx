"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api', 'simulynx/formatter/format'], function (Controller, JSONModel, api, format) {
    return Controller.extend('simulynx.controller.Results', {
        onInit() {
            this._model = new JSONModel({});
            this.getView().setModel(this._model, 'result');
            this.getOwnerComponent().getRouter().getRoute('simulations').attachPatternMatched(this.load.bind(this));
        },
        async load() {
            const bundle = api.unpack(await api.read('/odata/v4/simulation/active()'));
            bundle.run.affectedText = format.formatNumber(bundle.run.affected);
            bundle.run.reskillText = format.formatNumber(bundle.run.reskillDemand);
            bundle.run.redeployText = format.formatNumber(bundle.run.redeployDemand);
            bundle.pathways = bundle.pathways.map((row) => ({ ...row, countText: format.formatNumber(row.count) }));
            this._model.setData(bundle);
        },
    });
});
