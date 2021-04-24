'use strict';

var storeLocator = require('base/storeLocator/storeLocator');
var ENTER_KEY = 13;

/**
 * Populate store finder html
 * @param {Object} target - Dom element that needs to be populated with store finder
 */
function loadStoreLocator(target) {
    $.ajax({
        url: target.data('url'),
        method: 'GET',
        success: function (response) {
            target.html(response.storesResultsHtml);
            storeLocator.search();
            storeLocator.changeRadius();
            storeLocator.selectStore();
            storeLocator.updateSelectStoreButton();
            if (!$('.results').data('has-results')) {
                $('.store-locator-no-results').show();
            }
        }
    });
}

/**
 * Show store locator when appropriate shipping method is selected
 * @param {Object} shippingForm - DOM element that contains current shipping form
 */
function showStoreFinder(shippingForm) {
    // hide address panel
    shippingForm.find('.shipment-selector-block').addClass('d-none');
    shippingForm.find('.shipping-address-block').addClass('d-none');
    shippingForm.find('.change-store').addClass('d-none');

    shippingForm.find('.gift-message-block').addClass('d-none');
    shippingForm.find('.gift').prop('checked', false);
    shippingForm.find('.gift-message').addClass('d-none');

    shippingForm.find('.pickup-in-store').empty().removeClass('d-none');

    loadStoreLocator(shippingForm.find('.pickup-in-store'));
}

/**
 * Hide store finder and restore address form
 * @param {Object} shippingForm - DOM element with current form
 * @param {Object} data - data containing customer and order objects
 */
function hideStoreFinder(shippingForm, data) {
    if (data.order.usingMultiShipping) {
        $('body').trigger('instore:hideMultiShipStoreFinder', {
            form: shippingForm,
            customer: data.customer,
            order: data.order
        });
    } else {
        $('body').trigger('instore:hideSingleShipStoreFinder', {
            form: shippingForm,
            customer: data.customer,
            order: data.order
        });
    }

    shippingForm.find('.pickup-in-store').addClass('d-none');
    shippingForm.find('.change-store').addClass('d-none');
    shippingForm.find('.gift-message-block').removeClass('d-none');

    shippingForm.find('input[name="storeId"]').remove();
}

/**
 * Handles the initial state of single shipping on page load
 */
function handleInitialSingleship() {
    var pickupSelected = $(':checked', '.shipping-method-list').data('pickup');
    var storeSelected = $('.store-details').length;
    var shippingForm = $('.single-shipping .shipping-form');
    var storeID = storeSelected ? $('.store-details').data('store-id') : null;

    if (pickupSelected && !storeSelected) {
        showStoreFinder(shippingForm);
    } else if (pickupSelected && storeSelected) {
        shippingForm
            .find('.pickup-in-store')
            .removeClass('d-none')
            .append('<input type="hidden" name="storeId" value="' + storeID + '" />');

        shippingForm.find('.shipment-selector-block').addClass('d-none');
    }
}

/**
 * Handles the initial state of multi-shipping on page load
 */
function handleInitialMultiship() {
    $(':checked', '.multi-shipping .shipping-method-list').each(function () {
        var pickupSelected = $(this).data('pickup');
        var shippingForm = $(this).closest('form');
        var store = shippingForm.find('.store-details');
        var storeSelected = store.length;
        var storeID = storeSelected ? store.data('store-id') : null;

        if (pickupSelected && !storeSelected) {
            showStoreFinder(shippingForm);
        } else if (pickupSelected && storeSelected) {
            shippingForm
                .find('.pickup-in-store')
                .removeClass('d-none')
                .append('<input type="hidden" name="storeId" value="' + storeID + '" />');
        } else {
            shippingForm.find('.pickup-in-store').addClass('d-none');
            shippingForm.find('.shipping-address-block').removeClass('d-none');
        }
    });
}

