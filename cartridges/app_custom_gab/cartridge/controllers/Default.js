'use strict'
var server = require('server');
var base = require('app_storefront_base/cartridge/controllers/Default');
server.extend(base);

var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.replace('Start', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var PageMgr = require('dw/experience/PageMgr');
    var page = PageMgr.getPage('homepage-example');

    if (page != null && page.isVisible()) {
        if (!page.hasVisibilityRules()) {
            res.cachePeriod = 168; // eslint-disable-line no-param-reassign
            res.cachePeriodUnit = 'hours'; // eslint-disable-line no-param-reassign
        }

        res.page(page.ID, {});
    } else {
        pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
        res.render('/home/homePage');
    }
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
