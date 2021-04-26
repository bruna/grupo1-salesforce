var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var OrderModel = require('*/cartridge/models/order');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var Locale = require('dw/util/Locale');
/**
 * Sends a partial shipment email to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationShipmentEmail(order) {
    var currentLocale = Locale.getLocale(order.getCustomerLocaleID());

    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order' });

    var orderObject = { order: orderModel };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msg('subject.shipped_email', 'ocapi_shopOrder', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'shopOrder/confirmationShipmentEmail', orderObject);
}

exports.sendConfirmationShipmentEmail = sendConfirmationShipmentEmail;
