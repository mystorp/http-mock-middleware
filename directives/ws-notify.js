exports.name = "ws-notify";

exports.parse = function(context){
    if(!context.websocket) { return context; }
    let notify = context.data["#notify#"];
    delete context.data["#notify#"];
    if(!notify) { return context; }
    let notifies = [];
    if(typeof notify === "string") {
        notifies.push({
            delay: 0,
            url: notify
        });
    } else {
        if(Array.isArray(notify)) {
            notifies = notify;
        } else {
            notifies.push(notify);
        }
    }
    context.notifies = notifies;
    return context;
};
