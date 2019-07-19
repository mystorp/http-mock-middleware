const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const options = require("./options");
const handleProxy = require("./handlers/proxy");
const handleHttp = require("./handlers/http");
/**
 * @param {MockOptions} middlewareOptions
 * @returns {ExpressRequestHandler}
 */
let middleware = module.exports = function(middlewareOptions){
    middlewareOptions = Object.assign({
        cors: true,
        parseBody: true,
        parseCookie: true
    }, middlewareOptions);
    let mockRules = options.load(middlewareOptions.mockRules);
	let httpOptions = {
		rules: mockRules.filter(rule => rule.type !== "websocket"),
		middlewares: setupMiddlewares(middlewareOptions),
		auto404: 404
	};
	if(typeof middlewareOptions.auto404 !== "undefined") {
		httpOptions.auto404 = middlewareOptions.auto404;
	}
    let websocketRules = mockRules.filter(rule => rule.type === "websocket");
    middlewareOptions = middlewareOptions || {};
    if(websocketRules.length > 0 && enableWebsocket(middlewareOptions.websocket)) {
        require("./handlers/websocket")(middlewareOptions.websocket, websocketRules);
    }
    return function(req, resp, next){
        let proxy = req.get("X-Mock-Proxy");
        if(proxy) {
            handleProxy(req, resp, middlewareOptions.proxy, next);
        } else {
            handleHttp(req, resp, httpOptions, next);
        }
    };
};

function enableWebsocket(options) {
    let { server, encodeMessage, decodeMessage } = options || {};
    return  server &&
            typeof server.listen === "function" &&
            typeof encodeMessage === "function" &&
            typeof decodeMessage === "function";
}


function setupMiddlewares(options){
    let middlewares = [], mwOptions;
    if(options.cors) {
        mwOptions = options.cors;
        mwOptions = typeof mwOptions === "object" ? mwOptions : {};
        middlewares.push(cors(mwOptions));
    }
    if(options.parseBody) {
        mwOptions = options.parseBody;
        if(typeof mwOptions === "boolean") {
            mwOptions = {json: true, urlencoded: {extended: false}};
        }
        Object.keys(mwOptions).filter(x => mwOptions[x]).forEach(x => {
            middlewares.push(bodyParser[x](mwOptions[x]));
        });
    }
    if(options.parseCookie) {
        mwOptions = options.parseCookie;
        mwOptions = typeof mwOptions === "object" ? mwOptions : {};
        middlewares.push(cookieParser(mwOptions));
    }
    return middlewares;
}
