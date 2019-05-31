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
    MockFileManager.find(req.method, url, rootDirectory).then((file) => {
        resp.set("X-Mock-File", file);
        if(/\.json5?$/i.test(file)) {
            MockFileManager.mock(file).then(data => {
                // 允许用户自定义 延迟、杀掉、状态码
                let delay = data["#delay#"];
                let kill = data["#kill#"];
                let code = data["#code#"];
                delete data["#delay#"];
                delete data["#kill#"];
                delete data["#code#"];
                setTimeout(() => {
                    if(kill === true) {
                        resp.socket.destroy();
                    }
                    if(typeof code === "number") {
                        resp.status(code);
                    }
                    resp.json(data);
                }, delay || 0);
            }, error => {
                resp.status(500);
                resp.end("Error: " + error.message);
            });
        } else {
            resp.sendFile(file);
        }
    }, function(e){
        next();
    });
};