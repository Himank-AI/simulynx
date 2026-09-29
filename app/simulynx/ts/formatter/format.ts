sap.ui.define([], function () {
  function formatNumber(value: unknown): string {
    return new Intl.NumberFormat('en-US').format(Number(value) || 0)
  }
  function signed(value: unknown): string {
    const number = Math.round(Number(value) * 10) / 10
    return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`
  }
  function percent(value: unknown): string {
    return `${Math.round(Number(value) * 100)}%`
  }
  return { formatNumber, signed, percent }
})
