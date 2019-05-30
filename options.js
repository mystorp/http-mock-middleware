const fs = require("fs");
const json5 = require("json5");

/**
 * load order:
 * 1. mockrc.json
 * 2. package.json -> `mock`
 * 3. fallback to `{"/": ".data"}`
 */
function load(){
    let cwd = process.cwd();
    let json = readJsonSync(`${cwd}/mockrc.json`);
    if(!json) {
        json = readJsonSync(`${cwd}/package.json`);
        if(json) {
            if(json.mock && typeof json.mock !== "object") {
                throw new Error("package.json's mock field must be object");
            }
            json = json.mock;
        }
    }
    if(json instanceof Error) {
        throw json;
    }
    if(!json) {
        console.log(`use '{"/": ".data"}' as mock options`);
        json = {"/": ".data"};
    }
    checkOptions(json);
    let rules = Object.keys(json).map(url => {
        let originalRule = json[url], rule;
        if(typeof originalRule === "string") {
            rule = {rootDirectory: originalRule};
        } else {
            rule = {rootDirectory: originalRule.dir};
            if(originalRule.type) {
                rule.type = originalRule.type
            }
        }
        rule.url = url.trim();
        return rule;
    });
    rules.forEach(rule => (rule.rootDirectory = rule.rootDirectory.replace(/\\/g, "/")));
    return rules;
}

module.exports = {load};

function checkOptions(options){
    if(typeof options !== "object") {
        throw new Error("invalid options, object needed!");
    }
    let urls = Object.keys(options);
    if(urls.length === 0) {
        throw new Error("mock config can't be {}");
    }
    urls.forEach(url => {
        if(!/^\//.test(url)) {
            throw new Error("invalid url: " + url + ", it must start with \"/\"!");
        }
        let rule = options[url];
        let dir;
        if(typeof rule === "string") {
            dir = rule;
        } else if(rule && rule.dir && typeof rule.dir === "string") {
            dir = rule.dir;
        }
        if(!dir || !dir.trim()) {
            throw new Error("dir value for " + url + " must be a valid string!");
        }
        let type = rule ? rule.type : null;
        if(type && type !== "websocket") {
            throw new Error("type value can only be either \"websocket\" or falsy!");
        }
    });
    return true;
}

function readJsonSync(file){
    if(!fs.existsSync(file)) {
        return null;
    }
    try {
        let text = fs.readFileSync(file, "utf-8");
        return json5.parse(text);
    } catch(e) {
        return e;
    }
}