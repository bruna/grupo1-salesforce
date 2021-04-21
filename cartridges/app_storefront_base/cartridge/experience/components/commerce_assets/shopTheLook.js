'use strict';

var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

/**
 * Render logic for the storefront.shopTheLook component
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();

    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var content = context.content;
    var productTileParams = { pview: 'tile', pid: content.product.ID };
    var product = ProductFactory.get(productTileParams);

    var productUrl = URLUtils.url('Product-Show', 'pid', product.id).relative().toString();
    var quickViewUrl = URLUtils.url('Product-ShowQuickView', 'pid', product.id);

    model.product = product;
    model.urls = {
        product: productUrl,
        quickView: quickViewUrl
    };
    model.quickViewText = content.quickView;
    model.displayPrice = content.priceDisplay;
    model.itemsCount = product.numberOfProductsInSet;

    model.image = product.images.medium[0];

    return new Template('experience/components/commerce_assets/shopTheLook').render(model).text;
};
