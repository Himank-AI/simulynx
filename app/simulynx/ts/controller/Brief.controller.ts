sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller: any, JSONModel: any, api: any) {
  return Controller.extend('simulynx.controller.Brief', {
    onInit(this: any) {
      this._model = new JSONModel({ html: '' })
      this.getView().setModel(this._model, 'brief')
      this.getOwnerComponent().getRouter().getRoute('brief').attachPatternMatched(this.load.bind(this))
    },
    async load(this: any) {
      const active = api.unpack(await api.read('/odata/v4/simulation/active()')) as { run: { ID: string } }
      const brief = api.unpack(await api.read(`/odata/v4/analytics/decisionBrief(runId='${active.run.ID}')`)) as { body: string }
      const html = brief.body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/\n/g, '<br/>')
      this._model.setProperty('/html', `<div class="sxMarkdown">${html}</div>`)
    },
  })
})
