const MockFileManager = require("../MockFileManager");
const { callMiddleware } = require("../utils");

module.exports = function(req, resp, options, next){
    let url = req.path;
	let { auto404, rules, middlewares } = options;
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
    let { rootDirectory } = myrule;
    callMiddleware(req, resp, middlewares).then(function(){
        return doResponse(req, resp, url, rootDirectory, next);
    }).catch(function(error){
        if(error.code === "ENOENT" || /^can't find mock (file|directory)/.test(error.message)) {
			if(auto404) {
				resp.status(404).end();
			} else {
	            next();
			}
        } else {
	        resp.status(500).end(error.stack || error.message);
		}
	});
};

function doResponse(req, resp, url, rootDirectory, next) {
    return MockFileManager.findAndMock(req.method, url, rootDirectory, {
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
    });
}
