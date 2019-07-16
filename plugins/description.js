exports.name = "description";

exports.parse = function(context){
    let data = context.data;
    delete data["#description#"];
    return context;
};
