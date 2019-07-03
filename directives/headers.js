exports.name = "headers";

exports.parse = function(value){
    if(value.websocket) { return value; }
    let response = value.response;
    if(!response) { return value; }
    response.set("X-Mock-File", value.mockFile);
    // we can only judge if it's json
    if(/\.json5?(\..*)?$/.test(value.mockFile)) {
        response.setHeader("Content-Type", "application/json");
    }
    return value;
};
