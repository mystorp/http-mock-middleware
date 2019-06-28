const Mockjs = require("mockjs");

exports.name = "mock";

exports.parse = function(value) {
    value.data = Mockjs.mock(value.data);
    return value;
};
