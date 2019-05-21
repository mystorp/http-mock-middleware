const httpProxy = require('http-proxy');
/**
 * redirect request to `X-Mock-Proxy`
 */
module.exports = function(req, resp, next){
    let proxyBase = req.get("X-Mock-Proxy");
    httpProxy(req, resp, {target: proxyBase});
};