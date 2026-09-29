const NAV: Record<string, string> = {
  overview: 'overview',
  workforce: 'workforce',
  personas: 'personas',
  studio: 'studio',
  simulations: 'simulations',
  compare: 'compare',
  skills: 'skills',
  stress: 'stress',
  brief: 'brief',
  history: 'history',
  joule: 'joule',
  settings: 'settings',
}

sap.ui.define(['sap/ui/core/mvc/Controller'], function (Controller: any) {
  return Controller.extend('simulynx.controller.App', {
    onInit(this: any) {
      this.getOwnerComponent().getRouter().attachRouteMatched((event: { getParameter: (name: string) => string }) => {
        const name = event.getParameter('name')
        const item = this.byId('navList').getItems().find((entry: { getKey: () => string }) => entry.getKey() === name)
        if (item) this.byId('sideNav').setSelectedItem(item)
      })
    },
    onNav(this: any, event: { getParameter: (name: string) => { getKey: () => string } }) {
      const key = event.getParameter('item').getKey()
      const route = NAV[key]
      if (route) this.getOwnerComponent().getRouter().navTo(route)
    },
  })
})
