'use strict';

var processInclude = require('./util');

$(document).ready(function () {
    processInclude(require('./product/details'));
    processInclude(require('./product/pdpInstoreInventory'));
});
