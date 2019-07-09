const fs = require("fs");
const url = require("url");
const path = require("path");
const axios = require("axios");
const Promise = require("bluebird");
const { rotateFile } = require("../utils");
const mkdirAsync = Promise.promisify(require("mkdirp"));
const sanitize = require("sanitize-filename");
/**
 * redirect request to `X-Mock-Proxy`
 */
module.exports = function(req, resp, options, next){
    if(req.url === "/") { return next(); }
    let newUrl = req.get("X-Mock-Proxy") + req.url;
    let urlParts = url.parse(newUrl);
    let headers = req.headers;
    headers.host = urlParts.host;
    headers["connection"] = "close";
    delete headers["x-mock-proxy"];
    options = Object.assign({
        autoSave: false,
        saveDirectory: "",
        overrideSameFile: "rename" // override
    }, options);
    axios.request({
        method: req.method.toLowerCase(),
        url: newUrl,
        data: req,
        headers: headers,
        // disable default transformResponse function
        transformResponse: [function(data){
            return data;
        }],
        // we don't care about the status code
        validateStatus: () => true
    }).then(function(response){
        let data = response.data;
        resp.writeHead(response.status, response.headers);
        if(canAutoSave(options)) {
            proxy2local(req, response, options).then((stream) => {
                resp.end(data);
                stream.end(data);
            });
        } else {
            resp.end(data);
        }
    }, function(err){
        resp.status(500).end(err.message);
    });
};

function canAutoSave(options) {
    let yes = options.autoSave;
    yes = yes && options.saveDirectory;
    return yes;
}


function proxy2local(request, response, options) {
    let url = request.url;
    let dirname = path.dirname(url);
    let filename = path.basename(url);
    // path injection
    if(dirname.indexOf(".") > -1 || filename !== sanitize(filename)) {
        throw new Error("invalid url");
    }
    let filepath = path.resolve(
        options.saveDirectory + dirname,
        request.method.toLowerCase() + "-" + filename
    );
    if(/json/i.test(response.headers["content-type"])) {
        filepath += ".json";
    }
    const openstream = (file) => {
        return mkdirAsync(path.dirname(file)).then(() => fs.createWriteStream(file));
    }
    if(options.overrideSameFile === "rename") {
        return rotateFile(filepath).then(() => openstream(filepath));
    } else {
        return openstream(filepath);
    }
}
