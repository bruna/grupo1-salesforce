'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

server.post('Cesta', function (req, res, next) {
    var pids = JSON.parse(req.body);
    var customerID = req.currentCustomer.profile.customerNo;


    var txn = require('dw/system/Transaction');

    txn.wrap(function () {
        var obj = CustomObjectMgr.createCustomObject('Cesta', '0006');
        obj.custom.idCliente = customerID;
        //obj.custom.idProdutos = pids;
    });



    // txn.begin();
    // try {
    //     //alterações do seu objeto usando uma class Mgr: CustomObjectMgr, OrderMgr, etc
    //     txn.commit();
    // } catch(e) {
    //     //Oops!
    //     txn.rollback();
    // }
    return next();
});

module.exports = server.exports();
