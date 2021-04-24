'use strict';

var storeLocator = require('base/storeLocator/storeLocator');

/**
 * Restores Quantity Selector to its original state.
 * @param {HTMLElement} $quantitySelect - The Quantity Select Element
 */
function restoreQuantityOptions($quantitySelect) {
    var originalHTML = $quantitySelect.data('originalHTML');
    if (originalHTML) {
        $quantitySelect.html(originalHTML);
    }
}

/**
 * Sets the data attribute of Quantity Selector to save its original state.
 * @param {HTMLElement} $quantitySelect - The Quantity Select Element
 */
function setOriginalQuantitySelect($quantitySelect) {
    if (!$quantitySelect.data('originalHTML')) {
        $quantitySelect.data('originalHTML', $quantitySelect.html());
    } // If it's already there, don't re-set it
}

/**
 * Updates the Quantity Selector based on the In Store Quantity.
 * @param {string} quantitySelector - Quantity Selector
 * @param {string} quantityOptionSelector - Quantity Option Selector
 * @param {number} productAtsValue - Inventory in the selected store
 */
function updateQOptions(quantitySelector, quantityOptionSelector, productAtsValue) {
    var selectedQuantity = $(quantitySelector).val();
    restoreQuantityOptions($(quantitySelector));
    for (var i = $(quantityOptionSelector).length - 1; i >= productAtsValue; i--) {
        $(quantityOptionSelector).eq(i).remove();
    }
    $(quantitySelector + ' option[value="' + selectedQuantity + '"]').attr('selected', 'selected');
}

/**
 * Generates the modal window on the first call.
 */
function getModalHtmlElement() {
    if ($('#inStoreInventoryModal').length !== 0) {
        $('#inStoreInventoryModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal " id="inStoreInventoryModal" role="dialog">'
        + '<div class="modal-dialog in-store-inventory-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header justify-content-end">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal" title="'
        +          $('.btn-get-in-store-inventory').data('modal-close-text') + '">'    // eslint-disable-line
        + '        &times;'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
    $('#inStoreInventoryModal').modal('show');
}

/**
 * Replaces the content in the modal window with find stores components and
 * the result store list.
 * @param {string} pid - The product ID to search for
 * @param {number} quantity - Number of products to search inventory for
 * @param {number} selectedPostalCode - The postal code to search for inventory
 * @param {number} selectedRadius - The radius to search for inventory
 */
function fillModalElement(pid, quantity, selectedPostalCode, selectedRadius) {
    var requestData = {
        products: pid + ':' + quantity
    };

    if (selectedRadius) {
        requestData.radius = selectedRadius;
    }

    if (selectedPostalCode) {
        requestData.postalCode = selectedPostalCode;
    }

    $('#inStoreInventoryModal').spinner().start();
    $.ajax({
        url: $('.btn-get-in-store-inventory').data('action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            $('.modal-body').empty();
            $('.modal-body').html(response.storesResultsHtml);
            storeLocator.search();
            storeLocator.changeRadius();
            storeLocator.selectStore();
            storeLocator.updateSelectStoreButton();

            $('.btn-storelocator-search').attr('data-search-pid', pid);

            if (selectedRadius) {
                $('#radius').val(selectedRadius);
            }

            if (selectedPostalCode) {
                $('#store-postal-code').val(selectedPostalCode);
            }

            if (!$('.results').data('has-results')) {
                $('.store-locator-no-results').show();
            }

            $('#inStoreInventoryModal').modal('show');
            $('#inStoreInventoryModal').spinner().stop();
        },
        error: function () {
            $('#inStoreInventoryModal').spinner().stop();
        }
    });
}

/**
 * Remove the selected store.
 * @param {HTMLElement} $container - the target html element
 */
function deselectStore($container) {
    var storeElement = $($container).find('.selected-store-with-inventory');
    $(storeElement).find('.card-body').empty();
    $(storeElement).addClass('display-none');
    $($container).find('.btn-get-in-store-inventory').show();
    $($container).find('.quantity-select').removeData('originalHTML');
}

/**
 * Update quantity options. Only display quantity options that are available for the store.
 * @param {sring} searchPID - The product ID of the selected product.
 * @param {number} storeId - The store ID selected for in store pickup.
 */
function updateQuantityOptions(searchPID, storeId) {
    var selectorPrefix = '.product-detail[data-pid="' + searchPID + '"]';
    var productIdSelector = selectorPrefix + ' .product-id';
    var quantitySelector = selectorPrefix + ' .quantity-select';
    var quantityOptionSelector = quantitySelector + ' option';

    setOriginalQuantitySelect($(quantitySelector));

    var requestData = {
        pid: $(productIdSelector).text(),
        quantitySelected: $(quantitySelector).val(),
        storeId: storeId
    };

    $.ajax({
        url: $('.btn-get-in-store-inventory').data('ats-action-url'),
        data: requestData,
        method: 'GET',
        success: function (response) {
            // Update Quantity dropdown, Remove quantity greater than inventory
            var productAtsValue = response.atsValue;
            var availabilityValue = '';

            var $productContainer = $('.product-detail[data-pid="' + searchPID + '"]');

            if (!response.product.readyToOrder) {
                availabilityValue = '<div>' + response.resources.info_selectforstock + '</div>';
            } else {
                response.product.messages.forEach(function (message) {
                    availabilityValue += '<div>' + message + '</div>';
                });
            }

            $($productContainer).trigger('product:updateAvailability', {
                product: response.product,
                $productContainer: $productContainer,
                message: availabilityValue,
                resources: response.resources
            });

            $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
                product: response.product, $productContainer: $productContainer
            });

            updateQOptions(quantitySelector, quantityOptionSelector, productAtsValue);
        }
    });
}

