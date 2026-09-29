"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller, JSONModel, api) {
    return Controller.extend('simulynx.controller.Studio', {
        onInit() {
            this._model = new JSONModel({
                prompt: 'Automate 20% of Customer Support over the next 12 months.',
                draft: {
                    decision: '',
                    departmentId: '',
                    timeHorizonMonths: 12,
                    interventions: { reskilling: false, redeployment: false, roleRedesign: false, hiring: false },
                    reskillInvestment: 0.22,
                    trainingCompletion: 0.68,
                    redeployCapacity: 0.32,
                },
                departments: [],
                magnitudePercent: 20,
                notes: '',
                hasDraft: false,
                canBuild: false,
                canRun: false,
                scenarioId: '',
                error: '',
            });
            this.getView().setModel(this._model, 'studio');
            this.getOwnerComponent().getRouter().getRoute('studio').attachPatternMatched(this.loadDepartments.bind(this));
        },
        async loadDepartments() {
            const payload = (await api.read('/odata/v4/workforce/Departments?$orderby=name'));
            this._model.setProperty('/departments', payload.value);
        },
        async onInterpret() {
            this._model.setProperty('/error', '');
            try {
                const payload = await api.action('/odata/v4/scenario/interpret', { prompt: this._model.getProperty('/prompt') });
                const draft = api.unpack(payload);
                this._model.setProperty('/draft', draft);
                this._model.setProperty('/magnitudePercent', Math.round(Number(draft.automationLevel ?? 0) * 100));
                this._model.setProperty('/notes', draft.notes?.join(' ') ?? '');
                this._model.setProperty('/hasDraft', true);
                this._model.setProperty('/canBuild', Boolean(draft.departmentId));
                this._model.setProperty('/canRun', false);
                this._model.setProperty('/scenarioId', '');
            }
            catch (error) {
                this._model.setProperty('/error', error instanceof Error ? error.message : 'Interpretation failed.');
            }
        },
        onEdit() {
            const draft = this._model.getProperty('/draft');
            if (!draft?.interventions)
                return;
            const reskilling = Boolean(draft.interventions.reskilling);
            const redeployment = Boolean(draft.interventions.redeployment);
            draft.reskillInvestment = reskilling ? 0.82 : 0.22;
            draft.trainingCompletion = reskilling ? 0.86 : 0.68;
            draft.redeployCapacity = redeployment ? 0.84 : 0.32;
            draft.automationLevel = Number(this._model.getProperty('/magnitudePercent')) / 100;
            this._model.setProperty('/draft', draft);
            this._model.setProperty('/canBuild', Boolean(draft.departmentId));
            this._model.setProperty('/canRun', false);
        },
        async onBuild() {
            const draft = this._model.getProperty('/draft');
            this._model.setProperty('/error', '');
            try {
                const payload = await api.action('/odata/v4/scenario/createScenario', {
                    rawPrompt: this._model.getProperty('/prompt'),
                    decision: draft.decision,
                    departmentId: draft.departmentId,
                    automationLevel: Number(this._model.getProperty('/magnitudePercent')) / 100,
                    timeHorizonMonths: Number(draft.timeHorizonMonths),
                    reskilling: Boolean(draft.interventions?.reskilling),
                    redeployment: Boolean(draft.interventions?.redeployment),
                    roleRedesign: Boolean(draft.interventions?.roleRedesign),
                    hiring: Boolean(draft.interventions?.hiring),
                    reskillInvestment: Number(draft.reskillInvestment),
                    trainingCompletion: Number(draft.trainingCompletion),
                    redeployCapacity: Number(draft.redeployCapacity),
                });
                const scenario = api.unpack(payload);
                this._model.setProperty('/scenarioId', scenario.ID);
                this._model.setProperty('/canRun', true);
                this._model.setProperty('/notes', `Scenario ${scenario.ID} is stored. SAP Build Process Automation is not connected; the mock adapter recorded Scenario Created.`);
            }
            catch (error) {
                this._model.setProperty('/error', error instanceof Error ? error.message : 'The scenario was not created.');
            }
        },
        async onRun() {
            const scenarioId = this._model.getProperty('/scenarioId');
            if (!scenarioId)
                return;
            this._model.setProperty('/error', '');
            this.getOwnerComponent().getModel('app').setProperty('/phase', 'ANALYZING DECISION');
            try {
                await api.action('/odata/v4/simulation/execute', { scenarioId });
                this.getOwnerComponent().getRouter().navTo('overview');
                const earth = this.getOwnerComponent().byId('appView');
                void earth;
                sessionStorage.setItem('simulynx-play', '1');
            }
            catch (error) {
                this._model.setProperty('/error', error instanceof Error ? error.message : 'Simulation failed.');
            }
        },
    });
});
