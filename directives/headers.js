const { isObject } = require("../utils");

exports.name = "headers";

exports.parse = function(context){
    if(context.websocket) { return context; }
    let data = context.data;
    let response = context.response;
    let myHeaders = data["#headers#"];
    delete data["#headers#"];
    if(!response) { return context; }
    if(isObject(myHeaders)) {
        Object.keys(myHeaders).forEach(key => {
            response.set(key, myHeaders[key]);
        });
    }
    response.set("X-Mock-File", context.mockFile);
    // we can only judge if it's json
    if(/\.json5?(\..*)?$/.test(context.mockFile)) {
        response.set("Content-Type", "application/json");
    }
    return context;
};
