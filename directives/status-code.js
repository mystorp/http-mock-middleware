exports.name = "status-code";

exports.parse = function(value){
    let response = value.response;
    if(value.websocket || !response) { return value; }
    let data = value.data;
    let kill = data["#kill#"];
    let code = data["#code#"];
    delete data["#kill#"];
    delete data["#code#"];
    if(kill === true) {
        response.socket.destroy();
        value.next = false;
    } else if(typeof code === "number") {
        response.status(code);
    }
    return value;
};
