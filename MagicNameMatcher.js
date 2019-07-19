const isUUID = require('is-uuid');
const isemail = require("isemail");
const isIP = require("is-ip");
const isNumber = (str) => /^\d+$/.test(str);
const dateRe = /\d{4}-\d{1,2}-\d{1,2}/;
const timeRe = /\d{1,2}:\d{1,2}:\d{1,2}/;

exports.match = function(name){
    if(isUUID.anyNonNil(name)) {
        return "[uuid]";
    } else if(isNumber(name)) {
        return "[number]";
    } else if(dateRe.test(name)) {
        return "[date]";
    } else if(timeRe.test(name)) {
        return "[time]";
    } else if(isIP(name)) {
        return "[ip]";
    } else if(isemail.validate(name)) {
        return "[email]";
    }
    return name;
};