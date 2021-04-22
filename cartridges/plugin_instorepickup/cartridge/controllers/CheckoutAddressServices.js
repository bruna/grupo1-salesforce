'use strict';

var StoreMgr = require('dw/catalog/StoreMgr');
var server = require('server');
server.extend(module.superModule);

server.append('AddNewAddress', function (req, res, next) {
    var storeId = req.form.storeId;
    var viewData = res.getViewData();
    viewData.shippingMethod =
        viewData.form.shippingAddress.shippingMethodID.value
            ? viewData.form.shippingAddress.shippingMethodID.value.toString()
            : null;

    if (storeId && viewData.error) {
        viewData.error = false;
        delete viewData.fieldErrors;
        delete viewData.form;
        delete viewData.serverErrors;
    }

    if (storeId) {
        var store = StoreMgr.getStore(storeId);
        viewData.address = {
            firstName: store.name,
            lastName: '',
            address1: store.address1,
            address2: store.address2,
            city: store.city,
            stateCode: store.stateCode,
            postalCode: store.postalCode,
            countryCode: store.countryCode,
            phone: store.phone
        };
    }

    res.setViewData(viewData);

    /* eslint-disable no-shadow */
    this.on('route:BeforeComplete', function (req, res) {
        var viewData = res.getViewData();

        if (viewData.error) {
            return;
        }

        var BasketMgr = require('dw/order/BasketMgr');
        var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

        var shipmentUUID = viewData.shipmentUUID;
        var basket = BasketMgr.getCurrentBasket();
        var shipment = ShippingHelper.getShipmentByUUID(basket, shipmentUUID);

        if (shipment) {
            if (req.form.storeId) {
                ShippingHelper.markShipmentForPickup(shipment, req.form.storeId);
            } else {
                ShippingHelper.markShipmentForShipping(shipment);
            }
        }
    });
    /* eslint-enable no-shadow */

    next();
});

module.exports = server.exports();
