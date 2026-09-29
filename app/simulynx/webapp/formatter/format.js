"use strict";
sap.ui.define([], function () {
    function formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Number(value) || 0);
    }
    function signed(value) {
        const number = Math.round(Number(value) * 10) / 10;
        return `${number > 0 ? '+' : ''}${number.toFixed(1)}%`;
    }
    function percent(value) {
        return `${Math.round(Number(value) * 100)}%`;
    }
    return { formatNumber, signed, percent };
});
