exports.name = "status-code";

exports.parse = function(context){
    let response = context.response;
    if(context.websocket || !response) { return context; }
    let data = context.data;
    let kill = data["#kill#"];
    let code = data["#code#"];
    delete data["#kill#"];
    delete data["#code#"];
    if(kill === true) {
        response.socket.destroy();
        context.next = false;
    } else if(typeof code === "number") {
        response.status(code);
    }
    return context;
};
