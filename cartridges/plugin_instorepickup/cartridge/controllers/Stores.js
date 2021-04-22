'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
server.extend(module.superModule);

server.get('GetStoreById', server.middleware.include, cache.applyDefaultCache, function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var StoreModel = require('*/cartridge/models/store');
    var storeId = req.querystring.storeId ? req.querystring.storeId : '';
    var storeObject = StoreMgr.getStore(storeId);
    var store = new StoreModel(storeObject);
    res.render('store/storeDetails', store);
    next();
});

/**
 *
 * @param {string} products - list of product details info in the form of "productId:quantity,productId:quantity,... "
 * @returns {Object} a object containing product ID and quantity
 */
function buildProductListAsJson(products) {
    if (!products) {
        return null;
    }

    return products.split(',').map(function (item) {
        var properties = item.split(':');
        return { id: properties[0], quantity: properties[1] };
    });
}

server.get('InventorySearch', cache.applyDefaultCache, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var URLUtils = require('dw/web/URLUtils');

    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;

    var products = buildProductListAsJson(req.querystring.products);

    var url = URLUtils.url('Stores-FindStores', 'showMap', showMap, 'products', req.querystring.products).toString();
    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, url, products);

    var viewData = {
        stores: storesModel,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap
    };

    var storesResultsHtml = storesModel.stores
        ? renderTemplateHelper.getRenderedHtml(viewData, 'storeLocator/storeLocatorNoDecorator')
        : null;

    storesModel.storesResultsHtml = storesResultsHtml;
    res.json(storesModel);
    next();
});

// The req parameter in the unnamed callback function is a local instance of the request object.
// The req parameter has a property called querystring. In this use case the querystring could
// have the following:
// lat - The latitude of the users position.
// long - The longitude of the users position.
// radius - The radius that the user selected to refine the search
// or
// postalCode - The postal code that the user used to search.
// radius - The radius that the user selected to refine the search
server.replace('FindStores', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;

    var url = null;
    var products = buildProductListAsJson(req.querystring.products);

    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, url, products);

    if (products) {
        var context = {
            stores: storesModel,
            horizontalView: horizontalView,
            isForm: isForm,
            showMap: showMap
        };

        var storesResultsHtml = storesModel.stores
            ? renderTemplateHelper.getRenderedHtml(context, 'storeLocator/storeLocatorResults')
            : null;

        storesModel.storesResultsHtml = storesResultsHtml;
    }

    res.json(storesModel);
    next();
});

server.get('getAtsValue', function (req, res, next) {
    var Resource = require('dw/web/Resource');

    var productId = req.querystring.pid;
    var storeId = req.querystring.storeId;
    var quantitySelected = req.querystring.quantitySelected;

    var instorePUstoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');

    var instoreInventory = instorePUstoreHelpers.getStoreInventory(storeId, productId, quantitySelected);

    var productAtsValue = {
        atsValue: instoreInventory,
        product: {
            available: !!instoreInventory,
            readyToOrder: !!instoreInventory,
            messages: [
                Resource.msg('label.instock', 'common', null)
            ]
        },
        resources: {
            info_selectforstock: Resource.msg('label.ats.notavailable', 'instorePickup', null)
        }
    };

    res.json(productAtsValue);
    next();
});

module.exports = server.exports();
