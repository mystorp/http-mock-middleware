exports.name = "delay";

exports.parse = function(context){
    let data = context.data;
	if(!data) { return context; }
    let delay = data["#delay#"];
    delete data["#delay#"];
    if(typeof delay !== "number" || delay <= 0) {
        return context;
    }
    return new Promise(function(resolve, reject){
        setTimeout(function(){
            resolve(context);
        }, delay);
    });
};
