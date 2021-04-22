'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Copies a raw address object to the basket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} basket - the current shopping basket
 */
function copyBillingAddressToBasket(address, basket) {
    var Transaction = require('dw/system/Transaction');
    var billingAddress = basket.billingAddress;
    // Only do copy when defaultShipment is not storepickup
    var storepickup = basket.defaultShipment.custom.shipmentType === 'instore';
    if (!storepickup) {
        Transaction.wrap(function () {
            if (!billingAddress) {
                billingAddress = basket.createBillingAddress();
            }

            billingAddress.setFirstName(address.firstName);
            billingAddress.setLastName(address.lastName);
            billingAddress.setAddress1(address.address1);
            billingAddress.setAddress2(address.address2);
            billingAddress.setCity(address.city);
            billingAddress.setPostalCode(address.postalCode);
            billingAddress.setStateCode(address.stateCode);
            billingAddress.setCountryCode(address.countryCode.value);
            if (!billingAddress.phone) {
                billingAddress.setPhone(address.phone);
            }
        });
    }
}

/**
 * Loop through all shipments and make sure all not null
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {boolean} - allValid
 */
function ensureValidShipments(lineItemContainer) {
    var shipments = lineItemContainer.shipments;
    var storeAddress = true;
    var allValid = collections.every(shipments, function (shipment) {
        if (shipment) {
            var hasStoreID = shipment.custom && shipment.custom.fromStoreId;
            if (shipment.shippingMethod.custom && shipment.shippingMethod.custom.storePickupEnabled && !hasStoreID) {
                storeAddress = false;
            }
            var address = shipment.shippingAddress;
            return address && address.address1 && storeAddress;
        }
        return false;
    });
    return allValid;
}

module.exports = {
    ensureValidShipments: ensureValidShipments,
    copyBillingAddressToBasket: copyBillingAddressToBasket
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
