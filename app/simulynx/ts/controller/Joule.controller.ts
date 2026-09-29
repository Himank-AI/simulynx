sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'simulynx/service/api'], function (Controller: any, JSONModel: any, api: any) {
  return Controller.extend('simulynx.controller.Joule', {
    onInit(this: any) {
      this._model = new JSONModel({ intro: '', suggestions: [], answer: '' })
      this.getView().setModel(this._model, 'joule')
      this.getOwnerComponent().getRouter().getRoute('joule').attachPatternMatched(this.load.bind(this))
    },
    async load(this: any) {
      const payload = api.unpack(await api.read('/odata/v4/joule/suggestions()')) as { intro: string; suggestions: string[] }
      this._model.setProperty('/intro', payload.intro)
      this._model.setProperty('/suggestions', payload.suggestions.map((text: string) => ({ text })))
    },
    onSuggest(this: any, event: { getParameter: (name: string) => { getTitle: () => string } }) {
      const title = event.getParameter('listItem').getTitle()
      this.byId('question').setValue(title)
      void this.ask(title)
    },
    onAsk(this: any) {
      void this.ask(this.byId('question').getValue())
    },
    async ask(this: any, question: string) {
      const active = api.unpack(await api.read('/odata/v4/simulation/active()')) as { run: { ID: string } }
      const payload = api.unpack(await api.action('/odata/v4/joule/ask', { runId: active.run.ID, question })) as { answer: string }
      this._model.setProperty('/answer', payload.answer)
    },
  })
})
