const fs = require("fs");
const url = require("url");
const path = require("path");
const http = require("http");
const https = require("https");
const Promise = require("bluebird");
const statAsync = Promise.promisify(fs.stat);
const renameAsync = Promise.promisify(fs.rename);
/**
 * redirect request to `X-Mock-Proxy`
 */
module.exports = function(req, resp, options, next){
    let newUrl = req.get("X-Mock-Proxy") + req.url;
    let urlParts = url.parse(newUrl);
    let headers = req.headers;
    headers.host = urlParts.host;
    headers["connection"] = "close";
    options = Object.assign({
        autoSave: false,
        saveDirectory: "",
        overrideSameFile: "rename" // override
    }, options);
    const mod = urlParts.protocol === "https:" ? https : http;
    let proxyRequest = mod.request({
        hostname: urlParts.hostname,
        port: urlParts.port,
        path: urlParts.path,
        method: req.method,
        headers: headers
    }, function(response){
		resp.writeHead(response.statusCode, response.headers);
        if(canAutoSave(options)) {
            proxy2local(req, resp, options).then((stream) => {
                response.pipe(resp);
                response.pipe(stream);
            });
        } else {
            response.pipe(resp);
        }
	});
	proxyRequest.on('error', function(e){
		resp.writeHead(500);
		resp.end(e.message + "\n" + e.stack);
	});
	req.pipe(proxyRequest);
};

function canAutoSave(options) {
    let yes = options.autoSave;
    yes = yes && options.saveDirectory;
    return yes;
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
 * file.json => file.json.1
 * file.json.1 => file.json.2
 * @param {string} file 
 */
function rotate(file) {
    let nextFile = nextRotateFile(file);
    return statAsync(file).then((s) => {
        return rotate(nextFile);
    }).then(() => {
        return renameAsync(file, nextFile);
    }).catch(() => 0);
}

function proxy2local(request, response, options) {
    let url = request.url;
    if(url === "/") { return; }
    let dirname = path.dirname(url);
    let filename = path.basename(url);
    let filepath = path.resolve(
        options.saveDirectory + dirname,
        request.method.toLowerCase() + "-" + filename
    );
    if(/json/i.test(response.get("content-type"))) {
        filepath += ".json";
    }
    if(options.overrideSameFile === "rename") {
        return rotate(filepath).then(() => fs.createWriteStream(filepath));
    } else {
        return Promise.resolve(fs.createWriteStream(filepath));
    }
}