sap.ui.define(['sap/ui/core/mvc/Controller', 'sap/ui/model/odata/v4/ODataModel'], function (Controller: any, ODataModel: any) {
  return Controller.extend('simulynx.controller.History', {
    onInit(this: any) {
      this.getView().setModel(
        new ODataModel({
          serviceUrl: '/odata/v4/simulation/',
          synchronizationMode: 'None',
          operationMode: 'Server',
          autoExpandSelect: true,
          groupId: '$direct',
        }),
        'sim',
      )
    },
    onOpen(this: any) {
      this.getOwnerComponent().getRouter().navTo('simulations')
    },
  })
})
