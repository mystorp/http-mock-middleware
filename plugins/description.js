exports.name = "description";

exports.parse = function(context){
    let data = context.data;
    if(!data) { return context; }
    delete data["#description#"];
    return context;
};
