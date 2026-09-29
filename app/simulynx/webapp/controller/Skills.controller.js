"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller, JSONModel, api) {
    return Controller.extend('simulynx.controller.Skills', {
        onInit() {
            this._model = new JSONModel({ current: '', future: '', paths: [], mobility: [] });
            this.getView().setModel(this._model, 'skills');
            this.getOwnerComponent().getRouter().getRoute('skills').attachPatternMatched(this.load.bind(this));
        },
        async load() {
            const [bundlePayload, pathsPayload, mobilityPayload] = await Promise.all([
                api.read('/odata/v4/simulation/active()'),
                api.read('/odata/v4/workforce/CareerPaths?$expand=steps($expand=role)&$top=20'),
                api.read('/odata/v4/workforce/MobilityOptions?$expand=targetRole,targetDepartment&$top=80'),
            ]);
            const bundle = api.unpack(bundlePayload);
            const paths = pathsPayload.value.map((path) => ({
                title: path.title,
                narrative: path.narrative,
                months: `${path.estimatedLearningMonths} months`,
            }));
            this._model.setData({
                current: bundle.skillTransition.current.join(', '),
                future: bundle.skillTransition.future.join(', '),
                paths,
                mobility: mobilityPayload.value,
            });
        },
    });
});
