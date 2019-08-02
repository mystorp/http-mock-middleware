exports.name = "jsonp";

exports.parse = function(context){
	if(context.websocket) { return context; }
    try {
        let query = context.request.query;
        let jsonpKey = context.jsonpCallbackName;
        let jsonpCallback = query[jsonpKey];
        if(jsonpKey && typeof jsonpKey === "string" && jsonpCallback) {
            let data = context.data;
            if(!Buffer.isBuffer(data)) {
                data = jsonpCallback + "(" + JSON.stringify(data) + ")";
                context.data = Buffer.from(data);
            }
        }
    } catch(e) {
        // ignore
    }
	return context;
};
