sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller: any, JSONModel: any, api: any) {
  return Controller.extend('simulynx.controller.Stress', {
    onInit(this: any) {
      this._model = new JSONModel({ scenario: '', factors: [] })
      this.getView().setModel(this._model, 'stress')
      this.getOwnerComponent().getRouter().getRoute('stress').attachPatternMatched(this.load.bind(this))
    },
    async load(this: any) {
      const active = api.unpack(await api.read('/odata/v4/simulation/active()')) as { run: { ID: string } }
      const payload = api.unpack(await api.read(`/odata/v4/analytics/stress(runId='${active.run.ID}')`))
      this._model.setData(payload)
    },
  })
})
