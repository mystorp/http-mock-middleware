const vm = require("vm");

const ifRe = /^#if:(.*?)#$/;

exports.name = "if";

exports.parse = function(value) {
    let data = value.data;
    let request = value.request;
    let hasIfDirective = false;
    let keys = Object.keys(data).filter(function(key){
        return ifRe.test(key);
    }).filter(function(key){
        hasIfDirective = true;
        let code = ifRe.exec(key)[1];
        let context = {
            headers: request.headers,
            query: request.query,
            body: request.body
        };
        return vm.runInContext(code, context, {
            filename: "#if#-" + Date.now() + ".js",
            timeout: 500
        });
    });
    if(hasIfDirective) {
        let parsedData;
        if(keys.length === 0) {
            if(data.hasOwnProperty("#default#")) {
                parsedData = data["#default#"];
            } else {
                throw new Error("missing \"#default#\" directive!");
            }
        } else {
            parsedData = data[keys[0]];
        }
        value.data = parsedData;
    }
    return value;
};
