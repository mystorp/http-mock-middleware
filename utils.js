const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const statAsync = Promise.promisify(fs.stat);
const renameAsync = Promise.promisify(fs.rename);

exports.rotateFile = rotateFile;
exports.callMiddleware = callMiddleware;
exports.walkObject = walkObject;
exports.getValueByPath = getValueByPath;

const toString = Object.prototype.toString;
const isObject = isType.bind(null, "Object");
const isArray = isType.bind(null, "Array");
exports.isObject = isObject;
exports.isArray = isArray;

function isType(type, obj) {
    let str = toString.call(obj);
    return type === str.substring(8, str.length - 1);
}
/**
 * file.json => file.json.1
 * file.json.1 => file.json.2
 * @param {string} file 
 */
function rotateFile(file) {
    let nextFile = nextRotateFile(file);
    let exists = false;
    return statAsync(file).then((s) => {
        exists = true;
        return rotateFile(nextFile);
    }, () => 0).then(() => {
        if(exists) {
            return renameAsync(file, nextFile);
        }
    });
}

function nextRotateFile(file) {
    let dir = path.dirname(file);
    let name = path.basename(file);
    let re = /\.\d+$/;
    let rotateName;
    if(re.test(name)) {
        let num = name.split(".").pop() * 1 + 1;
        rotateName = name.replace(re, `.${num}`);
    } else {
        rotateName = `${name}.1`;
    }
    return dir + path.sep + rotateName;
}

/**
 * 由于 local-http-mock 本身工作为一个 middleware, 无法使用类似
 * `app.use(middleware)` 这种调用方法调用其它 middleware.
 * 所以写一个函数模拟 middleware 调用过程
 *
 * @param {object} request express Request 对象
 * @param {object} response express Response 对象
 * @param {Array} middlewares 配置好的 middlewares 列表
 * @returns {Promise} 当所有的 middleware 调用完毕，返回 promise
 */
function callMiddleware(request, response, middlewares){
    let p = Promise.resolve();
    for(let mw of middlewares) {
        p = p.then(function(){
            return new Promise(function(resolve, reject){
                mw(request, response, function(error){
                    error ? reject(error) : resolve();
                });
            });
        });
    }
    return p;
}

function walkObject(obj, fn) {
    if(isObject(obj)) {
        Object.keys(obj).forEach(function(key){
            let value = obj[key];
            obj[key] = value = fn(value, key, obj);
            if(isObject(value) || isArray(value)) {
                walkObject(value, fn);
            }
        });
    } else if(isArray(obj)) {
        obj.forEach(function(value, i, arr){
            obj[i] = value = fn(value, i, arr);
            if(isObject(value) || isArray(value)) {
                walkObject(value, fn);
            }
        });
    }
}

function getValueByPath(obj, path) {
    if(!isObject(obj) || !path) { return obj; }
    let parts = path.split(".");
    while(parts.length > 0) {
        let key = parts.shift();
        if(obj && obj.hasOwnProperty(key)) {
            obj = obj[key];
        } else {
            obj = undefined;
        }
    }
    return typeof obj === "undefined" ? "" : obj;
}
