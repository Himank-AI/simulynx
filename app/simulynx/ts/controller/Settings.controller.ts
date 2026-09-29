sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller: any, JSONModel: any, api: any) {
  return Controller.extend('simulynx.controller.Settings', {
    onInit(this: any) {
      this._model = new JSONModel({ cards: [] })
      this.getView().setModel(this._model, 'settings')
      this.getOwnerComponent().getRouter().getRoute('settings').attachPatternMatched(this.load.bind(this))
    },
    async load(this: any) {
      const adapters = api.unpack(await api.read('/odata/v4/analytics/adapters()')) as Record<string, { id: string; connected: boolean; note: string }>
      this._model.setProperty('/cards', [
        { title: `Joule · ${adapters.joule?.id}`, connected: adapters.joule?.connected, note: adapters.joule?.note },
        { title: `SAP Build Process Automation · ${adapters.buildProcessAutomation?.id}`, connected: adapters.buildProcessAutomation?.connected, note: adapters.buildProcessAutomation?.note },
        { title: `SAP Analytics Cloud · ${adapters.analyticsCloud?.id}`, connected: adapters.analyticsCloud?.connected, note: adapters.analyticsCloud?.note },
        { title: `SAP HANA Cloud · ${adapters.hanaCloud?.id}`, connected: adapters.hanaCloud?.connected, note: adapters.hanaCloud?.note },
      ])
    },
  })
})
