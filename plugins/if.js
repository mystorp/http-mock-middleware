const vm = require("vm");

const ifRe = /^#if:(.*?)#$/;

exports.name = "if";

exports.parse = function(context){
    while(true) {
        let ifKeys = Object.keys(context.data).filter(function(key){
            return ifRe.test(key);
        });
        if(ifKeys.length > 0) {
            context = runIf(context);
        } else {
            delete context.data["#default#"];
            break;
        }
    }
    return context;
};

function runIf(context) {
    let data = context.data;
	if(!data) { return context; }
    let request = context.request;
    let args = data["#args#"];
    if(context.args) {
        args = Object.assign({}, args, context.args);
    }
    let codeContext = request ? {
        headers: request.headers,
        query: request.query || {},
        body: request.body || {},
        cookies: request.cookies || {},
        signedCookies: request.signedCookies || {}
    } : {};
    codeContext.args = args || {};
    codeContext.env = process.env;
    vm.createContext(codeContext);
    let ifKeys = Object.keys(data).filter(function(key){
        return ifRe.test(key);
    });
    let matchedKeys = ifKeys.filter(function(key, i){
        let code = ifRe.exec(key)[1];
        return vm.runInContext(code, codeContext, {
            filename: `#if#-${i}.js`,
            timeout: 500
        });
    });
    if(ifKeys.length > 0) {
        let parsedData;
        if(matchedKeys.length === 0) {
            if(data.hasOwnProperty("#default#")) {
                parsedData = data["#default#"];
            } else {
                throw new Error('missing "#default#" directive!');
            }
        } else {
            parsedData = data[matchedKeys[0]];
        }
        context.data = parsedData;
    } else {
        delete data["#default#"];
    }
    return context;
};
