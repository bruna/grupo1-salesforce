'use strict';

var baseCheckout = require('base/checkout/checkout');
var baseSummaryHelpers = require('base/checkout/summary');
var pluginBilling = require('./billing');
var pluginShipping = require('./shipping');

baseCheckout.updateCheckoutView = function () {
    $('body').on('checkout:updateCheckoutView', function (e, data) {
        baseCheckout.methods.updateMultiShipInformation(data.order);
        baseSummaryHelpers.updateTotals(data.order.totals);

        data.order.shipping.forEach(function (shipping) {
            baseCheckout.methods.updateShippingInformation(
                shipping,
                data.order,
                data.customer,
                data.options
            );
        });

        baseCheckout.methods.updateBillingInformation(
            data.order,
            data.customer,
            data.options
        );

        baseCheckout.methods.updatePaymentInformation(data.order, data.options);
        baseSummaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
    });
};

[pluginShipping, pluginBilling].forEach(function (library) {
    Object.keys(library).forEach(function (key) {
        if (typeof library[key] === 'object') {
            baseCheckout[key] = $.extend({}, baseCheckout[key], library[key]);
        } else {
            baseCheckout[key] = library[key];
        }
    });
});

module.exports = baseCheckout;
