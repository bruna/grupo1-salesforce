'use strict';

var base = module.superModule;

module.exports = function fullProduct(product, apiProduct, options) {
    var recDeco = require('*/cartridge/models/product/decorators/recomendations');
    base.call(this, product, apiProduct, options);
    recDeco(product, apiProduct);
    return product;
};
