const MockFileManager = require("../MockFileManager");

module.exports = function(req, resp, rules, next){
    let url = req.path;
    // remove tail slash
    if(/\/$/.test(url)) {
        url = url.substr(0, url.length - 1);
    }
    // ignore "/"
    if(url === "") { return next(); }
    let matchedRules = rules.filter(rule => {
        let nurl = rule.url.length === 1 ? rule.url : rule.url + "/";
        return rule.url === url || url.indexOf(nurl) === 0;
    });
    if(matchedRules.length === 0) {
        return next();
    }
    // select longest match
    let myrule = matchedRules.reduce((a, b) => a.url.length > b.url.length ? a : b);
    let { rootDirectory, cors } = myrule;
    cors(req, resp, function(err){
        if(err) {
            resp.status(500).end(err.stack || err.message);
        } else {
            doResponse(req, resp, url, rootDirectory, next);
        }
    });
};

function doResponse(req, resp, url, rootDirectory, next) {
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
        if(error.code === "ENOENT" || /^can't find mock (file|directory)/.test(error.message)) {
            return next();
        }
        resp.status(500).end(error.message + "\n" + error.stack);
    });
}
