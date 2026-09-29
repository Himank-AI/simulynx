sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api', 'simulynx/formatter/format'], function (Controller: any, JSONModel: any, api: any, format: any) {
  return Controller.extend('simulynx.controller.Compare', {
    onInit(this: any) {
      this._model = new JSONModel({ runs: [], error: '', hasAlternative: false, question: '' })
      this.getView().setModel(this._model, 'compare')
      this.getOwnerComponent().getRouter().getRoute('compare').attachPatternMatched(this.load.bind(this))
    },
    async load(this: any) {
      const payload = api.unpack(await api.read('/odata/v4/analytics/comparison()')) as { runs: Array<Record<string, any>> }
      this._runs = payload.runs
      this._model.setProperty(
        '/runs',
        payload.runs.map((run) => {
          const high = (run.pathways as Array<{ pathway: string; count: number }>).find((row) => row.pathway === 'HIGH_TRANSITION_RISK')
          return {
            ...run,
            affectedText: format.formatNumber(run.affected),
            reskillText: format.formatNumber(run.reskillDemand),
            redeployText: format.formatNumber(run.redeployDemand),
            highText: format.formatNumber(high?.count),
            horizonText: format.signed(run.productivityHorizon),
          }
        }),
      )
    },
    async onAlternative(this: any) {
      this._model.setProperty('/error', '')
      try {
        const active = api.unpack(await api.read('/odata/v4/simulation/active()')) as { run: { ID: string } }
        const payload = api.unpack(
          await api.action('/odata/v4/counterfactual/runAlternative', {
            runId: active.run.ID,
            automationPercent: Number(this.byId('automation').getSelectedKey()),
            trainingPercent: Number(this.byId('training').getSelectedKey()),
            redeployCapacity: this.byId('redeploy').getSelectedKey(),
            reskillInvestment: this.byId('reskill').getSelectedKey(),
          }),
        ) as { question: string; base: Record<string, number | string>; alternative: { run: Record<string, number | string>; pathways: Array<{ pathway: string; count: number }> } }
        const altHigh = payload.alternative.pathways.find((row) => row.pathway === 'HIGH_TRANSITION_RISK')
        this._model.setProperty('/question', payload.question)
        this._model.setProperty('/hasAlternative', true)
        this._model.setProperty('/base', {
          ...payload.base,
          affectedText: format.formatNumber(payload.base.affected),
          highText: format.formatNumber(payload.base.highTransitionRisk),
          horizonText: format.signed(payload.base.productivityHorizon),
        })
        this._model.setProperty('/alt', {
          affectedText: format.formatNumber(payload.alternative.run.affected),
          highText: format.formatNumber(altHigh?.count),
          skillReadiness: payload.alternative.run.skillReadiness,
          transitionRisk: payload.alternative.run.transitionRisk,
          horizonText: format.signed(payload.alternative.run.productivityHorizon),
        })
      } catch (error) {
        this._model.setProperty('/error', error instanceof Error ? error.message : 'The alternative could not be calculated.')
      }
    },
  })
})
