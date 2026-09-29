sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api', 'simulynx/formatter/format'], function (Controller: any, JSONModel: any, api: any, format: any) {
  return Controller.extend('simulynx.controller.Results', {
    onInit(this: any) {
      this._model = new JSONModel({})
      this.getView().setModel(this._model, 'result')
      this.getOwnerComponent().getRouter().getRoute('simulations').attachPatternMatched(this.load.bind(this))
    },
    async load(this: any) {
      const bundle = api.unpack(await api.read('/odata/v4/simulation/active()')) as Record<string, any>
      bundle.run.affectedText = format.formatNumber(bundle.run.affected)
      bundle.run.reskillText = format.formatNumber(bundle.run.reskillDemand)
      bundle.run.redeployText = format.formatNumber(bundle.run.redeployDemand)
      bundle.pathways = (bundle.pathways as Array<Record<string, unknown>>).map((row) => ({ ...row, countText: format.formatNumber(row.count) }))
      this._model.setData(bundle)
    },
  })
})
