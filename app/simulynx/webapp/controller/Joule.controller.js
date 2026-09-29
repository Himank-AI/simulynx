"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller, JSONModel, api) {
    return Controller.extend('simulynx.controller.Joule', {
        onInit() {
            this._model = new JSONModel({ intro: '', suggestions: [], answer: '' });
            this.getView().setModel(this._model, 'joule');
            this.getOwnerComponent().getRouter().getRoute('joule').attachPatternMatched(this.load.bind(this));
        },
        async load() {
            const payload = api.unpack(await api.read('/odata/v4/joule/suggestions()'));
            this._model.setProperty('/intro', payload.intro);
            this._model.setProperty('/suggestions', payload.suggestions.map((text) => ({ text })));
        },
        onSuggest(event) {
            const title = event.getParameter('listItem').getTitle();
            this.byId('question').setValue(title);
            void this.ask(title);
        },
        onAsk() {
            void this.ask(this.byId('question').getValue());
        },
        async ask(question) {
            const active = api.unpack(await api.read('/odata/v4/simulation/active()'));
            const payload = api.unpack(await api.action('/odata/v4/joule/ask', { runId: active.run.ID, question }));
            this._model.setProperty('/answer', payload.answer);
        },
    });
});
