exports.name = "response-headers";

exports.parse = function(value){
    if(value.websocket) { return value; }
    let response = value.response;
    if(!response) { return value; }
    response.set("X-Mock-File", value.mockFile);
    // TODO: add Content-Type
    return value;
};
