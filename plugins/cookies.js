const { isArray, isObject } = require("../utils");
exports.name = "cookies";

exports.parse = function(context){
    if(context.websocket) { return context; }
    let data = context.data;
	if(!data) { return context; }
    let cookies = data["#cookies#"];
    delete data["#cookies#"];
    if(!cookies) { return context; }
    let response = context.response;
    if(isObject(cookies)) {
        Object.keys(cookies).forEach(key => {
            response.cookie(key, cookies[key]);
        });
    } else if(isArray(cookies)) {
        cookies.forEach(item => {
            response.cookie(item.name, item.value, item.options);
        });
    }
    return context;
};
