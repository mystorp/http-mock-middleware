const Mockjs = require("mockjs");

exports.name = "mock";

exports.parse = function(context) {
    let data = context.data;
	if(!data) { return context; }
    delete data["#args#"];
    context.data = Mockjs.mock(data);
    return context;
};
