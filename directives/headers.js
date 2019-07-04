exports.name = "headers";

exports.parse = function(context){
    if(context.websocket) { return context; }
    let response = context.response;
    if(!response) { return context; }
    response.set("X-Mock-File", context.mockFile);
    // we can only judge if it's json
    if(/\.json5?(\..*)?$/.test(context.mockFile)) {
        response.setHeader("Content-Type", "application/json");
    }
    return context;
};
