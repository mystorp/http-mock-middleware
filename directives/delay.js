exports.name = "delay";

exports.parse = function(value){
    let data = value.data;
    let delay = data["#delay#"];
    delete data["#delay#"];
    if(typeof delay !== "number" || delay <= 0) {
        return value;
    }
    return new Promise(function(resolve, reject){
        setTimeout(function(){
            resolve(value);
        }, delay);
    });
};