module.exports = {
    updateSelectStore: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            $('.btn-get-in-store-inventory', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available ||
                !response.product.availableForInStorePickup));
        });
    },
    removeSelectedStoreOnAttributeChange: function () {
        $('body').on('product:afterAttributeSelect', function (e, response) {
            response.container.attr('data-pid', response.data.product.id);
            deselectStore(response.container);
        });
    },
    updateAddToCartFormData: function () {
        $('body').on('updateAddToCartFormData', function (e, form) {
            if (form.pidsObj) {
                var pidsObj = JSON.parse(form.pidsObj);
                pidsObj.forEach(function (product) {
                    var storeElement = $('.product-detail[data-pid="' +
                        product.pid
                        + '"]').find('.store-name');
                    product.storeId = $(storeElement).length// eslint-disable-line no-param-reassign
                        ? $(storeElement).attr('data-store-id')
                        : null;
                });

                form.pidsObj = JSON.stringify(pidsObj);// eslint-disable-line no-param-reassign
            }

            var storeElement = $('.product-detail[data-pid="'
                + form.pid
                + '"]');

            if ($(storeElement).length) {
                form.storeId = $(storeElement).find('.store-name') // eslint-disable-line
                    .attr('data-store-id');
            }
        });
    },
    showInStoreInventory: function () {
        $('.btn-get-in-store-inventory').on('click', function (e) {
            var pid = $(this).closest('.product-detail').attr('data-pid');
            var quantity = $(this).closest('.product-detail').find('.quantity-select').val();
            getModalHtmlElement();
            fillModalElement(pid, quantity);
            e.stopPropagation();
        });
    },
    removeStoreSelection: function () {
        $('body').on('click', '#remove-store-selection', (function () {
            deselectStore($(this).closest('.product-detail'));
            $(document).trigger('store:afterRemoveStoreSelection', $(this).closest('.product-detail').find('.quantity-select'));
        }));
    },
    selectStoreWithInventory: function () {
        $('body').on('store:selected', function (e, data) {
            var searchPID = $('.btn-storelocator-search').attr('data-search-pid');
            var storeElement = $('.product-detail[data-pid="' + searchPID + '"]');
            $(storeElement).find('.selected-store-with-inventory .card-body').empty();
            $(storeElement).find('.selected-store-with-inventory .card-body').append(data.storeDetailsHtml);
            $(storeElement).find('.store-name').attr('data-store-id', data.storeID);
            $(storeElement).find('.selected-store-with-inventory').removeClass('display-none');

            var $changeStoreButton = $(storeElement).find('.change-store');
            $($changeStoreButton).data('postal', data.searchPostalCode);
            $($changeStoreButton).data('radius', data.searchRadius);

            $(storeElement).find('.btn-get-in-store-inventory').hide();

            updateQuantityOptions(searchPID, data.storeID);

            $('#inStoreInventoryModal').modal('hide');
            $('#inStoreInventoryModal').remove();
        });
    },
    changeStore: function () {
        $('body').on('click', '.change-store', (function () {
            var pid = $(this).closest('.product-detail').attr('data-pid');
            var quantity = $(this).closest('.product-detail').find('.quantity-select').val();
            getModalHtmlElement();
            fillModalElement(pid, quantity, $(this).data('postal'), $(this).data('radius'));
        }));
    }
};
