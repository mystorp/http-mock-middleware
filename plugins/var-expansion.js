const { isObject, isArray, walkObject, getValueByPath } = require("../utils");
const varRe = /#\$([^#]+)#/ig;
const oneVarRe = /^#\$([^#]+)#$/i;

exports.name = "var-expansion";

exports.parse = function(context) {
    let data = context.data;
    let request = context.request;
    let args = data["#args#"];
    if(context.args) {
        args = Object.assign({}, args, context.args);
    }
    let expansionContext = request ? {
        headers: request.headers,
        query: request.query || {},
        body: request.body || {},
        cookies: request.cookies || {},
        signedCookies: request.signedCookies || {}
    } : {};
    expansionContext.args = args || {};
    expansionContext.env = process.env;
    expansionContext.now = Date.now();
    const replacer = (v, path) => {
        return getValueByPath(expansionContext, path);
    };
    let wrap = false;
    if(typeof data === "string") {
        data = {data};
        wrap = true;
    }
    walkObject(data, function(value, key, obj){
        if(typeof value !== "string") { return value; }
        varRe.lastIndex = 0;
        if(!varRe.test(value)) { return value; }
        varRe.lastIndex = 0;
        return oneVarRe.test(value)
            ? replacer(...oneVarRe.exec(value))
            : value.replace(varRe, replacer);
    });
    if(wrap) {
        context.data = data.data;
    }
    return context;
};
