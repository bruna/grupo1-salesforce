var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var collections = require('*/cartridge/scripts/util/collections');
var ShopOrderHelpers = require('*/cartridge/scripts/helpers/shopOrderHelper');

var shopOrderAfterPatch = function (order, orderInput) {
    var shipments = order.getShipments();
    if (empty(orderInput)) {
        return new Status(Status.OK);
    }

    if (!empty(orderInput.confirmationStatus)) {
        order.setConfirmationStatus(Resource.msg('order.confirmation_status.' + orderInput.confirmationStatus, 'ocapi_technical', order.confirmationStatus));
    }

    if (!empty(orderInput.exportStatus)) {
        order.setExportStatus(Resource.msg('order.export_status.' + orderInput.exportStatus, 'ocapi_technical', order.exportStatus));
    }

    if (!empty(orderInput.shippingStatus)) {
        if (orderInput.shippingStatus == "part_shipped" && empty(orderInput.product_items))
            return new Status(Status.ERROR, "", Resource.msg('order.error_empty_products', 'ocapi_shopOrder', null));

        order.setShippingStatus(Resource.msg('order.shipping_status.' + orderInput.shippingStatus, 'ocapi_technical', order.shippingStatus));

        if (orderInput.shippingStatus == "shipped") {
            collections.forEach(shipments, function (shipment) {
                shipment.setShippingStatus(Resource.msg('order.shipping_status.' + orderInput.shippingStatus, 'ocapi_technical', order.shippingStatus));
            });
            ShopOrderHelpers.sendConfirmationShipmentEmail(order);
        }
    }


    if (!empty(orderInput.paymentStatus)) {
        order.setPaymentStatus(Resource.msg('order.payment_status.' + orderInput.paymentStatus, 'ocapi_technical', order.paymentStatus));
    }

    ShopOrderHelpers.notifyOrderStatus(order);

    return new Status(Status.OK);
};

var shopOrderBeforePatch = function (order, orderInput) {
    if (empty(orderInput)) {
        return new Status(Status.OK);
    }

    var shippingStatus = !empty(orderInput.shippingStatus) ? Resource.msg('order.shipping_status.' + orderInput.shippingStatus, 'ocapi_technical', order.shippingStatus) : "";

    if (shippingStatus == 1) {
        orderInput.shippingStatus = "part_shipped";
        orderInput.confirmationStatus = "confirmed";
        orderInput.exportStatus = "exported";
        orderInput.paymentStatus = "paid";
    }
    else if (shippingStatus == 2) {
        orderInput.shippingStatus = "shipped";
        orderInput.confirmationStatus = "confirmed";
        orderInput.exportStatus = "exported";
        orderInput.paymentStatus = "paid";
    }

    return new Status(Status.OK);
}

exports.afterPATCH = shopOrderAfterPatch;
exports.beforePATCH = shopOrderBeforePatch;