module.exports = {
    watchForInStoreShipping: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
            var multiShipFlag = data.order.usingMultiShipping;
            if (!data.urlParams || !data.urlParams.shipmentUUID) {
                data.order.shipping.forEach(function (shipment) {
                    var form = $('.shipping-form input[name="shipmentUUID"][value="' + shipment.UUID + '"]').closest('form');

                    form.find('.pickup-in-store').data('url', shipment.pickupInstoreUrl);

                    if (shipment.selectedShippingMethod.storePickupEnabled) {
                        showStoreFinder(form, multiShipFlag);
                    } else {
                        hideStoreFinder(form, data);
                    }
                });

                return;
            }

            var shipment = data.order.shipping.find(function (s) {
                return s.UUID === data.urlParams.shipmentUUID;
            });

            var shippingForm = $('.shipping-form input[name="shipmentUUID"][value="' + shipment.UUID + '"]').closest('form');
            shippingForm.find('.pickup-in-store').data('url', shipment.pickupInstoreUrl);

            if (shipment.selectedShippingMethod.storePickupEnabled) {
                showStoreFinder(shippingForm);
            } else {
                hideStoreFinder(shippingForm, data);
            }
        });
    },
    watchForStoreSelection: function () {
        $('body').on('store:selected', function (e, data) {
            var pickupInStorePanel = $(data.event.target).parents('.pickup-in-store');
            var card = pickupInStorePanel.parents('.card');
            if ($(window).scrollTop() > card.offset().top) {
                $('html, body').animate({
                    scrollTop: card.offset().top
                }, 200);
            }
            var newLabel = $(data.storeDetailsHtml);
            var content = $('<div class="selectedStore"></div>').append(newLabel)
                .append('<input type="hidden" name="storeId" value="' + data.storeID + '" />');

            pickupInStorePanel.empty().append(content);
            pickupInStorePanel.siblings('.change-store').removeClass('d-none');
        });
    },
    initialStoreMethodSelected: function () {
        $(document).ready(function () {
            var isMultiship = $('#checkout-main').hasClass('multi-ship');
            if (isMultiship) {
                handleInitialMultiship();
            } else {
                handleInitialSingleship();
            }
        });
    },
    updateAddressLabelText: function () {
        $('body').on('shipping:updateAddressLabelText', function (e, data) {
            var addressLabelText = data.selectedShippingMethod.storePickupEnabled ? data.resources.storeAddress : data.resources.shippingAddress;
            data.shippingAddressLabel.text(addressLabelText);
        });
    },
    changeStore: function () {
        $('body').on('click', '.change-store', (function () {
            showStoreFinder($(this).closest('form'));
            $(this).addClass('d-none');
        }));
    },
    updateAddressButtonClick: function () {
        $('body').on('click', '.btn-show-details', (function () {
            $(this).closest('.shipment-selector-block').siblings('.shipping-address-block').removeClass('d-none');
        }));
    },
    hideMultiShipStoreFinder: function () {
        $('body').on('instore:hideMultiShipStoreFinder', function (e, data) {
            data.form.find('.shipping-address-block').removeClass('d-none');
            data.form.find('.shipment-selector-block').removeClass('d-none');

            if (!data.customer.registeredUser) {
                data.form.attr('data-address-mode', 'new');
            } else {
                data.form.attr('data-address-mode', 'edit');
            }
        });
    },
    hideSingleShipStoreFinder: function () {
        $('body').on('instore:hideSingleShipStoreFinder', function (e, data) {
            if (data.customer.registeredUser) {
                if (data.customer.addresses.length) {
                    data.form.find('.shipment-selector-block').removeClass('d-none');
                    if (!data.order.shipping[0].matchingAddressId) {
                        data.form.find('.shipping-address-block').removeClass('d-none');
                    } else {
                        data.form.attr('data-address-mode', 'edit');

                        var addressSelectorDropDown = data.form.find('.addressSelector option[value="ab_' + data.order.shipping[0].matchingAddressId + '"]');
                        $(addressSelectorDropDown).prop('selected', true);
                    }
                } else {
                    data.form.find('.shipping-address-block').removeClass('d-none');
                }
            } else {
                data.form.find('.shipping-address-block').removeClass('d-none');
                data.form.find('.shipment-selector-block').removeClass('d-none');
            }
        });
    },
    actionEditMultiShip: function () {
        $('body').on('shipping:editMultiShipAddress', function (e, data) {
            var shippingForm = data.form;
            var pickupSelected = shippingForm.find(':checked', '.shipping-method-list').data('pickup');
            if (pickupSelected) {
                showStoreFinder(shippingForm);
            }
        });
    },
    clickFindStoresButton: function () {
        $('body').on('keypress', '#store-postal-code', (function (e) {
            if (e.keyCode === ENTER_KEY) {
                $(this).closest('.store-locator').find('.btn-storelocator-search').click();
            }
        }));
    }
};
