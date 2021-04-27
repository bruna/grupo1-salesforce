'use strict';

/**
 * @namespace Error
 */

var server = require('server');

server.get('Login', function (req, res, next) {
    // var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');

    CustomerMgr.logoutCustomer(true);
    res.render('partner/partner');
    next();
});

module.exports = server.exports();
