"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller, JSONModel, api) {
    return Controller.extend('simulynx.controller.Brief', {
        onInit() {
            this._model = new JSONModel({ html: '' });
            this.getView().setModel(this._model, 'brief');
            this.getOwnerComponent().getRouter().getRoute('brief').attachPatternMatched(this.load.bind(this));
        },
        async load() {
            const active = api.unpack(await api.read('/odata/v4/simulation/active()'));
            const brief = api.unpack(await api.read(`/odata/v4/analytics/decisionBrief(runId='${active.run.ID}')`));
            const html = brief.body
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/\n/g, '<br/>');
            this._model.setProperty('/html', `<div class="sxMarkdown">${html}</div>`);
        },
    });
});
