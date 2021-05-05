'use strict';

/**
 * @namespace Error
 */

var server = require('server');

server.get('Cadastro', function (req, res, next) {
    // var URLUtils = require('dw/web/URLUtils');
    var sellerFormDef = server.forms.getForm('sellerFormDef');
    sellerFormDef.clear();
    res.render('seller/sellerView', {
        addressForm: sellerFormDef
    });
    next();
});

server.post('Cadastrar', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var txn = require('dw/system/Transaction');
    var form = req.form;
    txn.begin();
    try {
        var CustomObject = CustomObjectMgr.createCustomObject('DesafioGabriel', form.dwfrm_sellerFormDef_email);
        CustomObject.custom.cep = form.dwfrm_sellerFormDef_postalCode;
        CustomObject.custom.cidade = form.dwfrm_sellerFormDef_city;
        CustomObject.custom.estado = form.dwfrm_sellerFormDef_states_stateCode;
        CustomObject.custom.nome = form.dwfrm_sellerFormDef_firstName;
        CustomObject.custom.sobrenome = form.dwfrm_sellerFormDef_lastName;
        CustomObject.custom.pais = form.dwfrm_sellerFormDef_country;
        CustomObject.custom.rua = form.dwfrm_sellerFormDef_address1;
        CustomObject.custom.senha = form.dwfrm_sellerFormDef_passwordConfirmation;
        CustomObject.custom.telefone = form.dwfrm_sellerFormDef_phone;
        txn.commit();
        res.render('seller/sellerFormResponse');
    } catch (e) {
        txn.rollback();
        res.redirect(URLUtils.url('Seller-Cadastro'));
    }

    next();
});

module.exports = server.exports();
