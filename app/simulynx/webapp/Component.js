"use strict";
sap.ui.define(['sap/ui/core/UIComponent', 'sap/ui/model/json/JSONModel'], function (UIComponent, JSONModel) {
    return UIComponent.extend('simulynx.Component', {
        metadata: { manifest: 'json' },
        init() {
            UIComponent.prototype.init.apply(this, arguments);
            this.setModel(new JSONModel({
                busy: false,
                error: '',
                phase: 'SIMULATION COMPLETE',
                affected: '—',
                highRisk: '—',
                personas: '2,400',
                scenarioName: '',
                disclaimer: 'Simulation result — not a prediction.',
            }), 'app');
            this.getRouter().initialize();
        },
    });
});
