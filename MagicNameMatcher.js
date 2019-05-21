const isUUID = require('is-uuid');
const isemail = require("isemail");
const isIP = require("is-ip");
const isNumber = (str) => /^\d+$/.test(str);

exports.match = function(name){
    if(isUUID.anyNonNil(name)) {
        return "[uuid]";
    } else if(isNumber(name)) {
        return "[number]";
    } else if(isIP(name)) {
        return "[ip]";
    } else if(isemail.validate(name)) {
        return "[email]";
    }
    return name;
};