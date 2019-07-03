const cors = require("cors");
const options = require("./options");
const handleProxy = require("./handlers/proxy");
const handleHttp = require("./handlers/http");
/**
 * @param {MockOptions} middlewareOptions
 * @returns {ExpressRequestHandler}
 */
let middleware = module.exports = function(middlewareOptions){
    let mockRules = options.load(middlewareOptions.mockRules);
    let httpRules = mockRules.filter(rule => rule.type !== "websocket");
    httpRules.forEach(rule => {
        if(rule.corsOptions && typeof rule.corsOptions === "object") {
            rule.cors = cors(rule.corsOptions);
        } else {
            rule.cors = cors();
        }
    });
    let websocketRules = mockRules.filter(rule => rule.type === "websocket");
    middlewareOptions = middlewareOptions || {};
    if(websocketRules.length > 0 && enableWebsocket(middlewareOptions)) {
        require("./handlers/websocket")(middlewareOptions, websocketRules);
    }
    return function(req, resp, next){
        let proxy = req.get("X-Mock-Proxy");
        if(proxy) {
            handleProxy(req, resp, middlewareOptions.proxy, next);
        } else {
            handleHttp(req, resp, httpRules, next);
        }
    };
};

middleware.bindWebpack = function(app, devServer, options){
    // webpack-dev-server apply middlewares earlier than creating http server
    process.nextTick(() => {
        let server = devServer.listeningApp;
        app.use("/", middleware(Object.assign({server}, options)));
    });
};

function enableWebsocket(options) {
    let {server, websocket} = options;
    return server && typeof server.listen === "function"
        && websocket && typeof websocket.encodeMessage === "function"
        && typeof websocket.decodeMessage === "function";
}
