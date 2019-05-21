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
            json = json.mock;
        }
    }
    if(!json) {
        json = {"/": ".data"};
    }
    // TODO: check json format by ajv
    if(!Array.isArray(json)) {
        json = Object.keys(json).map(url => {
            let rule = json[url];
            if(typeof rule === "string") {
                rule = {rootDirectory: rule};
            }
            rule.url = url;
            return rule;
        });
    }
    json.forEach(rule => (rule.rootDirectory = rule.rootDirectory.replace(/\\/g, "/")));
    return json;
}

module.exports = {load};

function readJsonSync(file){
    try {
        let text = fs.readFileSync(file, "utf-8");
        return json5.parse(text);
    } catch(e) {
        console.error("error when parsing file:", file);
    }
    return null;
}