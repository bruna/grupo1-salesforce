'use strict';

var HashMap = require('dw/util/HashMap');
var URLUtils = require('dw/web/URLUtils');

/**
 * Render logic for the storefront.popularCategories.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();

    model.pickUpInStore = {
        actionUrl: URLUtils.url('Stores-InventorySearch', 'showMap', false, 'horizontalView', true, 'isForm', true).toString(),
        atsActionUrl: URLUtils.url('Stores-getAtsValue').toString()
    };

    return module.superModule.render(context, model);
};
