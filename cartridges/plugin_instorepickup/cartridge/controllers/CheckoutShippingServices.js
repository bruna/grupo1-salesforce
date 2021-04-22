'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('SubmitShipping', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;

    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    /* eslint-disable no-shadow */
    // eslint-disable-next-line no-unused-vars
    this.on('route:BeforeComplete', function (req, res) {
        ShippingHelper.markShipmentForShipping(shipment);
    }, this);
    /* eslint-enable no-shadow */

    return next();
});

server.append('SubmitShipping', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;

    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    if (shipment.shippingMethod.custom.storePickupEnabled) {
        if (!req.form.storeId) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.no.store.selected', 'storeLocator', null)
            });
        } else {
            var viewData = res.getViewData();
            delete viewData.fieldErrors;
            viewData.error = false;
            viewData.shipmentUUID = req.form.shipmentUUID;
            viewData.storeId = req.form.storeId;
            viewData.shippingMethod = shipment.shippingMethodID;

            res.setViewData(viewData);

            /* eslint-disable no-shadow */
            this.on('route:BeforeComplete', function (req, res) {
                var StoreMgr = require('dw/catalog/StoreMgr');
                var Locale = require('dw/util/Locale');
                var OrderModel = require('*/cartridge/models/order');
                var AccountModel = require('*/cartridge/models/account');
                var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

                var viewData = res.getViewData();

                var storeId = viewData.storeId;
                var store = StoreMgr.getStore(storeId);
                var viewDataShipmentUUID = viewData.shipmentUUID;
                var viewDataShipment = viewDataShipmentUUID ? ShippingHelper.getShipmentByUUID(currentBasket, viewDataShipmentUUID) : currentBasket.defaultShipment;

                if (storeId) {
                    ShippingHelper.markShipmentForPickup(viewDataShipment, storeId);

                    Transaction.wrap(function () {
                        var storeAddress = {
                            address: {
                                firstName: store.name,
                                lastName: '',
                                address1: store.address1,
                                address2: store.address2,
                                city: store.city,
                                stateCode: store.stateCode,
                                postalCode: store.postalCode,
                                countryCode: store.countryCode.value,
                                phone: store.phone
                            },
                            shippingMethod: viewData.shippingMethod
                        };
                        COHelpers.copyShippingAddressToShipment(storeAddress, viewDataShipment);

                        COHelpers.setGift(viewDataShipment, false, null);
                    });
                }

                COHelpers.recalculateBasket(currentBasket);

                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
                    currentBasket,
                    {
                        usingMultiShipping: usingMultiShipping,
                        shippable: true,
                        countryCode: currentLocale.country,
                        containerView: 'basket'
                    }
                );

                res.json({
                    customer: new AccountModel(req.currentCustomer),
                    order: basketModel,
                    form: server.forms.getForm('shipping')
                });
            });
            /* eslint-enable no-shadow */
        }
    }
    next();
});

server.append('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;

    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    if (shipment.shippingMethod.custom.storePickupEnabled) {
        ShippingHelper.markShipmentForShipping(shipment);
        var viewData = res.getViewData();

        if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            var preferredAddress = req.currentCustomer.addressBook.preferredAddress;
            var countryCode = preferredAddress.countryCode.value;

            Object.keys(viewData.address).forEach(function (key) {
                var value = preferredAddress[key];
                if (value) {
                    if (key === 'countryCode') {
                        viewData.address[key] = countryCode;
                    } else {
                        viewData.address[key] = value;
                    }
                } else {
                    viewData.address[key] = null;
                }
            });
        } else {
            Object.keys(viewData.address).forEach(function (key) {
                viewData.address[key] = null;
            });
        }

        res.setViewData(viewData);
    }

    return next();
});

server.append('ToggleMultiShip', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var viewData = res.getViewData();
    var currentBasket = BasketMgr.getCurrentBasket();

    var order = viewData.order;

    collections.forEach(currentBasket.shipments, function (shipment) {
        ShippingHelper.markShipmentForShipping(shipment);
    });

    order.shipping.forEach(function (shipment) {
        /* eslint-disable no-param-reassign */
        if (shipment.custom && shipment.custom.fromStoreId) {
            delete shipment.custom.fromStoreId;
        }
        shipment.productLineItems.items.forEach(function (lineItem) {
            if (lineItem.custom && lineItem.custom.fromStoreId) {
                delete lineItem.custom.fromStoreId;
            }
        });
        /* eslint-enable no-param-reassign */
    });

    res.setViewData({
        customer: viewData.customer,
        order: order
    });

    next();
});

module.exports = server.exports();
