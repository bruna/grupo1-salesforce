'use strict';
var Resource = require('dw/web/Resource');
var base = module.superModule;

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    this.resources.storeAddress = Resource.msg('label.instore.pickup.from', 'instorePickup', null);
    if (this.firstLineItem) {
        this.firstLineItem.isPickUpInStore = lineItemContainer.productLineItems[0] ?
            lineItemContainer.productLineItems[0].shipment.shippingMethod.custom.storePickupEnabled : null;
    }
}

OrderModel.prototype = Object.create(base.prototype);

module.exports = OrderModel;
