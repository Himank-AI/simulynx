"use strict";
sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'sap/ui/core/Fragment', 'sap/ui/core/Item', 'simulynx/service/api', 'simulynx/formatter/format', 'simulynx/util/earth'], function (Controller, JSONModel, Fragment, Item, api, format, earth) {
    return Controller.extend('simulynx.controller.Earth', {
        onInit() {
            this._filters = { query: '', departmentId: '', roleId: '', skillId: '', location: '', impact: '', risk: '' };
            this._showLinks = true;
            this._showOrbits = true;
            this.getOwnerComponent().getRouter().getRoute('overview').attachPatternMatched(this.load.bind(this));
            this.getOwnerComponent().getRouter().getRoute('workforce').attachPatternMatched(this.load.bind(this));
        },
        async load() {
            const app = this.getOwnerComponent().getModel('app');
            app.setProperty('/busy', true);
            app.setProperty('/error', '');
            try {
                const [organizationPayload, personaPayload, bundlePayload] = await Promise.all([
                    api.read('/odata/v4/workforce/Organizations'),
                    api.read('/odata/v4/workforce/Personas?$expand=role,department,skills($expand=skill),gaps($expand=skill)&$top=100'),
                    api.read('/odata/v4/simulation/active()'),
                ]);
                const organizations = organizationPayload.value;
                const personas = personaPayload.value;
                const bundle = api.unpack(bundlePayload);
                this._personas = personas;
                this._bundle = bundle;
                const org = organizations[0];
                app.setProperty('/personas', format.formatNumber(org?.digitalPersonas));
                app.setProperty('/affected', format.formatNumber(bundle?.run?.affected));
                const high = bundle?.pathways?.find((row) => row.pathway === 'HIGH_TRANSITION_RISK');
                app.setProperty('/highRisk', format.formatNumber(high?.count));
                app.setProperty('/scenarioName', bundle?.scenario?.name ?? '');
                this.renderEarth();
                if (sessionStorage.getItem('simulynx-play') === '1') {
                    sessionStorage.removeItem('simulynx-play');
                    this._earth?.play();
                }
            }
            catch (error) {
                app.setProperty('/error', error instanceof Error ? error.message : 'The workforce could not be loaded.');
            }
            finally {
                app.setProperty('/busy', false);
            }
        },
        renderEarth() {
            const slot = this.byId('canvasSlot');
            const host = slot?.getDomRef?.();
            if (!host) {
                setTimeout(() => this.renderEarth(), 40);
                return;
            }
            let canvas = host.querySelector('canvas');
            if (!canvas) {
                host.style.position = 'relative';
                host.style.minHeight = '720px';
                canvas = document.createElement('canvas');
                canvas.className = 'sxCanvas';
                canvas.setAttribute('aria-label', 'Digital workforce. Synthetic personas orbit the workforce core.');
                host.appendChild(canvas);
                this._earth = earth.createEarth(canvas, {
                    onPersona: (id) => this.openPersona(id),
                    onPhase: (label) => this.getOwnerComponent().getModel('app').setProperty('/phase', label),
                });
            }
            const field = earth.buildField(this._personas ?? [], this._bundle?.departments ?? [], this._bundle?.outcomes ?? [], this._bundle?.scenario?.departmentId ?? '');
            this._earth.setField(field.nodes, field.links);
            this._earth.setFilters(this._filters);
            const cohort = this.byId('cohort');
            if (cohort && cohort.getItems().length === 0) {
                cohort.addItem(new Item({ key: '', text: 'All cohorts' }));
                for (const department of this._bundle.departments) {
                    cohort.addItem(new Item({ key: department.ID, text: department.name }));
                }
            }
        },
        onSearch(event) {
            this._filters.query = event.getParameter('newValue') || '';
            this._earth?.setFilters(this._filters);
        },
        onCohort(event) {
            const key = event.getParameter('selectedItem').getKey();
            this._filters.departmentId = key;
            this._earth?.setFilters(this._filters);
            this._earth?.setFocus(key || null);
        },
        onZoomIn() {
            this._earth?.zoomBy(1.12);
        },
        onZoomOut() {
            this._earth?.zoomBy(1 / 1.12);
        },
        onReset() {
            this._filters = { query: '', departmentId: '', roleId: '', skillId: '', location: '', impact: '', risk: '' };
            this._earth?.reset();
            this._earth?.setFilters(this._filters);
            this.byId('cohort')?.setSelectedKey('');
        },
        onAfterRendering() {
            if (this._personas)
                this.renderEarth();
        },
        async openPersona(id) {
            const outcome = this._bundle?.outcomes?.find((row) => row.personaId === id);
            const persona = this._personas.find((row) => row.ID === id);
            const state = outcome?.pathway === 'HIGH_TRANSITION_RISK' ? 'Error' : outcome?.pathway === 'ADDITIONAL_INTERVENTION' ? 'Warning' : 'Success';
            const model = new JSONModel({
                personaId: id,
                roleName: persona?.role?.name ?? outcome?.roleName ?? '',
                departmentName: persona?.department?.name ?? outcome?.departmentName ?? '',
                location: persona?.location_ID ?? outcome?.location ?? '',
                careerStage: persona?.careerStage_code ?? outcome?.careerStage ?? '',
                workload: persona ? `${persona.workload}%` : '—',
                learningCapacity: persona?.learningCapacity ?? outcome?.learningCapacity ?? '',
                mobilityPotential: persona?.mobilityPotential ?? outcome?.mobilityPotential ?? '',
                pathwayLabel: outcome?.pathwayLabel ?? 'Outside the committed scenario scope',
                skillGapLabel: outcome?.skillGapLabel ?? 'Not in this run',
                transitionScore: outcome ? String(outcome.transitionScore) : '—',
                rationale: outcome?.rationale ?? 'This synthetic persona is in the digital workforce. It is not part of the affected scope of the committed simulation.',
                state,
            });
            if (!this._dialog) {
                this._dialog = await Fragment.load({ name: 'simulynx.fragment.Persona', controller: this });
                this.getView().addDependent(this._dialog);
            }
            this._dialog.setModel(model, 'persona');
            this._dialog.open();
        },
        onClosePersona() {
            this._dialog?.close();
        },
        onResults() {
            this.getOwnerComponent().getRouter().navTo('simulations');
        },
        onCompare() {
            this.getOwnerComponent().getRouter().navTo('compare');
        },
        onStudio() {
            this.getOwnerComponent().getRouter().navTo('studio');
        },
        onExit() {
            this._earth?.destroy();
        },
    });
});
