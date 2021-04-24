'use strict';

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'allProductLinks', {
        enumerable: true,
        value: apiProduct && apiProduct.allProductLinks
        ? apiProduct.allProductLinks : false });
};
