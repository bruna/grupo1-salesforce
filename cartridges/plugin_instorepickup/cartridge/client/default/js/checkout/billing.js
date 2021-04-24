'use strict';

var addressHelpers = require('base/checkout/address');
var base = require('base/checkout/billing');

/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;

    var form = $('form[name$=billing]')[0];
    var $billingAddressSelector = $('.addressSelector', form);
    var hasSelectedAddress = false;

    if ($billingAddressSelector && $billingAddressSelector.length === 1) {
        $billingAddressSelector.empty();
        // Add New Address option
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
            null,
            false,
            order,
            { type: 'billing' }));

        // Separator -
        $billingAddressSelector.append(
            addressHelpers.methods.optionValueForAddress(order.resources.shippingAddresses, false, order, { type: 'billing' })
        );

        shippings.forEach(function (aShipping) {
            if (!aShipping.selectedShippingMethod || !aShipping.selectedShippingMethod.storePickupEnabled) {
                var isSelected = order.billing.matchingAddressId === aShipping.UUID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Shipping Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress(aShipping, isSelected, order, { type: 'billing' })
                );
            }
        });

        if (customer.addresses && customer.addresses.length > 0) {
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
                order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                var isSelected = order.billing.matchingAddressId === address.ID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
                // Customer Address option
                $billingAddressSelector.append(
                    addressHelpers.methods.optionValueForAddress({
                        UUID: 'ab_' + address.ID,
                        shippingAddress: address
                    }, isSelected, order, { type: 'billing' })
                );
            });
        }
    }

    if (hasSelectedAddress
        || (!order.billing.matchingAddressId && order.billing.billingAddress.address)) {
        // show
        $(form).attr('data-address-mode', 'edit');
    } else {
        $(form).attr('data-address-mode', 'new');
    }

    $billingAddressSelector.show();
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    updateBillingAddressSelector(order, customer);

    // update billing address form
    base.methods.updateBillingAddressFormValues(order);

    // update billing address summary
    addressHelpers.methods.populateAddressSummary('.billing .address-summary',
        order.billing.billingAddress.address);

    // update billing parts of order summary
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(order.billing.billingAddress.address.phone);
    }
}

base.methods.updateBillingInformation = updateBillingInformation;
base.methods.updateBillingAddressSelector = updateBillingAddressSelector;

module.exports = base;
