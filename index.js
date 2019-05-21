const options = require("./options");
const handleProxy = require("./handlers/proxy");
const handleHttp = require("./handlers/http");
/**
 * @param {MockOptions} middlewareOptions
 * @returns {ExpressRequestHandler}
 */
module.exports = function(middlewareOptions){
    let mockRules = options.load();
    let httpRules = mockRules.filter(rule => rule.type !== "websocket");
    let websocketRules = mockRules.filter(rule => rule.type === "websocket");
    middlewareOptions = middlewareOptions || {};
    if(enableWebsocket(middlewareOptions)) {
        require("./handlers/websocket")(middlewareOptions, websocketRules);
    }
    return function(req, resp, next){
        let proxy = req.get("X-Mock-Proxy");
        if(proxy) {
            handleProxy(req, resp, next);
        } else {
            // TODO: add CORS headers
            handleHttp(req, resp, httpRules, next);
        }
    };
};

function enableWebsocket(options) {
    let {server, websocket} = options;
    return server && typeof server.listen === "function"
        && websocket && typeof websocket.encodeMessage === "function"
        && typeof websocket.decodeMessage === "function";
}
