const MockFileManager = require("../MockFileManager");

module.exports = function(req, resp, rules, next){
    let url = req.path;
    // remove tail slash
    if(/\/$/.test(url)) {
        url = url.substr(0, url.length - 1);
    }
    if(url === "") { return next(); }
    let matchedRules = rules.filter(rule => url.indexOf(rule.url) === 0);
    if(matchedRules.length === 0) {
        rootDirectory = null;
    } else {
        rootDirectory = matchedRules.reduce((a, b) => a.url.length > b.url.length ? a : b).rootDirectory;
    }
    if(!rootDirectory) {
        return next();
    }
    MockFileManager.findAndMock(req.method, url, rootDirectory, {
        request: req,
        response: resp,
        websocket: false
    }).then(function(value){
        if(resp.destroyed) { return; }
        let data = value.data;
        if(typeof data === "object") {
            if(!Buffer.isBuffer(data)) {
                return resp.json(data);
            }
        }
        resp.end(value.data);
    }, function(error){
        if(resp.statusCode === 200) {
            resp.status(500);
        }
        resp.end(error.message + "\n" + error.stack);
    });
};
