const options = require("./options");
const handleProxy = require("./handlers/proxy");
const handleHttp = require("./handlers/http");
/**
 * @param {MockOptions} middlewareOptions
 * @returns {ExpressRequestHandler}
 */
let middleware = module.exports = function(middlewareOptions){
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
            resp.set({
                "Access-Control-Allow-Origin": req.get("origin") || "*",
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE, PUT",
                "Access-Control-Allow-Headers": "Content-Type, X-Mock-Proxy"
            });
            if(req.method.toLowerCase() === "options") {
                resp.status(200);
                return resp.end();
            }
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
