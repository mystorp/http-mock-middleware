const vm = require("vm");

const ifRe = /^#if:(.*?)#$/;

exports.name = "if";

exports.parse = function(value) {
    let data = value.data;
    let request = value.request;
    let args = data["#args#"];
    delete data["#args#"];
    let codeContext = request ? {
        headers: request.headers,
        query: request.query || {},
        body: request.body || {},
        args: args || {}
    } : {
        args: args || {}
    };
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
        value.data = parsedData;
    } else {
        delete data["#default#"];
    }
    return value;
};
