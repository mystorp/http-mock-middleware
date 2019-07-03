const fs = require("fs");
const json5 = require("json5");

/**
 * load order:
 * 1. mockrc.json
 * 2. package.json -> `mock`
 * 3. fallback to `{"/": ".data"}`
 */
function findAndLoad(){
    let cwd = process.cwd();
    let mockrcfile = `${cwd}/mockrc.json`;
    let json = readJsonSync(mockrcfile);
    if(!json) {
        let pkgfile = `${cwd}/package.json`;
        if(fs.existsSync(pkgfile)) {
            json = require(pkgfile).mock;
        }
        if(json && typeof json !== "object") {
            throw new Error("package.json's mock field must be object");
        }
    }
    if(!json) {
        console.log(`use '{"/": ".data"}' as mock options`);
        json = {"/": ".data"};
    }
    return json;
}
function load(mockRules){
    if(typeof mockRules === "undefined") {
        mockRules = findAndLoad();
    }
    checkRules(mockRules);
    let rules = Object.keys(mockRules).map(url => {
        let originalRule = mockRules[url], rule;
        if(typeof originalRule === "string") {
            rule = {rootDirectory: originalRule};
        } else {
            rule = {rootDirectory: originalRule.dir};
            if(originalRule.type) {
                rule.type = originalRule.type
            }
        }
        rule.url = url.trim();
        if(rule.url.length > 1) {
            rule.url = rule.url.replace(/\/+$/, "");
        }
        if(originalRule.corsOptions) {
            rule.corsOptions = originalRule.corsOptions;
        }
        return rule;
    });
    return rules;
}

module.exports = {load};

function checkRules(mockRules){
    if(typeof mockRules !== "object") {
        throw new Error("mockRules must be object");
    }
    let urls = Object.keys(mockRules);
    if(urls.length === 0) {
        throw new Error("mockRules must not be empty object");
    }
    urls.forEach(url => {
        if(!/^\//.test(url)) {
            throw new Error(`invalid url: ${url}, it must start with "/"`);
        }
        let rule = mockRules[url];
        let dir;
        if(typeof rule === "string") {
            dir = rule;
        } else if(rule && rule.dir && typeof rule.dir === "string") {
            dir = rule.dir;
        }
        if(!dir || !dir.trim()) {
            throw new Error(`dir value for ${url} must be a valid string`);
        }
        let type = rule ? rule.type : null;
        if(type && type !== "websocket") {
            throw new Error('type value can only be either "websocket" or falsy');
        }
    });
    return true;
}

function readJsonSync(file){
    if(!fs.existsSync(file)) {
        return null;
    }
    let text = fs.readFileSync(file, "utf-8");
    return json5.parse(text);
}
