'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

server.post('Cesta', function (req, res, next) {
    var pids = req.body;
    var d = new Date().toString();
    var customerID = req.currentCustomer.profile.customerNo;
    var idCesta = customerID+'-'+d;
    idCesta = idCesta.replace(/\s/g, '');

    var txn = require('dw/system/Transaction');
    txn.wrap(function () {
        var obj = CustomObjectMgr.createCustomObject('Cesta', idCesta);
        obj.custom.idCliente = customerID;
        obj.custom.idProdutos = pids;
    });

    return next();
});

module.exports = server.exports();
