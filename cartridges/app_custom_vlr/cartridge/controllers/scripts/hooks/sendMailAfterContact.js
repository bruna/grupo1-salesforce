var emailHelper = require('*/cartridge/scripts/helpers/emailHelpers');
var Resource = require('dw/web/Resource');
var customObjectMgr = require('dw/object/CustomObjectMgr');
// eslint-disable-next-line require-jsdoc
var sendMailAfterContact = function (firstName, lastName, contactEmail, contactTopic, contactComment) {
    var mailList = customObjectMgr.getAllCustomObjects('ID').asList().toArray();
    mailList.map((mail) => {
        var emailObj = {
            to: mail.custom.Email,
            subject: Resource.msg('custom.email.contact.title', 'customEmail', null),
            from: contactEmail
        };
        var data = {
            firstName: firstName,
            lastName: lastName,
            contactEmail: contactEmail,
            contactTopic: contactTopic,
            contactComment: contactComment
        };
        emailHelper.sendEmail(emailObj, 'customEmail/contactEmail', data);

    });
};
exports.sendMailAfterContact = sendMailAfterContact;
