'use strict';

var server = require('server');
var page = require('app_storefront_base/cartridge/controllers/ContactUs');
var hookMgr = require('dw/system/HookMgr');
server.extend(page);

server.replace('Subscribe', server.middleware.https, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var emailHelper = require('*/cartridge/scripts/helpers/emailHelpers');

    var myForm = req.form;
    var isValidEmailid = emailHelper.validateEmail(myForm.contactEmail);
    if (isValidEmailid) {
        var contactDetails = [myForm.contactFirstName, myForm.contactLastName, myForm.contactEmail, myForm.contactTopic, myForm.contactComment];
        hookMgr.callHook('app.contact.sendMailAfterContact', 'sendMailAfterContact', contactDetails);
        res.json({
            success: true,
            msg: Resource.msg('subscribe.to.contact.us.success', 'contactUs', null)
        });
    } else {
        res.json({
            error: true,
            msg: Resource.msg('subscribe.to.contact.us.email.invalid', 'contactUs', null)
        });
    }

    next();
});

module.exports = server.exports();
